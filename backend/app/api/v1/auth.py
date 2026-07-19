"""Auth router — thin. All logic lives in AuthService/UserService.

POST /api/v1/auth/login   : OAuth2 form (username, password) -> token + user
GET  /api/v1/auth/me      : current authenticated user
POST /api/v1/auth/logout  : stateless — instructs the client to drop the token
"""
from __future__ import annotations

from fastapi import APIRouter, Depends
from fastapi.security import OAuth2PasswordRequestForm

from app.api.deps import get_auth_service, get_current_active_user
from app.domain.schemas.auth import LoginResponse, LogoutResponse
from app.domain.schemas.common import ErrorResponse
from app.domain.schemas.user import UserResponse
from app.infrastructure.database.models import User
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/login",
    response_model=LoginResponse,
    responses={
        401: {"model": ErrorResponse, "description": "Invalid credentials"},
        403: {"model": ErrorResponse, "description": "Inactive account"},
    },
    summary="Login with username & password (OAuth2 form)",
)
def login(
    form: OAuth2PasswordRequestForm = Depends(),
    auth: AuthService = Depends(get_auth_service),
) -> LoginResponse:
    """OAuth2PasswordRequestForm sends `username` and `password` as form
    fields — exactly what Swagger's Authorize dialog submits."""
    return auth.login(form.username, form.password)


@router.get(
    "/me",
    response_model=UserResponse,
    responses={401: {"model": ErrorResponse, "description": "Missing/invalid token"}},
    summary="Current authenticated user",
)
def me(user: User = Depends(get_current_active_user)) -> User:
    return user


@router.post(
    "/logout",
    response_model=LogoutResponse,
    summary="Stateless logout",
)
def logout(user: User = Depends(get_current_active_user)) -> LogoutResponse:
    """JWT is stateless: the server keeps no session, so logout simply tells
    the client to discard its token. Requiring auth here keeps the endpoint
    honest (you can't 'log out' without being logged in)."""
    return LogoutResponse()