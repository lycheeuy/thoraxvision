"""Dashboard router — the HTTP layer for the overview screen.

Thin by design: it authenticates the caller, delegates to DashboardService,
and returns the aggregated response. No business logic, no data access here —
domain errors bubble up to the global error handler.
"""
from __future__ import annotations

from fastapi import APIRouter, Depends

from app.api.deps import get_current_active_user, get_dashboard_service
from app.domain.schemas.dashboard import DashboardResponse
from app.infrastructure.database.models import User
from app.services.dashboard_service import DashboardService

router = APIRouter(tags=["Dashboard"])


@router.get(
    "/dashboard",
    response_model=DashboardResponse,
    summary="Aggregated dashboard overview for the current user",
)
async def get_dashboard(
    service: DashboardService = Depends(get_dashboard_service),
    current_user: User = Depends(get_current_active_user),
) -> DashboardResponse:
    return await service.get_dashboard_overview(current_user)