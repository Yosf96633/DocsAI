from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from jose import jwt, JWTError
from dotenv import load_dotenv
import os
from typing import Optional

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

        # Safely get environment variables
        jwt_secret = os.getenv("JWT_SECRET")
        jwt_algorithm = os.getenv("JWT_ALGORITHM", "HS256")
        
        # Validate required configuration
        if not jwt_secret:
            return JSONResponse(
                status_code=500, 
                content={"detail": "Server configuration error: JWT_SECRET not set"}
            )
        
        if not isinstance(jwt_algorithm, str) or not jwt_algorithm.strip():
            return JSONResponse(
                status_code=500, 
                content={"detail": "Server configuration error: JWT_ALGORITHM invalid"}
            )

        try:
            payload = jwt.decode(
                token=str(token),  # Ensure token is string
                key=str(jwt_secret),  # Ensure key is string
                algorithms=[str(jwt_algorithm)]  # Ensure algorithm is in list as string
            )
            request.state.user_id = payload.get("sub")
            request.state.username = payload.get("username")
        except JWTError as e:
            print(f"JWT Error: {e}")  # For debugging
            return JSONResponse(status_code=401, content={"detail": "Invalid or expired token."})
        except Exception as e:
            print(f"Unexpected error: {e}")  # For debugging
            return JSONResponse(status_code=500, content={"detail": "Internal server error"})

        return await call_next(request)

    def extract_token(self, request: Request) -> Optional[str]:
        # 1. Try Authorization header (Bearer token)
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
            return token if token else None

        # 2. Fallback to cookie
        token = request.cookies.get("access_token")
        return token if token else None