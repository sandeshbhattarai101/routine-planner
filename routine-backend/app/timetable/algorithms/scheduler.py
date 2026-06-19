from app.timetable.algorithms.scoring_engine import (
    ScoringEngine
)

from app.timetable.validators.conflict_validator import (
    ConflictValidator
)

from app.timetable.validators.load_validator import (
    LoadValidator
)

from app.timetable.validators.distribution_validator import (
    DistributionValidator
)

from app.timetable.validators.availability_validator import (
    AvailabilityValidator
)


class Scheduler:

    def __init__(
        self,
        teacher_unavailability=None,
        class_unavailability=None
    ):

        self.teacher_schedule = set()

        self.class_schedule = set()

        self.daily_loads = {}

        self.subject_day_count = {}

        self.day_loads = {}

        self.entries = []

        self.teacher_unavailability = (
            teacher_unavailability or set()
        )

        self.class_unavailability = (
            class_unavailability or set()
        )

    def allocate(
        self,
        requirements,
        slots
    ):

        for requirement in requirements:

            assigned_count = 0

            while assigned_count < requirement.periods_required:

                best_slot = None

                best_score = -999999

                for slot in slots:

                    teacher_ok = (
                        ConflictValidator.teacher_available(
                            self.teacher_schedule,
                            requirement.teacher_id,
                            slot.day_id,
                            slot.period_id
                        )
                    )

                    if not teacher_ok:
                        continue


                    teacher_available = (
                        AvailabilityValidator.teacher_available(
                            self.teacher_unavailability,
                            requirement.teacher_id,
                            slot.day_id,
                            slot.period_id
                        )
                    )

                    if not teacher_available:
                        continue


                    class_available = (
                        AvailabilityValidator.class_available(
                            self.class_unavailability,
                            requirement.classroom_id,
                            requirement.section_id,
                            slot.day_id,
                            slot.period_id
                        )
                    )

                    if not class_available:
                        continue




                    class_ok = (
                        ConflictValidator.class_available(
                            self.class_schedule,
                            requirement.classroom_id,
                            requirement.section_id,
                            slot.day_id,
                            slot.period_id
                        )
                    )

                    if not class_ok:
                        continue

                    load_ok = (
                        LoadValidator.can_assign(
                            self.daily_loads,
                            requirement.teacher_id,
                            slot.day_id,
                            requirement.max_periods_per_day
                        )
                    )

                    if not load_ok:
                        continue

                    distribution_ok = (
                        DistributionValidator.can_assign(
                            self.subject_day_count,
                            requirement.classroom_id,
                            requirement.section_id,
                            requirement.subject_id,
                            slot.day_id
                        )
                    )

                    if not distribution_ok:
                        continue

                    score = (
                        ScoringEngine.score_slot(
                            day_load=self.day_loads.get(
                                slot.day_id,
                                0
                            ),
                            teacher_load=self.daily_loads.get(
                                (
                                    requirement.teacher_id,
                                    slot.day_id
                                ),
                                0
                            )
                        )
                    )

                    if score > best_score:

                        best_score = score

                        best_slot = slot

                if best_slot is None:

                    raise Exception(
                        f"Unable to allocate "
                        f"subject {requirement.subject_id}"
                    )

                self.teacher_schedule.add(
                    (
                        requirement.teacher_id,
                        best_slot.day_id,
                        best_slot.period_id
                    )
                )

                self.class_schedule.add(
                    (
                        requirement.classroom_id,
                        requirement.section_id,
                        best_slot.day_id,
                        best_slot.period_id
                    )
                )

                load_key = (
                    requirement.teacher_id,
                    best_slot.day_id
                )

                self.daily_loads[load_key] = (
                    self.daily_loads.get(
                        load_key,
                        0
                    ) + 1
                )

                subject_day_key = (
                    requirement.classroom_id,
                    requirement.section_id,
                    requirement.subject_id,
                    best_slot.day_id
                )

                self.subject_day_count[
                    subject_day_key
                ] = (
                    self.subject_day_count.get(
                        subject_day_key,
                        0
                    ) + 1
                )

                self.day_loads[
                    best_slot.day_id
                ] = (
                    self.day_loads.get(
                        best_slot.day_id,
                        0
                    ) + 1
                )

                self.entries.append(
                    {
                        "classroom_id":
                            requirement.classroom_id,

                        "section_id":
                            requirement.section_id,

                        "subject_id":
                            requirement.subject_id,

                        "teacher_id":
                            requirement.teacher_id,

                        "day_id":
                            best_slot.day_id,

                        "period_id":
                            best_slot.period_id
                    }
                )

                assigned_count += 1

        return self.entries