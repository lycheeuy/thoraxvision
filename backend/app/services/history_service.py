"""History service — owner-scoped read model over predictions.

Turns stored prediction rows into the API's history shapes. Three jobs the
repository deliberately doesn't do:

  * pagination maths (total_pages from total + limit),
  * turning a stored *disk path* into a public *static URL*, and
  * presenting confidence as a 0–100 percentage (it is stored 0–1) and
    reconstructing the two-class probability split from it.

Nothing here loads a model or touches inference; it only reshapes rows the
prediction pipeline already wrote.
"""
from __future__ import annotations

import os

from sqlalchemy.orm import Session

from app.core.config import settings
from app.domain.schemas.history import (
    HistoryDetailResponse,
    HistoryItem,
    HistoryListResponse,
    HistoryModelInfo,
)
from app.infrastructure.database.models import Prediction
from app.infrastructure.repositories.prediction_repository import PredictionRepository

# Hard ceiling on page size, enforced here as well as at the API boundary so
# the service is safe no matter who calls it.
MAX_LIMIT = 100


def _path_to_url(stored_path: str | None) -> str | None:
    """Map a stored disk path to its public static URL.

    Storage writes an absolute disk path to the DB (e.g.
    /app/uploads/original/abc.png) and serves the same files under
    STATIC_URL_PREFIX. We rebuild the URL from the last two path segments —
    <subdir>/<filename> — which is exactly how the URL was formed originally,
    and is robust to the disk root differing between machines.
    """
    if not stored_path:
        return None
    normalized = stored_path.replace("\\", "/")
    filename = os.path.basename(normalized)
    parent = os.path.basename(os.path.dirname(normalized))  # subdir
    if not filename:
        return None
    return f"{settings.STATIC_URL_PREFIX}/{parent}/{filename}"


def _to_percent(confidence: float) -> float:
    """Confidence is stored 0–1; the API speaks 0–100."""
    pct = confidence * 100.0 if confidence <= 1.0 else confidence
    return round(pct, 2)


def _reconstruct_probabilities(label: str, confidence_pct: float) -> dict[str, float]:
    """Two-class split from the single stored confidence.

    Only the winning label + its confidence are persisted, not the full
    probability vector. For two mutually exclusive classes the loser is
    exactly (100 - winner), so this reproduces the original split without
    loss. If a future model is multi-class this must be revisited.
    """
    other = "Non Tuberculosis" if label == "Tuberculosis" else "Tuberculosis"
    return {
        label: round(confidence_pct, 2),
        other: round(100.0 - confidence_pct, 2),
    }


class HistoryService:
    """Read-only history operations for the authenticated user."""

    def __init__(self, db: Session) -> None:
        self.repo = PredictionRepository(db)

    def list_history(
        self,
        *,
        user_id: int,
        page: int = 1,
        limit: int = 20,
        sort: str = "newest",
        search: str | None = None,
        label: str | None = None,
        date_from=None,
        date_to=None,
        min_confidence: float | None = None,
    ) -> HistoryListResponse:
        page = max(page, 1)
        limit = max(1, min(limit, MAX_LIMIT))

        # min_confidence is expressed 0–100 by the API; storage is 0–1.
        min_conf_stored = (
            min_confidence / 100.0 if min_confidence is not None else None
        )

        rows = self.repo.get_by_user(
            user_id=user_id,
            page=page,
            limit=limit,
            sort=sort,
            search=search,
            label=label,
            date_from=date_from,
            date_to=date_to,
            min_confidence=min_conf_stored,
        )
        total = self.repo.count_by_user(
            user_id=user_id,
            search=search,
            label=label,
            date_from=date_from,
            date_to=date_to,
            min_confidence=min_conf_stored,
        )
        total_pages = (total + limit - 1) // limit if total else 0

        items = [
            HistoryItem(
                prediction_id=r.id,
                predicted_label=r.predicted_label,
                confidence=_to_percent(r.confidence),
                thumbnail_url=_path_to_url(r.image_thumbnail_path),
                created_at=r.created_at,
            )
            for r in rows
        ]
        return HistoryListResponse(
            items=items,
            total=total,
            page=page,
            limit=limit,
            total_pages=total_pages,
        )

    def get_detail(self, *, prediction_id: int, user_id: int) -> HistoryDetailResponse | None:
        """Full detail for one prediction the user owns, or None (→ 404)."""
        row: Prediction | None = self.repo.get_by_id_for_user(
            prediction_id=prediction_id, user_id=user_id
        )
        if row is None:
            return None

        confidence_pct = _to_percent(row.confidence)
        model_info = None
        if row.model is not None:
            model_info = HistoryModelInfo(
                name=getattr(row.model, "model_name", None),
                version=getattr(row.model, "version", None),
                framework=getattr(row.model, "framework", None),
            )

        return HistoryDetailResponse(
            prediction_id=row.id,
            predicted_label=row.predicted_label,
            confidence=confidence_pct,
            probabilities=_reconstruct_probabilities(row.predicted_label, confidence_pct),
            original_image_url=_path_to_url(row.image_original_path),
            gradcam_url=_path_to_url(row.image_gradcam_path),
            thumbnail_url=_path_to_url(row.image_thumbnail_path),
            inference_time=(row.inference_time_ms / 1000.0) if row.inference_time_ms else None,
            notes=row.notes,
            model_info=model_info,
            created_at=row.created_at,
        )