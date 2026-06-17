import uuid

from sqlalchemy import String
from sqlalchemy import JSON
from sqlalchemy import ForeignKey

from sqlalchemy.dialects.postgresql import UUID

from sqlalchemy.orm import (
    Mapped,
    mapped_column
)

from app.core.database import Base


class TimetableConstraint(Base):
    __tablename__ = "timetable_constraints"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )

    school_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("schools.id")
    )

    constraint_type: Mapped[str] = mapped_column(
        String(100)
    )

    config: Mapped[dict] = mapped_column(
        JSON
    )