"""User repository — persistence operations for User entities.

Query methods only; credential verification and business rules live in
the service layer.
"""
from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.infrastructure.database.models import User
from app.infrastructure.repositories.base_repository import BaseRepository


class UserRepository(BaseRepository[User]):
    def __init__(self, db: Session) -> None:
        super().__init__(User, db)

    def get_by_username(self, username: str) -> User | None:
        stmt = select(User).where(User.username == username)
        return self.db.scalars(stmt).first()

    def get_by_email(self, email: str) -> User | None:
        stmt = select(User).where(User.email == email)
        return self.db.scalars(stmt).first()

    def touch_last_login(self, user: User) -> User:
        """Record a successful authentication timestamp."""
        user.last_login = datetime.now(timezone.utc)
        return self.update(user)