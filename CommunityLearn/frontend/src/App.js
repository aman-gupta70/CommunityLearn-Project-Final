import React, { useState, useEffect } from 'react';
import { Calendar, Book, Users, MessageSquare, Award, BarChart3, Plus, Search, LogOut, Clock, Star, CheckCircle, Target, Trophy, Zap, AlertCircle } from 'lucide-react';

const CommunityLearn = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sessions, setSessions] = useState([]);
  const [resources, setResources] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [userProgress, setUserProgress] = useState({ points: 0, level: 1, badges: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const demoSessions = [
      { id: 1, title: 'Math Fundamentals', tutor: 'Dr. Sarah Johnson', time: '2:00 PM - 3:00 PM', date: 'Nov 25', spots: 5, enrolled: 3, rating: 4.8, subject: 'Mathematics' },
      { id: 2, title: 'Web Development Basics', tutor: 'Prof. Mike Chen', time: '4:00 PM - 5:30 PM', date: 'Nov 26', spots: 8, enrolled: 6, rating: 4.9, subject: 'Programming' }
    ];

    const demoResources = [
      { id: 1, title: 'Introduction to Algebra', type: 'PDF', author: 'Dr. Sarah Johnson', downloads: 234, rating: 4.5 },
      { id: 2, title: 'JavaScript Basics Video Series', type: 'Video', author: 'Prof. Mike Chen', downloads: 567, rating: 4.8 }
    ];

    const demoQuizzes = [
      { id: 1, title: 'Algebra Quiz 1', questions: 10, difficulty: 'Easy', subject: 'Mathematics', completed: false },
      { id: 2, title: 'JavaScript Fundamentals', questions: 15, difficulty: 'Medium', subject: 'Programming', completed: false }
    ];

    setSessions(demoSessions);
    setResources(demoResources);
    setQuizzes(demoQuizzes);
    setUserProgress({ points: 850, level: 5, badges: ['Quick Learner', 'Perfect Score'] });
  }, []);

  const AuthPage = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({ email: '', password: '', name: '', role: 'student', confirmPassword: '' });
    const [validationErrors, setValidationErrors] = useState({});

    const validateEmail = (email) => {
      const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return regex.test(email);
    };

    const validatePassword = (password) => {
      return password.length >= 6;
    };

    const validateForm = () => {
      const errors = {};

      if (!formData.email) {
        errors.email = 'Email is required';
      } else if (!validateEmail(formData.email)) {
        errors.email = 'Please enter a valid email address';
      }

      if (!formData.password) {
        errors.password = 'Password is required';
      } else if (!validatePassword(formData.password)) {
        errors.password = 'Password must be at least 6 characters';
      }

      if (!isLogin) {
        if (!formData.name) {
          errors.name = 'Name is required';
        }

        if (!formData.confirmPassword) {
          errors.confirmPassword = 'Please confirm your password';
        } else if (formData.password !== formData.confirmPassword) {
          errors.confirmPassword = 'Passwords do not match';
        }
      }

      setValidationErrors(errors);
      return Object.keys(errors).length === 0;
    };

    const handleSubmit = (e) => {
      e.preventDefault();
      setError('');
      setValidationErrors({});

      if (!validateForm()) {
        return;
      }

      setLoading(true);

      setTimeout(() => {
        if (!formData.email || !formData.password) {
          setError('Please enter both email and password');
          setLoading(false);
          return;
        }

        if (isLogin) {
          if (formData.password.length >= 6) {
            setCurrentUser({ 
              name: formData.email.split('@')[0], 
              email: formData.email, 
              role: formData.role,
              avatar: formData.email[0].toUpperCase()
            });
            setError('');
          } else {
            setError('Invalid email or password');
          }
        } else {
          setCurrentUser({ 
            name: formData.name, 
            email: formData.email, 
            role: formData.role,
            avatar: formData.name[0].toUpperCase()
          });
          setError('');
        }
        setLoading(false);
      }, 1000);
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-4">
                <Book className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">CommunityLearn</h1>
              <p className="text-gray-600">Intelligent Community Tutoring Platform</p>
            </div>

            <div className="flex gap-2 mb-6">
              <button
                onClick={() => {
                  setIsLogin(true);
                  setError('');
                  setValidationErrors({});
                  setFormData({ email: '', password: '', name: '', role: 'student', confirmPassword: '' });
                }}
                className={`flex-1 py-2 rounded-lg font-medium transition-all ${
                  isLogin ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'
                }`}
              >
                Login
              </button>
              <button
                onClick={() => {
                  setIsLogin(false);
                  setError('');
                  setValidationErrors({});
                  setFormData({ email: '', password: '', name: '', role: 'student', confirmPassword: '' });
                }}
                className={`flex-1 py-2 rounded-lg font-medium transition-all ${
                  !isLogin ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'
                }`}
              >
                Register
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="space-y-4">
              {!isLogin && (
                <div>
                  <input
                    type="text"
                    placeholder="Full Name"
                    className={`w-full px-4 py-3 border ${validationErrors.name ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                  {validationErrors.name && (
                    <p className="text-sm text-red-500 mt-1">{validationErrors.name}</p>
                  )}
                </div>
              )}

              <div>
                <input
                  type="email"
                  placeholder="Email Address"
                  className={`w-full px-4 py-3 border ${validationErrors.email ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
                {validationErrors.email && (
                  <p className="text-sm text-red-500 mt-1">{validationErrors.email}</p>
                )}
              </div>

              <div>
                <input
                  type="password"
                  placeholder="Password (min 6 characters)"
                  className={`w-full px-4 py-3 border ${validationErrors.password ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                />
                {validationErrors.password && (
                  <p className="text-sm text-red-500 mt-1">{validationErrors.password}</p>
                )}
              </div>

              {!isLogin && (
                <div>
                  <input
                    type="password"
                    placeholder="Confirm Password"
                    className={`w-full px-4 py-3 border ${validationErrors.confirmPassword ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                  />
                  {validationErrors.confirmPassword && (
                    <p className="text-sm text-red-500 mt-1">{validationErrors.confirmPassword}</p>
                  )}
                </div>
              )}

              {!isLogin && (
                <select
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                >
                  <option value="student">Student</option>
                  <option value="tutor">Tutor</option>
                </select>
              )}

              <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50"
              >
                {loading ? 'Please wait...' : (isLogin ? 'Login' : 'Create Account')}
              </button>
            </div>

            <div className="mt-6 text-center text-sm text-gray-600">
              <p>🔒 Your data is secure and encrypted</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const Dashboard = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Level</p>
              <p className="text-3xl font-bold">{userProgress.level}</p>
            </div>
            <Trophy className="w-12 h-12 text-blue-200" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Points</p>
              <p className="text-3xl font-bold">{userProgress.points}</p>
            </div>
            <Zap className="w-12 h-12 text-purple-200" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Sessions</p>
              <p className="text-3xl font-bold">{sessions.length}</p>
            </div>
            <Calendar className="w-12 h-12 text-green-200" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">Badges</p>
              <p className="text-3xl font-bold">{userProgress.badges.length}</p>
            </div>
            <Award className="w-12 h-12 text-orange-200" />
          </div>
        </div>
      </div>
    </div>
  );

  const SessionsPage = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Available Sessions</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sessions.map(session => (
          <div key={session.id} className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">{session.title}</h3>
            <p className="text-sm text-gray-600 mb-4">{session.tutor}</p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4" />
                {session.date} - {session.time}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Users className="w-4 h-4" />
                {session.enrolled}/{session.spots} enrolled
              </div>
            </div>
            <button className="w-full mt-4 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600">
              Book Session
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  const ResourcesPage = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Learning Resources</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {resources.map(resource => (
          <div key={resource.id} className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">{resource.title}</h3>
            <p className="text-sm text-gray-600 mb-4">{resource.author}</p>
            <div className="flex items-center justify-between">
              <span className="text-sm text-yellow-600">⭐ {resource.rating}</span>
              <span className="text-sm text-gray-500">{resource.downloads} downloads</span>
            </div>
            <button className="w-full mt-4 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600">
              View Resource
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  const ChatPage = () => {
    const [input, setInput] = useState('');
    const [messages, setChatMessages] = useState([
      { type: 'bot', text: 'Hello! How can I help you today?' }
    ]);

    const handleSend = () => {
      if (!input.trim()) return;
      setChatMessages([...messages, { type: 'user', text: input }]);
      setTimeout(() => {
        setChatMessages(prev => [...prev, { type: 'bot', text: 'Thanks for your question!' }]);
      }, 1000);
      setInput('');
    };

    return (
      <div className="bg-white rounded-xl shadow-lg p-6 h-96 flex flex-col">
        <h2 className="text-xl font-bold mb-4">AI Tutor</h2>
        <div className="flex-1 overflow-y-auto space-y-2 mb-4">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`px-4 py-2 rounded-lg ${msg.type === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}>
                {msg.text}
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type your question..."
            className="flex-1 px-4 py-2 border rounded-lg"
          />
          <button onClick={handleSend} className="bg-blue-500 text-white px-6 py-2 rounded-lg">
            Send
          </button>
        </div>
      </div>
    );
  };

  const QuizzesPage = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Practice Quizzes</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {quizzes.map(quiz => (
          <div key={quiz.id} className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">{quiz.title}</h3>
            <p className="text-sm text-gray-600 mb-4">{quiz.subject}</p>
            <div className="flex justify-between text-sm mb-4">
              <span>Questions: {quiz.questions}</span>
              <span>Difficulty: {quiz.difficulty}</span>
            </div>
            <button className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600">
              Start Quiz
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  if (!currentUser) {
    return <AuthPage />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Book className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">CommunityLearn</h1>
                <p className="text-xs text-gray-500">Smart Learning Platform</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                  {currentUser.avatar}
                </div>
                <div className="hidden md:block">
                  <p className="text-sm font-medium">{currentUser.name}</p>
                  <p className="text-xs text-gray-500">{currentUser.role}</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  if (window.confirm('Are you sure you want to logout?')) {
                    setCurrentUser(null);
                  }
                }}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
              { id: 'sessions', label: 'Sessions', icon: Calendar },
              { id: 'resources', label: 'Resources', icon: Book },
              { id: 'chat', label: 'AI Tutor', icon: MessageSquare },
              { id: 'quizzes', label: 'Quizzes', icon: Target }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 ${
                  activeTab === tab.id ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-600'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'sessions' && <SessionsPage />}
        {activeTab === 'resources' && <ResourcesPage />}
        {activeTab === 'chat' && <ChatPage />}
        {activeTab === 'quizzes' && <QuizzesPage />}
      </main>
    </div>
  );
};

export default CommunityLearn;
