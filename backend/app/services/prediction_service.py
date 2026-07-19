"""Prediction service — ALL business logic for POST /predict lives here.

Routes stay thin: they parse the request and hand bytes to this service.
The service orchestrates: validate -> decode -> infer -> Grad-CAM ->
store files -> persist row -> build response. It never imports FastAPI.
"""
from __future__ import annotations

from app.ai.exceptions import (
    AIEngineError,
    InferenceError,
    MetadataNotFoundError,
    ModelFileNotFoundError,
    ModelLoadError,
)
from app.ai.predictor import InferenceEngine
from app.core.exceptions import (
    DatabaseError,
    ModelUnavailableError,
    PredictionFailedError,
)
from app.core.logger import get_logger
from app.domain.schemas.prediction import ModelMetadata, PredictionResponse
from app.infrastructure.repositories.prediction_repository import PredictionRepository
from app.infrastructure.storage.image_processor import ImageProcessor
from app.infrastructure.storage.storage_service import StorageService

logger = get_logger("prediction")


class PredictionService:
    """Use case: classify one chest X-ray and persist the outcome."""

    def __init__(
        self,
        engine: InferenceEngine,
        repository: PredictionRepository,
        storage: StorageService | None = None,
        processor: ImageProcessor | None = None,
    ) -> None:
        self._engine = engine
        self._repo = repository
        self._storage = storage or StorageService()
        self._processor = processor or ImageProcessor()

    # ---- display names: presentation only; labels.json stays the source of truth
    def _display_name(self, internal_label: str) -> str:
        names: dict[str, str] = self._engine.bundle.metadata.get("display_names", {})
        return names.get(internal_label, internal_label)

    def predict(
        self,
        *,
        filename: str | None,
        content: bytes,
        user_id: int | None = None,
    ) -> PredictionResponse:
        logger.info("Prediction started: filename=%s", filename)

        # 1-3. Validate extension + size, decode to RGB PIL.Image
        #      (raises UnsupportedFileTypeError / FileTooLargeError / CorruptedImageError)
        image = self._processor.process_upload(filename, content)

        # 4-5. AI Engine (Phase 3) — inference + Grad-CAM
        try:
            result = self._engine.predict(image)
            gradcam_image = self._engine.generate_gradcam(image)
        except (ModelFileNotFoundError, MetadataNotFoundError, ModelLoadError) as exc:
            logger.error("Prediction failed — model unavailable: %s", exc)
            raise ModelUnavailableError(
                "AI model is unavailable.", detail=str(exc)
            ) from exc
        except (InferenceError, AIEngineError) as exc:
            logger.exception("Prediction failed — inference error")
            raise PredictionFailedError("Prediction failed.", detail=str(exc)) from exc

        # 6. Persist images (raises FileStorageError)
        thumbnail = self._processor.make_thumbnail(image)
        stored = self._storage.save_prediction_images(image, gradcam_image, thumbnail)

        # 7. Persist row.
        #    Files are already on disk at this point, so a DB failure would leave
        #    orphans. Compensate: delete what we wrote, then surface the error.
        try:
            row = self._repo.create_prediction(
                predicted_label=result.prediction,          # internal label (NON_TBC / TUBERKULOSIS)
                confidence=result.confidence,               # 0.0 - 1.0
                inference_time_ms=result.inference_time * 1000,
                image_original_path=stored.original_path,
                image_gradcam_path=stored.gradcam_path,
                image_thumbnail_path=stored.thumbnail_path,
                user_id=user_id,
            )
        except Exception as exc:  # noqa: BLE001 — SQLAlchemy raises many types
            logger.exception("Prediction failed — database error; rolling back stored images")
            self._storage.delete_prediction_images(stored)
            raise DatabaseError("Failed to save prediction.", detail=str(exc)) from exc

        # 8. Build response (percentages + display names)
        meta = self._engine.bundle.metadata
        response = PredictionResponse(
            prediction=self._display_name(result.prediction),
            class_id=result.class_id,
            confidence=round(result.confidence * 100, 2),
            probabilities={
                self._display_name(label): round(prob * 100, 2)
                for label, prob in result.probabilities.items()
            },
            original_image_url=stored.original_url,
            gradcam_url=stored.gradcam_url,
            thumbnail_url=stored.thumbnail_url,
            prediction_id=row.id,
            inference_time=result.inference_time,
            model_info=ModelMetadata(
                name=meta.get("model_name", "unknown"),
                version=meta.get("version", "unknown"),
                framework=meta.get("framework", "PyTorch"),
                architecture=meta.get("architecture"),
            ),
            created_at=row.created_at,
        )
        logger.info(
            "Prediction finished: id=%s label=%s confidence=%.2f%% time=%.3fs",
            row.id, response.prediction, response.confidence, response.inference_time,
        )
        return response