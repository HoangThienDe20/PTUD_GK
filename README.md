# 📝 Quiz App - Fullstack

Một ứng dụng trắc nghiệm đơn giản được xây dựng với **FastAPI** (Backend) và **React + Vite** (Frontend).

## ✨ Tính năng

- ✅ 10 câu hỏi Web Development
- ✅ Chọn đáp án multiple choice
- ✅ Tính điểm tự động
- ✅ Hiển thị kết quả chi tiết (đúng/sai)
- ✅ Làm lại quiz bất cứ lúc nào
- ✅ UI đẹp với gradient color
- ✅ Loading state & error handling

## 🧩 Tech Stack

- **Backend**: FastAPI, Pydantic, Uvicorn
- **Frontend**: React 18, Vite, CSS3
- **API**: REST (JSON)
- **Giao tiếp**: CORS middleware

## 📁 Project Structure

```
PTUD/
├── backend/
│   ├── main.py                 # FastAPI app & endpoints
│   └── requirements.txt         # Python dependencies
│
└── frontend/
    ├── src/
    │   ├── components/         # React components
    │   │   ├── StartPage.jsx
    │   │   ├── StartPage.css
    │   │   ├── QuizPage.jsx
    │   │   ├── QuizPage.css
    │   │   ├── ResultPage.jsx
    │   │   └── ResultPage.css
    │   ├── App.jsx            # Main App component
    │   ├── App.css
    │   ├── main.jsx           # Entry point
    │   └── index.css          # Global styles
    ├── index.html             # HTML template
    ├── package.json           # npm dependencies
    ├── vite.config.js         # Vite configuration
    └── .gitignore
```

## 🚀 Hướng dẫn chạy trên Windows

### ⚙️ Yêu cầu hệ thống
- **Python 3.8+** - Tải từ [python.org](https://www.python.org/downloads/)
- **Node.js 16+** - Tải từ [nodejs.org](https://nodejs.org/)
- **Terminal/CMD/PowerShell**

### 🔧 Cài đặt ban đầu (lần đầu chạy)

#### Bước 1: Cài đặt Backend dependencies
```bash
cd backend
pip install -r requirements.txt
```

#### Bước 2: Cài đặt Frontend dependencies
```bash
cd frontend
npm install
cd ..
```

### ▶️ Chạy ứng dụng

**Mở 2 terminal/CMD riêng biệt:**

#### Terminal 1 - Backend (FastAPI)
```bash
cd backend
python -m uvicorn main:app --reload
```
✅ Backend chạy tại: `http://localhost:8000`

#### Terminal 2 - Frontend (React + Vite)
```bash
cd frontend
npm run dev
```
✅ Frontend chạy tại: `http://localhost:3000`

#### 🌐 Mở trình duyệt
Click vào link `http://localhost:3000` hoặc tự nhập vào URL bar

### 📝 Đăng nhập

**Tài khoản Admin (mặc định):**
- Username: `admin`
- Password: `admin123`

**Tạo tài khoản mới:**
- Click "Đăng ký" để tạo user mới
- User mới sẽ có role `user` (không có quyền admin)

### 🎯 Tính năng

#### User
- 📝 Làm bài quiz 10 câu
- 📊 Xem kết quả chi tiết (đúng/sai)
- 🔄 Làm lại quiz bất cứ lúc nào

#### Admin
- 👥 Xem danh sách người dùng & thống kê
- 📈 Xem chi tiết kết quả của từng user
- 📊 Thống kê tổng: số người, điểm TB, điểm cao/thấp nhất

### 🔌 API Endpoints (Backend)

**Authentication:**
- `POST /register` - Đăng ký tài khoản
- `POST /login` - Đăng nhập, nhận JWT token

**Quiz (cần token):**
- `GET /questions` - Lấy danh sách 10 câu hỏi
- `POST /submit` - Submit bài quiz, nhận kết quả

**Admin (cần token + role admin):**
- `GET /admin/results` - Danh sách tất cả kết quả quiz
- `GET /admin/stats` - Thống kê chung
- `GET /admin/user-results/{username}` - Kết quả của user cụ thể

**Documentation:** `http://localhost:8000/docs` (Swagger UI)

---

## 🎮 Cách sử dụng App

1. **Trang nhất** - Click "Start Quiz"
2. **Trang trắc nghiệm** - Chọn đáp án cho 10 câu (Submit button sẽ enable khi chọn hết)
3. **Trang kết quả** - Xem điểm, danh sách câu đúng/sai, click "Làm lại Quiz" để bắt đầu lại

---

## 📝 API Documentation

### GET /questions
Lấy danh sách câu hỏi (KHÔNG có đáp án đúng)

**Response:**
```json
[
  {
    "id": 1,
    "question": "React là thư viện của ngôn ngữ nào?",
    "options": ["Python", "JavaScript", "Java", "C#"]
  },
  ...
]
```

### POST /submit
Submit câu trả lời và nhận kết quả

**Request:**
```json
{
  "answers": [
    {
      "question_id": 1,
      "selected_answer": "JavaScript"
    },
    ...
  ]
}
```

**Response:**
```json
{
  "score": 8,
  "total": 10,
  "results": [
    {
      "question_id": 1,
      "correct": true,
      "correct_answer": "JavaScript",
      "selected_answer": "JavaScript"
    },
    {
      "question_id": 2,
      "correct": false,
      "correct_answer": "Starlette",
      "selected_answer": "Django"
    },
    ...
  ]
}
```

---

## 🔧 Troubleshooting

### Frontend không kết nối được Backend
- ✅ Kiểm tra backend chạy tại `http://localhost:8000`
- ✅ Kiểm tra CORS middleware trong `main.py` (đã config cho mọi origin)

### Port 8000 hoặc 3000 bị chiếm
- ✅ Chạy backend: `python -m uvicorn main:app --reload --port 8001`
- ✅ Chạy frontend: `npm run dev -- --port 3001`
- Sau đó cập nhật URL trong `QuizPage.jsx`: `http://localhost:8001`

### Module không tìm thấy (Python)
```bash
python -m pip install --user -r requirements.txt
```

### Lỗi "uvicorn: command not found"
Nếu gặp lỗi này, dùng:
```bash
python -m uvicorn main:app --reload
```
Thay vì:
```bash
uvicorn main:app --reload
```

### Module không tìm thấy (Node.js)
```bash
npm install
```

---

## 📌 Một số lưu ý

- **Backend**: Câu hỏi được hardcode trong `QUIZ_QUESTIONS`, có thể thêm/xóa câu bất cứ lúc nào
- **Frontend**: Chỉ fetch câu hỏi (không có đáp án đúng), đáp án đúng chỉ trả về khi submit
- **CORS**: Cho phép mọi origin (`allow_origins=["*"]`), nếu deploy production cần update

---

## 💡 Có thể mở rộng

- [ ] Thêm cơ sở dữ liệu (SQLite, PostgreSQL)
- [ ] Thêm authentication (JWT)
- [ ] Lưu kết quả quiz người dùng
- [ ] Thêm timer cho quiz
- [ ] Thêm câu hỏi động từ API
- [ ] Phân loại câu hỏi (topic/difficulty)

---

## 📄 License

MIT

**Tổ chức tác giả:** Huỳnh Nhật Hào
**Ngày tạo:** 2026

