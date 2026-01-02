import React, { useState, useEffect } from 'react';
import { Calendar, Book, Users, MessageSquare, Award, BarChart3, Plus, Search, LogOut, User, Clock, Star, CheckCircle, Target, Trophy, Zap } from 'lucide-react';

const CommunityLearn = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sessions, setSessions] = useState([]);
  const [resources, setResources] = useState([]);
  const [messages, setMessages] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [userProgress, setUserProgress] = useState({ points: 0, level: 1, badges: [] });

  // Initialize demo data
  useEffect(() => {
    const demoSessions = [
      { id: 1, title: 'Math Fundamentals', tutor: 'Dr. Sarah Johnson', time: '2:00 PM - 3:00 PM', date: 'Nov 25', spots: 5, enrolled: 3, rating: 4.8, subject: 'Mathematics' },
      { id: 2, title: 'Web Development Basics', tutor: 'Prof. Mike Chen', time: '4:00 PM - 5:30 PM', date: 'Nov 26', spots: 8, enrolled: 6, rating: 4.9, subject: 'Programming' },
      { id: 3, title: 'English Grammar Workshop', tutor: 'Emily Roberts', time: '10:00 AM - 11:00 AM', date: 'Nov 27', spots: 10, enrolled: 7, rating: 4.7, subject: 'Language' },
      { id: 4, title: 'Science Lab Techniques', tutor: 'Dr. James Wilson', time: '3:00 PM - 4:30 PM', date: 'Nov 28', spots: 6, enrolled: 4, rating: 4.9, subject: 'Science' }
    ];

    const demoResources = [
      { id: 1, title: 'Introduction to Algebra', type: 'PDF', author: 'Dr. Sarah Johnson', downloads: 234, rating: 4.5 },
      { id: 2, title: 'JavaScript Basics Video Series', type: 'Video', author: 'Prof. Mike Chen', downloads: 567, rating: 4.8 },
      { id: 3, title: 'Grammar Guide eBook', type: 'PDF', author: 'Emily Roberts', downloads: 189, rating: 4.6 },
      { id: 4, title: 'Physics Interactive Simulations', type: 'Interactive', author: 'Dr. James Wilson', downloads: 423, rating: 4.9 }
    ];

    const demoQuizzes = [
      { id: 1, title: 'Algebra Quiz 1', questions: 10, difficulty: 'Easy', subject: 'Mathematics', completed: false },
      { id: 2, title: 'JavaScript Fundamentals', questions: 15, difficulty: 'Medium', subject: 'Programming', completed: false },
      { id: 3, title: 'Grammar Test', questions: 20, difficulty: 'Easy', subject: 'Language', completed: true, score: 85 }
    ];

    setSessions(demoSessions);
    setResources(demoResources);
    setQuizzes(demoQuizzes);
    setUserProgress({ points: 850, level: 5, badges: ['Quick Learner', 'Perfect Score', 'Consistent'] });
  }, []);

  // Login/Register component
  const AuthPage = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({ email: '', password: '', name: '', role: 'student' });

    const handleSubmit = (e) => {
      e.preventDefault();
      setCurrentUser({ 
        name: formData.name || 'Demo User', 
        email: formData.email, 
        role: formData.role,
        avatar: formData.name ? formData.name[0].toUpperCase() : 'D'
      });
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
                onClick={() => setIsLogin(true)}
                className={`flex-1 py-2 rounded-lg font-medium transition-all ${
                  isLogin ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'
                }`}
              >
                Login
              </button>
              <button
                onClick={() => setIsLogin(false)}
                className={`flex-1 py-2 rounded-lg font-medium transition-all ${
                  !isLogin ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'
                }`}
              >
                Register
              </button>
            </div>

            <div className="space-y-4">
              {!isLogin && (
                <input
                  type="text"
                  placeholder="Full Name"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              )}
              <input
                type="email"
                placeholder="Email Address"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
              <input
                type="password"
                placeholder="Password"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
              />
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
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-lg font-medium hover:shadow-lg transition-all"
              >
                {isLogin ? 'Login' : 'Create Account'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Main Dashboard
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
              <p className="text-3xl font-bold">{sessions.filter(s => s.enrolled > 0).length}</p>
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

      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Your Learning Progress</h2>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Mathematics</span>
              <span className="text-sm text-gray-500">75%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-500 h-2 rounded-full" style={{width: '75%'}}></div>
            </div>
          </div>
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Programming</span>
              <span className="text-sm text-gray-500">60%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-purple-500 h-2 rounded-full" style={{width: '60%'}}></div>
            </div>
          </div>
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Language</span>
              <span className="text-sm text-gray-500">85%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-green-500 h-2 rounded-full" style={{width: '85%'}}></div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Your Badges</h2>
        <div className="grid grid-cols-3 gap-4">
          {userProgress.badges.map((badge, idx) => (
            <div key={idx} className="text-center p-4 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
              <Award className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-700">{badge}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Sessions page
  const SessionsPage = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Available Sessions</h2>
        {currentUser?.role === 'tutor' && (
          <button className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors">
            <Plus className="w-4 h-4" />
            Create Session
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sessions.map(session => (
          <div key={session.id} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">{session.title}</h3>
                <p className="text-sm text-gray-600">{session.tutor}</p>
              </div>
              <span className="px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-xs font-medium">
                {session.subject}
              </span>
            </div>
            
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4" />
                {session.date}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="w-4 h-4" />
                {session.time}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Users className="w-4 h-4" />
                {session.enrolled}/{session.spots} enrolled
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                {session.rating} rating
              </div>
            </div>

            <button className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-2 rounded-lg font-medium hover:shadow-lg transition-all">
              Book Session
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  // Resources page
  const ResourcesPage = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Learning Resources</h2>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search resources..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {resources.map(resource => (
          <div key={resource.id} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 mb-1">{resource.title}</h3>
                <p className="text-sm text-gray-600">{resource.author}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                resource.type === 'PDF' ? 'bg-red-100 text-red-600' :
                resource.type === 'Video' ? 'bg-purple-100 text-purple-600' :
                'bg-green-100 text-green-600'
              }`}>
                {resource.type}
              </span>
            </div>

            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm text-gray-600">{resource.rating}</span>
              </div>
              <span className="text-sm text-gray-500">{resource.downloads} downloads</span>
            </div>

            <button className="w-full bg-blue-500 text-white py-2 rounded-lg font-medium hover:bg-blue-600 transition-colors">
              View Resource
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  // AI Chat page
  const ChatPage = () => {
    const [input, setInput] = useState('');
    const [chatMessages, setChatMessages] = useState([
      { type: 'bot', text: 'Hello! I\'m your AI learning assistant. How can I help you today?' }
    ]);

    const handleSend = () => {
      if (!input.trim()) return;
      
      setChatMessages([...chatMessages, { type: 'user', text: input }]);
      
      setTimeout(() => {
        const responses = [
          'Great question! Let me help you with that...',
          'Based on your learning progress, I recommend focusing on...',
          'Here are some relevant resources that might help...',
          'I found this information in our knowledge base...'
        ];
        setChatMessages(prev => [...prev, { 
          type: 'bot', 
          text: responses[Math.floor(Math.random() * responses.length)] 
        }]);
      }, 1000);
      
      setInput('');
    };

    return (
      <div className="h-[calc(100vh-12rem)] flex flex-col bg-white rounded-xl shadow-lg">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">AI Tutor Assistant</h2>
          <p className="text-sm text-gray-600">Ask me anything about your studies!</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {chatMessages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                msg.type === 'user' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-100 text-gray-900'
              }`}>
                {msg.text}
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-gray-200">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Type your question..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={handleSend}
              className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Quizzes page
  const QuizzesPage = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Practice Quizzes</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {quizzes.map(quiz => (
          <div key={quiz.id} className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">{quiz.title}</h3>
                <p className="text-sm text-gray-600">{quiz.subject}</p>
              </div>
              {quiz.completed && <CheckCircle className="w-6 h-6 text-green-500" />}
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Questions:</span>
                <span className="font-medium">{quiz.questions}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Difficulty:</span>
                <span className={`font-medium ${
                  quiz.difficulty === 'Easy' ? 'text-green-600' :
                  quiz.difficulty === 'Medium' ? 'text-yellow-600' :
                  'text-red-600'
                }`}>{quiz.difficulty}</span>
              </div>
              {quiz.completed && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Your Score:</span>
                  <span className="font-medium text-blue-600">{quiz.score}%</span>
                </div>
              )}
            </div>

            <button className={`w-full py-2 rounded-lg font-medium transition-colors ${
              quiz.completed 
                ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' 
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}>
              {quiz.completed ? 'Retake Quiz' : 'Start Quiz'}
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
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Book className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">CommunityLearn</h1>
                <p className="text-xs text-gray-500">Smart Learning Platform</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                  {currentUser.avatar}
                </div>
                <div className="hidden md:block">
                  <p className="text-sm font-medium text-gray-900">{currentUser.name}</p>
                  <p className="text-xs text-gray-500 capitalize">{currentUser.role}</p>
                </div>
              </div>
              <button 
                onClick={() => setCurrentUser(null)}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1 overflow-x-auto">
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
                className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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