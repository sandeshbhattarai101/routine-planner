from app.models.timetable_entry import (
    TimetableEntry
)


class TimetablePersistence:

    @staticmethod
    def save_entries(
        db,
        school_id,
        timetable_id,
        entries
    ):

        objects = []

        for entry in entries:

            objects.append(
                TimetableEntry(
                    school_id=school_id,
                    timetable_id=timetable_id,
                    classroom_id=
                        entry["classroom_id"],
                    section_id=
                        entry["section_id"],
                    subject_id=
                        entry["subject_id"],
                    teacher_id=
                        entry["teacher_id"],
                    working_day_id=
                        entry["day_id"],
                    period_id=
                        entry["period_id"]
                )
            )

        db.add_all(objects)

        db.commit()

        return len(objects)