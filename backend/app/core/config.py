"""Central application settings.

Reads from environment variables / .env via pydantic-settings v2.
Every tunable value the API needs lives here — no magic numbers in
routes, services, or storage.
"""
from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

# Absolute path to backend/ — makes every relative path below CWD-independent.
BACKEND_DIR: Path = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # ---------- Application ----------
    APP_NAME: str = "ThoraxVision"
    APP_ENV: str = "development"
    API_V1_PREFIX: str = "/api/v1"
    BACKEND_CORS_ORIGINS: str = "http://localhost:3000"

    # ---------- Database (Phase 2) ----------
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_USER: str = "thoraxvision"
    POSTGRES_PASSWORD: str = "changeme"
    POSTGRES_DB: str = "thoraxvision"
    DATABASE_URL: str = ""
    SQL_ECHO: bool = False

    # ---------- ML (Phase 3) ----------
    MODEL_PATH: str = "ml_models/densenet121_tb_v1.pth"
    DEVICE: str = "cpu"
    IMAGE_SIZE: int = 224

    # ---------- Upload & storage (Phase 4) ----------
    UPLOAD_DIR: str = "uploads"
    ORIGINAL_SUBDIR: str = "original"
    GRADCAM_SUBDIR: str = "gradcam"
    THUMBNAIL_SUBDIR: str = "thumbnails"
    REPORTS_DIR: str = "reports"

    MAX_UPLOAD_SIZE_MB: int = 10
    ALLOWED_IMAGE_EXTENSIONS: str = "jpg,jpeg,png"
    THUMBNAIL_WIDTH: int = 256
    THUMBNAIL_HEIGHT: int = 256

    # Public URL prefix under which uploads/ is mounted as static files.
    STATIC_URL_PREFIX: str = "/static/uploads"

    # ---------- Authentication / JWT (Phase 5) ----------
    JWT_SECRET_KEY: str = "CHANGE_ME_dev_only_do_not_use_in_production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # ---------- Logging ----------
    LOG_LEVEL: str = "INFO"

    # ---------- Derived values ----------
    @property
    def cors_origins(self) -> list[str]:
        return [o.strip() for o in self.BACKEND_CORS_ORIGINS.split(",") if o.strip()]

    @property
    def database_url(self) -> str:
        """Effective SQLAlchemy URL: explicit DATABASE_URL wins, else assembled."""
        if self.DATABASE_URL:
            return self.DATABASE_URL
        return (
            f"postgresql+psycopg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
            f"@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )

    @property
    def allowed_extensions(self) -> set[str]:
        """Normalized extension set, e.g. {'.jpg', '.jpeg', '.png'}."""
        return {
            f".{e.strip().lower().lstrip('.')}"
            for e in self.ALLOWED_IMAGE_EXTENSIONS.split(",")
            if e.strip()
        }

    @property
    def max_upload_bytes(self) -> int:
        return self.MAX_UPLOAD_SIZE_MB * 1024 * 1024

    @property
    def thumbnail_size(self) -> tuple[int, int]:
        return (self.THUMBNAIL_WIDTH, self.THUMBNAIL_HEIGHT)

    # Absolute, CWD-independent paths -------------------------------------
    @property
    def model_file(self) -> Path:
        return BACKEND_DIR / self.MODEL_PATH

    @property
    def upload_root(self) -> Path:
        return BACKEND_DIR / self.UPLOAD_DIR

    @property
    def original_dir(self) -> Path:
        return self.upload_root / self.ORIGINAL_SUBDIR

    @property
    def gradcam_dir(self) -> Path:
        return self.upload_root / self.GRADCAM_SUBDIR

    @property
    def thumbnail_dir(self) -> Path:
        return self.upload_root / self.THUMBNAIL_SUBDIR


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
