"""Model repository.

Persistence for ModelInformation records (registered model versions).
Metadata sync from ml_models/metadata.json arrives in Phase 3; only the
typed CRUD base is wired in Phase 2.
"""
from sqlalchemy.orm import Session

from app.infrastructure.database.models import ModelInformation
from app.infrastructure.repositories.base_repository import BaseRepository


class ModelRepository(BaseRepository[ModelInformation]):
    def __init__(self, db: Session) -> None:
        super().__init__(ModelInformation, db)
