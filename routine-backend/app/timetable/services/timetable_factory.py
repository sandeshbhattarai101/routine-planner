from app.models.timetable import (
    Timetable
)


class TimetableFactory:

    @staticmethod
    def create(
        db,
        school_id,
        academic_year_id,
        name="Generated Timetable"
    ):

        timetable = Timetable(
            school_id=school_id,
            academic_year_id=
                academic_year_id,
            name=name,
            status="GENERATED"
        )

        db.add(timetable)

        db.commit()

        db.refresh(timetable)

        return timetable