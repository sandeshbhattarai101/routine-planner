from dataclasses import dataclass


@dataclass
class ScheduleSlot:

    day_id: str
    period_id: str


@dataclass
class SubjectRequirement:

    classroom_id: str

    section_id: str

    subject_id: str

    teacher_id: str

    periods_required: int