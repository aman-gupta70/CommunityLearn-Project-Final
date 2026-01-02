// server.js - Complete Express Backend for CommunityLearn
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware
app.use(cors());
app.use(express.json());

// PostgreSQL connection
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'communitylearn',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
});

// Auth Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Access denied' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

// ============ AUTH ROUTES ============

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name, role } = req.body;

    // Check if user exists
    const existingUser = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const result = await pool.query(
      'INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING id, email, role',
      [email, hashedPassword, role || 'student']
    );

    const userId = result.rows[0].id;

    // Create profile
    await pool.query(
      'INSERT INTO profiles (user_id, display_name, skills, interests) VALUES ($1, $2, $3, $4)',
      [userId, name, [], []]
    );

    // Generate token
    const token = jwt.sign(
      { id: userId, email: result.rows[0].email, role: result.rows[0].role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: {
        id: userId,
        email: result.rows[0].email,
        name,
        role: result.rows[0].role
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const result = await pool.query(
      'SELECT u.*, p.display_name FROM users u LEFT JOIN profiles p ON u.id = p.user_id WHERE u.email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.display_name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ============ SESSION ROUTES ============

// Get all sessions
app.get('/api/sessions', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT s.*, p.display_name as tutor_name,
             (SELECT COUNT(*) FROM bookings WHERE session_id = s.id) as enrolled_count
      FROM sessions s
      JOIN profiles p ON s.tutor_id = p.user_id
      WHERE s.start_time > NOW()
      ORDER BY s.start_time ASC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create session (tutors only)
app.post('/api/sessions', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'tutor' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only tutors can create sessions' });
    }

    const { title, description, start_time, duration_min, capacity } = req.body;

    const result = await pool.query(
      `INSERT INTO sessions (tutor_id, title, description, start_time, duration_min, capacity)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [req.user.id, title, description, start_time, duration_min, capacity]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create session error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ============ BOOKING ROUTES ============

// Book a session
app.post('/api/bookings', authenticateToken, async (req, res) => {
  try {
    const { session_id } = req.body;

    // Check if already booked
    const existing = await pool.query(
      'SELECT * FROM bookings WHERE session_id = $1 AND student_id = $2',
      [session_id, req.user.id]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Already booked' });
    }

    // Check capacity
    const session = await pool.query(
      `SELECT s.capacity, COUNT(b.id) as current_bookings
       FROM sessions s
       LEFT JOIN bookings b ON s.id = b.session_id
       WHERE s.id = $1
       GROUP BY s.id, s.capacity`,
      [session_id]
    );

    if (session.rows[0].current_bookings >= session.rows[0].capacity) {
      return res.status(400).json({ error: 'Session is full' });
    }

    // Create booking
    const result = await pool.query(
      'INSERT INTO bookings (session_id, student_id, status) VALUES ($1, $2, $3) RETURNING *',
      [session_id, req.user.id, 'booked']
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Booking error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user's bookings
app.get('/api/bookings', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT b.*, s.title, s.start_time, s.duration_min, p.display_name as tutor_name
      FROM bookings b
      JOIN sessions s ON b.session_id = s.id
      JOIN profiles p ON s.tutor_id = p.user_id
      WHERE b.student_id = $1
      ORDER BY s.start_time DESC
    `, [req.user.id]);

    res.json(result.rows);
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ============ RESOURCE ROUTES ============

// Get all resources
app.get('/api/resources', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT r.*, p.display_name as author_name
      FROM resources r
      JOIN profiles p ON r.uploader_id = p.user_id
      ORDER BY r.created_at DESC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Get resources error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Upload resource
app.post('/api/resources', authenticateToken, async (req, res) => {
  try {
    const { title, type, url, description } = req.body;

    const result = await pool.query(
      `INSERT INTO resources (uploader_id, title, type, url, description)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [req.user.id, title, type, url, description]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Upload resource error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ============ QUIZ ROUTES ============

// Get all quizzes
app.get('/api/quizzes', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT q.*, 
             (SELECT score FROM quiz_attempts WHERE quiz_id = q.id AND student_id = $1 ORDER BY created_at DESC LIMIT 1) as last_score
      FROM quizzes q
      ORDER BY q.created_at DESC
    `, [req.user.id]);

    res.json(result.rows);
  } catch (error) {
    console.error('Get quizzes error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Submit quiz attempt
app.post('/api/quiz/attempt', authenticateToken, async (req, res) => {
  try {
    const { quiz_id, answers, score } = req.body;

    const result = await pool.query(
      `INSERT INTO quiz_attempts (quiz_id, student_id, answers, score)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [quiz_id, req.user.id, JSON.stringify(answers), score]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Quiz attempt error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ============ FAQ / CHATBOT ROUTES ============

// Simple keyword-based FAQ search
app.post('/api/faq/query', authenticateToken, async (req, res) => {
  try {
    const { query } = req.body;
    
    const result = await pool.query(`
      SELECT * FROM faqs 
      WHERE LOWER(question) LIKE LOWER($1) OR LOWER(answer) LIKE LOWER($1)
      LIMIT 5
    `, [`%${query}%`]);

    if (result.rows.length === 0) {
      return res.json({ 
        answer: "I couldn't find an exact answer. Try rephrasing or contact a tutor!",
        suggestions: []
      });
    }

    res.json({
      answer: result.rows[0].answer,
      suggestions: result.rows.slice(1).map(r => r.question)
    });
  } catch (error) {
    console.error('FAQ query error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ============ PROFILE ROUTES ============

// Get user profile
app.get('/api/profile', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT p.*, u.email, u.role FROM profiles p JOIN users u ON p.user_id = u.id WHERE p.user_id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update profile
app.put('/api/profile', authenticateToken, async (req, res) => {
  try {
    const { display_name, skills, interests, bio } = req.body;

    const result = await pool.query(
      `UPDATE profiles 
       SET display_name = $1, skills = $2, interests = $3, bio = $4
       WHERE user_id = $5 RETURNING *`,
      [display_name, skills, interests, bio, req.user.id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ CommunityLearn Backend running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});