"""add auth fields to users

Adds username, role, last_login, updated_at to the users table.

Safe for a table that already has rows: username/role are added as nullable
first, backfilled, then promoted to NOT NULL. Fully reversible.

Revision ID: 55d5321f5bf0
Revises: c54ef18a7fd8
Create Date: 2026-07-17 01:42:27.114443
"""
from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


revision: str = "55d5321f5bf0"
down_revision: str | None = "c54ef18a7fd8"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # 1. Add columns — nullable first so existing rows don't violate NOT NULL.
    op.add_column("users", sa.Column("username", sa.String(length=100), nullable=True))
    op.add_column("users", sa.Column("role", sa.String(length=30), nullable=True))
    op.add_column("users", sa.Column("last_login", sa.DateTime(timezone=True), nullable=True))
    op.add_column("users", sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True))

    # 2. Backfill any pre-existing rows with sane defaults.
    op.execute("UPDATE users SET role = 'student' WHERE role IS NULL")
    op.execute("UPDATE users SET username = 'user_' || id WHERE username IS NULL")

    # 3. Promote the required columns to NOT NULL now that they're populated.
    op.alter_column("users", "username", existing_type=sa.String(length=100), nullable=False)
    op.alter_column("users", "role", existing_type=sa.String(length=30), nullable=False)

    # 4. Indexes.
    op.create_index(op.f("ix_users_role"), "users", ["role"], unique=False)
    op.create_index(op.f("ix_users_username"), "users", ["username"], unique=True)


def downgrade() -> None:
    op.drop_index(op.f("ix_users_username"), table_name="users")
    op.drop_index(op.f("ix_users_role"), table_name="users")
    op.drop_column("users", "updated_at")
    op.drop_column("users", "last_login")
    op.drop_column("users", "role")
    op.drop_column("users", "username")