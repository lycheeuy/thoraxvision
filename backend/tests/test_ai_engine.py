"""Unit tests — AI Engine (Phase 3).

Skipped automatically when the weights file is absent, so CI without the
.pth still passes.
"""
from __future__ import annotations

import pytest
from PIL import Image

from app.ai.builder import build_model
from app.ai.exceptions import ModelFileNotFoundError
from app.ai.loader import ModelLoader, get_model_bundle
from app.ai.predictor import InferenceEngine
from app.core.config import settings

weights_missing = not settings.model_file.exists()
requires_weights = pytest.mark.skipif(weights_missing, reason="model weights not present")


def test_build_model_has_custom_head() -> None:
    """Classifier must be the GWO head, not DenseNet121's default Linear."""
    model = build_model()
    head = model.classifier
    assert len(head) == 9, "custom head must have 9 layers"
    assert head[1].in_features == 1024 and head[1].out_features == 512
    assert head[-1].out_features == 2, "binary classification"


@requires_weights
def test_loader_is_singleton() -> None:
    ModelLoader.reset()
    assert get_model_bundle() is get_model_bundle()


@requires_weights
def test_labels_come_from_config() -> None:
    bundle = get_model_bundle()
    assert bundle.labels[0] == "NON_TBC"
    assert bundle.labels[1] == "TUBERKULOSIS"


@requires_weights
def test_predict_returns_normalized_probabilities(sample_image: Image.Image) -> None:
    result = InferenceEngine().predict(sample_image)
    assert result.class_id in (0, 1)
    assert 0.0 <= result.confidence <= 1.0
    assert abs(sum(result.probabilities.values()) - 1.0) < 1e-3
    assert result.inference_time > 0


@requires_weights
def test_gradcam_returns_pil_image(sample_image: Image.Image) -> None:
    overlay = InferenceEngine().generate_gradcam(sample_image)
    assert isinstance(overlay, Image.Image)
    assert overlay.size == (224, 224)


def test_missing_weights_raises(monkeypatch: pytest.MonkeyPatch) -> None:
    ModelLoader.reset()
    monkeypatch.setattr(settings, "MODEL_PATH", "ml_models/does_not_exist.pth")
    with pytest.raises(ModelFileNotFoundError):
        get_model_bundle()
    ModelLoader.reset()
