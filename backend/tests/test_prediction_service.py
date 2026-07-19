"""Unit tests — PredictionService (business logic, fully mocked).

No model, no database, no real filesystem: the service is exercised in
isolation, which is the point of keeping it framework-free.
"""
from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone

import pytest
from PIL import Image

from app.ai.exceptions import InferenceError, ModelFileNotFoundError
from app.ai.schemas import PredictionResult
from app.core.exceptions import (
    CorruptedImageError,
    FileTooLargeError,
    ModelUnavailableError,
    PredictionFailedError,
    UnsupportedFileTypeError,
)
from app.infrastructure.storage.storage_service import StoredImages
from app.services.prediction_service import PredictionService

METADATA = {
    "model_name": "ThoraxVision-DenseNet121-GWO",
    "version": "1.0.0",
    "framework": "PyTorch",
    "architecture": "DenseNet121",
    "display_names": {"NON_TBC": "Non Tuberculosis", "TUBERKULOSIS": "Tuberculosis"},
}
RESULT = PredictionResult(
    prediction="TUBERKULOSIS",
    class_id=1,
    confidence=0.9852,
    probabilities={"NON_TBC": 0.0148, "TUBERKULOSIS": 0.9852},
    inference_time=2.63,
    tb_probability=0.9852,
    used_threshold=True,
)


@dataclass
class _Bundle:
    metadata: dict


class FakeEngine:
    def __init__(self, predict_error: Exception | None = None) -> None:
        self.bundle = _Bundle(metadata=METADATA)
        self._error = predict_error

    def predict(self, image, use_threshold: bool = True) -> PredictionResult:
        if self._error:
            raise self._error
        return RESULT

    def generate_gradcam(self, image, target_class: int = 1) -> Image.Image:
        return Image.new("RGB", (224, 224))


class FakeRow:
    id = 42
    created_at = datetime(2026, 7, 14, 10, 30, tzinfo=timezone.utc)


class FakeRepo:
    def __init__(self, fail: bool = False) -> None:
        self.fail = fail
        self.saved: dict | None = None

    def create_prediction(self, **kwargs) -> FakeRow:
        if self.fail:
            raise RuntimeError("db down")
        self.saved = kwargs
        return FakeRow()


class FakeStorage:
    def __init__(self) -> None:
        self.rolled_back: StoredImages | None = None

    def save_prediction_images(self, original, gradcam, thumbnail) -> StoredImages:
        return StoredImages(
            original_path="/disk/original/x.png",
            gradcam_path="/disk/gradcam/x.png",
            thumbnail_path="/disk/thumbnails/x.png",
            original_url="/static/uploads/original/x.png",
            gradcam_url="/static/uploads/gradcam/x.png",
            thumbnail_url="/static/uploads/thumbnails/x.png",
        )

    def delete_prediction_images(self, stored: StoredImages) -> None:
        self.rolled_back = stored


def _service(engine=None, repo=None) -> PredictionService:
    return PredictionService(
        engine=engine or FakeEngine(),
        repository=repo or FakeRepo(),
        storage=FakeStorage(),
    )


def test_happy_path_returns_display_names_and_percentages(png_bytes: bytes) -> None:
    repo = FakeRepo()
    response = _service(repo=repo).predict(filename="xray.png", content=png_bytes)

    assert response.success is True
    assert response.prediction == "Tuberculosis"          # display name
    assert response.class_id == 1
    assert response.confidence == 98.52                   # percentage
    assert response.probabilities == {"Non Tuberculosis": 1.48, "Tuberculosis": 98.52}
    assert response.prediction_id == 42
    assert response.gradcam_url.endswith("/gradcam/x.png")
    assert response.model_info.name == "ThoraxVision-DenseNet121-GWO"
    assert response.model_info.version == "1.0.0"

    # DB stores the INTERNAL label and 0-1 confidence, not the display values
    assert repo.saved["predicted_label"] == "TUBERKULOSIS"
    assert repo.saved["confidence"] == 0.9852
    assert repo.saved["inference_time_ms"] == pytest.approx(2630.0)
    assert repo.saved["user_id"] is None


def test_rejects_unsupported_extension(png_bytes: bytes) -> None:
    with pytest.raises(UnsupportedFileTypeError):
        _service().predict(filename="scan.gif", content=png_bytes)


def test_rejects_oversized_file() -> None:
    with pytest.raises(FileTooLargeError):
        _service().predict(filename="big.png", content=b"\x89PNG" + b"0" * (11 * 1024 * 1024))


def test_rejects_corrupted_image() -> None:
    with pytest.raises(CorruptedImageError):
        _service().predict(filename="broken.png", content=b"not-an-image")


def test_model_unavailable_is_mapped(png_bytes: bytes) -> None:
    engine = FakeEngine(predict_error=ModelFileNotFoundError("weights gone"))
    with pytest.raises(ModelUnavailableError):
        _service(engine=engine).predict(filename="x.png", content=png_bytes)


def test_inference_failure_is_mapped(png_bytes: bytes) -> None:
    engine = FakeEngine(predict_error=InferenceError("forward pass blew up"))
    with pytest.raises(PredictionFailedError):
        _service(engine=engine).predict(filename="x.png", content=png_bytes)


def test_database_failure_is_mapped(png_bytes: bytes) -> None:
    from app.core.exceptions import DatabaseError

    with pytest.raises(DatabaseError):
        _service(repo=FakeRepo(fail=True)).predict(filename="x.png", content=png_bytes)
