"""Prediction router — thin. No business logic here.

POST /api/v1/predict : multipart/form-data, field `image` (jpg/jpeg/png, <= 10 MB)
"""
from __future__ import annotations

from fastapi import APIRouter, Depends, File, UploadFile

from app.api.deps import get_prediction_service
from app.domain.schemas.common import ErrorResponse
from app.domain.schemas.prediction import PredictionResponse
from app.services.prediction_service import PredictionService

router = APIRouter(tags=["Prediction"])


@router.post(
    "/predict",
    response_model=PredictionResponse,
    responses={
        413: {"model": ErrorResponse, "description": "File too large"},
        415: {"model": ErrorResponse, "description": "Unsupported file type"},
        422: {"model": ErrorResponse, "description": "Corrupted image"},
        500: {"model": ErrorResponse, "description": "Storage / database / inference error"},
        503: {"model": ErrorResponse, "description": "AI model unavailable"},
    },
    summary="Classify a chest X-ray (Tuberculosis / Non Tuberculosis)",
)
async def predict(
    image: UploadFile = File(..., description="Chest X-ray (jpg, jpeg, png; max 10 MB)"),
    service: PredictionService = Depends(get_prediction_service),
) -> PredictionResponse:
    """Upload an X-ray, get the classification + Grad-CAM overlay."""
    content = await image.read()
    return service.predict(filename=image.filename, content=content)
