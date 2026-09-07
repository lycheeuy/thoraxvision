FROM python:3.12-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app

COPY requirements.txt .

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        libglib2.0-0 \
        libgl1 \
        libxcb1 \
        libx11-6 \
        libxext6 \
        libxrender1 \
    && rm -rf /var/lib/apt/lists/* \
    && pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

COPY app ./app
COPY alembic ./alembic
COPY alembic.ini .
COPY ml_models ./ml_models
COPY scripts ./scripts

RUN mkdir -p \
    uploads/original \
    uploads/gradcam \
    uploads/thumbnails \
    reports

# Run as a dedicated unprivileged user. Only the runtime-writable directories
# (uploads + reports) are chowned to it; code and model weights stay root-owned
# and world-readable. OS/pip installs above ran as root; nothing below needs it.
RUN groupadd --system appgroup \
    && useradd --system --gid appgroup --home-dir /app --no-create-home appuser \
    && chown -R appuser:appgroup /app/uploads /app/reports

USER appuser

EXPOSE 8000

CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]