"""User service — business logic around user accounts.

Credential verification lives here (not in routes, not in the repository).
User creation is used by the seeder; there is NO public registration.
"""
from __future__ import annotations

from app.core.exceptions import InactiveUserError, InvalidCredentialsError
from app.core.logger import get_logger
from app.core.permissions import Role, is_valid_role
from app.core.security import hash_password, verify_password
from app.infrastructure.database.models import User
from app.infrastructure.repositories.user_repository import UserRepository

logger = get_logger("users")


class UserService:
    def __init__(self, repository: UserRepository) -> None:
        self._repo = repository

    def get_by_id(self, user_id: int) -> User | None:
        return self._repo.get(user_id)

    def get_by_username(self, username: str) -> User | None:
        return self._repo.get_by_username(username)

    def authenticate(self, username: str, password: str) -> User:
        """Verify credentials. Raises on every failure mode.

        Deliberately uses ONE error for 'unknown username' and 'wrong
        password' so responses don't reveal which usernames exist.
        """
        user = self._repo.get_by_username(username)
        if user is None or not verify_password(password, user.hashed_password):
            logger.warning("Failed login attempt for username=%s", username)
            raise InvalidCredentialsError("Incorrect username or password.")
        if not user.is_active:
            logger.warning("Login attempt for inactive account: %s", username)
            raise InactiveUserError("This account is inactive.")

        return self._repo.touch_last_login(user)

    def create_user(
        self,
        *,
        username: str,
        email: str,
        password: str,
        full_name: str | None = None,
        role: str = Role.STUDENT.value,
        is_active: bool = True,
    ) -> User:
        """Create a user (seeder / admin tooling only — no public signup)."""
        if not is_valid_role(role):
            raise ValueError(f"Invalid role '{role}'. Valid: {sorted(Role.values())}")
        user = User(
            username=username,
            email=email,
            hashed_password=hash_password(password),
            full_name=full_name,
            role=role,
            is_active=is_active,
        )
        created = self._repo.create(user)
        logger.info("User created: %s (role=%s)", username, role)
        return created