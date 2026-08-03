"""Parse a scikit-learn ``classification_report`` text table into JSON.

Tolerant across sklearn versions and formatting quirks:
  * class labels containing spaces (e.g. "Non Tuberculosis") — the numeric
    columns are read from the RIGHT, so any number of leading label tokens
    is fine;
  * "accuracy" rows that carry only two values (score + support) instead of
    four;
  * "macro avg" / "weighted avg" spelled with a space or underscore;
  * variable whitespace, blank lines, and a leading header line.

Pure function, no I/O. Returns None only if nothing parseable is found.
"""
from __future__ import annotations

from typing import Any


def _to_float(tok: str) -> float | None:
    try:
        return float(tok)
    except ValueError:
        return None


def _to_int(tok: str) -> int | None:
    try:
        return int(float(tok))
    except ValueError:
        return None


def label_tokens_join(label_tokens: list[str]) -> str:
    """Preserve original casing/spacing of a class label."""
    return " ".join(label_tokens).strip()


def parse_classification_report(text: str) -> dict[str, Any] | None:
    if not text or not text.strip():
        return None

    per_class: list[dict[str, Any]] = []
    accuracy: float | None = None
    macro_avg: dict[str, Any] | None = None
    weighted_avg: dict[str, Any] | None = None

    for raw in text.splitlines():
        line = raw.strip()
        if not line:
            continue

        tokens = line.split()
        # Header row: precision recall f1-score support
        lowered = [t.lower() for t in tokens]
        if "precision" in lowered and "recall" in lowered:
            continue

        # Identify how many trailing tokens are numeric.
        numeric_tail: list[str] = []
        for tok in reversed(tokens):
            if _to_float(tok) is not None:
                numeric_tail.append(tok)
            else:
                break
        numeric_tail.reverse()
        if not numeric_tail:
            continue

        label_tokens = tokens[: len(tokens) - len(numeric_tail)]
        label = " ".join(label_tokens).strip().lower()

        # accuracy row: sklearn prints "accuracy <score> <support>" (2 nums)
        # or occasionally just "accuracy <score>".
        if label == "accuracy":
            accuracy = _to_float(numeric_tail[0])
            continue

        # Rows with the full 4-number tail: precision recall f1 support
        if len(numeric_tail) >= 4:
            row = {
                "precision": _to_float(numeric_tail[-4]),
                "recall": _to_float(numeric_tail[-3]),
                "f1_score": _to_float(numeric_tail[-2]),
                "support": _to_int(numeric_tail[-1]),
            }
        elif len(numeric_tail) == 3:
            # some layouts omit support on avg lines
            row = {
                "precision": _to_float(numeric_tail[0]),
                "recall": _to_float(numeric_tail[1]),
                "f1_score": _to_float(numeric_tail[2]),
                "support": None,
            }
        else:
            continue

        norm = label.replace("_", " ")
        if norm in ("macro avg", "macro average"):
            macro_avg = row
        elif norm in ("weighted avg", "weighted average"):
            weighted_avg = row
        else:
            per_class.append({"label": label_tokens_join(label_tokens), **row})

    if not per_class and accuracy is None:
        return None

    return {
        "per_class": per_class,
        "accuracy": accuracy,
        "macro_avg": macro_avg,
        "weighted_avg": weighted_avg,
    }