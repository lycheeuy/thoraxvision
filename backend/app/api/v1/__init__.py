"""API v1 router aggregator."""
from fastapi import APIRouter
from app.api.v1 import auth, dashboard, health, history, model_insights, prediction, users
api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(auth.router)
api_router.include_router(prediction.router)
api_router.include_router(history.router)
api_router.include_router(model_insights.router)
api_router.include_router(dashboard.router)
api_router.include_router(users.router)
__all__ = ["api_router"]