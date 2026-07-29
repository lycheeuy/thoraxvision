"""History router — owner-scoped reads. Thin; logic lives in HistoryService.

GET /api/v1/history            : paginated, filterable, sortable list
GET /api/v1/history/{id}       : full detail for one owned prediction (404 otherwise)

Both endpoints require an authenticated, active user and only ever expose
that user's own predictions.
"""
from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.api.deps import get_current_active_user, get_history_service
from app.domain.schemas.common import ErrorResponse
from app.domain.schemas.history import (
    HistoryDetailResponse,
    HistoryListResponse,
    SortOption,
)
from app.infrastructure.database.models import User
from app.services.history_service import HistoryService

router = APIRouter(tags=["History"])


@router.get(
    "/history",
    response_model=HistoryListResponse,
    summary="List the authenticated user's prediction history",
)
def list_history(
    page: int = Query(1, ge=1, description="1-based page number"),
    limit: int = Query(20, ge=1, le=100, description="Page size (max 100)"),
    sort: SortOption = Query(SortOption.newest, description="Sort order"),
    search: str | None = Query(None, description="Match against label and notes"),
    label: str | None = Query(None, description="Exact label filter, e.g. 'Tuberculosis'"),
    date_from: datetime | None = Query(None, description="Only predictions at/after this time"),
    date_to: datetime | None = Query(None, description="Only predictions at/before this time"),
    min_confidence: float | None = Query(
        None, ge=0, le=100, description="Minimum confidence percentage (0-100)"
    ),
    service: HistoryService = Depends(get_history_service),
    current_user: User = Depends(get_current_active_user),
) -> HistoryListResponse:
    return service.list_history(
        user_id=current_user.id,
        page=page,
        limit=limit,
        sort=sort.value,
        search=search,
        label=label,
        date_from=date_from,
        date_to=date_to,
        min_confidence=min_confidence,
    )


@router.get(
    "/history/{prediction_id}",
    response_model=HistoryDetailResponse,
    responses={404: {"model": ErrorResponse, "description": "Not found or not owned"}},
    summary="Get one prediction from the user's history",
)
def get_history_detail(
    prediction_id: int,
    service: HistoryService = Depends(get_history_service),
    current_user: User = Depends(get_current_active_user),
) -> HistoryDetailResponse:
    detail = service.get_detail(prediction_id=prediction_id, user_id=current_user.id)
    if detail is None:
        # 404 whether the row is absent or owned by someone else — never reveal
        # that another user's prediction id exists.
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prediction not found.",
        )
    return detail