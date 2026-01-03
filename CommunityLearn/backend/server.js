// server.js - SECURE Express Backend for CommunityLearn
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Security: Rate limiting to prevent brute force attacks
const loginAttempts = new Map();
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_TIME = 15 * 60 * 1000; // 15 minutes

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

// Test database connection
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Database connection error:', err.stack);
  } else {
    console.log('✅ Database connected successfully');
    release();
  }
});

// Auth Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Access denied - No token provided' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    req.user = user;
    next();
  });
};

// Helper: Check if account is locked
const isAccountLocked = (email) => {
  const attempts = loginAttempts.get(email);
  if (!attempts) return false;
  
  if (attempts.count >= MAX_LOGIN_ATTEMPTS) {
    const timeSinceLocked = Date.now() - attempts.lastAttempt;
    if (timeSinceLocked < LOCKOUT_TIME) {
      return true;
    } else {
      // Reset after lockout time
      loginAttempts.delete(email);
      return false;
    }
  }
  return false;
};

// Helper: Record failed login attempt
const recordFailedLogin = (email) => {
  const attempts = loginAttempts.get(email) || { count: 0, lastAttempt: Date.now() };
  attempts.count += 1;
  attempts.lastAttempt = Date.now();
  loginAttempts.set(email, attempts);
};

// Helper: Reset login attempts
const resetLoginAttempts = (email) => {
  loginAttempts.delete(email);
};

// Email validation
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Password validation
const isStrongPassword = (password) => {
  return password.length >= 6;
};

// ============ AUTH ROUTES ============

// Register with SECURITY CHECKS - UPDATED VERSION
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name, role } = req.body;

    // Input validation
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Password strength validation
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    // SECURITY: Check if user already exists (case-insensitive)
    const existingUser = await pool.query(
      'SELECT * FROM users WHERE LOWER(email) = LOWER($1)',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ 
        error: 'This email is already registered. Please use a different email or login instead.' 
      });
    }

    // Hash password with 12 salt rounds (more secure)
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const result = await pool.query(
      'INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING id, email, role, created_at',
      [email.toLowerCase(), hashedPassword, role || 'student']
    );

    const userId = result.rows[0].id;

    // Create profile
    await pool.query(
      'INSERT INTO profiles (user_id, display_name, skills, interests) VALUES ($1, $2, $3, $4)',
      [userId, name, [], []]
    );

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: userId, 
        email: result.rows[0].email, 
        role: result.rows[0].role 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log(`✅ New user registered: ${email}`);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: userId,
        email: result.rows[0].email,
        name,
        role: result.rows[0].role,
        createdAt: result.rows[0].created_at
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

// Login with BRUTE FORCE PROTECTION
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Input validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Check if account is locked
    if (isAccountLocked(email)) {
      return res.status(429).json({ 
        error: 'Too many failed login attempts. Account locked for 15 minutes.' 
      });
    }

    // Find user (case-insensitive email)
    const result = await pool.query(
      'SELECT u.*, p.display_name FROM users u LEFT JOIN profiles p ON u.id = p.user_id WHERE LOWER(u.email) = LOWER($1)',
      [email]
    );

    if (result.rows.length === 0) {
      recordFailedLogin(email);
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!validPassword) {
      recordFailedLogin(email);
      const attempts = loginAttempts.get(email);
      const remaining = MAX_LOGIN_ATTEMPTS - (attempts?.count || 0);
      
      return res.status(401).json({ 
        error: 'Invalid email or password',
        attemptsRemaining: remaining > 0 ? remaining : 0
      });
    }

    // Reset failed attempts on successful login
    resetLoginAttempts(email);

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log(`✅ User logged in: ${email}`);

    res.json({
      success: true,
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
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

// Change Password (Secure)
app.post('/api/auth/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new passwords are required' });
    }

    if (!isStrongPassword(newPassword)) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long' });
    }

    // Get current password hash
    const result = await pool.query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const validPassword = await bcrypt.compare(currentPassword, result.rows[0].password_hash);
    
    if (!validPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await pool.query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [hashedPassword, req.user.id]);

    console.log(`✅ Password changed for user ID: ${req.user.id}`);

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// ============ SESSION ROUTES ============

// Get all sessions
app.get('/api/sessions', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT s.*, p.display_name as tutor_name,
             (SELECT COUNT(*) FROM bookings WHERE session_id = s.id AND status = 'booked') as enrolled_count
      FROM sessions s
      JOIN profiles p ON s.tutor_id = p.user_id
      WHERE s.start_time > NOW()
      ORDER BY s.start_time ASC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// Create session (tutors only)
app.post('/api/sessions', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'tutor' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only tutors can create sessions' });
    }

    const { title, description, start_time, duration_min, capacity, subject } = req.body;

    if (!title || !start_time || !duration_min) {
      return res.status(400).json({ error: 'Title, start time, and duration are required' });
    }

    const result = await pool.query(
      `INSERT INTO sessions (tutor_id, title, description, start_time, duration_min, capacity, subject)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [req.user.id, title, description, start_time, duration_min, capacity || 10, subject]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create session error:', error);
    res.status(500).json({ error: 'Failed to create session' });
  }
});

// ============ BOOKING ROUTES ============

// Book a session
app.post('/api/bookings', authenticateToken, async (req, res) => {
  try {
    const { session_id } = req.body;

    if (!session_id) {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    // Check if already booked
    const existing = await pool.query(
      'SELECT * FROM bookings WHERE session_id = $1 AND student_id = $2',
      [session_id, req.user.id]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'You have already booked this session' });
    }

    // Check capacity
    const session = await pool.query(
      `SELECT s.capacity, COUNT(b.id) as current_bookings
       FROM sessions s
       LEFT JOIN bookings b ON s.id = b.session_id AND b.status = 'booked'
       WHERE s.id = $1
       GROUP BY s.id, s.capacity`,
      [session_id]
    );

    if (session.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

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
    res.status(500).json({ error: 'Failed to book session' });
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
    res.status(500).json({ error: 'Failed to fetch bookings' });
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
    res.status(500).json({ error: 'Failed to fetch resources' });
  }
});

// Upload resource
app.post('/api/resources', authenticateToken, async (req, res) => {
  try {
    const { title, type, url, description, subject } = req.body;

    if (!title || !type || !url) {
      return res.status(400).json({ error: 'Title, type, and URL are required' });
    }

    const result = await pool.query(
      `INSERT INTO resources (uploader_id, title, type, url, description, subject)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [req.user.id, title, type, url, description, subject]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Upload resource error:', error);
    res.status(500).json({ error: 'Failed to upload resource' });
  }
});

// ============ PROFILE ROUTES ============

// Get user profile
app.get('/api/profile', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT p.*, u.email, u.role, u.created_at FROM profiles p JOIN users u ON p.user_id = u.id WHERE p.user_id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update profile
app.put('/api/profile', authenticateToken, async (req, res) => {
  try {
    const { display_name, skills, interests, bio } = req.body;

    const result = await pool.query(
      `UPDATE profiles 
       SET display_name = $1, skills = $2, interests = $3, bio = $4, updated_at = NOW()
       WHERE user_id = $5 RETURNING *`,
      [display_name, skills || [], interests || [], bio, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// ============ AI CHATBOT ROUTE ============

// Smart Response Generator (FREE alternative to ChatGPT)
function generateSmartResponse(message) {
  const msg = message.toLowerCase();

  // Educational responses with context
  const responses = {
    math: {
      keywords: ['math', 'algebra', 'calculus', 'geometry', 'equation', 'solve', 'formula'],
      response: 'I can help with mathematics! Could you be more specific about the problem? For example:\n\n' +
               '• What topic? (algebra, calculus, geometry)\n' +
               '• What\'s the specific question?\n' +
               '• What have you tried so far?\n\n' +
               'Common math resources: Khan Academy, our Math Fundamentals session, and algebra practice quizzes.'
    },
    programming: {
      keywords: ['code', 'programming', 'javascript', 'python', 'java', 'html', 'css', 'function', 'loop', 'array'],
      response: 'Programming question detected! Let me help:\n\n' +
               '1. **Debugging**: Share your code and error message\n' +
               '2. **Concepts**: Which topic? (variables, functions, loops, objects)\n' +
               '3. **Projects**: I can guide you step-by-step\n\n' +
               '💡 Pro tip: Break complex problems into smaller steps. Check our "Web Development Basics" session!'
    },
    homework: {
      keywords: ['homework', 'assignment', 'project', 'due', 'deadline'],
      response: 'I\'ll help guide you through your homework! Remember, I\'m here to help you **learn**, not just give answers.\n\n' +
               'Please share:\n' +
               '• Subject and topic\n' +
               '• Specific question you\'re stuck on\n' +
               '• What you\'ve tried already\n\n' +
               'This way, you\'ll truly understand the material! 📚'
    },
    study: {
      keywords: ['study', 'tips', 'prepare', 'exam', 'test', 'memorize', 'concentrate'],
      response: '📖 **Effective Study Strategies:**\n\n' +
               '1. **Pomodoro Technique**: Study 25 min, break 5 min\n' +
               '2. **Active Recall**: Test yourself instead of re-reading\n' +
               '3. **Spaced Repetition**: Review material at increasing intervals\n' +
               '4. **Teach Someone**: Best way to learn is to teach\n' +
               '5. **Practice Problems**: Do more exercises than reading\n\n' +
               'What subject are you studying for?'
    },
    motivation: {
      keywords: ['difficult', 'hard', 'can\'t', 'confused', 'stuck', 'don\'t understand', 'frustrated'],
      response: 'I understand learning can be challenging, but you\'re doing great by asking for help! 💪\n\n' +
               '**Remember:**\n' +
               '• Every expert was once a beginner\n' +
               '• Making mistakes is part of learning\n' +
               '• Break problems into tiny steps\n' +
               '• Take breaks when frustrated\n\n' +
               'Let\'s work through this together. What specific part is confusing you?'
    },
    quiz: {
      keywords: ['quiz', 'practice', 'test myself', 'exercise'],
      response: '🎯 **Quiz & Practice:**\n\n' +
               'Our platform offers:\n' +
               '• Auto-graded quizzes (instant feedback)\n' +
               '• Multiple difficulty levels\n' +
               '• Subject-specific practice\n\n' +
               'Start with **Easy** to build confidence, then progress to **Medium** and **Hard**. ' +
               'Review your mistakes - that\'s where the real learning happens!'
    },
    session: {
      keywords: ['session', 'tutor', 'teacher', 'class', 'live', 'meeting'],
      response: '👨‍🏫 **Live Tutoring Sessions:**\n\n' +
               'Available sessions:\n' +
               '• **Dr. Sarah Johnson** - Mathematics (Expert in Algebra & Calculus)\n' +
               '• **Prof. Mike Chen** - Programming (Web Dev, JavaScript)\n' +
               '• **Emily Roberts** - English & Writing\n\n' +
               'Sessions are interactive - you can ask questions in real-time! ' +
               'Check the Sessions tab to book.'
    }
  };

  // Check which category matches
  for (const [category, data] of Object.entries(responses)) {
    if (data.keywords.some(keyword => msg.includes(keyword))) {
      return data.response;
    }
  }

  // Greeting responses
  if (msg.match(/^(hi|hello|hey|greetings)/)) {
    return 'Hello! 👋 Welcome to CommunityLearn!\n\n' +
           'I can help you with:\n' +
           '• Homework and assignments\n' +
           '• Study tips and strategies\n' +
           '• Math, Programming, Science, Languages\n' +
           '• Quiz practice and test prep\n' +
           '• Finding the right tutor or session\n\n' +
           'What would you like to learn about today?';
  }

  // Thank you responses
  if (msg.match(/(thank|thanks|appreciate)/)) {
    return 'You\'re very welcome! 😊 Keep up the excellent work with your studies. ' +
           'Remember, I\'m here 24/7 whenever you need help. Good luck!';
  }

  // Default intelligent response
  return 'That\'s an interesting question! While I might not have all the details, here\'s how I can help:\n\n' +
         '1. **Clarify your question** - The more specific, the better I can assist\n' +
         '2. **Browse Resources** - Check our library for relevant materials\n' +
         '3. **Book a session** - Connect with a specialized tutor\n' +
         '4. **Try a quiz** - Practice and test your knowledge\n\n' +
         'What would be most helpful for you right now?';
}

app.post('/api/chat/message', authenticateToken, async (req, res) => {
  try {
    const { message, conversationHistory } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Smart Pattern Matching (FREE - No API key needed)
    const aiResponse = generateSmartResponse(message);

    res.json({
      success: true,
      response: aiResponse,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ 
      error: 'Failed to get response',
      fallback: 'I apologize, but I\'m having trouble processing your request right now. Please try again or contact a human tutor for assistance.'
    });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ CommunityLearn Backend running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔒 Security features enabled: Password hashing, JWT, Rate limiting`);
  console.log('🔒 Security features enabled:');
  console.log('   ✓ Email validation');
  console.log('   ✓ Password strength check (min 6 chars)');
  console.log('   ✓ Duplicate email prevention');
  console.log('   ✓ Case-insensitive email matching');
  console.log('   ✓ Password hashing (bcrypt, 12 rounds)');
  console.log('🤖 AI Chatbot ready with smart responses!');
});
