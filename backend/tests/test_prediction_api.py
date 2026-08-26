"""API tests — POST /api/v1/predict and GET /api/v1/health.

The AI Engine and DB session are overridden with fakes via dependency
overrides, so these tests run without weights or PostgreSQL.
"""
from __future__ import annotations

from datetime import datetime, timezone

import pytest
from fastapi.testclient import TestClient

from app.api.deps import get_db, get_inference_engine, get_current_active_user
from app.main import app
from tests.test_prediction_service import FakeEngine, FakeRow


class FakeSession:
    """Minimal stand-in; the repository is what actually touches it."""

    def close(self) -> None: ...

class _FakeUser:
    """Minimal authenticated user; /predict only reads .id."""
    id = 1
    
@pytest.fixture
def client(monkeypatch: pytest.MonkeyPatch) -> TestClient:
    # Repository writes nowhere; storage writes to the real uploads/ dir (tmp-safe).
    from app.infrastructure.repositories import prediction_repository as repo_mod

    def fake_create_prediction(self, **kwargs):  # noqa: ANN001
        return FakeRow()

    monkeypatch.setattr(
        repo_mod.PredictionRepository, "create_prediction", fake_create_prediction
    )

    app.dependency_overrides[get_inference_engine] = lambda: FakeEngine()
    app.dependency_overrides[get_db] = lambda: FakeSession()
    app.dependency_overrides[get_current_active_user] = lambda: _FakeUser()
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


def test_predict_success(client: TestClient, png_bytes: bytes) -> None:
    resp = client.post(
        "/api/v1/predict", files={"image": ("xray.png", png_bytes, "image/png")}
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["success"] is True
    assert body["prediction"] == "Tuberculosis"
    assert body["confidence"] == 98.52
    assert body["probabilities"]["Non Tuberculosis"] == 1.48
    assert body["prediction_id"] == 42
    assert body["gradcam_url"].startswith("/static/uploads/gradcam/")
    assert body["model_info"]["version"] == "1.0.0"


def test_predict_rejects_gif(client: TestClient, png_bytes: bytes) -> None:
    resp = client.post(
        "/api/v1/predict", files={"image": ("scan.gif", png_bytes, "image/gif")}
    )
    assert resp.status_code == 415
    body = resp.json()
    assert body["success"] is False
    assert body["error"]["code"] == "unsupported_file_type"


def test_predict_rejects_oversized(client: TestClient) -> None:
    big = b"\x89PNG" + b"0" * (11 * 1024 * 1024)
    resp = client.post("/api/v1/predict", files={"image": ("big.png", big, "image/png")})
    assert resp.status_code == 413
    assert resp.json()["error"]["code"] == "file_too_large"


def test_predict_rejects_corrupted(client: TestClient) -> None:
    resp = client.post(
        "/api/v1/predict", files={"image": ("broken.png", b"not-an-image", "image/png")}
    )
    assert resp.status_code == 422
    assert resp.json()["error"]["code"] == "corrupted_image"


def test_predict_requires_image_field(client: TestClient) -> None:
    resp = client.post("/api/v1/predict")
    assert resp.status_code == 422
    assert resp.json()["success"] is False


def test_health_reports_all_subsystems(client: TestClient) -> None:
    resp = client.get("/api/v1/health")
    assert resp.status_code == 200
    body = resp.json()
    assert set(["status", "app", "phase", "database", "model"]).issubset(body)
    assert body["phase"] == 4
