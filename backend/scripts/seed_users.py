"""Database seeder — creates the four default users if they don't exist.

Run from the backend/ folder (venv active):

    python -m scripts.seed_users

Idempotent: re-running never duplicates or overwrites existing users.
There is NO public registration; this is how accounts come to exist.
"""
from __future__ import annotations

import sys
from pathlib import Path

# Allow running as a plain script too (python scripts/seed_users.py)
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.core.logger import get_logger, setup_logging  # noqa: E402
from app.core.permissions import Role  # noqa: E402
from app.infrastructure.database.session import SessionLocal  # noqa: E402
from app.infrastructure.repositories.user_repository import UserRepository  # noqa: E402
from app.services.user_service import UserService  # noqa: E402

setup_logging()
logger = get_logger("seed")

# NOTE: default passwords are for local development of this final project
# ONLY. Change them (or the users) before any shared/public deployment.
DEFAULT_USERS: list[dict] = [
    {
        "username": "admin",
        "email": "admin@thoraxvision.local",
        "password": "Admin123!",
        "full_name": "Administrator",
        "role": Role.ADMIN.value,
    },
    {
        "username": "student",
        "email": "student@thoraxvision.local",
        "password": "Student123!",
        "full_name": "Student Demo",
        "role": Role.STUDENT.value,
    },
    {
        "username": "supervisor",
        "email": "supervisor@thoraxvision.local",
        "password": "Supervisor123!",
        "full_name": "Supervisor Demo",
        "role": Role.SUPERVISOR.value,
    },
    {
        "username": "examiner",
        "email": "examiner@thoraxvision.local",
        "password": "Examiner123!",
        "full_name": "Examiner Demo",
        "role": Role.EXAMINER.value,
    },
]


def seed() -> None:
    db = SessionLocal()
    try:
        users = UserService(UserRepository(db))
        created, skipped = 0, 0
        for data in DEFAULT_USERS:
            if users.get_by_username(data["username"]) is not None:
                logger.info("Skip (exists): %s", data["username"])
                skipped += 1
                continue
            users.create_user(**data)
            created += 1
        logger.info("Seeding done: %d created, %d skipped.", created, skipped)
    finally:
        db.close()


if __name__ == "__main__":
    seed()