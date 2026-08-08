"""User response schema — never exposes hashed_password."""
from __future__ import annotations

from datetime import datetime
from pydantic import BaseModel, ConfigDict, EmailStr, Field



class UserResponse(BaseModel):
    """Safe public representation of a user."""

    model_config = ConfigDict(from_attributes=True)  # build from ORM objects

    id: int
    username: str
    email: str
    full_name: str | None = None
    role: str
    is_active: bool
    last_login: datetime | None = None
    created_at: datetime
    
class UpdateUserRequest(BaseModel):
    """Self-service profile update. Only these fields may be changed by the
    user themselves; role / is_active / username are out of scope."""

    full_name: str | None = Field(default=None, max_length=255)
    email: EmailStr | None = None


class ChangePasswordRequest(BaseModel):
    """Change the current user's password. Requires the current password."""

    current_password: str = Field(..., min_length=1)
    new_password: str = Field(..., min_length=8, max_length=128)


class MessageResponse(BaseModel):
    """Simple success envelope for actions without a resource body."""

    success: bool = True
    message: str