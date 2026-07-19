"""Application-level exceptions (domain/infrastructure, not HTTP).

Routes never raise HTTPException directly for business failures — services
raise these, and app.api.error_handlers maps them to HTTP responses. This
keeps the service layer framework-free.

Each carries an `error_code` used in the standardized error envelope.
"""
from __future__ import annotations


class AppError(Exception):
    """Base class for every ThoraxVision application error."""

    error_code: str = "internal_error"
    status_code: int = 500

    def __init__(self, message: str, *, detail: str | None = None) -> None:
        super().__init__(message)
        self.message = message
        self.detail = detail


class ValidationError(AppError):
    """Client sent something structurally wrong (bad type, missing field)."""

    error_code = "validation_error"
    status_code = 400


class UnsupportedFileTypeError(AppError):
    """Extension / content type not in the allow-list."""

    error_code = "unsupported_file_type"
    status_code = 415


class FileTooLargeError(AppError):
    """Upload exceeds MAX_UPLOAD_SIZE_MB."""

    error_code = "file_too_large"
    status_code = 413


class CorruptedImageError(AppError):
    """Bytes are not a decodable image."""

    error_code = "corrupted_image"
    status_code = 422


class FileStorageError(AppError):
    """Writing the original / gradcam / thumbnail file failed."""

    error_code = "file_storage_error"
    status_code = 500


class DatabaseError(AppError):
    """Persisting the prediction failed."""

    error_code = "database_error"
    status_code = 500


class ModelUnavailableError(AppError):
    """Weights or JSON config missing / unloadable — service not ready."""

    error_code = "model_unavailable"
    status_code = 503


class PredictionFailedError(AppError):
    """Forward pass or Grad-CAM computation failed."""

    error_code = "prediction_failed"
    status_code = 500

class AuthenticationError(AppError):
    """Generic auth failure (malformed/absent token)."""

    error_code = "authentication_error"
    status_code = 401


class InvalidCredentialsError(AppError):
    """Username not found or password mismatch (same message for both)."""

    error_code = "invalid_credentials"
    status_code = 401


class TokenError(AppError):
    """Token is invalid or expired."""

    error_code = "invalid_token"
    status_code = 401


class InactiveUserError(AppError):
    """Account exists but is deactivated."""

    error_code = "inactive_user"
    status_code = 403


class PermissionDeniedError(AppError):
    """Authenticated but lacks the required role."""

    error_code = "permission_denied"
    status_code = 403
