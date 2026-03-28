import React, { useState, useEffect } from 'react'
import './QuizPage.css'

export default function QuizPage({ onSubmit, token }) {
  const [questions, setQuestions] = useState([])
  const [answers, setAnswers] = useState({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  // Fetch câu hỏi khi component mount
  useEffect(() => {
    fetchQuestions()
  }, [])

  const fetchQuestions = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('http://localhost:8000/questions', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Session hết hạn. Vui lòng đăng nhập lại.')
        }
        throw new Error('Lỗi khi lấy câu hỏi')
      }
      
      const data = await response.json()
      setQuestions(data)
      
      // Initialize answers object
      const initialAnswers = {}
      data.forEach(q => {
        initialAnswers[q.id] = null
      })
      setAnswers(initialAnswers)
    } catch (err) {
      setError(err.message)
      console.error('Error fetching questions:', err)
    } finally {
      setLoading(false)
    }
  }

  // Cập nhật answer khi người dùng chọn
  const handleAnswerChange = (questionId, option) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: option
    }))
  }

  // Kiểm tra xem đã trả lời hết câu hỏi
  const isAllAnswered = questions.length > 0 && 
                        questions.every(q => answers[q.id] !== null && answers[q.id] !== undefined)

  // Submit quiz
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!isAllAnswered) {
      alert('Vui lòng trả lời hết tất cả câu hỏi')
      return
    }

    try {
      setSubmitting(true)
      
      const submitData = {
        answers: questions.map(q => ({
          question_id: q.id,
          selected_answer: answers[q.id]
        }))
      }

      const response = await fetch('http://localhost:8000/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(submitData)
      })

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Session hết hạn. Vui lòng đăng nhập lại.')
        }
        throw new Error('Lỗi khi submit bài')
      }

      const result = await response.json()
      
      // Lưu kết quả vào database
      try {
        await fetch('http://localhost:8000/results', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(result)
        })
      } catch (err) {
        console.error('Error saving quiz result to database:', err)
        // Vẫn hiển thị kết quả ngay cả nếu lưu database thất bại
      }
      
      onSubmit(result, questions)
    } catch (err) {
      setError(err.message)
      console.error('Error submitting quiz:', err)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="quiz-container">
        <div className="loading">
          <div className="spinner"></div>
          <p>Đang tải câu hỏi...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="quiz-container">
        <div className="error-message">
          <p>❌ {error}</p>
          <button className="btn-retry" onClick={fetchQuestions}>
            Thử lại
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="quiz-container">
      <h1>📝 Quiz</h1>
      <p className="progress">
        Câu hỏi: {Object.values(answers).filter(a => a !== null).length}/{questions.length}
      </p>

      <form onSubmit={handleSubmit}>
        {questions.map((question, index) => (
          <div key={question.id} className="question-card">
            <h2 className="question-title">
              Câu {index + 1}: {question.question}
            </h2>

            <div className="options">
              {question.options.map((option, optIndex) => (
                <label key={optIndex} className="option-label">
                  <input
                    type="radio"
                    name={`question-${question.id}`}
                    value={option}
                    checked={answers[question.id] === option}
                    onChange={() => handleAnswerChange(question.id, option)}
                  />
                  <span className="option-text">{option}</span>
                </label>
              ))}
            </div>
          </div>
        ))}

        <div className="form-actions">
          <button
            type="submit"
            className={`btn-submit ${isAllAnswered ? 'active' : 'disabled'}`}
            disabled={!isAllAnswered || submitting}
          >
            {submitting ? 'Đang xử lý...' : 'Submit'}
          </button>
        </div>
      </form>
    </div>
  )
}
