"""Model loader — thread-safe singleton.

Loads the reconstructed DenseNet121, its weights, and the three JSON
configs (metadata/labels/transforms) exactly once. Subsequent calls to
get_model_bundle() reuse the same in-memory instance.
"""
from __future__ import annotations

import json
import logging
import threading
import time
from dataclasses import dataclass
from pathlib import Path

import torch

from app.ai.builder import build_model
from app.ai.exceptions import (
    MetadataNotFoundError,
    ModelFileNotFoundError,
    ModelLoadError,
)
from app.ai.preprocessor import ImagePreprocessor
from app.core.config import settings

logger = logging.getLogger("thoraxvision.ai")


@dataclass(frozen=True)
class ModelBundle:
    """Everything the inference engine needs, loaded once."""

    model: torch.nn.Module
    metadata: dict
    labels: dict[int, str]
    preprocessor: ImagePreprocessor
    device: torch.device


class ModelLoader:
    """Singleton holder for the ModelBundle."""

    _instance: ModelBundle | None = None
    _lock = threading.Lock()

    @classmethod
    def get_bundle(cls) -> ModelBundle:
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:  # double-checked locking
                    cls._instance = cls._load()
        return cls._instance

    @classmethod
    def reset(cls) -> None:
        """Drop the cached bundle (e.g. after swapping model versions)."""
        with cls._lock:
            cls._instance = None

    @staticmethod
    def _read_json(path: Path) -> dict:
        if not path.exists():
            raise MetadataNotFoundError(f"Missing config file: {path}")
        with path.open(encoding="utf-8") as fh:
            return json.load(fh)

    @classmethod
    def _load(cls) -> ModelBundle:
        ml_dir = Path(settings.MODEL_PATH).resolve().parent
        weights_path = Path(settings.MODEL_PATH).resolve()

        metadata = cls._read_json(ml_dir / "metadata.json")
        labels_raw = cls._read_json(ml_dir / "labels.json")
        transforms_cfg = cls._read_json(ml_dir / "transforms.json")

        labels = {int(k): v for k, v in labels_raw.items()}
        device = torch.device(settings.DEVICE if torch.cuda.is_available() else "cpu")

        head = metadata.get("classifier_head", {})
        model = build_model(
            dropout_rate=head.get("dropout_rate", 0.3197),
            dense_units=head.get("dense_units", 512),
        )

        if not weights_path.exists():
            raise ModelFileNotFoundError(f"Weights not found: {weights_path}")

        try:
            state_dict = torch.load(weights_path, map_location=device, weights_only=True)
            model.load_state_dict(state_dict)
        except Exception as exc:  # noqa: BLE001
            raise ModelLoadError(f"Failed to load state_dict: {exc}") from exc

        model.to(device)
        model.eval()  # WAJIB: nonaktifkan Dropout & set BatchNorm ke running stats

        preprocessor = ImagePreprocessor(transforms_cfg["inference"])
        logger.info(
            "Model loaded: %s v%s on %s",
            metadata.get("model_name"), metadata.get("version"), device,
        )
        return ModelBundle(model, metadata, labels, preprocessor, device)


def get_model_bundle() -> ModelBundle:
    """Public accessor — loads on first call, reuses afterwards."""
    return ModelLoader.get_bundle()
