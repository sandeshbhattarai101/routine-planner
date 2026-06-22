from uuid import UUID

from pydantic import BaseModel


class GenerateTimetableRequest(
    BaseModel
):
    academic_year_id: UUID


class TimetableRenameRequest(BaseModel):
    name: str


class TimetableEntryCreate(BaseModel):
    working_day_id: UUID
    period_id: UUID
    classroom_id: UUID
    section_id: UUID
    teacher_id: UUID
    subject_id: UUID


class TimetableEntryUpdate(BaseModel):
    working_day_id: UUID | None = None
    period_id: UUID | None = None
    classroom_id: UUID | None = None
    section_id: UUID | None = None
    teacher_id: UUID | None = None
    subject_id: UUID | None = None


class TimetableEntryResponse(
    BaseModel
):
    day: str
    period: str
    classroom: str
    section: str
    subject: str
    teacher: str

    class Config:
        from_attributes = True