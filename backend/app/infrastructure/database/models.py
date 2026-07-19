"""ORM models (SQLAlchemy 2 typed style).

ORM classes live in infrastructure — not in domain/ — because they are
bound to SQLAlchemy. domain/entities stays framework-free; services and
repositories translate between the two as the project grows.
"""
from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.database.base import Base


class User(Base):
    """Application user (students, supervisors, examiners, admin)."""

    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    username: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    full_name: Mapped[str | None] = mapped_column(String(255))
    hashed_password: Mapped[str] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(30), default="student", index=True)
    is_active: Mapped[bool] = mapped_column(default=True)
    last_login: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), onupdate=func.now()
    )

    predictions: Mapped[list["Prediction"]] = relationship(back_populates="user")


class ModelInformation(Base):
    """Registered ML model version (mirrors ml_models/metadata.json)."""

    __tablename__ = "model_information"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    model_name: Mapped[str] = mapped_column(String(100))
    framework: Mapped[str] = mapped_column(String(50), default="PyTorch")
    task: Mapped[str] = mapped_column(String(100))
    classes: Mapped[dict | list] = mapped_column(JSONB)
    input_size: Mapped[int] = mapped_column(Integer, default=224)
    threshold: Mapped[float] = mapped_column(Float, default=0.5)
    version: Mapped[str] = mapped_column(String(20))
    weights_path: Mapped[str] = mapped_column(String(500))
    is_active: Mapped[bool] = mapped_column(default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    predictions: Mapped[list["Prediction"]] = relationship(back_populates="model")


class Prediction(Base):
    """One classification result for one uploaded X-ray."""

    __tablename__ = "predictions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), index=True
    )
    model_id: Mapped[int | None] = mapped_column(
        ForeignKey("model_information.id", ondelete="SET NULL"), index=True
    )

    image_original_path: Mapped[str] = mapped_column(String(500))
    image_gradcam_path: Mapped[str | None] = mapped_column(String(500))
    image_thumbnail_path: Mapped[str | None] = mapped_column(String(500))

    predicted_label: Mapped[str] = mapped_column(String(50), index=True)
    confidence: Mapped[float] = mapped_column(Float)
    inference_time_ms: Mapped[float | None] = mapped_column(Float)
    notes: Mapped[str | None] = mapped_column(Text)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), index=True
    )

    user: Mapped["User | None"] = relationship(back_populates="predictions")
    model: Mapped["ModelInformation | None"] = relationship(back_populates="predictions")
