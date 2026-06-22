from dataclasses import dataclass, field


@dataclass
class ColumnMember:
    # One subject's claim on a column: the requirement it belongs to, how
    # many days/week it needs, and (once a group is finalized) the
    # specific working days it occupies in that column.
    requirement: object
    requirement_size: int
    assigned_days: list = field(default_factory=list)


@dataclass
class ColumnGroup:
    members: list = field(default_factory=list)

    @property
    def total_days(self):
        return sum(len(m.assigned_days) for m in self.members)


class ColumnPlanner:
    """Decides, per class/section, which subjects should share a single
    period-column for the whole week.

    A subject that runs every working day gets a column to itself (a
    group of size one). Subjects that run fewer days than the week are
    bin-packed together so their day-sets fill out a shared column with
    no day left vacant, instead of being discovered/fixed up after the
    fact. Only one period per subject per day is modelled.
    """

    @staticmethod
    def plan(requirements, working_day_ids):

        total_days = len(working_day_ids)

        sizes = ColumnPlanner._days_needed(requirements, total_days)

        groups = ColumnPlanner._bin_pack(sizes, total_days)

        ColumnPlanner._assign_days(groups, working_day_ids)

        return groups

    @staticmethod
    def _days_needed(requirements, total_days):
        return [
            (
                requirement,
                min(
                    requirement.days_per_week or requirement.periods_required,
                    total_days
                )
            )
            for requirement in requirements
        ]

    @staticmethod
    def _bin_pack(sizes, total_days):
        # First-fit-decreasing: place the biggest day-footprint
        # requirements first, into the first group with enough remaining
        # capacity, else open a new group. This is what makes exact-fill
        # groups (e.g. 3 + 3 == 6) the common outcome instead of an
        # accident.
        ordered = sorted(sizes, key=lambda pair: -pair[1])

        groups = []

        for requirement, size in ordered:

            placed = False

            for group in groups:

                used = sum(m.requirement_size for m in group.members)

                if used + size <= total_days:
                    group.members.append(
                        ColumnMember(
                            requirement=requirement, requirement_size=size
                        )
                    )
                    placed = True
                    break

            if not placed:
                groups.append(
                    ColumnGroup(
                        members=[
                            ColumnMember(
                                requirement=requirement, requirement_size=size
                            )
                        ]
                    )
                )

        return groups

    @staticmethod
    def _assign_days(groups, working_day_ids):
        # Within a group, members must occupy disjoint days (otherwise two
        # subjects would double-book the same column on the same day) —
        # chunk sequentially over the working-day order.
        for group in groups:

            cursor = 0

            for member in group.members:

                size = member.requirement_size

                member.assigned_days = working_day_ids[cursor:cursor + size]

                cursor += size
