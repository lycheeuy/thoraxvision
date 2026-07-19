"""DenseNet121 architecture reconstruction.

The .pth file stores only a state_dict (weights), not the architecture.
build_model() must reproduce the training-time network EXACTLY, otherwise
load_state_dict() raises size-mismatch / unexpected-key errors.

Custom classifier head (replaces the default DenseNet121 classifier),
matching the training notebook — dropout tuned via Grey Wolf Optimizer:

    BatchNorm1d(1024)
    Linear(1024 -> 512)
    BatchNorm1d(512)
    ReLU(inplace=True)
    Dropout(p=0.3197)
    Linear(512 -> 256)
    ReLU(inplace=True)
    Dropout(p=0.3197)
    Linear(256 -> 2)
"""
import torch.nn as nn
from torchvision import models


def build_model(dropout_rate: float = 0.3197, dense_units: int = 512) -> nn.Module:
    """Reconstruct the exact DenseNet121 used in training (weights=None)."""
    model = models.densenet121(weights=None)
    in_features = model.classifier.in_features  # 1024

    model.classifier = nn.Sequential(
        nn.BatchNorm1d(in_features),
        nn.Linear(in_features, dense_units),
        nn.BatchNorm1d(dense_units),
        nn.ReLU(inplace=True),
        nn.Dropout(p=dropout_rate),
        nn.Linear(dense_units, 256),
        nn.ReLU(inplace=True),
        nn.Dropout(p=dropout_rate),
        nn.Linear(256, 2),
    )
    return model
