"""API tests for Phase 9-12 read endpoints: dashboard, history, model-insights.

Run against the real database (like test_auth.py / test_profile_api.py).
Two throwaway users are created per test with a few predictions owned by the
first, so statistics, listing and ownership isolation have real data. Seeded
users are untouched; everything is cleaned up afterwards.
"""
from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.core.security import create_access_token
from app.infrastructure.database.session import SessionLocal
from app.infrastructure.repositories.prediction_repository import PredictionRepository
from app.infrastructure.repositories.user_repository import UserRepository
from app.main import app
from app.services.user_service import UserService

USER_A = "pytest_dash_a"
USER_B = "pytest_dash_b"
EMAIL_A = "pytest_dash_a@example.com"
EMAIL_B = "pytest_dash_b@example.com"
PASSWORD = "PytestPass123!"


def _cleanup(db, *usernames):
    svc = UserService(UserRepository(db))
    for name in usernames:
        u = svc.get_by_username(name)
        if u:
            # remove owned predictions first (FK), then the user
            for p in list(getattr(u, "predictions", []) or []):
                db.delete(p)
            db.delete(u)
            db.commit()


@pytest.fixture
def db_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture
def seeded(db_session):
    """User A (with 3 predictions: 2 TB, 1 Non-TB) and User B (1 prediction).
    Yields (user_a, user_b, a_prediction_id, b_prediction_id)."""
    users = UserService(UserRepository(db_session))
    preds = PredictionRepository(db_session)
    _cleanup(db_session, USER_A, USER_B)

    a = users.create_user(username=USER_A, email=EMAIL_A, password=PASSWORD,
                          full_name="Dash A", role="student")
    b = users.create_user(username=USER_B, email=EMAIL_B, password=PASSWORD,
                          full_name="Dash B", role="student")

    def mk(user_id, label, conf):
        return preds.create_prediction(
            predicted_label=label, confidence=conf, inference_time_ms=1200.0,
            image_original_path="/static/uploads/original/x.png", user_id=user_id,
        )

    a1 = mk(a.id, "TUBERKULOSIS", 98.5)
    mk(a.id, "TUBERKULOSIS", 91.2)
    mk(a.id, "NON_TBC", 88.0)
    b1 = mk(b.id, "TUBERKULOSIS", 77.7)

    yield a, b, a1.id, b1.id
    _cleanup(db_session, USER_A, USER_B)


def _headers(user):
    return {"Authorization": f"Bearer {create_access_token(user.id)}"}


client = TestClient(app)


# ================================ DASHBOARD =================================
def test_dashboard_authenticated(seeded):
    a, _, _, _ = seeded
    r = client.get("/api/v1/dashboard", headers=_headers(a))
    assert r.status_code == 200
    body = r.json()
    for key in ("statistics", "recent_studies", "model", "system"):
        assert key in body


def test_dashboard_statistics_match_user_data(seeded):
    a, _, _, _ = seeded
    r = client.get("/api/v1/dashboard", headers=_headers(a))
    stats = r.json()["statistics"]
    # User A owns exactly 3 predictions: 2 TB + 1 Non-TB.
    assert stats["total_studies"] == 3
    assert stats["tb_detected"] == 2
    assert stats["normal_detected"] == 1


def test_dashboard_unauthenticated():
    r = client.get("/api/v1/dashboard")
    assert r.status_code == 401


# ================================= HISTORY =================================
def test_history_list_authenticated(seeded):
    a, _, _, _ = seeded
    r = client.get("/api/v1/history", headers=_headers(a))
    assert r.status_code == 200
    body = r.json()
    assert body["total"] == 3
    assert len(body["items"]) == 3
    assert {"page", "limit", "total_pages"} <= body.keys()


def test_history_list_unauthenticated():
    r = client.get("/api/v1/history")
    assert r.status_code == 401


def test_history_detail_own_study(seeded):
    a, _, a_pred_id, _ = seeded
    r = client.get(f"/api/v1/history/{a_pred_id}", headers=_headers(a))
    assert r.status_code == 200
    assert r.json()["prediction_id"] == a_pred_id


def test_history_detail_other_users_study_is_404(seeded):
    # User A requests User B's prediction -> 404 (never revealed as existing).
    a, _, _, b_pred_id = seeded
    r = client.get(f"/api/v1/history/{b_pred_id}", headers=_headers(a))
    assert r.status_code == 404


def test_history_detail_missing_is_404(seeded):
    a, _, _, _ = seeded
    r = client.get("/api/v1/history/99999999", headers=_headers(a))
    assert r.status_code == 404


def test_history_detail_unauthenticated(seeded):
    _, _, a_pred_id, _ = seeded
    r = client.get(f"/api/v1/history/{a_pred_id}")
    assert r.status_code == 401


# ============================== MODEL INSIGHTS =============================
def test_insights_authenticated(seeded):
    a, _, _, _ = seeded
    r = client.get("/api/v1/model-insights", headers=_headers(a))
    assert r.status_code == 200
    body = r.json()
    assert "overview" in body
    assert "artifacts" in body


def test_insights_unauthenticated():
    r = client.get("/api/v1/model-insights")
    assert r.status_code == 401