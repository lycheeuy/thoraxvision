"""Exception -> HTTP mapping.

Every failure leaves the API in ONE shape (ErrorResponse), so the frontend
parses errors the same way regardless of what went wrong.
"""
from __future__ import annotations

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.exceptions import AppError
from app.core.logger import get_logger
from app.domain.schemas.common import ErrorDetail, ErrorResponse

logger = get_logger("api")


def _envelope(code: str, message: str, detail: str | None, status_code: int) -> JSONResponse:
    payload = ErrorResponse(error=ErrorDetail(code=code, message=message, detail=detail))
    headers = {"WWW-Authenticate": "Bearer"} if status_code == 401 else None
    return JSONResponse(status_code=status_code, content=payload.model_dump(), headers=headers)


def register_error_handlers(app: FastAPI) -> None:
    """Attach the standardized handlers to the application."""

    @app.exception_handler(AppError)
    async def _app_error(_: Request, exc: AppError) -> JSONResponse:
        logger.warning("AppError [%s]: %s", exc.error_code, exc.message)
        return _envelope(exc.error_code, exc.message, exc.detail, exc.status_code)

    @app.exception_handler(RequestValidationError)
    async def _request_validation(_: Request, exc: RequestValidationError) -> JSONResponse:
        return _envelope(
            "validation_error",
            "Request validation failed.",
            str(exc.errors()),
            status.HTTP_422_UNPROCESSABLE_ENTITY,
        )

    @app.exception_handler(StarletteHTTPException)
    async def _http_exception(_: Request, exc: StarletteHTTPException) -> JSONResponse:
        return _envelope("http_error", str(exc.detail), None, exc.status_code)

    @app.exception_handler(Exception)
    async def _unhandled(_: Request, exc: Exception) -> JSONResponse:
        logger.exception("Unhandled error")
        return _envelope(
            "internal_error",
            "An unexpected error occurred.",
            None,
            status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
