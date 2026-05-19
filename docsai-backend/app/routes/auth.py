from fastapi import APIRouter, Depends, HTTPException , Response , Request
from pydantic import BaseModel, EmailStr
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.security import hash_password, verify_password, create_jwt
from app.models.user import User
import os
router = APIRouter(prefix="/v1/auth")

class RegisterRequest(BaseModel):
    username: str
    email: EmailStr
    password: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

is_production = os.getenv("ENV") == "production"

@router.post("/register")
async def register(body: RegisterRequest, response: Response , db: AsyncSession = Depends(get_db)):
    # Check if email or username already exists
    existing = await db.execute(
        select(User).where((User.email == body.email) | (User.username == body.username))
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Username or email already exists.")

    user = User(
        username=body.username,
        email=body.email,
        hashed_password=hash_password(body.password)
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    token = create_jwt({"sub": str(user.id), "username": user.username})
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,       # JS cannot access it
        secure=is_production,         # HTTPS only (set False for local dev)
        samesite="lax",      # CSRF protection
        max_age=60 * 60 * 24 # 1 day in seconds
    )
    return {"status": True, "message": "Registered successfully."}


@router.post("/login")
async def login(body: LoginRequest ,  response: Response , db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()

    if not user or not verify_password(body.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    token = create_jwt({"sub": str(user.id), "username": user.username})
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,       # JS cannot access it
        secure=is_production,         # HTTPS only (set False for local dev)
        samesite="lax",      # CSRF protection
        max_age=60 * 60 * 24 # 1 day in seconds
    )
    return {"status": True, "message": "Login successful."}

@router.post("/logout")
async def logout(req: Request, res: Response):
    res.delete_cookie(
        key="access_token",
        httponly=True,
        secure=is_production,       # match what you set during login
        samesite="lax"     # match what you set during login
    )
    return {"status": True, "message": "Logout successfully."}
    