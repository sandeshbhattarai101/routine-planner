from sqlalchemy.orm import Session

from app.models.timetable_entry import (
    TimetableEntry
)


class TimetableService:

    @staticmethod
    def get_timetable(
        db: Session,
        timetable_id
    ):

        return (
            db.query(
                TimetableEntry
            )
            .filter(
                TimetableEntry.timetable_id
                == timetable_id
            )
            .all()
        )