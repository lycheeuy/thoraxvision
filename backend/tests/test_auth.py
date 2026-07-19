"""Auth API tests — run against the real database (like the app does).

Requires PostgreSQL up and migrations applied. A dedicated throwaway user
is created per test session and removed afterwards; the seeded users are
not touched.
"""
from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.core.security import create_access_token
from app.infrastructure.database.session import SessionLocal
from app.infrastructure.repositories.user_repository import UserRepository
from app.main import app
from app.services.user_service import UserService

USERNAME = "pytest_auth_user"
PASSWORD = "PytestPass123!"


@pytest.fixture(scope="module")
def test_user():
    db = SessionLocal()
    svc = UserService(UserRepository(db))
    existing = svc.get_by_username(USERNAME)
    if existing:  # leftover from an aborted run
        db.delete(existing)
        db.commit()
    user = svc.create_user(
        username=USERNAME,
        email=f"{USERNAME}@thoraxvision.local",
        password=PASSWORD,
        full_name="Pytest Auth User",
        role="student",
    )
    user_id = user.id
    yield user
    cleanup = svc.get_by_id(user_id)
    if cleanup:
        db.delete(cleanup)
        db.commit()
    db.close()


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)


def _login(client: TestClient, username: str = USERNAME, password: str = PASSWORD):
    return client.post("/api/v1/auth/login", data={"username": username, "password": password})


# ---- Login ----------------------------------------------------------------
def test_login_success_returns_token_and_user(client: TestClient, test_user) -> None:
    resp = _login(client)
    assert resp.status_code == 200
    body = resp.json()
    assert body["token_type"] == "bearer"
    assert body["access_token"]
    assert body["expires_in"] > 0
    assert body["user"]["username"] == USERNAME
    assert body["user"]["role"] == "student"
    assert "hashed_password" not in body["user"]


def test_login_updates_last_login(client: TestClient, test_user) -> None:
    resp = _login(client)
    assert resp.json()["user"]["last_login"] is not None


def test_login_wrong_password(client: TestClient, test_user) -> None:
    resp = _login(client, password="salah-total")
    assert resp.status_code == 401
    assert resp.json()["error"]["code"] == "invalid_credentials"


def test_login_unknown_username_same_error(client: TestClient) -> None:
    resp = _login(client, username="tidak_ada_user_ini")
    assert resp.status_code == 401
    assert resp.json()["error"]["code"] == "invalid_credentials"


# ---- Current user / protected endpoint ------------------------------------
def test_me_returns_current_user(client: TestClient, test_user) -> None:
    token = _login(client).json()["access_token"]
    resp = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    assert resp.json()["username"] == USERNAME


def test_protected_endpoint_without_token(client: TestClient) -> None:
    resp = client.get("/api/v1/auth/me")
    assert resp.status_code == 401
    assert resp.headers.get("www-authenticate", "").lower().startswith("bearer")


def test_protected_endpoint_with_garbage_token(client: TestClient) -> None:
    resp = client.get("/api/v1/auth/me", headers={"Authorization": "Bearer bukan.token.jwt"})
    assert resp.status_code == 401
    assert resp.json()["error"]["code"] == "invalid_token"


# ---- Expired token ---------------------------------------------------------
def test_expired_token_rejected(client: TestClient, test_user) -> None:
    expired = create_access_token(test_user.id, expires_minutes=-1)
    resp = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {expired}"})
    assert resp.status_code == 401
    assert resp.json()["error"]["code"] == "invalid_token"


# ---- Logout ----------------------------------------------------------------
def test_logout_requires_auth_and_succeeds(client: TestClient, test_user) -> None:
    assert client.post("/api/v1/auth/logout").status_code == 401
    token = _login(client).json()["access_token"]
    resp = client.post("/api/v1/auth/logout", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    assert resp.json()["success"] is True