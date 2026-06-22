import random

from collections import defaultdict

from sqlalchemy.orm import Session

from app.models.class_subject import ClassSubject
from app.models.teacher_subject import TeacherSubject
from app.models.working_day import WorkingDay
from app.models.period import Period
from app.models.teacher import Teacher
from app.models.classroom import Classroom
from app.models.subject import Subject
from app.models.section import Section

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

from app.timetable.algorithms.exceptions import (
    SchedulingConflictError
)

from app.timetable.services.column_planner import (
    ColumnPlanner
)

from app.models.teacher_availability import (
    TeacherAvailability
)

from app.models.class_availability import (
    ClassAvailability
)

# Allocation has no true backtracking, so a single unlucky tie-break can
# leave one requirement stranded even when a feasible full schedule exists.
# Retrying with a freshly-seeded random tiebreaker lets the algorithm
# explore a different combination of placements each time.
MAX_GENERATION_ATTEMPTS = 25


class TimetableGenerator:

    def __init__(
        self,
        db: Session,
        school_id
    ):
        self.db = db
        self.school_id = school_id
        self.skipped_requirements = []


    def load_working_day_ids(self):

        days = (
            self.db.query(
                WorkingDay
            )
            .filter(
                WorkingDay.school_id == self.school_id,
                WorkingDay.is_active == True
            )
            .order_by(WorkingDay.id)
            .all()
        )

        return [str(day.id) for day in days]

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
            .order_by(WorkingDay.id)
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
            .order_by(Period.start_time)
            .all()
        )

        for day in days:

            for period in periods:

                slots.append(
                    ScheduleSlot(
                        day_id=str(day.id),
                        period_id=str(period.id),
                        period_start_time=period.start_time,
                        period_end_time=period.end_time
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
            .order_by(ClassSubject.id)
            .all()
        )

        for cs in class_subjects:

            teacher_id = cs.teacher_id

            if not teacher_id:
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
                    self.skipped_requirements.append(
                        {
                            "classroom_id": str(cs.classroom_id),
                            "section_id": str(cs.section_id),
                            "subject_id": str(cs.subject_id),
                            "reason": "no_teacher_assigned"
                        }
                    )
                    continue

                teacher_id = teacher_subject.teacher_id

            teacher = (
                self.db.query(Teacher)
                .filter(
                    Teacher.id == teacher_id
                )
                .first()
            )

            if not teacher:
                self.skipped_requirements.append(
                    {
                        "classroom_id": str(cs.classroom_id),
                        "section_id": str(cs.section_id),
                        "subject_id": str(cs.subject_id),
                        "reason": "no_teacher_assigned"
                    }
                )
                continue

            classroom = (
                self.db.query(Classroom)
                .filter(
                    Classroom.id == cs.classroom_id
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
                        teacher_id
                    ),

                    periods_required=
                        cs.periods_per_week,

                    days_per_week=
                        cs.days_per_week,

                    max_periods_per_day=
                        teacher.max_periods_per_day,

                    classroom_start_time=
                        classroom.start_time
                        if classroom else None,

                    classroom_end_time=
                        classroom.end_time
                        if classroom else None
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
    


    def _validate_classroom_windows(self, requirements, slots):
        # A classroom whose time window matches no period (e.g. an inverted
        # or too-narrow start/end time) will always fail allocation, no
        # matter how many randomized attempts are tried. Catch that upfront
        # with a precise message instead of burning through retries first.
        from app.timetable.validators.time_window_validator import (
            TimeWindowValidator
        )

        checked = set()

        for requirement in requirements:

            key = (
                requirement.classroom_id,
                requirement.classroom_start_time,
                requirement.classroom_end_time
            )

            if key in checked:
                continue

            checked.add(key)

            if requirement.classroom_start_time is None and requirement.classroom_end_time is None:
                continue

            has_match = any(
                TimeWindowValidator.within_window(
                    slot.period_start_time,
                    slot.period_end_time,
                    requirement.classroom_start_time,
                    requirement.classroom_end_time
                )
                for slot in slots
            )

            if not has_match:
                classroom_name = self._name_of(Classroom, requirement.classroom_id)
                raise Exception(
                    f"Classroom '{classroom_name}' has a time window "
                    f"({requirement.classroom_start_time} - "
                    f"{requirement.classroom_end_time}) that doesn't match any "
                    f"period. Fix it on the Classes & Sections page (end time "
                    f"must be after start time, and at least one period must "
                    f"fall inside the window) before generating."
                )

    def _build_period_lookup(self, slots):
        # Periods are ordered by start_time within each day in load_slots,
        # so the first occurrence of each period_id already reflects the
        # right ordering.
        period_ids = []

        period_times = {}

        for slot in slots:
            if slot.period_id not in period_times:
                period_times[slot.period_id] = (
                    slot.period_start_time, slot.period_end_time
                )
                period_ids.append(slot.period_id)

        return period_ids, period_times

    def _build_column_plans(self, requirements, working_day_ids):
        # Decide, per class/section, which subjects should share a period
        # column for the whole week (bin-packed so their day-sets fill the
        # week with no day left vacant) before the schedule is even built,
        # instead of discovering it afterwards.
        by_class = defaultdict(list)

        for requirement in requirements:
            key = (requirement.classroom_id, requirement.section_id)
            by_class[key].append(requirement)

        return {
            class_key: ColumnPlanner.plan(class_requirements, working_day_ids)
            for class_key, class_requirements in by_class.items()
        }

    def generate(self, academic_year_id):

        requirements = (
            self.load_requirements()
        )

        slots = (
            self.load_slots()
        )

        self._validate_classroom_windows(requirements, slots)

        period_ids, period_times = self._build_period_lookup(slots)

        column_plans = self._build_column_plans(
            requirements, self.load_working_day_ids()
        )

        column_tasks = [
            (class_key, group)
            for class_key, groups in column_plans.items()
            for group in groups
        ]

        teacher_unavailability = (
            self.load_teacher_unavailability()
        )

        class_unavailability = (
            self.load_class_unavailability()
        )

        entries = None

        worst_error = None

        worst_error_progress = -1

        for attempt in range(MAX_GENERATION_ATTEMPTS):

            scheduler = Scheduler(
                teacher_unavailability=
                    teacher_unavailability,

                class_unavailability=
                    class_unavailability,

                rng=random.Random(attempt)
            )

            try:
                entries = scheduler.allocate_columns(
                    column_tasks=column_tasks,
                    period_ids=period_ids,
                    period_times=period_times
                )
                break

            except SchedulingConflictError as error:

                if len(scheduler.entries) > worst_error_progress:
                    worst_error_progress = len(scheduler.entries)
                    worst_error = error

        if entries is None:
            raise Exception(
                self._describe_failure(worst_error)
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
                saved_count,

            "warnings":
                self._describe_skipped()
        }

    def _name_of(self, model, entity_id):
        row = (
            self.db.query(model)
            .filter(model.id == entity_id)
            .first()
        )
        return row.name if row else str(entity_id)

    def _describe_failure(self, error):

        if error is None:
            return "Unable to generate a timetable: no schedulable subjects found."

        requirement = error.requirement

        subject_name = self._name_of(Subject, requirement.subject_id)
        section = (
            self.db.query(Section)
            .filter(Section.id == requirement.section_id)
            .first()
        )
        classroom_name = self._name_of(Classroom, requirement.classroom_id)
        section_name = section.name if section else str(requirement.section_id)

        reasons = error.reason_breakdown()
        reason_text = ", ".join(
            f"{label} ({count}x)" for label, count in reasons[:3]
        ) or "no slot satisfied every constraint"

        return (
            f"Couldn't fit all periods of '{subject_name}' for "
            f"{classroom_name} / {section_name} even after "
            f"{MAX_GENERATION_ATTEMPTS} attempts "
            f"({error.assigned_count}/{requirement.periods_required} periods placed). "
            f"Most slots were rejected because: {reason_text}. "
            f"Try: {error.top_suggestion()}."
        )

    def _describe_skipped(self):

        warnings = []

        for skipped in self.skipped_requirements:

            subject_name = self._name_of(Subject, skipped["subject_id"])
            classroom_name = self._name_of(Classroom, skipped["classroom_id"])
            section = (
                self.db.query(Section)
                .filter(Section.id == skipped["section_id"])
                .first()
            )
            section_name = section.name if section else skipped["section_id"]

            warnings.append(
                f"'{subject_name}' for {classroom_name} / {section_name} was "
                f"skipped: no teacher is assigned to teach it (set one on the "
                f"Curriculum or Teachers page)."
            )

        return warnings