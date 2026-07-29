"""Prediction repository — persistence only, no business rules."""
from __future__ import annotations

from datetime import datetime

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.infrastructure.database.models import Prediction
from app.infrastructure.repositories.base_repository import BaseRepository


_SORT_MAP = {
    "newest": (Prediction.created_at, "desc"),
    "oldest": (Prediction.created_at, "asc"),
    "highest_confidence": (Prediction.confidence, "desc"),
    "lowest_confidence": (Prediction.confidence, "asc"),
}


class PredictionRepository(BaseRepository[Prediction]):
    def __init__(self, db: Session) -> None:
        super().__init__(Prediction, db)

    def create_prediction(
        self,
        *,
        predicted_label: str,
        confidence: float,
        inference_time_ms: float,
        image_original_path: str,
        image_gradcam_path: str | None = None,
        image_thumbnail_path: str | None = None,
        user_id: int | None = None,
        model_id: int | None = None,
    ) -> Prediction:
        prediction = Prediction(
            predicted_label=predicted_label,
            confidence=confidence,
            inference_time_ms=inference_time_ms,
            image_original_path=image_original_path,
            image_gradcam_path=image_gradcam_path,
            image_thumbnail_path=image_thumbnail_path,
            user_id=user_id,
            model_id=model_id,
        )
        return self.create(prediction)

    def _apply_history_filters(
        self,
        stmt,
        *,
        user_id: int,
        search: str | None,
        label: str | None,
        date_from: datetime | None,
        date_to: datetime | None,
        min_confidence: float | None,
    ):
        stmt = stmt.where(Prediction.user_id == user_id)

        if search:
            like = f"%{search}%"
            stmt = stmt.where(
                Prediction.predicted_label.ilike(like)
                | Prediction.notes.ilike(like)
            )
        if label:
            stmt = stmt.where(Prediction.predicted_label == label)
        if date_from is not None:
            stmt = stmt.where(Prediction.created_at >= date_from)
        if date_to is not None:
            stmt = stmt.where(Prediction.created_at <= date_to)
        if min_confidence is not None:
            stmt = stmt.where(Prediction.confidence >= min_confidence)

        return stmt

    def get_by_user(
        self,
        *,
        user_id: int,
        page: int = 1,
        limit: int = 20,
        sort: str = "newest",
        search: str | None = None,
        label: str | None = None,
        date_from: datetime | None = None,
        date_to: datetime | None = None,
        min_confidence: float | None = None,
    ) -> list[Prediction]:
        stmt = select(Prediction)
        stmt = self._apply_history_filters(
            stmt,
            user_id=user_id,
            search=search,
            label=label,
            date_from=date_from,
            date_to=date_to,
            min_confidence=min_confidence,
        )

        column, direction = _SORT_MAP.get(sort, _SORT_MAP["newest"])
        order = column.desc() if direction == "desc" else column.asc()
        stmt = stmt.order_by(order, Prediction.id.desc())

        offset = (max(page, 1) - 1) * limit
        stmt = stmt.offset(offset).limit(limit)
        return list(self.db.scalars(stmt).all())

    def count_by_user(
        self,
        *,
        user_id: int,
        search: str | None = None,
        label: str | None = None,
        date_from: datetime | None = None,
        date_to: datetime | None = None,
        min_confidence: float | None = None,
    ) -> int:
        stmt = select(func.count()).select_from(Prediction)
        stmt = self._apply_history_filters(
            stmt,
            user_id=user_id,
            search=search,
            label=label,
            date_from=date_from,
            date_to=date_to,
            min_confidence=min_confidence,
        )
        return int(self.db.scalar(stmt) or 0)

    def get_by_id_for_user(self, *, prediction_id: int, user_id: int) -> Prediction | None:
        stmt = select(Prediction).where(
            Prediction.id == prediction_id,
            Prediction.user_id == user_id,
        )
        return self.db.scalars(stmt).first()