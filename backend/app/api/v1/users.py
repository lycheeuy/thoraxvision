"""Self-service profile endpoints for the authenticated user.

    GET  /api/v1/users/me           -> current profile
    PUT  /api/v1/users/me           -> update full_name / email
    PUT  /api/v1/users/me/password  -> change password
"""
from __future__ import annotations

from fastapi import APIRouter, Depends

from app.api.deps import get_current_active_user, get_user_service
from app.domain.schemas.user import (
    ChangePasswordRequest,
    MessageResponse,
    UpdateUserRequest,
    UserResponse,
)
from app.infrastructure.database.models import User
from app.services.user_service import UserService

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me", response_model=UserResponse)
def read_current_user(
    current_user: User = Depends(get_current_active_user),
) -> User:
    """Return the authenticated user's own profile."""
    return current_user


@router.put("/me", response_model=UserResponse)
def update_current_user(
    payload: UpdateUserRequest,
    current_user: User = Depends(get_current_active_user),
    users: UserService = Depends(get_user_service),
) -> User:
    """Update the authenticated user's full_name and/or email."""
    return users.update_profile(current_user, payload)


@router.put("/me/password", response_model=MessageResponse)
def change_current_user_password(
    payload: ChangePasswordRequest,
    current_user: User = Depends(get_current_active_user),
    users: UserService = Depends(get_user_service),
) -> MessageResponse:
    """Change the authenticated user's password."""
    users.change_password(
        current_user, payload.current_password, payload.new_password
    )
    return MessageResponse(message="Password updated successfully.")