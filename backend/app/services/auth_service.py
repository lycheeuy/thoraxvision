"""Auth service — orchestrates the login use case.

verify credentials (UserService) -> issue JWT -> assemble LoginResponse.
Token *validation* for requests lives in app.api.deps.get_current_user.
"""
from __future__ import annotations

from app.core.config import settings
from app.core.logger import get_logger
from app.core.security import create_access_token
from app.domain.schemas.auth import LoginResponse
from app.domain.schemas.user import UserResponse
from app.services.user_service import UserService

logger = get_logger("auth")


class AuthService:
    def __init__(self, users: UserService) -> None:
        self._users = users

    def login(self, username: str, password: str) -> LoginResponse:
        """Authenticate and issue an access token with role/username claims."""
        user = self._users.authenticate(username, password)

        token = create_access_token(
            user.id,
            extra_claims={"username": user.username, "role": user.role},
        )
        logger.info("Login success: %s (role=%s)", user.username, user.role)
        return LoginResponse(
            access_token=token,
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            user=UserResponse.model_validate(user),
        )