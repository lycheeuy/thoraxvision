"""ThoraxVision — FastAPI application entrypoint (Phase 4)."""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text

from app.api.error_handlers import register_error_handlers
from app.api.v1 import api_router
from app.core.config import settings
from app.core.logger import get_logger, setup_logging
from app.infrastructure.database.session import engine
from app.infrastructure.storage.storage_service import StorageService

setup_logging()
logger = get_logger("app")


@asynccontextmanager
async def lifespan(_: FastAPI):
    """Startup: make sure upload folders exist. Model loads lazily on first use."""
    StorageService().ensure_directories()
    logger.info("%s started (env=%s)", settings.APP_NAME, settings.APP_ENV)
    yield
    logger.info("%s shutting down", settings.APP_NAME)


app = FastAPI(
    title=settings.APP_NAME,
    description="Chest X-ray Tuberculosis classification API (DenseNet121 + Grad-CAM).",
    version="0.4.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

register_error_handlers(app)

# Serve uploaded/generated images so gradcam_url & original_image_url resolve.
app.mount(
    settings.STATIC_URL_PREFIX,
    StaticFiles(directory=settings.upload_root),
    name="uploads",
)

# Model research artifacts (Phase 9) — read-only static files.
if settings.model_artifacts_root.is_dir():
    app.mount(
        settings.MODEL_ARTIFACTS_URL_PREFIX,
        StaticFiles(directory=settings.model_artifacts_root),
        name="model-artifacts",
    )

app.include_router(api_router, prefix=settings.API_V1_PREFIX)


@app.get("/health", tags=["System"], include_in_schema=False)
def legacy_health() -> dict:
    """Kept for backward compatibility; prefer /api/v1/health."""
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        database = "connected"
    except Exception:  # noqa: BLE001
        database = "disconnected"
    return {
        "status": "ok" if database == "connected" else "degraded",
        "app": settings.APP_NAME,
        "phase": 4,
        "database": database,
    }
