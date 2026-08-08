"""User service — business logic around user accounts.

Credential verification lives here (not in routes, not in the repository).
User creation is used by the seeder; there is NO public registration.
"""
from __future__ import annotations

from app.core.exceptions import ConflictError, ValidationError
from app.core.exceptions import InactiveUserError, InvalidCredentialsError
from app.core.logger import get_logger
from app.core.permissions import Role, is_valid_role
from app.core.security import hash_password, verify_password
from app.infrastructure.database.models import User
from app.infrastructure.repositories.user_repository import UserRepository
from app.domain.schemas.user import UpdateUserRequest

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
    
    def update_profile(self, user: User, data: UpdateUserRequest) -> User:
        """Update the caller's own profile.

        Only full_name and email are editable here. Email is checked for
        uniqueness against other users before saving, so a clash returns a
        clean 409 instead of surfacing a database integrity error.
        """
        if data.email is not None and data.email != user.email:
            existing = self._repo.get_by_email(data.email)
            if existing is not None and existing.id != user.id:
                raise ConflictError(
                    "Email is already in use by another account.",
                    detail="email_taken",
                )
            user.email = data.email

        if data.full_name is not None:
            user.full_name = data.full_name

        return self._repo.update(user)

    def change_password(
        self, user: User, current_password: str, new_password: str
    ) -> None:
        """Change the caller's password after verifying the current one.

        The new password must differ from the current one. Length rules are
        enforced by the request schema (min 8).
        """
        if not verify_password(current_password, user.hashed_password):
            raise ValidationError(
                "Current password is incorrect.",
                detail="wrong_current_password",
            )
        if verify_password(new_password, user.hashed_password):
            raise ValidationError(
                "New password must be different from the current password.",
                detail="password_unchanged",
            )
        user.hashed_password = hash_password(new_password)
        self._repo.update(user)