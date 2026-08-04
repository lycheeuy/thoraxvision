"""Dashboard schemas (Pydantic v2).

Read-only response shapes for the Dashboard API. No business logic, no
database access — these only describe the aggregated overview payload.
"""
from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class Statistics(BaseModel):
    """Headline counts across the user's studies."""

    total_studies: int
    today_studies: int
    tb_detected: int
    normal_detected: int


class RecentStudy(BaseModel):
    """A compact study entry for the recent-activity list."""

    prediction_id: int
    predicted_label: str
    confidence: float = Field(..., description="Percentage, 0-100")
    thumbnail_url: str | None = None
    created_at: datetime


class ModelStatus(BaseModel):
    """Current AI model information and readiness."""

    model_config = ConfigDict(protected_namespaces=())

    name: str | None = None
    architecture: str | None = None
    framework: str | None = None
    version: str | None = None
    threshold: float | None = None
    input_size: int | None = None
    classes: list[str] | None = None
    device: str | None = None
    loaded: bool


class SystemStatus(BaseModel):
    """Liveness of each subsystem."""

    backend: bool
    database: bool
    ai_model: bool
    storage: bool


class DashboardResponse(BaseModel):
    """Aggregated dashboard payload."""

    statistics: Statistics
    recent_studies: list[RecentStudy]
    model: ModelStatus
    system: SystemStatus