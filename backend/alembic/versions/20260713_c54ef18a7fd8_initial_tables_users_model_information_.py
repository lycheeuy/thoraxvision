"""initial tables users model_information predictions

Revision ID: c54ef18a7fd8
Revises: 
Create Date: 2026-07-13 13:31:06.849997

"""
from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = 'c54ef18a7fd8'
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table('model_information',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('model_name', sa.String(length=100), nullable=False),
    sa.Column('framework', sa.String(length=50), nullable=False),
    sa.Column('task', sa.String(length=100), nullable=False),
    sa.Column('classes', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
    sa.Column('input_size', sa.Integer(), nullable=False),
    sa.Column('threshold', sa.Float(), nullable=False),
    sa.Column('version', sa.String(length=20), nullable=False),
    sa.Column('weights_path', sa.String(length=500), nullable=False),
    sa.Column('is_active', sa.Boolean(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.PrimaryKeyConstraint('id', name=op.f('pk_model_information'))
    )
    op.create_table('users',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('email', sa.String(length=255), nullable=False),
    sa.Column('hashed_password', sa.String(length=255), nullable=False),
    sa.Column('full_name', sa.String(length=255), nullable=True),
    sa.Column('is_active', sa.Boolean(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.PrimaryKeyConstraint('id', name=op.f('pk_users'))
    )
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)
    op.create_table('predictions',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('user_id', sa.Integer(), nullable=True),
    sa.Column('model_id', sa.Integer(), nullable=True),
    sa.Column('image_original_path', sa.String(length=500), nullable=False),
    sa.Column('image_gradcam_path', sa.String(length=500), nullable=True),
    sa.Column('image_thumbnail_path', sa.String(length=500), nullable=True),
    sa.Column('predicted_label', sa.String(length=50), nullable=False),
    sa.Column('confidence', sa.Float(), nullable=False),
    sa.Column('inference_time_ms', sa.Float(), nullable=True),
    sa.Column('notes', sa.Text(), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['model_id'], ['model_information.id'], name=op.f('fk_predictions_model_id_model_information'), ondelete='SET NULL'),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], name=op.f('fk_predictions_user_id_users'), ondelete='SET NULL'),
    sa.PrimaryKeyConstraint('id', name=op.f('pk_predictions'))
    )
    op.create_index(op.f('ix_predictions_created_at'), 'predictions', ['created_at'], unique=False)
    op.create_index(op.f('ix_predictions_model_id'), 'predictions', ['model_id'], unique=False)
    op.create_index(op.f('ix_predictions_predicted_label'), 'predictions', ['predicted_label'], unique=False)
    op.create_index(op.f('ix_predictions_user_id'), 'predictions', ['user_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_predictions_user_id'), table_name='predictions')
    op.drop_index(op.f('ix_predictions_predicted_label'), table_name='predictions')
    op.drop_index(op.f('ix_predictions_model_id'), table_name='predictions')
    op.drop_index(op.f('ix_predictions_created_at'), table_name='predictions')
    op.drop_table('predictions')
    op.drop_index(op.f('ix_users_email'), table_name='users')
    op.drop_table('users')
    op.drop_table('model_information')