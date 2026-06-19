import uuid

from sqlalchemy import ForeignKey
from sqlalchemy import UniqueConstraint

from sqlalchemy.dialects.postgresql import UUID

from sqlalchemy.orm import (
    Mapped,
    mapped_column
)

from app.core.database import Base


class TimetableEntry(Base):
    __tablename__ = "timetable_entries"
    __table_args__ = (
        UniqueConstraint(
            "timetable_id", "teacher_id", "working_day_id", "period_id",
            name="uq_timetable_entries_teacher_slot"
        ),
        UniqueConstraint(
            "timetable_id", "section_id", "working_day_id", "period_id",
            name="uq_timetable_entries_section_slot"
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )


    school_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("schools.id")
    )

    timetable_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("timetables.id")
    )

    working_day_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("working_days.id")
    )

    period_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("periods.id")
    )

    classroom_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("classrooms.id")
    )

    section_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("sections.id")
    )

    teacher_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("teachers.id")
    )

    subject_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("subjects.id")
    )