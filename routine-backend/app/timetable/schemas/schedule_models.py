from dataclasses import dataclass
from datetime import time


@dataclass
class ScheduleSlot:

    day_id: str
    period_id: str

    period_start_time: time | None = None
    period_end_time: time | None = None


@dataclass
class SubjectRequirement:

    classroom_id: str

    section_id: str

    subject_id: str

    teacher_id: str

    periods_required: int

    # Number of distinct days this subject's periods should be spread
    # across each week. None means no constraint (today's behaviour: one
    # period per day, spread across as many days as needed).
    days_per_week: int | None = None

    max_periods_per_day: int = 5

    # Optional daily window for this class. When set, only slots whose
    # period falls fully within [classroom_start_time, classroom_end_time]
    # are eligible.
    classroom_start_time: time | None = None
    classroom_end_time: time | None = None