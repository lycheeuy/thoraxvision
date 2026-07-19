"""Application logging configuration.

Single entrypoint: setup_logging() at startup, get_logger(name) everywhere else.
Loggers are namespaced under "thoraxvision" (e.g. thoraxvision.ai,
thoraxvision.prediction) so levels can be tuned per subsystem.
"""
from __future__ import annotations

import logging
import sys

from app.core.config import settings

_ROOT_NAME = "thoraxvision"
_FORMAT = "%(asctime)s | %(levelname)-8s | %(name)s | %(message)s"
_DATEFMT = "%Y-%m-%d %H:%M:%S"


def setup_logging() -> None:
    """Configure the thoraxvision logger tree once, at application startup."""
    root = logging.getLogger(_ROOT_NAME)
    if root.handlers:  # idempotent — avoid duplicate handlers on reload
        return

    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(logging.Formatter(_FORMAT, datefmt=_DATEFMT))

    root.setLevel(settings.LOG_LEVEL.upper())
    root.addHandler(handler)
    root.propagate = False


def get_logger(name: str) -> logging.Logger:
    """Return a namespaced child logger, e.g. get_logger("prediction")."""
    return logging.getLogger(f"{_ROOT_NAME}.{name}")
