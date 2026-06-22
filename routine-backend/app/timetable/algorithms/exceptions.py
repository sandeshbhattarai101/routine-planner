REASON_LABELS = {
    "teacher_busy": "the teacher was already teaching another class then",
    "teacher_unavailable": "the teacher is marked unavailable then",
    "outside_class_window": "the period falls outside this class's allowed time window",
    "class_unavailable": "the class is marked unavailable then",
    "class_busy": "the class already had another subject then",
    "teacher_daily_load": "the teacher's daily period limit was reached",
    "distribution_limit": "this subject's days/week or periods/day spread was already used up",
}

REASON_SUGGESTIONS = {
    "teacher_busy": (
        "assigning a second/different teacher to this subject, or reducing "
        "this teacher's other commitments"
    ),
    "teacher_unavailable": (
        "reviewing this teacher's availability rules, or assigning a "
        "different teacher to this subject"
    ),
    "outside_class_window": (
        "widening this classroom's start/end time window, or adding periods "
        "that fall inside it"
    ),
    "class_unavailable": (
        "reviewing this class's availability rules to free up more periods"
    ),
    "class_busy": (
        "lowering this subject's periods/week, or adding more working days "
        "or periods so the class has more free slots"
    ),
    "teacher_daily_load": (
        "raising this teacher's max periods/day, or assigning an additional "
        "teacher to this subject"
    ),
    "distribution_limit": (
        "raising this subject's days/week (relative to its periods/week), or "
        "lowering periods/week"
    ),
}


class SchedulingConflictError(Exception):
    """Raised when a requirement can't be fully placed into the available slots.

    Carries structured diagnostics (which requirement, why each slot was
    rejected, how far allocation got) so callers can build an actionable
    message instead of a bare "couldn't allocate" notice.
    """

    def __init__(
        self,
        requirement,
        reason_counts,
        total_slots,
        assigned_count
    ):
        self.requirement = requirement
        self.reason_counts = reason_counts
        self.total_slots = total_slots
        self.assigned_count = assigned_count

        super().__init__(
            f"Unable to allocate subject {requirement.subject_id} "
            f"for classroom {requirement.classroom_id}, "
            f"section {requirement.section_id}: no free slot "
            f"matches the class's time window, teacher load, "
            f"and availability constraints."
        )

    def reason_breakdown(self):
        # Most-common rejection reasons first, as (label, count) pairs.
        return sorted(
            (
                (REASON_LABELS.get(reason, reason), count)
                for reason, count in self.reason_counts.items()
            ),
            key=lambda pair: -pair[1]
        )

    def top_suggestion(self):
        if not self.reason_counts:
            return (
                "adding more working days or periods, or reducing this "
                "subject's periods/week"
            )

        top_reason = max(self.reason_counts, key=self.reason_counts.get)

        return REASON_SUGGESTIONS.get(
            top_reason,
            "adding more working days or periods, or reducing this "
            "subject's periods/week"
        )
