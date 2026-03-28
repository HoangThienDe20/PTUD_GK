from fastapi import FastAPI, Depends, HTTPException, status, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime, timedelta
from sqlalchemy import create_engine, Column, Integer, String, DateTime, Enum, ForeignKey, Float
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from passlib.context import CryptContext
from jose import JWTError, jwt
import enum
import json

# Database setup
DATABASE_URL = "sqlite:///./quiz_auth.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Security setup
SECRET_KEY = "your-secret-key-change-in-production"  # Change this in production
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

app = FastAPI()

# CORS middleware để cho phép frontend gọi API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==================== ENUMS ====================
class UserRole(str, enum.Enum):
    admin = "admin"
    user = "user"

# ==================== DATABASE MODELS ====================
class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(Enum(UserRole), default=UserRole.user)
    created_at = Column(DateTime, default=datetime.utcnow)

class QuizResult(Base):
    __tablename__ = "quiz_results"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    username = Column(String, index=True)
    score = Column(Integer)
    total = Column(Integer)
    percentage = Column(Float)
    results_json = Column(String)  # JSON string of detailed results
    created_at = Column(DateTime, default=datetime.utcnow)

# Create tables
Base.metadata.create_all(bind=engine)

# Dependency to get DB
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ==================== QUIZ DATA ====================
# Danh sách câu hỏi với đáp án đúng (hardcode)
QUIZ_QUESTIONS = [
    {
        "id": 1,
        "question": "React là thư viện của ngôn ngữ nào?",
        "options": ["Python", "JavaScript", "Java", "C#"],
        "correct_answer": "JavaScript"
    },
    {
        "id": 2,
        "question": "FastAPI được xây dựng trên nền tảng nào?",
        "options": ["Express.js", "Flask", "Starlette", "Django"],
        "correct_answer": "Starlette"
    },
    {
        "id": 3,
        "question": "Vite là công cụ gì?",
        "options": ["Database", "Build tool", "CSS framework", "API Gateway"],
        "correct_answer": "Build tool"
    },
    {
        "id": 4,
        "question": "REST API sử dụng protocol nào?",
        "options": ["FTP", "SMTP", "HTTP/HTTPS", "SSH"],
        "correct_answer": "HTTP/HTTPS"
    },
    {
        "id": 5,
        "question": "JSON là viết tắt của?",
        "options": ["Java Standard Object Notation", "JavaScript Object Notation", "Java Server Object Name", "JavaScript Object Name"],
        "correct_answer": "JavaScript Object Notation"
    },
    {
        "id": 6,
        "question": "Hooks trong React dùng để làm gì?",
        "options": ["Styling", "Quản lý state", "Routing", "Database"],
        "correct_answer": "Quản lý state"
    },
    {
        "id": 7,
        "question": "CORS là viết tắt của?",
        "options": ["Cross Origin Resource Sharing", "Core Object Resource System", "Cross Object Resource System", "Core Origin Request Sharing"],
        "correct_answer": "Cross Origin Resource Sharing"
    },
    {
        "id": 8,
        "question": "Python là ngôn ngữ gì?",
        "options": ["Compiled", "Interpreted", "Assembly", "Markup"],
        "correct_answer": "Interpreted"
    },
    {
        "id": 9,
        "question": "Component trong React là gì?",
        "options": ["Function hoặc Class", "Database", "API", "CSS file"],
        "correct_answer": "Function hoặc Class"
    },
    {
        "id": 10,
        "question": "Async/await được sử dụng để làm gì?",
        "options": ["Styling", "Xử lý async", "Routing", "Database connection"],
        "correct_answer": "Xử lý async"
    },
]

# ==================== PYDANTIC MODELS ====================
# Auth models
class UserRegister(BaseModel):
    email: str
    username: str
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    id: int
    email: str
    username: str
    role: UserRole
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class TokenData(BaseModel):
    username: Optional[str] = None

# Quiz models
class Answer(BaseModel):
    question_id: int
    selected_answer: str

class SubmitRequest(BaseModel):
    answers: List[Answer]

class QuestionResponse(BaseModel):
    id: int
    question: str
    options: List[str]

class ResultDetail(BaseModel):
    question_id: int
    correct: bool
    correct_answer: str
    selected_answer: str

class SubmitResponse(BaseModel):
    score: int
    total: int
    results: List[ResultDetail]

class QuizResultResponse(BaseModel):
    id: int
    username: str
    score: int
    total: int
    percentage: float
    created_at: datetime

    class Config:
        from_attributes = True

class AdminStatsResponse(BaseModel):
    total_users: int
    total_quizzes_taken: int
    average_score: float
    highest_score: int
    lowest_score: int

# ==================== UTILITY FUNCTIONS ====================
def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> User:
    """
    Lấy thông tin user hiện tại từ JWT token
    """
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Parse "Bearer {token}"
    try:
        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            raise ValueError()
    except (ValueError, IndexError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header",
        )
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token",
            )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        )
    
    user = db.query(User).filter(User.username == username).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )
    return user

# ==================== STARTUP EVENT ====================
@app.on_event("startup")
def create_default_admin():
    """Tạo admin user mặc định khi backend khởi động"""
    db = SessionLocal()
    try:
        # Kiểm tra xem admin đã tồn tại chưa
        admin = db.query(User).filter(User.username == "admin").first()
        if not admin:
            hashed_password = hash_password("admin123")
            admin_user = User(
                email="admin@quizapp.com",
                username="admin",
                hashed_password=hashed_password,
                role=UserRole.admin
            )
            db.add(admin_user)
            db.commit()
            print("✅ Admin user created: username=admin, password=admin123")
        else:
            print("✅ Admin user already exists")
    finally:
        db.close()

# ==================== ENDPOINTS ====================
# ==================== AUTHENTICATION ENDPOINTS ====================

@app.post("/register", response_model=UserResponse, tags=["auth"])
def register(user_data: UserRegister, db: Session = Depends(get_db)):
    """
    Đăng ký tài khoản mới
    """
    # Kiểm tra email đã tồn tại
    db_user = db.query(User).filter(User.email == user_data.email).first()
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Kiểm tra username đã tồn tại
    db_user = db.query(User).filter(User.username == user_data.username).first()
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken"
        )
    
    # Tạo user mới
    hashed_password = hash_password(user_data.password)
    db_user = User(
        email=user_data.email,
        username=user_data.username,
        hashed_password=hashed_password,
        role=UserRole.user  # Mặc định là user
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@app.post("/login", response_model=Token, tags=["auth"])
def login(user_data: UserLogin, db: Session = Depends(get_db)):
    """
    Đăng nhập và nhận JWT token
    """
    db_user = db.query(User).filter(User.username == user_data.username).first()
    if not db_user or not verify_password(user_data.password, db_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )
    
    # Tạo access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": db_user.username},
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": UserResponse.from_orm(db_user)
    }

@app.get("/me", response_model=UserResponse, tags=["auth"])
async def get_current_user_info(user: User = Depends(get_current_user)):
    """
    Lấy thông tin user hiện tại
    """
    return user

# ==================== QUIZ ENDPOINTS ====================

@app.get("/", tags=["health"])
def read_root():
    """Health check endpoint"""
    return {"message": "Quiz API is running"}

@app.get("/questions", response_model=List[QuestionResponse], tags=["quiz"])
async def get_questions(user: User = Depends(get_current_user)):
    """
    Lấy danh sách câu hỏi (KHÔNG có đáp án đúng)
    Yêu cầu: Phải đăng nhập
    """
    return [
        QuestionResponse(
            id=q["id"],
            question=q["question"],
            options=q["options"]
        )
        for q in QUIZ_QUESTIONS
    ]

@app.post("/submit", response_model=SubmitResponse, tags=["quiz"])
async def submit_quiz(
    request: SubmitRequest,
    user: User = Depends(get_current_user)
):
    """
    Submit câu trả lời và nhận điểm
    Yêu cầu: Phải đăng nhập
    """
    # Tạo dict từ QUIZ_QUESTIONS để tìm kiếm nhanh
    questions_dict = {q["id"]: q for q in QUIZ_QUESTIONS}
    
    score = 0
    results = []
    
    for answer in request.answers:
        question_id = answer.question_id
        selected_answer = answer.selected_answer
        
        # Lấy câu hỏi
        question = questions_dict.get(question_id)
        if not question:
            continue
        
        correct_answer = question["correct_answer"]
        is_correct = selected_answer == correct_answer
        
        if is_correct:
            score += 1
        
        results.append(
            ResultDetail(
                question_id=question_id,
                correct=is_correct,
                correct_answer=correct_answer,
                selected_answer=selected_answer
            )
        )
    
    return SubmitResponse(
        score=score,
        total=len(request.answers),
        results=results
    )

# ==================== RESULTS MANAGEMENT ====================

@app.post("/results", tags=["quiz"])
async def save_quiz_result(
    request: SubmitResponse,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Lưu kết quả quiz của user
    """
    
    # Tính percentage
    percentage = (request.score / request.total * 100) if request.total > 0 else 0
    
    # Lưu vào database
    quiz_result = QuizResult(
        user_id=user.id,
        username=user.username,
        score=request.score,
        total=request.total,
        percentage=percentage,
        results_json=json.dumps([result.dict() for result in request.results])
    )
    db.add(quiz_result)
    db.commit()
    db.refresh(quiz_result)
    
    return {
        "message": "Quiz result saved successfully",
        "result_id": quiz_result.id
    }

@app.get("/admin/results", response_model=List[QuizResultResponse], tags=["admin"])
async def get_all_quiz_results(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Lấy danh sách tất cả kết quả quiz (Admin only)
    """
    
    # Kiểm tra quyền admin
    if user.role != UserRole.admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin can view all results"
        )
    
    # Lấy tất cả kết quả, sắp xếp theo thời gian mới nhất
    results = db.query(QuizResult).order_by(QuizResult.created_at.desc()).all()
    return results

@app.get("/admin/stats", response_model=AdminStatsResponse, tags=["admin"])
async def get_admin_statistics(
    token: str = None,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Lấy thống kê tổng quan (Admin only)
    """
    # Kiểm tra quyền admin
    if user.role != UserRole.admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin can view statistics"
        )
    
    # Thống kê
    total_users = db.query(User).filter(User.role == UserRole.user).count()
    quiz_results = db.query(QuizResult).all()
    
    if not quiz_results:
        return AdminStatsResponse(
            total_users=total_users,
            total_quizzes_taken=0,
            average_score=0,
            highest_score=0,
            lowest_score=0
        )
    
    scores = [r.score for r in quiz_results]
    average_score = sum(scores) / len(scores)
    highest_score = max(scores) if scores else 0
    lowest_score = min(scores) if scores else 0
    
    return AdminStatsResponse(
        total_users=total_users,
        total_quizzes_taken=len(quiz_results),
        average_score=average_score,
        highest_score=highest_score,
        lowest_score=lowest_score
    )

@app.get("/admin/user-results/{username}", tags=["admin"])
async def get_user_results(
    username: str,
    token: str = None,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Lấy tất cả kết quả của 1 user cụ thể (Admin only)
    """
    # Kiểm tra quyền admin
    if user.role != UserRole.admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin can view user results"
        )
    
    # Lấy kết quả của user
    user_results = db.query(QuizResult).filter(
        QuizResult.username == username
    ).order_by(QuizResult.created_at.desc()).all()
    
    if not user_results:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No results found for user: {username}"
        )
    
    return user_results

# ==================== MAIN ====================
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
