"""add start_time/end_time to classrooms

Revision ID: a1c3d4e5f607
Revises: e465b5b25d63
Create Date: 2026-06-20 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1c3d4e5f607'
down_revision: Union[str, Sequence[str], None] = 'e465b5b25d63'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('classrooms', sa.Column('start_time', sa.Time(), nullable=True))
    op.add_column('classrooms', sa.Column('end_time', sa.Time(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('classrooms', 'end_time')
    op.drop_column('classrooms', 'start_time')
