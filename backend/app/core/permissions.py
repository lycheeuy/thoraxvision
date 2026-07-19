"""Role-based permission helpers.

Roles are plain strings (stored as VARCHAR) so adding one never needs a DB
migration. This module centralizes the vocabulary and the checks, so services
and dependencies never compare role strings by hand.
"""
from __future__ import annotations

from enum import Enum


class Role(str, Enum):
    """The four roles for this university final-project system."""

    ADMIN = "admin"
    STUDENT = "student"
    SUPERVISOR = "supervisor"
    EXAMINER = "examiner"

    @classmethod
    def values(cls) -> set[str]:
        return {r.value for r in cls}


# Sensible groupings, referenced by dependencies/services rather than literals.
STAFF_ROLES: frozenset[str] = frozenset(
    {Role.ADMIN.value, Role.SUPERVISOR.value, Role.EXAMINER.value}
)
ALL_ROLES: frozenset[str] = frozenset(Role.values())


def is_valid_role(role: str) -> bool:
    return role in Role.values()


def has_role(user_role: str, *allowed: str) -> bool:
    """True if user_role is one of the allowed roles."""
    return user_role in set(allowed)


def is_admin(user_role: str) -> bool:
    return user_role == Role.ADMIN.value


def is_staff(user_role: str) -> bool:
    """Staff = anyone who evaluates/administers (not a student)."""
    return user_role in STAFF_ROLES


__all__ = [
    "Role",
    "STAFF_ROLES",
    "ALL_ROLES",
    "is_valid_role",
    "has_role",
    "is_admin",
    "is_staff",
]