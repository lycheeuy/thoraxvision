"""Health router — API, database, and AI model readiness."""
from __future__ import annotations

from fastapi import APIRouter
from sqlalchemy import text

from app.ai.exceptions import AIEngineError
from app.ai.loader import ModelLoader
from app.core.config import settings
from app.domain.schemas.common import HealthResponse
from app.infrastructure.database.session import engine

router = APIRouter(tags=["System"])


@router.get("/health", response_model=HealthResponse, summary="Service readiness")
def health() -> HealthResponse:
    """Report status of the API, the database, and the AI model."""
    # Database
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        database = "connected"
    except Exception:  # noqa: BLE001
        database = "disconnected"

    # AI model — report state without forcing a load
    model_state = "not_loaded"
    model_info: dict | None = None
    if ModelLoader._instance is not None:  # already warm
        model_state = "loaded"
        meta = ModelLoader._instance.metadata
        model_info = {
            "name": meta.get("model_name"),
            "version": meta.get("version"),
            "framework": meta.get("framework"),
        }
    else:
        try:
            bundle = ModelLoader.get_bundle()
            model_state = "loaded"
            model_info = {
                "name": bundle.metadata.get("model_name"),
                "version": bundle.metadata.get("version"),
                "framework": bundle.metadata.get("framework"),
            }
        except AIEngineError:
            model_state = "unavailable"

    healthy = database == "connected" and model_state == "loaded"
    return HealthResponse(
        status="ok" if healthy else "degraded",
        app=settings.APP_NAME,
        phase=4,
        database=database,
        model=model_state,
        model_info=model_info,
    )
