from uuid import UUID

from pydantic import BaseModel


class SchoolCreate(
    BaseModel
):
    name: str


class SchoolUpdate(
    BaseModel
):
    name: str | None = None

    is_active: bool | None = None


class SchoolResponse(
    BaseModel
):
    id: UUID

    name: str

    is_active: bool | None = True

    class Config:
        from_attributes = True