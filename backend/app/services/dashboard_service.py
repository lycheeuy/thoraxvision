"""Dashboard service — read-only aggregation for the overview screen.

Assembles the DashboardResponse from existing repositories and lightweight
liveness probes. It holds no SQL of its own: prediction statistics come from
PredictionRepository, model information from the loaded ModelLoader bundle
(falling back to metadata.json when the model isn't loaded yet), and subsystem
health from cheap, guarded checks. Every probe is wrapped so a failing
subsystem degrades to a False status rather than breaking the whole response.
"""
from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.ai.loader import ModelLoader
from app.core.config import settings
from app.domain.schemas.dashboard import (
    DashboardResponse,
    ModelStatus,
    RecentStudy,
    Statistics,
    SystemStatus,
)
from app.infrastructure.database.models import Prediction, User
from app.infrastructure.database.session import engine
from app.infrastructure.repositories.prediction_repository import PredictionRepository

# How many recent studies the overview shows.
_RECENT_LIMIT = 5

# Fallback internal labels if labels.json can't be read. Index 1 is the
# positive (TB) class, matching the model's labels.json convention.
_DEFAULT_LABELS = {0: "NON_TBC", 1: "TUBERKULOSIS"}


class DashboardService:
    """Aggregates the dashboard overview. No business rules beyond assembly."""

    def __init__(self, db: Session) -> None:
        self._db = db
        self._predictions = PredictionRepository(db)

    async def get_dashboard_overview(self, current_user: User) -> DashboardResponse:
        tb_label, normal_label = self._resolve_labels()
        return DashboardResponse(
            statistics=self._build_statistics(current_user.id, tb_label, normal_label),
            recent_studies=self._build_recent_studies(current_user.id),
            model=self._build_model_status(),
            system=self._build_system_status(),
        )

    # ---- label resolution (labels.json is source of truth) ---------- #

    def _resolve_labels(self) -> tuple[str, str]:
        """Return (tb_label, normal_label) as stored on predictions.

        Reads labels.json — {"0": "NON_TBC", "1": "TUBERKULOSIS"} — where
        index 1 is the positive (TB) class. Falls back to sane defaults.
        """
        labels = self._load_labels()
        normal_label = labels.get(0, _DEFAULT_LABELS[0])
        tb_label = labels.get(1, _DEFAULT_LABELS[1])
        return tb_label, normal_label

    def _load_labels(self) -> dict[int, str]:
        path = self._model_dir() / "labels.json"
        try:
            raw = json.loads(path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            return dict(_DEFAULT_LABELS)
        result: dict[int, str] = {}
        for key, value in raw.items():
            try:
                result[int(key)] = str(value)
            except (ValueError, TypeError):
                continue
        return result or dict(_DEFAULT_LABELS)

    # ---- statistics (via repository only) --------------------------- #

    def _build_statistics(
        self, user_id: int, tb_label: str, normal_label: str
    ) -> Statistics:
        start_of_today = datetime.now(timezone.utc).replace(
            hour=0, minute=0, second=0, microsecond=0
        )
        return Statistics(
            total_studies=self._predictions.count_by_user(user_id=user_id),
            today_studies=self._predictions.count_by_user(
                user_id=user_id, date_from=start_of_today
            ),
            tb_detected=self._predictions.count_by_user(user_id=user_id, label=tb_label),
            normal_detected=self._predictions.count_by_user(
                user_id=user_id, label=normal_label
            ),
        )

    def _build_recent_studies(self, user_id: int) -> list[RecentStudy]:
        rows: list[Prediction] = self._predictions.get_by_user(
            user_id=user_id, page=1, limit=_RECENT_LIMIT, sort="newest"
        )
        return [
            RecentStudy(
                prediction_id=row.id,
                predicted_label=row.predicted_label,
                confidence=self._to_percent(row.confidence),
                thumbnail_url=self._to_static_url(row.image_thumbnail_path),
                created_at=row.created_at,
            )
            for row in rows
        ]

    @staticmethod
    def _to_percent(confidence: float | None) -> float:
        """Stored 0-1 -> presented 0-100. Values already >1 pass through."""
        if confidence is None:
            return 0.0
        return round(confidence * 100, 2) if confidence <= 1 else round(confidence, 2)

    def _to_static_url(self, stored_path: str | None) -> str | None:
        """Disk path -> static URL, matching HistoryService.

        Uses the last two path segments (subdir + filename) under the static
        uploads prefix, so both Windows and POSIX paths resolve correctly.
        """
        if not stored_path:
            return None
        parts = Path(str(stored_path).replace("\\", "/")).parts
        if len(parts) >= 2:
            tail = "/".join(parts[-2:])
        else:
            tail = parts[-1]
        prefix = settings.STATIC_URL_PREFIX.rstrip("/")
        return f"{prefix}/{tail}"

    # ---- model status (ModelLoader, fallback to metadata.json) ------ #

    def _build_model_status(self) -> ModelStatus:
        bundle = ModelLoader._instance
        loaded = bundle is not None

        meta = getattr(bundle, "metadata", None) if loaded else None
        if not meta:
            meta = self._load_metadata_file()
        meta = meta or {}

        device = getattr(bundle, "device", None) if loaded else None

        return ModelStatus(
            name=meta.get("model_name") or meta.get("name"),
            architecture=meta.get("architecture"),
            framework=meta.get("framework"),
            version=meta.get("version"),
            threshold=meta.get("threshold"),
            input_size=self._extract_input_size(meta.get("input_size")),
            classes=self._extract_classes(meta.get("classes")),
            device=str(device) if device is not None else None,
            loaded=loaded,
        )

    def _load_metadata_file(self) -> dict:
        path = self._model_dir() / "metadata.json"
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            return {}
        return data if isinstance(data, dict) else {}

    @staticmethod
    def _extract_input_size(raw: object) -> int | None:
        """metadata may store input_size as 224 or as a shape [1,3,224,224]."""
        if isinstance(raw, bool):
            return None
        if isinstance(raw, int):
            return raw
        if isinstance(raw, (list, tuple)) and raw:
            last = raw[-1]
            return int(last) if isinstance(last, (int, float)) and not isinstance(last, bool) else None
        return None

    @staticmethod
    def _extract_classes(raw: object) -> list[str] | None:
        """classes may be a list or a dict {"0": "...", "1": "..."}."""
        if isinstance(raw, dict):
            try:
                return [raw[k] for k in sorted(raw, key=lambda x: int(x))]
            except (ValueError, TypeError):
                return [str(v) for v in raw.values()]
        if isinstance(raw, list):
            return [str(v) for v in raw]
        return None

    def _model_dir(self) -> Path:
        """Directory holding labels.json / metadata.json (beside MODEL_PATH)."""
        model_path = Path(settings.MODEL_PATH)
        if not model_path.is_absolute():
            from app.core.config import BACKEND_DIR

            model_path = BACKEND_DIR / model_path
        return model_path.parent

    # ---- system status (guarded liveness probes) -------------------- #

    def _build_system_status(self) -> SystemStatus:
        return SystemStatus(
            backend=True,
            database=self._check_database(),
            ai_model=ModelLoader._instance is not None,
            storage=self._check_storage(),
        )

    def _check_database(self) -> bool:
        try:
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            return True
        except Exception:  # noqa: BLE001 — any failure means "not live"
            return False

    def _check_storage(self) -> bool:
        try:
            return settings.upload_root.exists()
        except Exception:  # noqa: BLE001
            return False