"""Prediction repository — persistence only, no business rules."""
from __future__ import annotations

from sqlalchemy.orm import Session

from app.infrastructure.database.models import Prediction
from app.infrastructure.repositories.base_repository import BaseRepository


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
        """Insert one prediction row and return it (with its generated id)."""
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
