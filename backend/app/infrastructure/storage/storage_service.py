"""Supabase Storage persistence for prediction images.

Interface preserved: save_prediction_images(...) -> StoredImages,
delete_prediction_images(stored), ensure_directories(). Images go to a private
Supabase bucket. Local dirs are still created so the legacy StaticFiles mount
(old on-disk records) keeps working.
"""
from __future__ import annotations

import io
import uuid
from dataclasses import dataclass

from PIL import Image

from app.core.config import settings
from app.core.exceptions import FileStorageError
from app.core.logger import get_logger
from app.infrastructure.storage.supabase_storage import (
    StorageBackendError,
    SupabaseStorage,
)

logger = get_logger("storage.files")


@dataclass(frozen=True)
class StoredImages:
    original_path: str
    gradcam_path: str
    thumbnail_path: str
    original_url: str
    gradcam_url: str
    thumbnail_url: str

    @property
    def object_keys(self) -> list[str]:
        return [self.original_path, self.gradcam_path, self.thumbnail_path]


def _png_bytes(image: Image.Image) -> bytes:
    buf = io.BytesIO()
    image.save(buf, format="PNG")
    return buf.getvalue()


class StorageService:
    def __init__(self, storage: SupabaseStorage | None = None) -> None:
        self._storage = storage or SupabaseStorage()
        self._subdirs = {
            "original": settings.ORIGINAL_SUBDIR,
            "gradcam": settings.GRADCAM_SUBDIR,
            "thumbnails": settings.THUMBNAIL_SUBDIR,
        }
        # Legacy local dirs: kept so StaticFiles(directory=upload_root) mounts
        # and old on-disk records still serve. New images go to Supabase.
        self._local_dirs = [
            settings.original_dir,
            settings.gradcam_dir,
            settings.thumbnail_dir,
        ]

    def ensure_directories(self) -> None:
        """Create the local upload tree (legacy StaticFiles needs it)."""
        for path in self._local_dirs:
            path.mkdir(parents=True, exist_ok=True)

    @staticmethod
    def new_file_id() -> str:
        return uuid.uuid4().hex

    def save_prediction_images(
        self,
        original: Image.Image,
        gradcam: Image.Image,
        thumbnail: Image.Image,
    ) -> StoredImages:
        stem = f"{self.new_file_id()}.png"
        keys = {
            "original": f"{self._subdirs['original']}/{stem}",
            "gradcam": f"{self._subdirs['gradcam']}/{stem}",
            "thumbnails": f"{self._subdirs['thumbnails']}/{stem}",
        }
        images = {"original": original, "gradcam": gradcam, "thumbnails": thumbnail}
        uploaded: list[str] = []
        try:
            for name in ("original", "gradcam", "thumbnails"):
                self._storage.upload_png(keys[name], _png_bytes(images[name]))
                uploaded.append(keys[name])
            # Signed URLs are REQUIRED for the response (schema: str). If signing
            # fails, the prediction must NOT look successful -> raise + rollback.
            urls = {
                name: self._storage.create_signed_url(keys[name])
                for name in ("original", "gradcam", "thumbnails")
            }
        except StorageBackendError as exc:
            for k in uploaded:
                self._storage.delete(k)
            raise FileStorageError(
                "Failed to store prediction images.", detail=exc.message
            ) from exc

        logger.info("Images stored to Supabase: %s", stem)
        return StoredImages(
            original_path=keys["original"],
            gradcam_path=keys["gradcam"],
            thumbnail_path=keys["thumbnails"],
            original_url=urls["original"],
            gradcam_url=urls["gradcam"],
            thumbnail_url=urls["thumbnails"],
        )

    def delete_prediction_images(self, stored: StoredImages) -> None:
        for key in stored.object_keys:
            self._storage.delete(key)
        logger.info("Rolled back stored images: %s", stored.original_path)