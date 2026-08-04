"""FastAPI dependency providers.

Wiring only — this is where the framework meets the (framework-free) services.
Includes the authentication chain: oauth2_scheme -> get_current_user ->
get_current_active_user -> require_roles(...).
"""
from __future__ import annotations

from collections.abc import Generator

from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.ai.exceptions import AIEngineError
from app.ai.predictor import InferenceEngine
from app.core.exceptions import (
    InactiveUserError,
    ModelUnavailableError,
    PermissionDeniedError,
    TokenError,
)
from app.core.security import JWTError, decode_access_token
from app.infrastructure.database.models import User
from app.infrastructure.database.session import get_db
from app.infrastructure.repositories.prediction_repository import PredictionRepository
from app.infrastructure.repositories.user_repository import UserRepository
from app.services.auth_service import AuthService
from app.services.dashboard_service import DashboardService
from app.services.history_service import HistoryService
from app.services.model_insights_service import ModelInsightsService
from app.services.prediction_service import PredictionService
from app.services.user_service import UserService

# tokenUrl points at the login endpoint so Swagger's Authorize button works.
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


# ---- Services ----------------------------------------------------------
def get_user_service(db: Session = Depends(get_db)) -> UserService:
    return UserService(UserRepository(db))


def get_auth_service(users: UserService = Depends(get_user_service)) -> AuthService:
    return AuthService(users)


def get_inference_engine() -> InferenceEngine:
    """The Phase 3 AI Engine. Model is a singleton — loaded once, reused."""
    try:
        return InferenceEngine()
    except AIEngineError as exc:
        raise ModelUnavailableError("AI model is unavailable.", detail=str(exc)) from exc


def get_prediction_service(
    db: Session = Depends(get_db),
    engine: InferenceEngine = Depends(get_inference_engine),
) -> PredictionService:
    return PredictionService(engine=engine, repository=PredictionRepository(db))


def get_history_service(db: Session = Depends(get_db)) -> HistoryService:
    """History use case — read-only, owner-scoped. No AI engine needed."""
    return HistoryService(db)


def get_model_insights_service() -> ModelInsightsService:
    """Model Insights use case — read-only, no DB, no model loading."""
    return ModelInsightsService()


def get_dashboard_service(db: Session = Depends(get_db)) -> DashboardService:
    """Dashboard use case — read-only aggregation over the shared Session."""
    return DashboardService(db)


# ---- Authentication chain ---------------------------------------------
def get_current_user(
    token: str = Depends(oauth2_scheme),
    users: UserService = Depends(get_user_service),
) -> User:
    """Decode the Bearer token and load the user it identifies."""
    try:
        payload = decode_access_token(token)
        user_id = int(payload["sub"])
    except (JWTError, KeyError, ValueError) as exc:
        raise TokenError("Token is invalid or expired.") from exc

    user = users.get_by_id(user_id)
    if user is None:
        raise TokenError("Token refers to a user that no longer exists.")
    return user


def get_current_active_user(user: User = Depends(get_current_user)) -> User:
    if not user.is_active:
        raise InactiveUserError("This account is inactive.")
    return user


def require_roles(*allowed_roles: str):
    """Dependency factory for role-protected endpoints.

    Usage:
        @router.get("/admin-only", dependencies=[Depends(require_roles(Role.ADMIN))])
    """
    allowed = {str(r) for r in allowed_roles}

    def checker(user: User = Depends(get_current_active_user)) -> User:
        if user.role not in allowed:
            raise PermissionDeniedError(
                "You do not have permission to access this resource.",
                detail=f"Required role: {', '.join(sorted(allowed))}",
            )
        return user

    return checker


__all__ = [
    "get_db",
    "get_user_service",
    "get_auth_service",
    "get_inference_engine",
    "get_prediction_service",
    "get_history_service",
    "get_model_insights_service",
    "get_dashboard_service",
    "get_current_user",
    "get_current_active_user",
    "require_roles",
    "oauth2_scheme",
    "Generator",
]