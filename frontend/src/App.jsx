import React, { useState, useEffect } from 'react'
import LoginPage from './components/LoginPage'
import RegisterPage from './components/RegisterPage'
import StartPage from './components/StartPage'
import QuizPage from './components/QuizPage'
import ResultPage from './components/ResultPage'
import AdminDashboard from './components/AdminDashboard'
import './App.css'

export default function App() {
  const [page, setPage] = useState('login') // 'login', 'register', 'start', 'quiz', 'result', 'admin'
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [result, setResult] = useState(null)
  const [questions, setQuestions] = useState([])

  // Check if user is already logged in (restore from localStorage)
  useEffect(() => {
    const storedToken = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')

    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser)
        setToken(storedToken)
        setUser(parsedUser)
        setPage('start')
      } catch (err) {
        console.error('Failed to restore user session:', err)
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      }
    }
  }, [])

  // Handle login
  const handleLogin = (userData, accessToken) => {
    setUser(userData)
    setToken(accessToken)
    // Admin vào dashboard, user vào start page
    if (userData.role === 'admin') {
      setPage('admin')
    } else {
      setPage('start')
    }
  }

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    setToken(null)
    setPage('login')
  }

  // Handle start quiz
  const handleStartQuiz = () => {
    setPage('quiz')
  }

  // Handle submit quiz
  const handleSubmitQuiz = (quizResult, quizQuestions) => {
    setResult(quizResult)
    setQuestions(quizQuestions)
    setPage('result')
  }

  // Handle restart quiz
  const handleRestartQuiz = () => {
    setResult(null)
    setQuestions([])
    setPage('start')
  }

  // Handle page switch for auth pages
  const handleDemoSwitchPage = (newPage) => {
    setPage(newPage)
  }

  return (
    <div className="app">
      {/* Header with user info and logout button */}
      {user && (
        <div className="app-header">
          <div className="user-info">
            <span>👤 {user.username}</span>
            <span className="role-badge" data-role={user.role}>
              {user.role === 'admin' ? '⚙️ Admin' : '👥 User'}
            </span>
          </div>
          
          {/* Navigation for Admin */}
          {user.role === 'admin' && (
            <div className="admin-nav">
              <button
                className={`nav-btn ${page === 'admin' ? 'active' : ''}`}
                onClick={() => setPage('admin')}
              >
                📊 Bảng Điều Khiển
              </button>
              <button
                className={`nav-btn ${page === 'start' ? 'active' : ''}`}
                onClick={() => setPage('start')}
              >
                📝 Làm Quiz
              </button>
            </div>
          )}
          
          <button className="btn-logout" onClick={handleLogout}>
            Đăng Xuất
          </button>
        </div>
      )}

      {/* Main Content */}
      <div className={`app-content ${page === 'admin' ? 'admin-page' : ''}`}>
        {!user && page === 'login' && (
          <LoginPage onLogin={handleLogin} onSwitchPage={handleDemoSwitchPage} />
        )}
        {!user && page === 'register' && (
          <RegisterPage onRegister={handleLogin} onSwitchPage={handleDemoSwitchPage} />
        )}
        {user && page === 'start' && <StartPage onStart={handleStartQuiz} />}
        {user && page === 'quiz' && <QuizPage onSubmit={handleSubmitQuiz} token={token} />}
        {user && page === 'result' && (
          <ResultPage result={result} questions={questions} onRestart={handleRestartQuiz} />
        )}
        {user && page === 'admin' && (
          <AdminDashboard token={token} onChangeRole={() => {}} />
        )}
      </div>
    </div>
  )
}
