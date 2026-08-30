# ThoraxVision

ThoraxVision is a full-stack web application for chest X-ray tuberculosis (TB)
screening. It pairs a DenseNet121 deep-learning model with Grad-CAM
explainability behind an authenticated FastAPI backend, and presents results
through a Next.js workspace: upload a chest X-ray, run the model, and review the
prediction, confidence, and a Grad-CAM heatmap alongside the user's own study
history and model research metadata.

It is a research decision-support tool, not a diagnostic device. Every result is
intended for review by a qualified radiologist.

## Features

- **Authentication** — JWT-based login with role-aware access (student,
  supervisor, examiner, admin). Prediction and all history are scoped to the
  authenticated user.
- **AI chest X-ray prediction** — upload a JPG/PNG chest X-ray and receive a
  TB / Non-TB classification with per-class confidence.
- **Explainability** — a Grad-CAM heatmap for every prediction, viewable
  side-by-side with the original image or as a draggable wipe comparison.
- **Dashboard** — per-user overview: study counts, TB vs Non-TB totals, recent
  studies, model status, and subsystem health.
- **Studies / history** — a paginated, filterable, sortable list of the user's
  past predictions, each with a full detail view (owner-scoped).
- **Model insights** — a read-only research view of the model: metadata,
  parsed metrics, and available research artifacts.
- **Profile management** — view and update name/email, and change password.

## Tech Stack

**Frontend**
- Next.js 15 (App Router) · React 19 · TypeScript
- TailwindCSS 3 · shadcn/ui (Radix UI primitives)
- TanStack Query (server state) · Axios (HTTP)
- React Hook Form + Zod (forms/validation) · next-themes · sonner · lucide-react

**Backend**
- FastAPI · Uvicorn
- Pydantic v2 / pydantic-settings
- python-jose (JWT) · passlib + bcrypt (password hashing)

**Database**
- PostgreSQL (via SQLAlchemy 2 ORM, psycopg 3 driver)
- Alembic (migrations)

**AI / ML**
- PyTorch · torchvision
- pytorch-grad-cam (Grad-CAM) · Pillow · NumPy
- Model: DenseNet121, fine-tuned (ImageNet base + GWO hyperparameter tuning)

**Development / Tooling**
- pytest (backend tests)
- TypeScript type-checking + Next.js production build (frontend verification)
- Git

## System Architecture

The backend follows a layered architecture with dependencies pointing inward:
the HTTP layer (routers) delegates to services (use cases), which use
repositories for data access; the domain layer (schemas/entities) has no
framework dependencies.

```
Browser (Next.js)
      │  HTTPS/JSON, Bearer token
      ▼
FastAPI router  ──▶  auth dependency (JWT → current user)
      │
      ▼
Service layer (prediction, dashboard, history, insights, user)
      │
      ├──▶ AI engine (DenseNet121 + Grad-CAM)  ── on /predict
      ├──▶ Repositories ──▶ PostgreSQL
      └──▶ Model artifacts (metadata.json, metrics, images) on disk
      │
      ▼
JSON response  (+ static image URLs served from /static)
```

A prediction flow: the frontend uploads an image to an authenticated
`POST /predict`; the service validates it, runs inference and Grad-CAM, stores
the images and a prediction row linked to the user, and returns the label,
confidence, probabilities and artifact URLs.

## Project Structure

```
thoraxvision/
├── backend/
│   ├── app/
│   │   ├── api/            # FastAPI routers (v1) + dependencies
│   │   ├── services/       # use cases (prediction, dashboard, history, ...)
│   │   ├── domain/         # Pydantic schemas
│   │   ├── infrastructure/ # database models, session, repositories
│   │   ├── ai/             # model loader / inference engine
│   │   └── core/           # config, security, exceptions
│   ├── alembic/            # database migrations
│   ├── ml_models/          # model weights + artifacts (metadata.json, metrics)
│   ├── tests/              # pytest suite
│   ├── uploads/            # stored original / gradcam / thumbnail images
│   ├── pytest.ini
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── app/            # Next.js App Router pages (dashboard, prediction, …)
│   │   ├── components/     # UI + feature components
│   │   ├── services/       # API clients
│   │   ├── providers/      # auth / query providers
│   │   └── lib/            # api types, utils
│   └── package.json
└── README.md
```

## AI Model

Values below come from the model's `metadata.json` in the repository.

- **Architecture:** DenseNet121 (PyTorch)
- **Variant:** ImageNet-pretrained base with GWO (Grey Wolf Optimizer)
  hyperparameter optimization
- **Task:** binary classification (medical imaging)
- **Input size:** 224×224 RGB (tensor shape `[1, 3, 224, 224]`)
- **Classes:** `NON_TBC` (Non Tuberculosis), `TUBERKULOSIS` (Tuberculosis)
- **Decision threshold:** 0.45 on the TB-class probability (lower to increase
  sensitivity)
- **Explainability:** Grad-CAM on `features.denseblock4`
- **Version:** 1.0.0

Reported evaluation metrics (from `metadata.json`):

| Metric | Value |
|--------|-------|
| Test accuracy | 0.7075 |
| AUC | 0.8286 |
| Sensitivity (TB) | 0.6391 |
| Specificity (Non-TB) | 0.8381 |
| F1 (weighted) | 0.7146 |

These figures are as recorded in the model metadata; see the model insights
endpoint / artifacts for the underlying reports.

## API

All endpoints are prefixed with `/api/v1`. Every endpoint except login requires
a Bearer token. Note the history endpoints use the `/history` path.

**Auth**
- `POST /auth/login` — obtain an access token
- `GET  /auth/me` — current user
- `POST /auth/logout`

**Prediction**
- `POST /predict` — classify an uploaded chest X-ray (authenticated)
- `GET  /health` — service and subsystem status

**Dashboard**
- `GET /dashboard` — aggregated per-user overview

**History / Studies**
- `GET /history` — paginated, filterable, sortable list of the user's studies
- `GET /history/{prediction_id}` — one owned study in full (404 if absent or
  not owned)

**Model Insights**
- `GET /model-insights` — model metadata, metrics, and artifact availability

**Users / Profile**
- `GET /users/me` — current profile
- `PUT /users/me` — update full name / email
- `PUT /users/me/password` — change password

Interactive API docs are available at `/docs` when the backend is running.

## Installation

Prerequisites: Python 3.12, Node.js 18+, PostgreSQL.

**1. Clone**
```bash
git clone https://github.com/lycheeuy/thoraxvision.git
cd thoraxvision
```

**2. Backend — environment & dependencies**
```bash
cd backend
python -m venv venv
source venv/Scripts/activate      # Windows (Git Bash);  use venv/bin/activate on macOS/Linux
python -m pip install -r requirements.txt
```

**3. Backend — environment variables**
Create `backend/.env` (see Environment Variables below).

**4. Database**
```bash
# with PostgreSQL running and the database created:
alembic upgrade head
```

**5. Model artifacts**
Place the trained weights and artifacts under `backend/ml_models/`
(`final_gwo_model.pth`, `metadata.json`, `labels.json`, and any metric
artifacts). The model insights endpoint reads these; missing optional
artifacts degrade gracefully.

**6. Frontend — dependencies**
```bash
cd ../frontend
npm install
cp .env.local.example .env.local   # sets NEXT_PUBLIC_API_URL
```

**7. Run**
```bash
# backend (from backend/, venv active)
uvicorn app.main:app --reload

# frontend (from frontend/)
npm run dev
```
Backend runs on http://localhost:8000, frontend on http://localhost:3000.

## Environment Variables

**Frontend** (`frontend/.env.local`)
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

**Backend** (`backend/.env`) — placeholders only; never commit real secrets.
All values below have defaults in `app/core/config.py`; override what you need.

```
APP_ENV=development
BACKEND_CORS_ORIGINS=http://localhost:3000

# Database — either set DATABASE_URL directly, or the POSTGRES_* parts are assembled.
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=thoraxvision
POSTGRES_PASSWORD=your-db-password
POSTGRES_DB=thoraxvision
DATABASE_URL=

# Model / inference
MODEL_PATH=ml_models/densenet121_tb_v1.pth
DEVICE=cpu
IMAGE_SIZE=224

# Uploads / storage
UPLOAD_DIR=uploads
MAX_UPLOAD_SIZE_MB=10
ALLOWED_IMAGE_EXTENSIONS=jpg,jpeg,png
STATIC_URL_PREFIX=/static/uploads

# Authentication / JWT
JWT_SECRET_KEY=your-strong-secret-here
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60

# Model research artifacts (read-only)
MODEL_ARTIFACTS_DIR=ml_models/artifacts
MODEL_ARTIFACTS_URL_PREFIX=/static/model-artifacts

LOG_LEVEL=INFO
```

## Testing

Backend (pytest):
```bash
cd backend
source venv/Scripts/activate
python -m pytest -v
```
Current status: **67 passed, 0 failed**. Configuration lives in
`backend/pytest.ini` (`testpaths = tests`, plus a targeted filter for a
third-party `jose` deprecation warning). The suite covers the AI engine,
authentication, permissions, prediction service/API, profile API, and the
dashboard / history / model-insights endpoints (including owner-scoped access).

Frontend (type-check + production build):
```bash
cd frontend
npx tsc --noEmit
npm run build
```

## Development

```bash
# Backend
uvicorn app.main:app --reload        # run API (from backend/, venv active)
python -m pytest -v                  # run tests

# Frontend
npm run dev                          # dev server
npm run build                        # production build
npx tsc --noEmit                     # type-check
npm run lint                         # lint
```

## Deployment

The application has not been deployed. This section is preparation guidance
based on what exists in the repository; no production environment, domain, or
server configuration is claimed.

Before a public deployment, the following would need to be addressed:
- Serve the backend behind a production ASGI setup (e.g. Uvicorn workers) and a
  reverse proxy terminating HTTPS.
- Set a strong `SECRET_KEY` and production `DATABASE_URL`; run
  `alembic upgrade head` against the production database.
- Build the frontend (`npm run build`) and serve it (`npm run start` or a static
  host), pointing `NEXT_PUBLIC_API_URL` at the deployed backend.
- Configure CORS, allowed hosts, and static/media file serving for uploaded
  images.
- Provide the model weights and artifacts on the server.

No Dockerfile, reverse-proxy config, or HTTPS setup is included yet.

## Project Status

- Application implementation: complete (auth, prediction, dashboard, history,
  model insights, profile).
- Responsive / UX polish: complete.
- Backend test suite: 67 passed, 0 failed (pytest).
- Frontend: type-check clean, production build passing.
- Documentation: this README.
- Deployment: not yet done (see Deployment above).

## License

Not specified.
