"""Unit tests — permission layer (app/core/permissions.py + require_roles)."""
from __future__ import annotations

import pytest

from app.core.exceptions import PermissionDeniedError
from app.core.permissions import (
    ALL_ROLES,
    STAFF_ROLES,
    Role,
    has_role,
    is_admin,
    is_staff,
    is_valid_role,
)


def test_role_vocabulary_is_exactly_four() -> None:
    assert Role.values() == {"admin", "student", "supervisor", "examiner"}
    assert ALL_ROLES == frozenset(Role.values())


def test_staff_excludes_student() -> None:
    assert STAFF_ROLES == {"admin", "supervisor", "examiner"}
    assert "student" not in STAFF_ROLES


@pytest.mark.parametrize("role", ["admin", "student", "supervisor", "examiner"])
def test_valid_roles(role: str) -> None:
    assert is_valid_role(role)


@pytest.mark.parametrize("role", ["hacker", "ADMIN", "", "root", "Student "])
def test_invalid_roles(role: str) -> None:
    assert not is_valid_role(role)


def test_has_role() -> None:
    assert has_role("supervisor", "admin", "supervisor")
    assert not has_role("student", "admin", "supervisor")


def test_is_admin_and_is_staff() -> None:
    assert is_admin("admin") and not is_admin("supervisor")
    assert is_staff("examiner") and is_staff("supervisor") and is_staff("admin")
    assert not is_staff("student")


# ---- require_roles dependency (called directly, outside FastAPI) --------
class _FakeUser:
    def __init__(self, role: str, is_active: bool = True) -> None:
        self.role = role
        self.is_active = is_active


def test_require_roles_allows_matching_role() -> None:
    from app.api.deps import require_roles

    checker = require_roles(Role.ADMIN.value, Role.SUPERVISOR.value)
    user = _FakeUser("supervisor")
    assert checker(user=user) is user


def test_require_roles_rejects_other_roles() -> None:
    from app.api.deps import require_roles

    checker = require_roles(Role.ADMIN.value)
    with pytest.raises(PermissionDeniedError):
        checker(user=_FakeUser("student"))