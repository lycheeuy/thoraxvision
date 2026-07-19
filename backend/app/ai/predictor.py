"""Inference engine — the reusable AI service.

Receives a PIL.Image, returns a PredictionResult. Optionally produces a
Grad-CAM overlay. No FastAPI, no DB, no file I/O — callable from any
service layer in later phases.
"""
from __future__ import annotations

import logging
import time

import torch
import torch.nn.functional as F
from PIL import Image

from app.ai.exceptions import InferenceError, InvalidImageError
from app.ai.gradcam import GradCAMEngine
from app.ai.loader import ModelBundle, get_model_bundle
from app.ai.schemas import PredictionResult

logger = logging.getLogger("thoraxvision.ai")


class InferenceEngine:
    """Runs preprocessing + forward pass + (optional) Grad-CAM."""

    def __init__(self, bundle: ModelBundle | None = None) -> None:
        self._bundle = bundle or get_model_bundle()
        self._gradcam = GradCAMEngine(self._bundle.model)

    @property
    def bundle(self) -> ModelBundle:
        return self._bundle

    def predict(self, image: Image.Image, use_threshold: bool = True) -> PredictionResult:
        """Classify one X-ray. Softmax probabilities, threshold or argmax."""
        if image is None:
            raise InvalidImageError("No image provided.")

        b = self._bundle
        threshold = float(b.metadata.get("threshold", 0.45))
        tb_index = int(b.metadata.get("threshold_target_class", 1))

        logger.info("Inference started")
        start = time.perf_counter()
        try:
            tensor = b.preprocessor.to_tensor(image).to(b.device)
            with torch.no_grad():
                logits = b.model(tensor)
                probs = F.softmax(logits, dim=1)[0]
        except InvalidImageError:
            raise
        except Exception as exc:  # noqa: BLE001
            logger.exception("Inference error")
            raise InferenceError(f"Forward pass failed: {exc}") from exc

        tb_prob = probs[tb_index].item()
        if use_threshold:
            class_id = tb_index if tb_prob >= threshold else 1 - tb_index
        else:
            class_id = int(torch.argmax(probs).item())

        elapsed = time.perf_counter() - start
        probabilities = {b.labels[i]: round(probs[i].item(), 6) for i in b.labels}
        result = PredictionResult(
            prediction=b.labels[class_id],
            class_id=class_id,
            confidence=round(probs[class_id].item(), 6),
            probabilities=probabilities,
            inference_time=round(elapsed, 4),
            tb_probability=round(tb_prob, 6),
            used_threshold=use_threshold,
        )
        logger.info(
            "Inference completed: %s (%.4f) in %.4fs",
            result.prediction, result.confidence, result.inference_time,
        )
        return result

    def generate_gradcam(self, image: Image.Image, target_class: int = 1) -> Image.Image:
        """Grad-CAM overlay as PIL.Image (runs outside no_grad)."""
        b = self._bundle
        tensor = b.preprocessor.to_tensor(image).to(b.device)
        cam_base = b.preprocessor.to_cam_array(image)
        return self._gradcam.generate(tensor, cam_base, target_class)
