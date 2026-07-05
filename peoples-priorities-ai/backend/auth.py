import os
import re
import uuid
import sqlite3
from datetime import datetime, timedelta
from typing import Literal
from fastapi import APIRouter, HTTPException, status, Header, Depends
from pydantic import BaseModel, Field
import bcrypt
from jose import jwt, JWTError

# Router instance
router = APIRouter(prefix="/auth", tags=["authentication"])

# JWT configuration
SECRET_KEY = os.environ.get("JWT_SECRET", "hackathon_secret_key_123456789")
ALGORITHM = "HS256"

# Database path resolution
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "data", "peoples_priorities.db")

def get_db_connection():
    if not os.path.exists(DB_PATH):
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database file not found. Ensure seeding scripts are run first."
        )
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

# Email validator helper
EMAIL_REGEX = r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$"

def validate_email(email: str) -> bool:
    return bool(re.match(EMAIL_REGEX, email))

# Schemas
class RegisterRequest(BaseModel):
    name: str = Field(..., min_length=2)
    email: str = Field(...)
    password: str = Field(..., min_length=6)
    role: Literal["mp_office", "citizen"]

class RegisterResponse(BaseModel):
    user_id: str
    name: str
    email: str
    role: str

class LoginRequest(BaseModel):
    email: str
    password: str

class UserProfile(BaseModel):
    user_id: str
    name: str
    email: str
    role: str

class LoginResponse(BaseModel):
    token: str
    user: UserProfile

# Endpoints
@router.post("/register", response_model=RegisterResponse, status_code=201)
def register(body: RegisterRequest):
    # Validate email
    if not validate_email(body.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid email format"
        )
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Check if user already exists
    cursor.execute("SELECT email FROM users WHERE email = ?", (body.email,))
    if cursor.fetchone():
        conn.close()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already exists"
        )
    
    # Hash password
    salt = bcrypt.gensalt()
    password_hash = bcrypt.hashpw(body.password.encode('utf-8'), salt).decode('utf-8')
    user_id = str(uuid.uuid4())
    
    # Insert user
    try:
        cursor.execute(
            "INSERT INTO users (user_id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)",
            (user_id, body.name, body.email, password_hash, body.role)
        )
        conn.commit()
    except Exception as e:
        conn.close()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )
    finally:
        conn.close()
        
    return RegisterResponse(
        user_id=user_id,
        name=body.name,
        email=body.email,
        role=body.role
    )

@router.post("/login", response_model=LoginResponse)
def login(body: LoginRequest):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Lookup user
    cursor.execute("SELECT user_id, name, email, password_hash, role FROM users WHERE email = ?", (body.email,))
    user = cursor.fetchone()
    conn.close()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
        
    # Verify password
    password_hash_bytes = user["password_hash"].encode('utf-8') if isinstance(user["password_hash"], str) else user["password_hash"]
    if not bcrypt.checkpw(body.password.encode('utf-8'), password_hash_bytes):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
        
    # Generate JWT
    expire = datetime.utcnow() + timedelta(hours=24)
    payload = {
        "user_id": user["user_id"],
        "email": user["email"],
        "name": user["name"],
        "role": user["role"],
        "exp": expire.timestamp()
    }
    token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
    
    return LoginResponse(
        token=token,
        user=UserProfile(
            user_id=user["user_id"],
            name=user["name"],
            email=user["email"],
            role=user["role"]
        )
    )

@router.get("/me", response_model=UserProfile)
def get_me(authorization: str = Header(..., description="Bearer {token}")):
    # Extract Bearer token
    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization scheme"
        )
    
    token = authorization[len("Bearer "):]
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("user_id")
        email = payload.get("email")
        name = payload.get("name")
        role = payload.get("role")
        
        if not user_id or not email:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload"
            )
            
        return UserProfile(
            user_id=user_id,
            name=name,
            email=email,
            role=role
        )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )
