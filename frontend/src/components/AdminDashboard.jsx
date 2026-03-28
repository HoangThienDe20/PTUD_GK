import React, { useState, useEffect } from 'react'
import './AdminDashboard.css'

export default function AdminDashboard({ token, onChangeRole }) {
  const [stats, setStats] = useState(null)
  const [allResults, setAllResults] = useState([])
  const [selectedUser, setSelectedUser] = useState(null)
  const [userResults, setUserResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchStats()
    fetchAllResults()
  }, [token])

  const fetchStats = async () => {
    try {
      const response = await fetch('http://localhost:8000/admin/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Không thể lấy thống kê')
      }

      const data = await response.json()
      setStats(data)
    } catch (err) {
      setError(err.message)
    }
  }

  const fetchAllResults = async () => {
    try {
      setLoading(true)
      const response = await fetch('http://localhost:8000/admin/results', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Không thể lấy kết quả')
      }

      const data = await response.json()
      setAllResults(data)
      setLoading(false)
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  const fetchUserResults = async (username) => {
    try {
      const response = await fetch(`http://localhost:8000/admin/user-results/${username}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Không thể lấy kết quả của user')
      }

      const data = await response.json()
      setUserResults(data)
      setSelectedUser(username)
    } catch (err) {
      setError(err.message)
    }
  }

  const getUniqueUsers = () => {
    const users = {}
    allResults.forEach(result => {
      if (!users[result.username]) {
        users[result.username] = {
          username: result.username,
          totalAttempts: 0,
          averageScore: 0,
          bestScore: 0,
          totalQuestions: result.total
        }
      }
      users[result.username].totalAttempts += 1
      users[result.username].bestScore = Math.max(users[result.username].bestScore, result.score)
      users[result.username].averageScore = 
        (users[result.username].averageScore * (users[result.username].totalAttempts - 1) + result.score) / 
        users[result.username].totalAttempts
    })
    return Object.values(users)
  }

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="loading">
          <div className="spinner"></div>
          <p>Đang tải dữ liệu...</p>
        </div>
      </div>
    )
  }

  const uniqueUsers = getUniqueUsers()

  return (
    <div className="admin-dashboard">
      <h1>📊 Bảng Điều Khiển Admin</h1>

      {error && <div className="error-message">{error}</div>}

      {/* Statistics Cards */}
      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-content">
              <div className="stat-label">Tổng User</div>
              <div className="stat-value">{stats.total_users}</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">📝</div>
            <div className="stat-content">
              <div className="stat-label">Tổng Bài Làm</div>
              <div className="stat-value">{stats.total_quizzes_taken}</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">⭐</div>
            <div className="stat-content">
              <div className="stat-label">Điểm Trung Bình</div>
              <div className="stat-value">{stats.average_score.toFixed(1)}</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">🏆</div>
            <div className="stat-content">
              <div className="stat-label">Điểm Cao Nhất</div>
              <div className="stat-value">{stats.highest_score}</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">📉</div>
            <div className="stat-content">
              <div className="stat-label">Điểm Thấp Nhất</div>
              <div className="stat-value">{stats.lowest_score}</div>
            </div>
          </div>
        </div>
      )}

      {/* Results Table and Details */}
      <div className="results-section">
        <div className="users-list">
          <h2>📋 Danh Sách User & Kết Quả</h2>
          
          {uniqueUsers.length === 0 ? (
            <p className="no-data">Chưa có ai làm quiz</p>
          ) : (
            <div className="users-table">
              <div className="table-header">
                <div className="col-username">Username</div>
                <div className="col-attempts">Lần Làm</div>
                <div className="col-average">Điểm TB</div>
                <div className="col-best">Điểm Cao</div>
                <div className="col-action">Chi Tiết</div>
              </div>

              {uniqueUsers.map(user => (
                <div
                  key={user.username}
                  className={`table-row ${selectedUser === user.username ? 'active' : ''}`}
                  onClick={() => fetchUserResults(user.username)}
                >
                  <div className="col-username">👤 {user.username}</div>
                  <div className="col-attempts">{user.totalAttempts}</div>
                  <div className="col-average">{user.averageScore.toFixed(1)}/10</div>
                  <div className="col-best">{user.bestScore}/10</div>
                  <div className="col-action">
                    <button className="btn-view">Xem</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* User Details */}
        {selectedUser && userResults.length > 0 && (
          <div className="user-details">
            <h2>📊 Chi Tiết {selectedUser}</h2>
            <div className="details-list">
              {userResults.map((result, index) => (
                <div key={result.id} className="result-item">
                  <div className="result-header">
                    <span className="result-number">Lần #{index + 1}</span>
                    <span className="result-date">
                      {new Date(result.created_at).toLocaleDateString('vi-VN')}
                    </span>
                    <span className={`result-score ${result.percentage >= 70 ? 'pass' : 'fail'}`}>
                      {result.score}/{result.total} ({result.percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${result.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
