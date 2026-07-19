"""Authentication schemas (Pydantic v2)."""
from __future__ import annotations

from pydantic import BaseModel

from app.domain.schemas.user import UserResponse


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class LoginResponse(Token):
    """Token + the authenticated user object (decision #6)."""

    expires_in: int  # seconds until expiry
    user: UserResponse

    model_config = {
        "json_schema_extra": {
            "example": {
                "access_token": "eyJhbGciOiJIUzI1NiIs...",
                "token_type": "bearer",
                "expires_in": 3600,
                "user": {
                    "id": 1,
                    "username": "student",
                    "email": "student@thoraxvision.local",
                    "full_name": "Student Demo",
                    "role": "student",
                    "is_active": True,
                    "last_login": "2026-07-17T09:00:00Z",
                    "created_at": "2026-07-17T08:00:00Z",
                },
            }
        }
    }


class LogoutResponse(BaseModel):
    success: bool = True
    message: str = "Logged out. Discard the token on the client side."