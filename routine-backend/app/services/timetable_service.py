from sqlalchemy.orm import Session

from app.models.timetable import Timetable
from app.models.timetable_entry import (
    TimetableEntry
)
from app.models.teacher import Teacher
from app.models.period import Period
from app.models.classroom import Classroom
from app.models.teacher_availability import TeacherAvailability
from app.models.class_availability import ClassAvailability

from app.timetable.validators.conflict_validator import ConflictValidator
from app.timetable.validators.availability_validator import AvailabilityValidator
from app.timetable.validators.load_validator import LoadValidator
from app.timetable.validators.distribution_validator import DistributionValidator
from app.timetable.validators.time_window_validator import TimeWindowValidator


class TimetableService:

    @staticmethod
    def get_timetable(
        db: Session,
        timetable_id,
        school_id
    ):

        return (
            db.query(
                TimetableEntry
            )
            .filter(
                TimetableEntry.timetable_id
                == timetable_id,
                TimetableEntry.school_id
                == school_id
            )
            .all()
        )

    @staticmethod
    def _build_schedule_state(db: Session, school_id, timetable_id, exclude_entry_id=None):
        query = db.query(TimetableEntry).filter(
            TimetableEntry.timetable_id == timetable_id,
            TimetableEntry.school_id == school_id
        )

        if exclude_entry_id:
            query = query.filter(TimetableEntry.id != exclude_entry_id)

        teacher_schedule = set()
        class_schedule = set()
        daily_loads = {}
        subject_day_count = {}

        for entry in query.all():
            day_id = str(entry.working_day_id)
            period_id = str(entry.period_id)
            teacher_id = str(entry.teacher_id)
            classroom_id = str(entry.classroom_id)
            section_id = str(entry.section_id)
            subject_id = str(entry.subject_id)

            teacher_schedule.add((teacher_id, day_id, period_id))
            class_schedule.add((classroom_id, section_id, day_id, period_id))

            load_key = (teacher_id, day_id)
            daily_loads[load_key] = daily_loads.get(load_key, 0) + 1

            subject_key = (classroom_id, section_id, subject_id, day_id)
            subject_day_count[subject_key] = subject_day_count.get(subject_key, 0) + 1

        return teacher_schedule, class_schedule, daily_loads, subject_day_count

    @staticmethod
    def validate_entry(db: Session, school_id, timetable_id, data, exclude_entry_id=None):
        period = (
            db.query(Period)
            .filter(Period.id == data.period_id, Period.school_id == school_id)
            .first()
        )
        if not period:
            raise ValueError("Period not found.")
        if period.is_break:
            raise ValueError("Cannot schedule an entry during a break period.")

        classroom = (
            db.query(Classroom)
            .filter(Classroom.id == data.classroom_id, Classroom.school_id == school_id)
            .first()
        )
        if not classroom:
            raise ValueError("Classroom not found.")
        if not TimeWindowValidator.within_window(
            period.start_time, period.end_time, classroom.start_time, classroom.end_time
        ):
            raise ValueError(
                "This period falls outside the class's configured daily time range."
            )

        teacher = (
            db.query(Teacher)
            .filter(Teacher.id == data.teacher_id, Teacher.school_id == school_id)
            .first()
        )
        if not teacher:
            raise ValueError("Teacher not found.")

        teacher_schedule, class_schedule, daily_loads, subject_day_count = (
            TimetableService._build_schedule_state(
                db, school_id, timetable_id, exclude_entry_id
            )
        )

        day_id = str(data.working_day_id)
        period_id = str(data.period_id)
        teacher_id = str(data.teacher_id)
        classroom_id = str(data.classroom_id)
        section_id = str(data.section_id)
        subject_id = str(data.subject_id)

        if not ConflictValidator.teacher_available(teacher_schedule, teacher_id, day_id, period_id):
            raise ValueError("Teacher is already assigned to another class in this slot.")

        if not ConflictValidator.class_available(class_schedule, classroom_id, section_id, day_id, period_id):
            raise ValueError("This section already has a subject scheduled in this slot.")

        teacher_unavailable = (
            db.query(TeacherAvailability)
            .filter(
                TeacherAvailability.teacher_id == data.teacher_id,
                TeacherAvailability.working_day_id == data.working_day_id,
                TeacherAvailability.period_id == data.period_id,
                TeacherAvailability.available == False
            )
            .first()
        )
        if not AvailabilityValidator.teacher_available(
            {(teacher_id, day_id, period_id)} if teacher_unavailable else set(),
            teacher_id, day_id, period_id
        ):
            raise ValueError("Teacher is marked unavailable for this slot.")

        class_unavailable = (
            db.query(ClassAvailability)
            .filter(
                ClassAvailability.classroom_id == data.classroom_id,
                ClassAvailability.section_id == data.section_id,
                ClassAvailability.working_day_id == data.working_day_id,
                ClassAvailability.period_id == data.period_id,
                ClassAvailability.available == False
            )
            .first()
        )
        if not AvailabilityValidator.class_available(
            {(classroom_id, section_id, day_id, period_id)} if class_unavailable else set(),
            classroom_id, section_id, day_id, period_id
        ):
            raise ValueError("This class is marked unavailable for this slot.")

        if not LoadValidator.can_assign(daily_loads, teacher_id, day_id, teacher.max_periods_per_day):
            raise ValueError(
                f"Teacher has reached their max periods per day ({teacher.max_periods_per_day})."
            )

        if not DistributionValidator.can_assign(subject_day_count, classroom_id, section_id, subject_id, day_id):
            raise ValueError("This subject is already scheduled for this class today.")

    @staticmethod
    def create_entry(db: Session, school_id, timetable_id, data):
        TimetableService.validate_entry(db, school_id, timetable_id, data)

        entry = TimetableEntry(
            school_id=school_id,
            timetable_id=timetable_id,
            working_day_id=data.working_day_id,
            period_id=data.period_id,
            classroom_id=data.classroom_id,
            section_id=data.section_id,
            teacher_id=data.teacher_id,
            subject_id=data.subject_id
        )

        db.add(entry)
        db.commit()
        db.refresh(entry)

        return entry

    @staticmethod
    def update_entry(db: Session, school_id, entry_id, data):
        entry = (
            db.query(TimetableEntry)
            .filter(TimetableEntry.id == entry_id, TimetableEntry.school_id == school_id)
            .first()
        )
        if not entry:
            raise ValueError("Timetable entry not found.")

        merged_fields = {
            "working_day_id": data.working_day_id if data.working_day_id is not None else entry.working_day_id,
            "period_id": data.period_id if data.period_id is not None else entry.period_id,
            "classroom_id": data.classroom_id if data.classroom_id is not None else entry.classroom_id,
            "section_id": data.section_id if data.section_id is not None else entry.section_id,
            "teacher_id": data.teacher_id if data.teacher_id is not None else entry.teacher_id,
            "subject_id": data.subject_id if data.subject_id is not None else entry.subject_id,
        }

        class _Merged:
            pass

        merged = _Merged()
        for key, value in merged_fields.items():
            setattr(merged, key, value)

        TimetableService.validate_entry(
            db, school_id, entry.timetable_id, merged, exclude_entry_id=entry.id
        )

        for key, value in merged_fields.items():
            setattr(entry, key, value)

        db.commit()
        db.refresh(entry)

        return entry

    @staticmethod
    def rename_timetable(db: Session, school_id, timetable_id, name):
        timetable = (
            db.query(Timetable)
            .filter(Timetable.id == timetable_id, Timetable.school_id == school_id)
            .first()
        )
        if not timetable:
            raise ValueError("Timetable not found.")

        name = name.strip()
        if not name:
            raise ValueError("Name cannot be empty.")

        timetable.name = name
        db.commit()
        db.refresh(timetable)

        return timetable

    @staticmethod
    def delete_timetable(db: Session, school_id, timetable_id):
        timetable = (
            db.query(Timetable)
            .filter(Timetable.id == timetable_id, Timetable.school_id == school_id)
            .first()
        )
        if not timetable:
            raise ValueError("Timetable not found.")

        db.query(TimetableEntry).filter(
            TimetableEntry.timetable_id == timetable_id,
            TimetableEntry.school_id == school_id
        ).delete()

        db.delete(timetable)
        db.commit()

    @staticmethod
    def delete_entry(db: Session, school_id, entry_id):
        entry = (
            db.query(TimetableEntry)
            .filter(TimetableEntry.id == entry_id, TimetableEntry.school_id == school_id)
            .first()
        )
        if not entry:
            raise ValueError("Timetable entry not found.")

        db.delete(entry)
        db.commit()