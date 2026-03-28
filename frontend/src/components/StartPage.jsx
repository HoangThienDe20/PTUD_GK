import React from 'react'
import './StartPage.css'

export default function StartPage({ onStart }) {
  return (
    <div className="start-container">
      <div className="start-card">
        <h1>📝 Quiz App</h1>
        <p className="subtitle">Hãy kiểm tra kiến thức của bạn</p>
        
        <div className="info">
          <p>✨ 10 câu hỏi về Web Development</p>
          <p>⏱️ Không giới hạn thời gian</p>
          <p>🎯 Kiểm tra kết quả ngay lập tức</p>
        </div>
        
        <button className="btn-start" onClick={onStart}>
          Start Quiz
        </button>
      </div>
    </div>
  )
}
