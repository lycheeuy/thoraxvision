"""AI engine result schemas (framework-free dataclasses)."""
from __future__ import annotations

from dataclasses import dataclass, field


@dataclass(frozen=True)
class PredictionResult:
    """Outcome of a single inference over one chest X-ray."""

    prediction: str                       # class name, e.g. "TUBERKULOSIS"
    class_id: int                         # 0 or 1
    confidence: float                     # probability of the predicted class
    probabilities: dict[str, float]       # {class_name: prob} for every class
    inference_time: float                 # seconds
    tb_probability: float = 0.0           # convenience: probs of TB class
    used_threshold: bool = False          # True if threshold decided the class
