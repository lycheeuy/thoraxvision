"""Profile API tests — GET/PUT /api/v1/users/me and PUT /users/me/password.

Run against the real database (like test_auth.py). Dedicated throwaway users
are created per module and removed afterwards; seeded users are not touched.
"""
from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.core.security import create_access_token
from app.infrastructure.database.session import SessionLocal
from app.infrastructure.repositories.user_repository import UserRepository
from app.main import app
from app.services.user_service import UserService

PRIMARY_USERNAME = "pytest_profile_user"
PRIMARY_EMAIL = "pytest_profile@example.com"
PRIMARY_PASSWORD = "PytestPass123!"

OTHER_USERNAME = "pytest_profile_other"
OTHER_EMAIL = "pytest_profile_other@example.com"
OTHER_PASSWORD = "OtherPass123!"


def _cleanup(svc: UserService, db, *usernames: str) -> None:
    for name in usernames:
        existing = svc.get_by_username(name)
        if existing:
            db.delete(existing)
            db.commit()


@pytest.fixture
def db_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture
def profile_users(db_session):
    """Create a primary user (the caller) and a second user that already owns
    OTHER_EMAIL, so the email-conflict path has a real collision to hit.
    Fresh per test so password/email mutations don't leak between tests."""
    svc = UserService(UserRepository(db_session))
    _cleanup(svc, db_session, PRIMARY_USERNAME, OTHER_USERNAME)
    primary = svc.create_user(
        username=PRIMARY_USERNAME, email=PRIMARY_EMAIL,
        password=PRIMARY_PASSWORD, full_name="Primary User", role="student",
    )
    svc.create_user(
        username=OTHER_USERNAME, email=OTHER_EMAIL,
        password=OTHER_PASSWORD, full_name="Other User", role="student",
    )
    yield primary
    _cleanup(svc, db_session, PRIMARY_USERNAME, OTHER_USERNAME)


@pytest.fixture
def auth_headers(profile_users) -> dict[str, str]:
    token = create_access_token(profile_users.id)
    return {"Authorization": f"Bearer {token}"}


client = TestClient(app)


# ----------------------------- GET profile ----------------------------------
def test_get_profile_authenticated(auth_headers):
    r = client.get("/api/v1/users/me", headers=auth_headers)
    assert r.status_code == 200
    body = r.json()
    assert body["username"] == PRIMARY_USERNAME
    assert body["email"] == PRIMARY_EMAIL
    assert "hashed_password" not in body


def test_get_profile_unauthenticated():
    r = client.get("/api/v1/users/me")
    assert r.status_code == 401


# ----------------------------- UPDATE profile -------------------------------
def test_update_full_name(auth_headers):
    r = client.put("/api/v1/users/me", headers=auth_headers, json={"full_name": "Renamed"})
    assert r.status_code == 200
    assert r.json()["full_name"] == "Renamed"


def test_update_email(auth_headers):
    r = client.put("/api/v1/users/me", headers=auth_headers,
                   json={"email": "pytest_profile_new@example.com"})
    assert r.status_code == 200
    assert r.json()["email"] == "pytest_profile_new@example.com"


def test_update_email_conflict(auth_headers):
    # OTHER_EMAIL belongs to the second user -> must conflict.
    r = client.put("/api/v1/users/me", headers=auth_headers, json={"email": OTHER_EMAIL})
    assert r.status_code == 409
    assert r.json()["error"]["code"] == "conflict"


def test_update_invalid_email(auth_headers):
    r = client.put("/api/v1/users/me", headers=auth_headers, json={"email": "not-an-email"})
    assert r.status_code == 422


def test_update_cannot_change_role(auth_headers):
    # role is not part of UpdateUserRequest; sending it must be ignored,
    # never elevate the user. Pydantic drops the unknown field.
    r = client.put("/api/v1/users/me", headers=auth_headers,
                   json={"full_name": "Still Student", "role": "admin"})
    assert r.status_code == 200
    assert r.json()["role"] == "student"


def test_update_unauthenticated():
    r = client.put("/api/v1/users/me", json={"full_name": "Nope"})
    assert r.status_code == 401


# ----------------------------- CHANGE PASSWORD ------------------------------
def test_change_password_success(auth_headers):
    r = client.put("/api/v1/users/me/password", headers=auth_headers,
                   json={"current_password": PRIMARY_PASSWORD, "new_password": "BrandNewPass1"})
    assert r.status_code == 200
    assert r.json()["success"] is True


def test_change_password_wrong_current(auth_headers):
    r = client.put("/api/v1/users/me/password", headers=auth_headers,
                   json={"current_password": "WrongPass9", "new_password": "BrandNewPass1"})
    assert r.status_code == 400


def test_change_password_same_as_current(auth_headers):
    r = client.put("/api/v1/users/me/password", headers=auth_headers,
                   json={"current_password": PRIMARY_PASSWORD, "new_password": PRIMARY_PASSWORD})
    assert r.status_code == 400


def test_change_password_too_short(auth_headers):
    r = client.put("/api/v1/users/me/password", headers=auth_headers,
                   json={"current_password": PRIMARY_PASSWORD, "new_password": "short"})
    assert r.status_code == 422


def test_change_password_unauthenticated():
    r = client.put("/api/v1/users/me/password",
                   json={"current_password": "x", "new_password": "yyyyyyyy"})
    assert r.status_code == 401