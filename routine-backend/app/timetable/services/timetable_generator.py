from sqlalchemy.orm import Session

from app.models.class_subject import ClassSubject
from app.models.teacher_subject import TeacherSubject
from app.models.working_day import WorkingDay
from app.models.period import Period
from app.models.teacher import Teacher

from app.timetable.services.timetable_factory import (
    TimetableFactory
)

from app.timetable.services.timetable_persistence import (
    TimetablePersistence
)

from app.timetable.schemas.schedule_models import (
    ScheduleSlot,
    SubjectRequirement
)

from app.timetable.algorithms.scheduler import (
    Scheduler
)

from app.models.teacher_availability import (
    TeacherAvailability
)

from app.models.class_availability import (
    ClassAvailability
)


class TimetableGenerator:

    def __init__(
        self,
        db: Session,
        school_id
    ):
        self.db = db
        self.school_id = school_id


    def load_slots(self):

        slots = []

        days = (
            self.db.query(
                WorkingDay
            )
            .filter(
                WorkingDay.school_id == self.school_id,
                WorkingDay.is_active == True
            )
            .all()
        )

        periods = (
            self.db.query(
                Period
            )
            .filter(
                Period.school_id == self.school_id,
                Period.is_break == False
            )
            .all()
        )

        for day in days:

            for period in periods:

                slots.append(
                    ScheduleSlot(
                        day_id=str(day.id),
                        period_id=str(period.id)
                    )
                )

        return slots
    


    def load_requirements(self):

        requirements = []

        class_subjects = (
            self.db.query(
                ClassSubject
            )
            .filter(
                ClassSubject.school_id == self.school_id
            )
            .all()
        )

        for cs in class_subjects:

            teacher_subject = (
                self.db.query(
                    TeacherSubject
                )
                .filter(
                    TeacherSubject.school_id == self.school_id,
                    TeacherSubject.subject_id
                    == cs.subject_id
                )
                .first()
            )

            if not teacher_subject:
                continue

            teacher = (
                self.db.query(Teacher)
                .filter(
                    Teacher.id == teacher_subject.teacher_id
                )
                .first()
            )

            requirements.append(
                SubjectRequirement(
                    classroom_id=str(
                        cs.classroom_id
                    ),

                    section_id=str(
                        cs.section_id
                    ),

                    subject_id=str(
                        cs.subject_id
                    ),

                    teacher_id=str(
                        teacher_subject.teacher_id
                    ),

                    periods_required=
                        cs.periods_per_week,

                    max_periods_per_day=
                        teacher.max_periods_per_day
                )
            )

        return requirements
    

    def load_teacher_unavailability(
        self
    ):

        records = (
            self.db.query(
                TeacherAvailability
            )
            .filter(
                TeacherAvailability.available == False
            )
            .all()
        )

        result = set()

        for row in records:

            result.add(
                (
                    str(row.teacher_id),
                    str(row.working_day_id),
                    str(row.period_id)
                )
            )

        return result
    

    def load_class_unavailability(
        self
    ):

        records = (
            self.db.query(
                ClassAvailability
            )
            .filter(
                ClassAvailability.available == False
            )
            .all()
        )

        result = set()

        for row in records:

            result.add(
                (
                    str(row.classroom_id),
                    str(row.section_id),
                    str(row.working_day_id),
                    str(row.period_id)
                )
            )

        return result
    


    def generate(self, academic_year_id):

        requirements = (
            self.load_requirements()
        )

        slots = (
            self.load_slots()
        )

        teacher_unavailability = (
            self.load_teacher_unavailability()
        )

        class_unavailability = (
            self.load_class_unavailability()
        )

        scheduler = Scheduler(
            teacher_unavailability=
                teacher_unavailability,

            class_unavailability=
                class_unavailability
        )
        entries = scheduler.allocate(
            requirements=requirements,
            slots=slots
        )
        timetable = (
            TimetableFactory.create(
                db=self.db,
                school_id=self.school_id,
                academic_year_id=
                    academic_year_id
            )
        )

        saved_count = (
            TimetablePersistence.save_entries(
                db=self.db,
                school_id=self.school_id,
                timetable_id=timetable.id,
                entries=entries
            )
        )

        return {
            "timetable_id":
                str(timetable.id),

            "entries_saved":
                saved_count
        }