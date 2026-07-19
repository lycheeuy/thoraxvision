"""Standardized API envelopes shared by every endpoint."""
from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field


class ErrorDetail(BaseModel):
    code: str = Field(..., description="Machine-readable error code, e.g. 'file_too_large'")
    message: str = Field(..., description="Human-readable summary")
    detail: str | None = Field(None, description="Optional extra context")


class ErrorResponse(BaseModel):
    """The single error shape returned by EVERY failing endpoint."""

    success: bool = False
    error: ErrorDetail

    model_config = {
        "json_schema_extra": {
            "example": {
                "success": False,
                "error": {
                    "code": "file_too_large",
                    "message": "File too large: 12.40 MB.",
                    "detail": "Maximum allowed: 10 MB.",
                },
            }
        }
    }


class HealthResponse(BaseModel):
    """Lightweight readiness report: API, database, AI model."""

    status: str = Field(..., description="ok | degraded")
    app: str
    phase: int
    database: str = Field(..., description="connected | disconnected")
    model: str = Field(..., description="loaded | not_loaded | unavailable")
    model_info: dict[str, Any] | None = None
