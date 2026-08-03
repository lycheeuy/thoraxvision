"""Model Insights service — read-only aggregation of research artifacts.

Reads (never writes) the files under MODEL_ARTIFACTS_DIR plus the existing
metadata.json, and assembles one ModelInsightsResponse. Every artifact is
optional: a missing file becomes a null section and available=False in the
`artifacts` map. Nothing here loads the model or runs inference.
"""
from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from app.core.config import BACKEND_DIR, settings
from app.core.report_parser import parse_classification_report
from app.domain.schemas.model_insights import (
    ArtifactInfo,
    ClassificationReport,
    ClassificationRow,
    ModelInsightsResponse,
    ModelOverview,
    PerformanceMetrics,
)

# artifact key -> filename on disk
_ARTIFACT_FILES = {
    "classification_report": "classification_report.txt",
    "confusion_matrix": "confusion_matrix.png",
    "roc_curve": "roc_curve.png",
    "training_curves": "training_curves.png",
    "gradcam_example": "gradcam_example.png",
    "gwo_log": "gwo_log.json",
    "research_summary": "research_summary_gwo.json",
}


def _resolve(path_str: str) -> Path:
    p = Path(path_str)
    return p if p.is_absolute() else (BACKEND_DIR / p)

def _extract_input_size(raw: Any) -> int | None:
    """metadata may store input_size as 224 or as a shape [1,3,224,224]."""
    if raw is None:
        return None
    if isinstance(raw, int):
        return raw
    if isinstance(raw, (list, tuple)) and raw:
        last = raw[-1]
        return int(last) if isinstance(last, (int, float)) else None
    return None

class ModelInsightsService:
    def __init__(self) -> None:
        self._dir = _resolve(settings.MODEL_ARTIFACTS_DIR)
        self._url_prefix = settings.MODEL_ARTIFACTS_URL_PREFIX.rstrip("/")
        self._models_dir = self._dir.parent

    # ---- helpers ---------------------------------------------------- #

    def _artifact_info(self, key: str) -> ArtifactInfo:
        filename = _ARTIFACT_FILES[key]
        fpath = self._dir / filename
        if not fpath.is_file():
            return ArtifactInfo(available=False)
        stat = fpath.stat()
        return ArtifactInfo(
            available=True,
            url=f"{self._url_prefix}/{filename}",
            size_bytes=stat.st_size,
            modified_at=datetime.fromtimestamp(stat.st_mtime, tz=timezone.utc).isoformat(),
        )

    def _read_text(self, key: str) -> str | None:
        fpath = self._dir / _ARTIFACT_FILES[key]
        if not fpath.is_file():
            return None
        try:
            return fpath.read_text(encoding="utf-8")
        except OSError:
            return None

    def _read_json(self, key: str) -> dict[str, Any] | None:
        text = self._read_text(key)
        if text is None:
            return None
        try:
            data = json.loads(text)
        except json.JSONDecodeError:
            return None
        # Only object roots are rendered; wrap a non-object so nothing breaks.
        return data if isinstance(data, dict) else {"value": data}

    def _load_overview(self) -> ModelOverview:
        """Hero + Overview come entirely from metadata.json (best-effort)."""
        meta_path = self._models_dir / "metadata.json"
        if not meta_path.is_file():
            return ModelOverview()
        try:
            meta = json.loads(meta_path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            return ModelOverview()

        classes = meta.get("classes")
        if isinstance(classes, dict):
            # {"0": "NON_TBC", "1": "TUBERKULOSIS"} -> ordered list
            try:
                classes = [classes[k] for k in sorted(classes, key=lambda x: int(x))]
            except (ValueError, TypeError):
                classes = list(classes.values())
        elif not isinstance(classes, list):
            classes = None

        return ModelOverview(
            name=meta.get("model_name") or meta.get("name"),
            version=meta.get("version"),
            framework=meta.get("framework"),
            architecture=meta.get("architecture"),
            task=meta.get("task"),
            input_size=_extract_input_size(meta.get("input_size")),
            threshold=meta.get("threshold"),
            classes=classes,
        )

    def _build_report(self) -> tuple[ClassificationReport | None, PerformanceMetrics | None]:
        text = self._read_text("classification_report")
        if text is None:
            return None, None
        parsed = parse_classification_report(text)
        if parsed is None:
            return None, None

        def row(d: dict[str, Any] | None) -> ClassificationRow | None:
            if not d:
                return None
            return ClassificationRow(
                label=d.get("label", ""),
                precision=d.get("precision"),
                recall=d.get("recall"),
                f1_score=d.get("f1_score"),
                support=d.get("support"),
            )

        report = ClassificationReport(
            per_class=[
                ClassificationRow(
                    label=c["label"],
                    precision=c.get("precision"),
                    recall=c.get("recall"),
                    f1_score=c.get("f1_score"),
                    support=c.get("support"),
                )
                for c in parsed["per_class"]
            ],
            accuracy=parsed.get("accuracy"),
            macro_avg=row(parsed.get("macro_avg")),
            weighted_avg=row(parsed.get("weighted_avg")),
        )

        # Headline metrics: accuracy from report, precision/recall/f1 from
        # the weighted average (a fair single-number summary for 2 classes).
        wa = parsed.get("weighted_avg") or {}
        metrics = PerformanceMetrics(
            accuracy=parsed.get("accuracy"),
            precision=wa.get("precision"),
            recall=wa.get("recall"),
            f1_score=wa.get("f1_score"),
        )
        return report, metrics

    # ---- public ----------------------------------------------------- #

    def get_insights(self) -> ModelInsightsResponse:
        artifacts = {key: self._artifact_info(key) for key in _ARTIFACT_FILES}
        report, metrics = self._build_report()

        def url_of(key: str) -> str | None:
            info = artifacts[key]
            return info.url if info.available else None

        return ModelInsightsResponse(
            overview=self._load_overview(),
            metrics=metrics,
            classification_report=report,
            confusion_matrix_url=url_of("confusion_matrix"),
            roc_curve_url=url_of("roc_curve"),
            training_curves_url=url_of("training_curves"),
            gradcam_example_url=url_of("gradcam_example"),
            gwo=self._read_json("gwo_log"),
            research_summary=self._read_json("research_summary"),
            artifacts=artifacts,
        )