from uuid import UUID

from pydantic import BaseModel


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