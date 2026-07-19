# ml_models/

Model artifacts and their metadata. Weights (`*.pth`) are git-ignored.

| File | Purpose |
|------|---------|
| `densenet121_tb_v1.pth` | Pretrained DenseNet121 weights (place manually; versioned filename enables side-by-side model versions) |
| `metadata.json` | Single source of truth for model configuration: class names/order, input size, decision threshold, version. Loaded by the ML engine in Phase 3 so no class labels or thresholds are hardcoded in Python. |
