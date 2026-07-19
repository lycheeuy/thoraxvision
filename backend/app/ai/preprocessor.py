"""Image preprocessing — rebuilt from transforms.json.

Reproduces the val/test pipeline exactly (no augmentation):
Resize(256,256) -> CenterCrop(224) -> ToTensor -> Normalize(ImageNet).
The steps are read from config so labels/params are never hardcoded.
"""
from __future__ import annotations

import numpy as np
from PIL import Image
from torchvision import transforms

from app.ai.exceptions import InvalidImageError


class ImagePreprocessor:
    """Builds an inference transform from a transforms.json 'inference' block."""

    def __init__(self, inference_cfg: dict) -> None:
        self._cfg = inference_cfg
        self._transform = self._build(inference_cfg)

    @staticmethod
    def _build(cfg: dict) -> transforms.Compose:
        steps: list = []
        for step in sorted(cfg["steps"], key=lambda s: s["order"]):
            name, params = step["name"], step.get("params", {})
            if name == "Resize":
                steps.append(transforms.Resize(tuple(params["size"])))
            elif name == "CenterCrop":
                steps.append(transforms.CenterCrop(params["size"]))
            elif name == "ToTensor":
                steps.append(transforms.ToTensor())
            elif name == "Normalize":
                steps.append(transforms.Normalize(mean=params["mean"], std=params["std"]))
            else:
                raise ValueError(f"Unknown transform step: {name}")
        return transforms.Compose(steps)

    def to_rgb(self, image: Image.Image) -> Image.Image:
        """Force 3-channel RGB (X-rays are often grayscale)."""
        try:
            return image.convert("RGB")
        except Exception as exc:  # noqa: BLE001
            raise InvalidImageError(f"Cannot convert image to RGB: {exc}") from exc

    def to_tensor(self, image: Image.Image):
        """PIL.Image -> normalized tensor [1, 3, 224, 224]."""
        rgb = self.to_rgb(image)
        return self._transform(rgb).unsqueeze(0)

    def to_cam_array(self, image: Image.Image) -> np.ndarray:
        """Float RGB array [224,224,3] in [0,1] for Grad-CAM overlay base."""
        rgb = self.to_rgb(image).resize((224, 224))
        return np.array(rgb, dtype=np.float32) / 255.0
