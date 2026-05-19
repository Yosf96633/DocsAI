from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from jose import jwt, JWTError
from dotenv import load_dotenv
import os

load_dotenv()

UNPROTECTED = [
    "/api/v1/auth/register",
    "/api/v1/auth/login",
    "/docs",
    "/openapi.json",
    "/redoc",
]

class AuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if any(request.url.path.startswith(path) for path in UNPROTECTED):
            return await call_next(request)

        token = self.extract_token(request)
        if not token:
            return JSONResponse(status_code=401, content={"detail": "Missing token."})

        try:
            payload = jwt.decode(token, os.getenv("JWT_SECRET"), algorithms=[os.getenv("JWT_ALGORITHM")])
            request.state.user_id = payload.get("sub")
            request.state.username = payload.get("username")
        except JWTError:
            return JSONResponse(status_code=401, content={"detail": "Invalid or expired token."})

        return await call_next(request)

    def extract_token(self, request: Request) -> str | None:
        # 1. Try Authorization header (Bearer token)
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            return auth_header[7:]

        # 2. Fallback to cookie
        return request.cookies.get("access_token")