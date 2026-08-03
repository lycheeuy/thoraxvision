"""Schemas for the aggregated Model Insights endpoint (Phase 9).

One read-only response assembled from research artifacts under
ml_models/artifacts/. Every data-bearing section is Optional: a missing
artifact yields null, never an error, and the `artifacts` map tells the
frontend which sections to render.
"""
from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field


class ModelOverview(BaseModel):
    """From metadata.json — drives the Hero and Overview sections."""

    name: str | None = None
    version: str | None = None
    framework: str | None = None
    architecture: str | None = None
    task: str | None = None
    input_size: int | list[int] | None = None
    threshold: float | None = None
    classes: list[str] | None = None


class ClassificationRow(BaseModel):
    label: str
    precision: float | None = None
    recall: float | None = None
    f1_score: float | None = None
    support: int | None = None


class ClassificationReport(BaseModel):
    per_class: list[ClassificationRow] = Field(default_factory=list)
    accuracy: float | None = None
    macro_avg: ClassificationRow | None = None
    weighted_avg: ClassificationRow | None = None


class PerformanceMetrics(BaseModel):
    """Headline figures, derived from the parsed report (weighted avg)."""

    accuracy: float | None = None
    precision: float | None = None
    recall: float | None = None
    f1_score: float | None = None


class ArtifactInfo(BaseModel):
    """Availability + metadata for one artifact file."""

    available: bool = False
    url: str | None = None
    size_bytes: int | None = None
    modified_at: str | None = None  # ISO 8601


class ModelInsightsResponse(BaseModel):
    success: bool = True

    overview: ModelOverview
    metrics: PerformanceMetrics | None = None
    classification_report: ClassificationReport | None = None

    confusion_matrix_url: str | None = None
    roc_curve_url: str | None = None
    training_curves_url: str | None = None
    gradcam_example_url: str | None = None

    # Rendered generically on the frontend — no fixed schema assumed.
    gwo: dict[str, Any] | None = None
    research_summary: dict[str, Any] | None = None

    # Per-artifact availability + metadata (keys: classification_report,
    # confusion_matrix, roc_curve, training_curves, gradcam_example,
    # gwo_log, research_summary).
    artifacts: dict[str, ArtifactInfo] = Field(default_factory=dict)

    model_config = {"protected_namespaces": ()}