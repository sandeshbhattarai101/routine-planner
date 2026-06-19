"""add unique constraints to timetable_entries

Revision ID: f69531592917
Revises: 19d20a062320
Create Date: 2026-06-19 09:57:19.687034

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'f69531592917'
down_revision: Union[str, Sequence[str], None] = '19d20a062320'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_unique_constraint('uq_timetable_entries_section_slot', 'timetable_entries', ['timetable_id', 'section_id', 'working_day_id', 'period_id'])
    op.create_unique_constraint('uq_timetable_entries_teacher_slot', 'timetable_entries', ['timetable_id', 'teacher_id', 'working_day_id', 'period_id'])


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_constraint('uq_timetable_entries_teacher_slot', 'timetable_entries', type_='unique')
    op.drop_constraint('uq_timetable_entries_section_slot', 'timetable_entries', type_='unique')
