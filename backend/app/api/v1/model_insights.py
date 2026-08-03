"""Model Insights router — one read-only aggregated endpoint (Phase 9).

GET /api/v1/model-insights returns model metadata, parsed metrics, artifact
URLs and the raw GWO / research-summary JSON in a single response. Auth-
protected like the other endpoints; reads existing artifacts only.
"""
from __future__ import annotations

from fastapi import APIRouter, Depends

from app.api.deps import get_current_active_user, get_model_insights_service
from app.domain.schemas.model_insights import ModelInsightsResponse
from app.infrastructure.database.models import User
from app.services.model_insights_service import ModelInsightsService

router = APIRouter(tags=["Model Insights"])


@router.get(
    "/model-insights",
    response_model=ModelInsightsResponse,
    summary="Aggregated model research metadata, metrics and artifacts",
)
def get_model_insights(
    service: ModelInsightsService = Depends(get_model_insights_service),
    current_user: User = Depends(get_current_active_user),
) -> ModelInsightsResponse:
    return service.get_insights()