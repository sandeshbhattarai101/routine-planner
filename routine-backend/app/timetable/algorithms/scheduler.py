import random

from app.timetable.algorithms.scoring_engine import (
    ScoringEngine
)

from app.timetable.algorithms.exceptions import (
    SchedulingConflictError
)

from app.timetable.validators.conflict_validator import (
    ConflictValidator
)

from app.timetable.validators.load_validator import (
    LoadValidator
)

from app.timetable.validators.availability_validator import (
    AvailabilityValidator
)

from app.timetable.validators.time_window_validator import (
    TimeWindowValidator
)


class Scheduler:
    """Assigns each planned column (see ColumnPlanner) to one period for
    the whole week, instead of placing single day+period occurrences and
    fixing up the result afterwards. Column groups are colored onto
    periods in most-constrained-first order — a group conflicts with
    every other group in the same class (they can't share a period) and
    with any group elsewhere that uses one of the same teachers on an
    overlapping day (that teacher can't be in two places at once).

    A column that can't get a single shared period (every candidate period
    clashes with an already-placed, more-constrained column) falls back to
    scattering its own occurrences across whatever periods are free, day by
    day, so generation always produces a feasible schedule.
    """

    def __init__(
        self,
        teacher_unavailability=None,
        class_unavailability=None,
        rng=None
    ):

        self.teacher_schedule = set()

        self.class_schedule = set()

        self.daily_loads = {}

        self.day_loads = {}

        self.entries = []

        self.teacher_unavailability = (
            teacher_unavailability or set()
        )

        self.class_unavailability = (
            class_unavailability or set()
        )

        # Used to break ties between equally-constrained columns/periods
        # differently on each attempt, so a retry can escape a dead end a
        # previous attempt walked into.
        self.rng = rng or random.Random()

    def allocate_columns(
        self,
        column_tasks,
        period_ids,
        period_times
    ):

        ordered_tasks = self._order_by_constraint_tightness(column_tasks)

        for class_key, group in ordered_tasks:

            placed = self._assign_group_to_column(
                class_key, group, period_ids, period_times
            )

            if not placed:

                for member in group.members:

                    self._allocate_requirement_days(
                        member.requirement,
                        member.assigned_days,
                        class_key,
                        period_ids,
                        period_times
                    )

        return self.entries

    def _order_by_constraint_tightness(self, column_tasks):
        # Two columns conflict (must not land on the same period) if
        # they're in the same class, or if they share a teacher on an
        # overlapping day. Process the most-conflicted columns first,
        # while the most periods are still free.
        def teacher_days(group):
            days = set()
            for member in group.members:
                for day in member.assigned_days:
                    days.add((member.requirement.teacher_id, day))
            return days

        info = [
            (class_key, group, teacher_days(group))
            for class_key, group in column_tasks
        ]

        def degree(index):
            class_key, group, td = info[index]
            count = 0
            for other_index, (other_class_key, other_group, other_td) in enumerate(info):
                if other_index == index:
                    continue
                if other_class_key == class_key:
                    count += 1
                elif td & other_td:
                    count += 1
            return count

        degrees = [degree(i) for i in range(len(info))]

        tiebreakers = [self.rng.random() for _ in info]

        order = sorted(
            range(len(info)),
            key=lambda i: (
                -degrees[i],
                -info[i][1].total_days,
                tiebreakers[i]
            )
        )

        return [(info[i][0], info[i][1]) for i in order]

    def _assign_group_to_column(self, class_key, group, period_ids, period_times):

        classroom_id, section_id = class_key

        shuffled_periods = list(period_ids)

        self.rng.shuffle(shuffled_periods)

        for period_id in shuffled_periods:

            period_start, period_end = period_times.get(
                period_id, (None, None)
            )

            plan = []

            feasible = True

            for member in group.members:

                requirement = member.requirement

                if not TimeWindowValidator.within_window(
                    period_start, period_end,
                    requirement.classroom_start_time,
                    requirement.classroom_end_time
                ):
                    feasible = False
                    break

                for day in member.assigned_days:

                    if not self._slot_is_free(
                        requirement, classroom_id, section_id, day, period_id
                    ):
                        feasible = False
                        break

                    plan.append((requirement, day))

                if not feasible:
                    break

            if not feasible:
                continue

            for requirement, day in plan:
                self._commit_entry(
                    requirement, classroom_id, section_id, day, period_id
                )

            return True

        return False

    def _allocate_requirement_days(
        self, requirement, days, class_key, period_ids, period_times
    ):

        classroom_id, section_id = class_key

        assigned_count = 0

        for day in days:

            best_period = None

            best_score = -999999

            tied_best_periods = []

            reason_counts = {}

            shuffled_periods = list(period_ids)

            self.rng.shuffle(shuffled_periods)

            for period_id in shuffled_periods:

                period_start, period_end = period_times.get(
                    period_id, (None, None)
                )

                if not TimeWindowValidator.within_window(
                    period_start, period_end,
                    requirement.classroom_start_time,
                    requirement.classroom_end_time
                ):
                    reason_counts["outside_class_window"] = (
                        reason_counts.get("outside_class_window", 0) + 1
                    )
                    continue

                if not self._slot_is_free(
                    requirement, classroom_id, section_id, day, period_id
                ):
                    reason_counts["slot_unavailable"] = (
                        reason_counts.get("slot_unavailable", 0) + 1
                    )
                    continue

                score = ScoringEngine.score_slot(
                    day_load=self.day_loads.get(day, 0),
                    teacher_load=self.daily_loads.get(
                        (requirement.teacher_id, day), 0
                    )
                )

                if score > best_score:
                    best_score = score
                    tied_best_periods = [period_id]
                elif score == best_score:
                    tied_best_periods.append(period_id)

            if tied_best_periods:
                best_period = self.rng.choice(tied_best_periods)

            if best_period is None:
                raise SchedulingConflictError(
                    requirement=requirement,
                    reason_counts=reason_counts,
                    total_slots=len(period_ids),
                    assigned_count=assigned_count
                )

            self._commit_entry(
                requirement, classroom_id, section_id, day, best_period
            )

            assigned_count += 1

    def _slot_is_free(self, requirement, classroom_id, section_id, day, period_id):

        if not AvailabilityValidator.teacher_available(
            self.teacher_unavailability, requirement.teacher_id, day, period_id
        ):
            return False

        if not ConflictValidator.teacher_available(
            self.teacher_schedule, requirement.teacher_id, day, period_id
        ):
            return False

        if not AvailabilityValidator.class_available(
            self.class_unavailability, classroom_id, section_id, day, period_id
        ):
            return False

        if not ConflictValidator.class_available(
            self.class_schedule, classroom_id, section_id, day, period_id
        ):
            return False

        if not LoadValidator.can_assign(
            self.daily_loads, requirement.teacher_id, day,
            requirement.max_periods_per_day
        ):
            return False

        return True

    def _commit_entry(self, requirement, classroom_id, section_id, day, period_id):

        self.teacher_schedule.add(
            (requirement.teacher_id, day, period_id)
        )

        self.class_schedule.add(
            (classroom_id, section_id, day, period_id)
        )

        load_key = (requirement.teacher_id, day)

        self.daily_loads[load_key] = self.daily_loads.get(load_key, 0) + 1

        self.day_loads[day] = self.day_loads.get(day, 0) + 1

        self.entries.append(
            {
                "classroom_id": classroom_id,
                "section_id": section_id,
                "subject_id": requirement.subject_id,
                "teacher_id": requirement.teacher_id,
                "day_id": day,
                "period_id": period_id
            }
        )
