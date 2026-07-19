"""API v1 router aggregator.

Feature routers are mounted here as each phase lands. Routers not yet
implemented (dashboard, history, performance, model) stay unmounted.
"""
from fastapi import APIRouter

from app.api.v1 import auth, health, prediction

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(auth.router)
api_router.include_router(prediction.router)

__all__ = ["api_router"]