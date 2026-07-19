"""Filesystem persistence for uploaded and generated images.

Guarantees:
  - target folders are created if missing
  - filenames are UUID4 (collision-free); existing files are NEVER overwritten
  - writes are all-or-nothing: a failure mid-way removes what was already written
  - a caller whose DB insert fails can roll the whole set back
    (delete_prediction_images) so uploads/ never accumulates orphan files
"""
from __future__ import annotations

import uuid
from dataclasses import dataclass
from pathlib import Path

from PIL import Image

from app.core.config import settings
from app.core.exceptions import FileStorageError
from app.core.logger import get_logger

logger = get_logger("storage.files")


@dataclass(frozen=True)
class StoredImages:
    """Paths + public URLs of everything written for one prediction."""

    original_path: str
    gradcam_path: str
    thumbnail_path: str
    original_url: str
    gradcam_url: str
    thumbnail_url: str

    @property
    def disk_paths(self) -> list[str]:
        return [self.original_path, self.gradcam_path, self.thumbnail_path]


class StorageService:
    """Writes images under uploads/{original,gradcam,thumbnails}/."""

    def __init__(self) -> None:
        self._dirs = {
            "original": settings.original_dir,
            "gradcam": settings.gradcam_dir,
            "thumbnails": settings.thumbnail_dir,
        }
        self.ensure_directories()

    def ensure_directories(self) -> None:
        """Create the upload folder tree if it doesn't exist yet."""
        for path in self._dirs.values():
            path.mkdir(parents=True, exist_ok=True)

    @staticmethod
    def new_file_id() -> str:
        """UUID4 stem shared by the original/gradcam/thumbnail of one upload."""
        return uuid.uuid4().hex

    def _public_url(self, subdir: str, filename: str) -> str:
        return f"{settings.STATIC_URL_PREFIX}/{subdir}/{filename}"

    def _delete_paths(self, paths: list[str]) -> None:
        """Best-effort removal — never raises, so it is safe inside except blocks."""
        for path in paths:
            try:
                Path(path).unlink(missing_ok=True)
            except OSError as exc:
                logger.warning("Cleanup failed for %s: %s", path, exc)

    def _save(self, image: Image.Image, subdir: str, filename: str) -> tuple[str, str]:
        """Write one image; refuse to overwrite. Returns (disk_path, public_url)."""
        target: Path = self._dirs[subdir] / filename
        if target.exists():  # UUID collision is practically impossible — fail loudly
            raise FileStorageError(f"Refusing to overwrite existing file: {target.name}")
        try:
            image.save(target, format="PNG")
        except (OSError, ValueError) as exc:
            raise FileStorageError(
                f"Failed to save image to {subdir}/.", detail=str(exc)
            ) from exc
        return str(target), self._public_url(subdir, filename)

    def save_prediction_images(
        self,
        original: Image.Image,
        gradcam: Image.Image,
        thumbnail: Image.Image,
    ) -> StoredImages:
        """Persist all three artifacts of a prediction under one shared UUID.

        All-or-nothing: if the second or third write fails, the earlier ones are
        removed before the error propagates.
        """
        filename = f"{self.new_file_id()}.png"
        written: list[str] = []

        try:
            original_path, original_url = self._save(original, "original", filename)
            written.append(original_path)

            gradcam_path, gradcam_url = self._save(gradcam, "gradcam", filename)
            written.append(gradcam_path)

            thumb_path, thumb_url = self._save(thumbnail, "thumbnails", filename)
            written.append(thumb_path)
        except FileStorageError:
            self._delete_paths(written)  # partial write — undo it
            raise

        logger.info("Images stored: %s", filename)
        return StoredImages(
            original_path=original_path,
            gradcam_path=gradcam_path,
            thumbnail_path=thumb_path,
            original_url=original_url,
            gradcam_url=gradcam_url,
            thumbnail_url=thumb_url,
        )

    def delete_prediction_images(self, stored: StoredImages) -> None:
        """Compensating rollback for a prediction that failed to persist.

        Called when the DB INSERT fails after the images are already on disk:
        without this, uploads/ accumulates orphan files no DB row points at.
        Best-effort by design — it must never mask the original error.
        """
        self._delete_paths(stored.disk_paths)
        logger.info("Rolled back stored images: %s", Path(stored.original_path).name)