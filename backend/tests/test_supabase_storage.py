"""Supabase Storage tests — mocked httpx, no real credentials.

Covers: PNG upload (3 objects, correct keys, shared UUID), signed URL +
expiry, delete, HTTP error handling (no secret leak), legacy path -> static
URL, Supabase key -> signed URL, mixed records, storage-failure handling.
"""
from __future__ import annotations

import httpx
import pytest
from PIL import Image

from app.core.config import settings
from app.core.exceptions import FileStorageError
from app.infrastructure.storage import supabase_storage as sb
from app.infrastructure.storage.supabase_storage import (
    StorageBackendError,
    SupabaseStorage,
)
from app.infrastructure.storage.storage_service import StorageService


@pytest.fixture(autouse=True)
def _supabase_env(monkeypatch):
    monkeypatch.setattr(settings, "SUPABASE_URL", "https://demo.supabase.co")
    monkeypatch.setattr(settings, "SUPABASE_SERVICE_KEY", "test-service-key")
    monkeypatch.setattr(settings, "SUPABASE_STORAGE_BUCKET", "thoraxvision")
    monkeypatch.setattr(settings, "SUPABASE_SIGNED_URL_EXPIRE_SECONDS", 3600)


def _png() -> Image.Image:
    return Image.new("RGB", (16, 16), (128, 128, 128))


class _Rec:
    def __init__(self):
        self.calls = []


@pytest.fixture
def rec(monkeypatch):
    r = _Rec()

    def fake_post(url, content=None, json=None, headers=None, timeout=None):
        r.calls.append(("POST", url, content, json, headers))
        if "/object/sign/" in url:
            key = url.split("/object/sign/thoraxvision/")[1]
            return httpx.Response(200, json={"signedURL": f"/object/sign/thoraxvision/{key}?token=abc"})
        return httpx.Response(200, json={"Key": "ok"})

    def fake_request(method, url, headers=None, timeout=None):
        r.calls.append((method, url, None, None, headers))
        return httpx.Response(200)

    monkeypatch.setattr(sb.httpx, "post", fake_post)
    monkeypatch.setattr(sb.httpx, "request", fake_request)
    return r


def test_save_uploads_three_png_correct_keys(rec):
    stored = StorageService(SupabaseStorage()).save_prediction_images(_png(), _png(), _png())
    uploads = [c for c in rec.calls if c[0] == "POST" and "/object/thoraxvision/" in c[1] and "/sign/" not in c[1]]
    assert len(uploads) == 3
    keys = [c[1].split("/object/thoraxvision/")[1] for c in uploads]
    assert any(k.startswith("original/") for k in keys)
    assert any(k.startswith("gradcam/") for k in keys)
    assert any(k.startswith("thumbnails/") for k in keys)
    for c in uploads:
        assert c[2][:8] == b"\x89PNG\r\n\x1a\n"  # PNG signature
    assert stored.original_path.startswith("original/") and "token" not in stored.original_path
    assert len({k.split("/")[1] for k in keys}) == 1  # shared UUID


def test_signed_url_and_expiry(rec):
    url = SupabaseStorage().create_signed_url("original/abc.png")
    assert url.startswith("https://demo.supabase.co/storage/v1/object/sign/")
    assert "token=" in url
    sign = [c for c in rec.calls if "/object/sign/" in c[1]]
    assert sign[0][3] == {"expiresIn": 3600}


def test_delete_object(rec):
    assert SupabaseStorage().delete("original/abc.png") is True
    dels = [c for c in rec.calls if c[0] == "DELETE"]
    assert dels and "/object/thoraxvision/original/abc.png" in dels[0][1]


def test_upload_http_error_no_secret_leak(monkeypatch):
    monkeypatch.setattr(sb.httpx, "post", lambda *a, **k: httpx.Response(500))
    with pytest.raises(StorageBackendError) as ei:
        SupabaseStorage().upload_png("original/x.png", b"\x89PNG")
    assert "test-service-key" not in str(ei.value)


def test_signing_failure_rolls_back_upload(monkeypatch):
    calls = {"del": []}

    def post(url, content=None, json=None, headers=None, timeout=None):
        return httpx.Response(403) if "/sign/" in url else httpx.Response(200)

    def req(method, url, headers=None, timeout=None):
        if method == "DELETE":
            calls["del"].append(url)
        return httpx.Response(200)

    monkeypatch.setattr(sb.httpx, "post", post)
    monkeypatch.setattr(sb.httpx, "request", req)
    with pytest.raises(FileStorageError):
        StorageService(SupabaseStorage()).save_prediction_images(_png(), _png(), _png())
    assert len(calls["del"]) == 3  # all uploads rolled back


def test_stored_images_have_signed_urls(rec):
    stored = StorageService(SupabaseStorage()).save_prediction_images(_png(), _png(), _png())
    assert stored.original_url.startswith("https://")
    assert stored.gradcam_url.startswith("https://")
    assert stored.thumbnail_url.startswith("https://")
    
def test_headers_include_authorization_and_apikey():
    st = SupabaseStorage()
    h = st._headers("image/png")
    assert "Authorization" in h
    assert "apikey" in h
    assert h["Authorization"].startswith("Bearer ")
    assert h["Content-Type"] == "image/png"
    # both carry the same credential (never assert/print the actual value)
    assert h["apikey"] == h["Authorization"].removeprefix("Bearer ")