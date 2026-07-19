# app/ai/ — ThoraxVision Inference Engine (Phase 3)

Reusable, framework-agnostic AI engine. No FastAPI, no DB, no file I/O —
call it from any service layer in later phases.

## Modules

| Module | Responsibility |
|--------|----------------|
| `builder.py` | Reconstructs the exact DenseNet121 + custom GWO classifier head |
| `preprocessor.py` | Builds val/test transform from `transforms.json`, RGB conversion |
| `loader.py` | Thread-safe **singleton** — loads model + weights + JSON configs once |
| `predictor.py` | `InferenceEngine`: PIL.Image -> `PredictionResult` (+ Grad-CAM) |
| `gradcam.py` | Grad-CAM over `features.denseblock4` -> overlay as `PIL.Image` |
| `schemas.py` | `PredictionResult` dataclass |
| `exceptions.py` | Typed errors (missing model/weights, invalid image, inference) |

## Config-driven (never hardcode labels)

Reads from `ml_models/`: `metadata.json` (head dims, threshold, version),
`labels.json` (index -> class name), `transforms.json` (preprocessing steps).
Place the real weights at `ml_models/densenet121_tb_v1.pth` (or update
`MODEL_PATH`).

## Usage

```python
from PIL import Image
from app.ai.predictor import InferenceEngine

engine = InferenceEngine()                 # model loads once (singleton)
image = Image.open("xray.png")             # RGB conversion handled internally

result = engine.predict(image)             # threshold-based decision (default)
print(result.prediction, result.confidence, result.probabilities)

overlay = engine.generate_gradcam(image)   # PIL.Image, target = TB (class 1)
```

`engine.predict(image, use_threshold=False)` switches to pure argmax.
The singleton means every `InferenceEngine()` shares one loaded model —
safe to instantiate per request.
