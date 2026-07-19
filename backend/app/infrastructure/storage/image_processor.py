"""Image validation & transformation — pure image concerns, no filesystem.

Responsibility split (Clean Architecture):
  image_processor -> validates bytes, decodes to PIL, derives thumbnails
  storage_service -> decides *where* bytes land on disk and under what name
"""
from __future__ import annotations

import io
from pathlib import Path

from PIL import Image, UnidentifiedImageError

from app.core.config import settings
from app.core.exceptions import (
    CorruptedImageError,
    FileTooLargeError,
    UnsupportedFileTypeError,
)
from app.core.logger import get_logger

logger = get_logger("storage.image")


class ImageProcessor:
    """Validates uploads and produces the derived images we persist."""

    def validate_extension(self, filename: str | None) -> str:
        """Return the normalized extension, or raise UnsupportedFileTypeError."""
        if not filename:
            raise UnsupportedFileTypeError("Filename is missing.")

        ext = Path(filename).suffix.lower()
        allowed = settings.allowed_extensions
        if ext not in allowed:
            raise UnsupportedFileTypeError(
                f"Unsupported file type: '{ext or 'none'}'.",
                detail=f"Allowed extensions: {', '.join(sorted(allowed))}",
            )
        return ext

    def validate_size(self, content: bytes) -> None:
        """Reject payloads above MAX_UPLOAD_SIZE_MB."""
        size = len(content)
        if size == 0:
            raise CorruptedImageError("Uploaded file is empty.")
        if size > settings.max_upload_bytes:
            raise FileTooLargeError(
                f"File too large: {size / 1_048_576:.2f} MB.",
                detail=f"Maximum allowed: {settings.MAX_UPLOAD_SIZE_MB} MB.",
            )

    def decode(self, content: bytes) -> Image.Image:
        """Bytes -> PIL.Image (RGB). Raises CorruptedImageError if undecodable."""
        try:
            image = Image.open(io.BytesIO(content))
            image.verify()  # structural check; consumes the file object
            image = Image.open(io.BytesIO(content))  # reopen after verify()
            return image.convert("RGB")  # X-rays are often grayscale
        except (UnidentifiedImageError, OSError, ValueError) as exc:
            raise CorruptedImageError(
                "Image is corrupted or not a valid image file.", detail=str(exc)
            ) from exc

    def make_thumbnail(self, image: Image.Image) -> Image.Image:
        """Downscaled copy for list views (aspect ratio preserved)."""
        thumb = image.copy()
        thumb.thumbnail(settings.thumbnail_size)
        return thumb

    def process_upload(self, filename: str | None, content: bytes) -> Image.Image:
        """Full validation pipeline: extension -> size -> decode."""
        self.validate_extension(filename)
        self.validate_size(content)
        image = self.decode(content)
        logger.info("Image validated: %s (%d bytes, %s)", filename, len(content), image.size)
        return image
