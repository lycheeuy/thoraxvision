"""History API schemas (Pydantic v2).

Two shapes, deliberately different in weight:

  HistoryItem   — a row in the list. Lightweight: only what a table/card
                  needs, and image references as a thumbnail URL, never a
                  filesystem path.
  HistoryDetail — one study in full: original, Grad-CAM and thumbnail URLs,
                  confidence, model information, per-class report, notes and
                  timestamps — everything the detail page renders.

Enums pin the query vocabulary so the API rejects unknown sort values
instead of silently ignoring them.
"""
from __future__ import annotations

from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field


class SortOption(str, Enum):
    newest = "newest"
    oldest = "oldest"
    highest_confidence = "highest_confidence"
    lowest_confidence = "lowest_confidence"


class HistoryItem(BaseModel):
    """One entry in the paginated history list (compact)."""

    prediction_id: int
    predicted_label: str
    confidence: float = Field(..., description="Percentage, 0-100")
    thumbnail_url: str | None = Field(None, description="Static URL, not a filesystem path")
    created_at: datetime


class HistoryListResponse(BaseModel):
    """Paginated envelope for the history list."""

    success: bool = True
    items: list[HistoryItem]
    total: int = Field(..., description="Total predictions matching the filters")
    page: int
    limit: int
    total_pages: int

    model_config = {
        "json_schema_extra": {
            "example": {
                "success": True,
                "items": [
                    {
                        "prediction_id": 12,
                        "predicted_label": "Tuberculosis",
                        "confidence": 98.52,
                        "thumbnail_url": "/static/uploads/thumbnails/8f14e45f.png",
                        "created_at": "2026-07-14T10:30:00Z",
                    }
                ],
                "total": 42,
                "page": 1,
                "limit": 20,
                "total_pages": 3,
            }
        }
    }


class HistoryModelInfo(BaseModel):
    """Model provenance for a stored prediction (best-effort)."""

    name: str | None = None
    version: str | None = None
    framework: str | None = None
    architecture: str | None = None


class HistoryDetailResponse(BaseModel):
    """One prediction in full — everything the detail page needs."""

    success: bool = True
    prediction_id: int
    predicted_label: str
    confidence: float = Field(..., description="Percentage, 0-100")
    probabilities: dict[str, float] = Field(
        default_factory=dict, description="Per-class percentages"
    )
    original_image_url: str | None = None
    gradcam_url: str | None = None
    thumbnail_url: str | None = None
    inference_time: float | None = Field(None, description="Seconds")
    notes: str | None = None
    model_info: HistoryModelInfo | None = None
    created_at: datetime

    model_config = {
        "protected_namespaces": (),  # allow the 'model_info' field name
        "json_schema_extra": {
            "example": {
                "success": True,
                "prediction_id": 12,
                "predicted_label": "Tuberculosis",
                "confidence": 98.52,
                "probabilities": {"Tuberculosis": 98.52, "Non Tuberculosis": 1.48},
                "original_image_url": "/static/uploads/original/8f14e45f.png",
                "gradcam_url": "/static/uploads/gradcam/8f14e45f.png",
                "thumbnail_url": "/static/uploads/thumbnails/8f14e45f.png",
                "inference_time": 2.63,
                "notes": None,
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