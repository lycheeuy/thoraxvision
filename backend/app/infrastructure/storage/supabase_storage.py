"""Supabase Storage REST client — httpx only, backend-side (service key).

Three operations: upload object, create signed URL, delete object.
Never logs or returns the service key, and never exposes raw upstream
bodies (which could echo request context). Failures raise StorageBackendError
with a safe message.
"""
from __future__ import annotations

import httpx

from app.core.config import settings
from app.core.logger import get_logger

logger = get_logger("storage.supabase")


class StorageBackendError(Exception):
    """Safe storage error — message never contains credentials."""

    def __init__(self, message: str, *, status: int | None = None) -> None:
        super().__init__(message)
        self.message = message
        self.status = status


class SupabaseStorage:
    """Thin REST wrapper over the Supabase Storage API (private bucket)."""

    def __init__(self) -> None:
        self._base = settings.SUPABASE_URL.rstrip("/") + "/storage/v1"
        self._bucket = settings.SUPABASE_STORAGE_BUCKET
        self._key = settings.SUPABASE_SERVICE_KEY
        self._expire = settings.SUPABASE_SIGNED_URL_EXPIRE_SECONDS

    def _headers(self, content_type: str | None = None) -> dict[str, str]:
        # Supabase secret keys (sb_secret_...) require BOTH the Authorization
        # bearer header AND the apikey header; legacy service_role JWTs accept
        # either, so sending both is correct for all key types.
        h = {"Authorization": f"Bearer {self._key}", "apikey": self._key}
        if content_type:
            h["Content-Type"] = content_type
        return h

    def upload_png(self, object_key: str, data: bytes) -> None:
        """Upload PNG bytes to {bucket}/{object_key}. Refuses overwrite."""
        url = f"{self._base}/object/{self._bucket}/{object_key}"
        try:
            resp = httpx.post(
                url,
                content=data,
                headers={**self._headers("image/png"), "x-upsert": "false"},
                timeout=30.0,
            )
        except httpx.HTTPError:
            raise StorageBackendError("Storage upload failed (network).") from None
        if resp.status_code not in (200, 201):
            raise StorageBackendError("Storage upload failed.", status=resp.status_code)

    def create_signed_url(self, object_key: str) -> str:
        """Return an absolute HTTPS signed URL for object_key."""
        url = f"{self._base}/object/sign/{self._bucket}/{object_key}"
        try:
            resp = httpx.post(
                url,
                json={"expiresIn": self._expire},
                headers=self._headers("application/json"),
                timeout=15.0,
            )
        except httpx.HTTPError:
            raise StorageBackendError("Signed URL request failed (network).") from None
        if resp.status_code != 200:
            raise StorageBackendError(
                "Signed URL request failed.", status=resp.status_code
            )
        body = resp.json()
        signed = body.get("signedURL") or body.get("signedUrl")
        if not signed:
            raise StorageBackendError("Signed URL missing in response.")
        return f"{self._base}{signed}" if signed.startswith("/") else signed

    def delete(self, object_key: str) -> bool:
        """Best-effort delete. Returns True on success, False otherwise (no raise)."""
        url = f"{self._base}/object/{self._bucket}/{object_key}"
        try:
            resp = httpx.request("DELETE", url, headers=self._headers(), timeout=15.0)
            return resp.status_code in (200, 204)
        except httpx.HTTPError:
            logger.warning("Storage delete failed for %s: network error", object_key)
            return False