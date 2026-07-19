"""Shared pytest fixtures."""
from __future__ import annotations

import io

import pytest
from PIL import Image


@pytest.fixture
def png_bytes() -> bytes:
    """A valid, decodable grayscale PNG (like a real X-ray upload)."""
    buf = io.BytesIO()
    Image.new("L", (320, 300), color=128).save(buf, format="PNG")
    return buf.getvalue()


@pytest.fixture
def sample_image() -> Image.Image:
    return Image.new("RGB", (320, 300), color=(120, 120, 120))
