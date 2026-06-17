from uuid import UUID

from pydantic import BaseModel


class TeacherCreate(
    BaseModel
):
    name: str

    teacher_code: str | None = None

    max_periods_per_day: int = 5


class TeacherUpdate(
    BaseModel
):
    name: str | None = None

    teacher_code: str | None = None

    max_periods_per_day: int | None = None

    is_active: bool | None = None


class TeacherResponse(
    BaseModel
):
    id: UUID

    school_id: UUID

    name: str

    teacher_code: str | None

    max_periods_per_day: int

    is_active: bool

    class Config:
        from_attributes = True