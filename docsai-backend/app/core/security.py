from passlib.context import CryptContext
from jose import jwt
from datetime import datetime, timedelta, timezone
import os
from typing import Optional

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

def create_jwt(data: dict) -> str:
    # Get environment variables with defaults
    jwt_secret = os.getenv("JWT_SECRET")
    jwt_algorithm = os.getenv("JWT_ALGORITHM", "HS256")  # Default to HS256
    
    # Validate required configuration
    if not jwt_secret:
        raise ValueError("JWT_SECRET environment variable not set")
    
    if not jwt_algorithm:
        raise ValueError("JWT_ALGORITHM environment variable not set")
    
    payload = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=int(os.getenv("JWT_EXPIRE_MINUTES", 60)))
    payload.update({"exp": expire})
    
    # Ensure we're passing strings to jwt.encode
    return jwt.encode(
        claims=payload,
        key=str(jwt_secret),
        algorithm=str(jwt_algorithm)
    )