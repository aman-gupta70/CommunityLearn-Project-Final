-- schema.sql - Complete Database Schema for CommunityLearn

-- Create database (run this separately if needed)
-- CREATE DATABASE communitylearn;

-- ============ USERS TABLE ============
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) CHECK (role IN ('student', 'tutor', 'admin')) DEFAULT 'student',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============ PROFILES TABLE ============
CREATE TABLE IF NOT EXISTS profiles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  display_name VARCHAR(255),
  skills TEXT[] DEFAULT '{}',
  interests TEXT[] DEFAULT '{}',
  rating NUMERIC(3, 2) DEFAULT 0.00,
  bio TEXT,
  avatar_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id)
);

-- ============ SESSIONS TABLE ============
CREATE TABLE IF NOT EXISTS sessions (
  id SERIAL PRIMARY KEY,
  tutor_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  subject VARCHAR(100),
  start_time TIMESTAMP NOT NULL,
  duration_min INTEGER NOT NULL,
  capacity INTEGER DEFAULT 10,
  status VARCHAR(50) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'ongoing', 'completed', 'cancelled')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============ BOOKINGS TABLE ============
CREATE TABLE IF NOT EXISTS bookings (
  id SERIAL PRIMARY KEY,
  session_id INTEGER REFERENCES sessions(id) ON DELETE CASCADE,
  student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'booked' CHECK (status IN ('booked', 'attended', 'cancelled', 'no-show')),
  booking_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(session_id, student_id)
);

-- ============ RESOURCES TABLE ============
CREATE TABLE IF NOT EXISTS resources (
  id SERIAL PRIMARY KEY,
  uploader_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50) CHECK (type IN ('pdf', 'video', 'audio', 'link', 'document', 'interactive')),
  url VARCHAR(1000) NOT NULL,
  file_size BIGINT,
  subject VARCHAR(100),
  tags TEXT[] DEFAULT '{}',
  downloads INTEGER DEFAULT 0,
  rating NUMERIC(3, 2) DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============ QUIZZES TABLE ============
CREATE TABLE IF NOT EXISTS quizzes (
  id SERIAL PRIMARY KEY,
  creator_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  subject VARCHAR(100),
  difficulty VARCHAR(50) CHECK (difficulty IN ('easy', 'medium', 'hard')),
  questions JSONB NOT NULL,
  total_questions INTEGER NOT NULL,
  time_limit_min INTEGER,
  passing_score INTEGER DEFAULT 60,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============ QUIZ ATTEMPTS TABLE ============
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id SERIAL PRIMARY KEY,
  quiz_id INTEGER REFERENCES quizzes(id) ON DELETE CASCADE,
  student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  answers JSONB NOT NULL,
  score NUMERIC(5, 2) NOT NULL,
  time_taken_sec INTEGER,
  completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============ FAQS TABLE ============
CREATE TABLE IF NOT EXISTS faqs (
  id SERIAL PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category VARCHAR(100),
  tags TEXT[] DEFAULT '{}',
  views INTEGER DEFAULT 0,
  helpful_count INTEGER DEFAULT 0,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============ EMBEDDINGS TABLE (for AI features) ============
CREATE TABLE IF NOT EXISTS embeddings (
  id SERIAL PRIMARY KEY,
  content_type VARCHAR(50) CHECK (content_type IN ('faq', 'resource', 'transcript', 'answer')),
  content_id INTEGER NOT NULL,
  text_content TEXT NOT NULL,
  embedding FLOAT8[] NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============ CHAT MESSAGES TABLE ============
CREATE TABLE IF NOT EXISTS chat_messages (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  response TEXT,
  context JSONB,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============ USER PROGRESS TABLE ============
CREATE TABLE IF NOT EXISTS user_progress (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  subject VARCHAR(100) NOT NULL,
  level INTEGER DEFAULT 1,
  points INTEGER DEFAULT 0,
  completed_topics TEXT[] DEFAULT '{}',
  current_streak INTEGER DEFAULT 0,
  last_activity_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, subject)
);

-- ============ BADGES TABLE ============
CREATE TABLE IF NOT EXISTS badges (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon_url VARCHAR(500),
  criteria JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============ USER BADGES TABLE ============
CREATE TABLE IF NOT EXISTS user_badges (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  badge_id INTEGER REFERENCES badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, badge_id)
);

-- ============ NOTIFICATIONS TABLE ============
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) CHECK (type IN ('session', 'quiz', 'badge', 'message', 'system')),
  read BOOLEAN DEFAULT FALSE,
  action_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============ RATINGS TABLE ============
CREATE TABLE IF NOT EXISTS ratings (
  id SERIAL PRIMARY KEY,
  rater_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  rated_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  session_id INTEGER REFERENCES sessions(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(rater_id, rated_id, session_id)
);

-- ============ INDEXES FOR PERFORMANCE ============
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_sessions_tutor ON sessions(tutor_id);
CREATE INDEX idx_sessions_start_time ON sessions(start_time);
CREATE INDEX idx_bookings_session ON bookings(session_id);
CREATE INDEX idx_bookings_student ON bookings(student_id);
CREATE INDEX idx_resources_uploader ON resources(uploader_id);
CREATE INDEX idx_resources_subject ON resources(subject);
CREATE INDEX idx_quizzes_creator ON quizzes(creator_id);
CREATE INDEX idx_quiz_attempts_quiz ON quiz_attempts(quiz_id);
CREATE INDEX idx_quiz_attempts_student ON quiz_attempts(student_id);
CREATE INDEX idx_chat_messages_user ON chat_messages(user_id);
CREATE INDEX idx_user_progress_user ON user_progress(user_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_ratings_rated ON ratings(rated_id);

-- ============ SAMPLE DATA (for testing) ============

-- Insert sample admin user
INSERT INTO users (email, password_hash, role) 
VALUES ('admin@communitylearn.com', '$2a$10$XQVZKZwvKv5yZLm5vVvLh.5YBH4QvXKKGqVxKqYqVxKqYqVxKqYqV', 'admin')
ON CONFLICT (email) DO NOTHING;

-- Insert sample tutors
INSERT INTO users (email, password_hash, role) 
VALUES 
  ('sarah.johnson@tutors.com', '$2a$10$XQVZKZwvKv5yZLm5vVvLh.5YBH4QvXKKGqVxKqYqVxKqYqVxKqYqV', 'tutor'),
  ('mike.chen@tutors.com', '$2a$10$XQVZKZwvKv5yZLm5vVvLh.5YBH4QvXKKGqVxKqYqVxKqYqVxKqYqV', 'tutor'),
  ('emily.roberts@tutors.com', '$2a$10$XQVZKZwvKv5yZLm5vVvLh.5YBH4QvXKKGqVxKqYqVxKqYqVxKqYqV', 'tutor')
ON CONFLICT (email) DO NOTHING;

-- Insert profiles for tutors
INSERT INTO profiles (user_id, display_name, skills, rating, bio) 
VALUES 
  (2, 'Dr. Sarah Johnson', ARRAY['Mathematics', 'Statistics', 'Calculus'], 4.8, 'PhD in Mathematics with 10 years teaching experience'),
  (3, 'Prof. Mike Chen', ARRAY['Programming', 'Web Development', 'JavaScript'], 4.9, 'Senior Software Engineer and Programming Instructor'),
  (4, 'Emily Roberts', ARRAY['English', 'Grammar', 'Writing'], 4.7, 'Certified English Teacher with 5 years experience')
ON CONFLICT (user_id) DO NOTHING;

-- Insert sample FAQs
INSERT INTO faqs (question, answer, category) VALUES
  ('How do I book a tutoring session?', 'Navigate to the Sessions page, browse available sessions, and click "Book Session" on your preferred time slot.', 'Platform Usage'),
  ('What subjects are available?', 'We offer tutoring in Mathematics, Science, Programming, Languages, and many more subjects. Check the Sessions page for current offerings.', 'General'),
  ('How does the AI tutor work?', 'Our AI tutor uses natural language processing to understand your questions and provide relevant answers from our knowledge base and resources.', 'AI Features'),
  ('Can I become a tutor?', 'Yes! Register as a tutor and create your profile with your skills and expertise. You can then create sessions for students to book.', 'Tutoring'),
  ('How are quizzes graded?', 'Quizzes are auto-graded using AI-powered algorithms that compare your answers with model answers for accuracy and understanding.', 'Quizzes')
ON CONFLICT DO NOTHING;

-- Insert sample badges
INSERT INTO badges (name, description, criteria) VALUES
  ('Quick Learner', 'Complete 5 quizzes with 80% or higher score', '{"type": "quiz_completion", "count": 5, "min_score": 80}'),
  ('Perfect Score', 'Get 100% on any quiz', '{"type": "perfect_score", "count": 1}'),
  ('Consistent Learner', 'Maintain a 7-day learning streak', '{"type": "streak", "days": 7}'),
  ('Social Butterfly', 'Attend 10 tutoring sessions', '{"type": "session_attendance", "count": 10}'),
  ('Knowledge Seeker', 'Download 20 resources', '{"type": "resource_downloads", "count": 20}')
ON CONFLICT DO NOTHING;

-- ============ TRIGGERS ============

-- Update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============ VIEWS FOR ANALYTICS ============

CREATE OR REPLACE VIEW session_statistics AS
SELECT 
  DATE(s.start_time) as session_date,
  COUNT(DISTINCT s.id) as total_sessions,
  COUNT(DISTINCT b.student_id) as unique_students,
  AVG(b.id IS NOT NULL::int) as avg_attendance_rate
FROM sessions s
LEFT JOIN bookings b ON s.id = b.session_id
GROUP BY DATE(s.start_time);

CREATE OR REPLACE VIEW tutor_performance AS
SELECT 
  u.id as tutor_id,
  p.display_name as tutor_name,
  COUNT(DISTINCT s.id) as total_sessions,
  COUNT(DISTINCT b.student_id) as total_students,
  COALESCE(AVG(r.rating), 0) as avg_rating
FROM users u
JOIN profiles p ON u.id = p.user_id
LEFT JOIN sessions s ON u.id = s.tutor_id
LEFT JOIN bookings b ON s.id = b.session_id
LEFT JOIN ratings r ON u.id = r.rated_id
WHERE u.role = 'tutor'
GROUP BY u.id, p.display_name;

-- ============ COMPLETION MESSAGE ============
DO $$
BEGIN
  RAISE NOTICE '✅ CommunityLearn database schema created successfully!';
  RAISE NOTICE '📊 All tables, indexes, triggers, and views are ready';
  RAISE NOTICE '🎯 Sample data has been inserted for testing';
END $$;