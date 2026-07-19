# ThoraxVision

SaaS-style web application for chest X-ray Tuberculosis classification using a pretrained **DenseNet121** (PyTorch) model, with **Grad-CAM** explainability.

> **Status: Phase 1.1** — scaffolding + architectural refinement. No auth, database, Docker, API endpoints, or inference logic yet.

## Tech Stack

| Layer    | Technology |
|----------|-----------|
| Frontend | Next.js 15 (App Router), TypeScript, TailwindCSS, shadcn/ui |
| Backend  | FastAPI, SQLAlchemy*, PostgreSQL* |
| AI       | PyTorch, torchvision, pytorch-grad-cam |

\* prepared, not yet configured (Phase 2+)

## Project Architecture

The backend follows **Clean Architecture**. Dependencies point inward only:

```
api (Presentation) ──▶ services (Application) ──▶ domain (Entities/Schemas)
        ▲                        ▲
        └── infrastructure (DB, repositories) & ml (engine) implement
            interfaces consumed by the inner layers (dependency inversion)
```

Rules:
1. `domain/` never imports FastAPI, SQLAlchemy, or torch.
2. `services/` contain use cases and depend on repository/engine abstractions.
3. `api/` routers stay thin: validate via schemas, delegate to services.
4. `infrastructure/` and `ml/` are replaceable details (swap DB or model without touching use cases).

## Folder Responsibilities

```
thoraxvision/
├── frontend/                        # Next.js 15 App Router application
│   └── src/
│       ├── app/                     # Routes, layouts, pages
│       ├── components/ui/           # shadcn/ui components
│       └── lib/                     # Utilities (cn helper, API client later)
├── backend/
│   ├── app/
│   │   ├── api/v1/                  # Presentation layer — one router per feature:
│   │   │   ├── auth.py              #   registration/login/tokens (Phase 5)
│   │   │   ├── dashboard.py         #   aggregate statistics (Phase 3+)
│   │   │   ├── prediction.py        #   upload + classification (Phase 3)
│   │   │   ├── history.py           #   past predictions (Phase 3+)
│   │   │   ├── performance.py       #   training artifacts (Phase 4+)
│   │   │   └── model.py             #   model metadata/health (Phase 3+)
│   │   ├── core/                    # Settings (pydantic-settings)
│   │   ├── domain/
│   │   │   ├── entities/            # Framework-free business objects
│   │   │   └── schemas/             # Pydantic request/response models
│   │   ├── services/                # Use cases: auth, prediction, history,
│   │   │                            #   performance, model, dashboard
│   │   ├── infrastructure/
│   │   │   ├── database/            # SQLAlchemy engine & session (Phase 2)
│   │   │   └── repositories/        # user / prediction / model repositories
│   │   └── ml/
│   │       ├── model/               # DenseNet121 loader & inference (Phase 3)
│   │       └── gradcam/             # Grad-CAM heatmap generation (Phase 4)
│   ├── ml_models/                   # densenet121_tb_v1.pth + metadata.json
│   ├── uploads/
│   │   ├── original/                # Raw X-rays — audit trail, re-inference source
│   │   ├── gradcam/                 # Heatmap overlays, 1:1 with originals
│   │   └── thumbnails/              # Downscaled previews for list views
│   ├── outputs/gradcam/             # (legacy scratch output — superseded by uploads/gradcam)
│   ├── reports/                     # Static training artifacts (see reports/README.md)
│   └── tests/
└── docs/                            # ARCHITECTURE.md, phase documentation
```

Key architectural decisions:
- **`ml_models/metadata.json`** is the single source of truth for class names/order, input size, threshold, and version — Phase 3 inference reads it instead of hardcoding labels.
- **Versioned weight filenames** (`densenet121_tb_v1.pth`) allow multiple model versions side by side and auditable rollbacks.
- **Stage-separated uploads** (`original/gradcam/thumbnails`) keep raw data immutable, artifacts reproducible, and list views fast.
- **One router / service / repository per feature** so each phase lands in its own module without touching existing files.

## Getting Started

### Backend (Windows PowerShell)
```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000    # → http://localhost:8000/health
```

### Frontend
```powershell
cd frontend
npm install
npm run dev                                  # → http://localhost:3000
```

### Environment
```powershell
Copy-Item .env.example backend\.env          # fill values in later phases
```

## Development Roadmap

| Phase | Scope | Status |
|-------|-------|--------|
| 1 | Project scaffolding & initialization | ✅ Done |
| 1.1 | Architectural refinement (model metadata, storage structure, feature modules) | ✅ Done |
| 2 | PostgreSQL + SQLAlchemy + Alembic migrations | ⏭️ Next |
| 3 | Upload & DenseNet121 inference endpoints; model/dashboard/history APIs | Planned |
| 4 | Grad-CAM visualization; performance page from reports/ | Planned |
| 5 | Authentication (JWT), reports export, Docker deployment | Planned |

## Future Phases (beyond 5)

- Batch/asynchronous inference queue for high-volume screening
- Model registry with multiple DenseNet versions and A/B threshold tuning
- DICOM ingestion support alongside PNG/JPEG
- Clinician feedback loop (label corrections feeding retraining datasets)
