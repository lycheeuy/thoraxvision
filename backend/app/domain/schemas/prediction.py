"""Prediction API response schemas (Pydantic v2)."""
from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field


class ModelMetadata(BaseModel):
    """Which model produced this prediction (auditability)."""

    name: str
    version: str
    framework: str
    architecture: str | None = None


class PredictionResponse(BaseModel):
    """Successful /predict payload."""

    success: bool = True
    prediction: str = Field(..., description="Display name of the predicted class")
    class_id: int = Field(..., description="0 = Non Tuberculosis, 1 = Tuberculosis")
    confidence: float = Field(..., description="Percentage, 0-100")
    probabilities: dict[str, float] = Field(..., description="Per-class percentages")
    original_image_url: str
    gradcam_url: str
    thumbnail_url: str
    prediction_id: int = Field(..., description="Database primary key (auto-increment)")
    inference_time: float = Field(..., description="Seconds")
    model_info: ModelMetadata
    created_at: datetime

    model_config = {
        "protected_namespaces": (),  # allow the 'model_info' field name
        "json_schema_extra": {
            "example": {
                "success": True,
                "prediction": "Tuberculosis",
                "class_id": 1,
                "confidence": 98.52,
                "probabilities": {"Tuberculosis": 98.52, "Non Tuberculosis": 1.48},
                "original_image_url": "/static/uploads/original/8f14e45f.png",
                "gradcam_url": "/static/uploads/gradcam/8f14e45f.png",
                "thumbnail_url": "/static/uploads/thumbnails/8f14e45f.png",
                "prediction_id": 1,
                "inference_time": 2.63,
                "model_info": {
                    "name": "ThoraxVision-DenseNet121-GWO",
                    "version": "1.0.0",
                    "framework": "PyTorch",
                    "architecture": "DenseNet121",
                },
                "created_at": "2026-07-14T10:30:00Z",
            }
        },
    }
