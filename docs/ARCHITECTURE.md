# ThoraxVision — Architecture Notes (Phase 1)

## Clean Architecture layers (backend)

| Layer | Folder | Responsibility | May import from |
|-------|--------|----------------|-----------------|
| Presentation | `app/api/` | HTTP routing, request/response wiring | services, schemas |
| Application | `app/services/` | Use cases (classify image, generate report) | domain |
| Domain | `app/domain/` | Entities & Pydantic schemas, framework-free | — |
| Infrastructure | `app/infrastructure/`, `app/ml/` | DB, repositories, PyTorch engine, Grad-CAM | domain interfaces |

Rules:
1. Dependencies point inward only. Domain never imports FastAPI, SQLAlchemy, or torch.
2. Services depend on repository/engine *interfaces*; infrastructure provides implementations (dependency inversion).
3. Routers stay thin — validation via schemas, delegation to services.

## Runtime data folders

- `ml_models/` — pretrained `densenet121_tb.pth` (git-ignored)
- `uploads/` — raw uploaded X-rays
- `outputs/gradcam/` — heatmap overlays
- `reports/` — generated analysis reports

## Phase plan

1. **Scaffolding** (this phase)
2. PostgreSQL + SQLAlchemy + Alembic migrations
3. Upload & inference endpoints (DenseNet121)
4. Grad-CAM visualization endpoint
5. Auth, reports, Docker deployment
