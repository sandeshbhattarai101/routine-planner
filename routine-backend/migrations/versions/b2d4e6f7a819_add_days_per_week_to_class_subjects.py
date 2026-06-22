"""add days_per_week to class_subjects

Revision ID: b2d4e6f7a819
Revises: a1c3d4e5f607
Create Date: 2026-06-21 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b2d4e6f7a819'
down_revision: Union[str, Sequence[str], None] = 'a1c3d4e5f607'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('class_subjects', sa.Column('days_per_week', sa.Integer(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('class_subjects', 'days_per_week')
