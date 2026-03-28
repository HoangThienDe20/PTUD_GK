import React from 'react'
import './ResultPage.css'

export default function ResultPage({ result, questions, onRestart }) {
  // Tính phần trăm
  const percentage = Math.round((result.score / result.total) * 100)
  
  // Lấy câu hỏi từ ID
  const getQuestion = (questionId) => {
    return questions.find(q => q.id === questionId)
  }

  // Xác định badge dựa trên điểm
  const getBadge = () => {
    if (percentage >= 80) return { text: 'Excellent! 🌟', class: 'badge-excellent' }
    if (percentage >= 60) return { text: 'Good! 👏', class: 'badge-good' }
    if (percentage >= 40) return { text: 'Fair! 📚', class: 'badge-fair' }
    return { text: 'Try again! 💪', class: 'badge-tryagain' }
  }

  const badge = getBadge()

  return (
    <div className="result-container">
      <div className="result-card">
        <h1>📊 Your Results</h1>
        
        <div className={`score-section ${badge.class}`}>
          <div className="score-display">
            <div className="score-number">{result.score}/{result.total}</div>
            <div className="score-percentage">{percentage}%</div>
          </div>
          <p className="badge-text">{badge.text}</p>
        </div>

        <div className="results-details">
          <h2>Kết quả chi tiết</h2>
          
          {result.results.map((res, idx) => {
            const question = getQuestion(res.question_id)
            const isCorrect = res.correct

            return (
              <div key={res.question_id} className={`result-item ${isCorrect ? 'correct' : 'incorrect'}`}>
                <div className="result-header">
                  <span className="question-number">Câu {idx + 1}</span>
                  <span className={`result-badge ${isCorrect ? 'badge-correct' : 'badge-wrong'}`}>
                    {isCorrect ? '✓ Đúng' : '✗ Sai'}
                  </span>
                </div>

                <p className="result-question">{question?.question}</p>

                <div className="result-answers">
                  <div className="answer-group">
                    <label>Đáp án của bạn:</label>
                    <p className={`answer ${isCorrect ? 'answer-correct' : 'answer-wrong'}`}>
                      {res.selected_answer}
                    </p>
                  </div>

                  {!isCorrect && (
                    <div className="answer-group">
                      <label>Đáp án đúng:</label>
                      <p className="answer answer-correct">{res.correct_answer}</p>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        <button className="btn-restart" onClick={onRestart}>
          🔄 Làm lại Quiz
        </button>
      </div>
    </div>
  )
}
