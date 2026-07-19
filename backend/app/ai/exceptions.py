"""Typed exceptions for the AI engine.

Services/routers can map these to HTTP responses in later phases without
catching bare Exception.
"""


class AIEngineError(Exception):
    """Base class for every AI engine failure."""


class ModelFileNotFoundError(AIEngineError):
    """The weights file (.pth) is missing."""


class MetadataNotFoundError(AIEngineError):
    """A required JSON config (metadata/labels/transforms) is missing."""


class ModelLoadError(AIEngineError):
    """state_dict could not be loaded into the reconstructed architecture."""


class InvalidImageError(AIEngineError):
    """The provided image is unreadable, empty, or not a valid image."""


class InferenceError(AIEngineError):
    """The forward pass or Grad-CAM computation failed."""
