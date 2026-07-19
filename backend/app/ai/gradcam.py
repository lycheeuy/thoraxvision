"""Grad-CAM engine.

Generates a class-activation heatmap over model.features.denseblock4 and
returns the overlay as a PIL.Image. Files are NOT written here (Phase 4).

NOTE: Grad-CAM needs gradients — it must run OUTSIDE torch.no_grad().
"""
from __future__ import annotations

import logging

import numpy as np
import torch
from PIL import Image
from pytorch_grad_cam import GradCAM
from pytorch_grad_cam.utils.image import show_cam_on_image
from pytorch_grad_cam.utils.model_targets import ClassifierOutputTarget

from app.ai.exceptions import InferenceError

logger = logging.getLogger("thoraxvision.ai")


class GradCAMEngine:
    """Wraps pytorch-grad-cam for the DenseNet121 TB model."""

    def __init__(self, model: torch.nn.Module) -> None:
        self._model = model
        # Last dense block: highest-resolution semantically-rich feature map
        self._target_layers = [model.features.denseblock4]

    def generate(
        self,
        input_tensor: torch.Tensor,
        cam_base: np.ndarray,
        target_class: int = 1,
    ) -> Image.Image:
        """Return heatmap overlay as PIL.Image (target defaults to TB=1)."""
        try:
            cam = GradCAM(model=self._model, target_layers=self._target_layers)
            targets = [ClassifierOutputTarget(target_class)]
            grayscale_cam = cam(input_tensor=input_tensor, targets=targets)[0]
            overlay = show_cam_on_image(cam_base, grayscale_cam, use_rgb=True)
            return Image.fromarray(overlay)
        except Exception as exc:  # noqa: BLE001
            raise InferenceError(f"Grad-CAM failed: {exc}") from exc
