from uuid import UUID

from pydantic import BaseModel
from pydantic import EmailStr


class CreateSchoolAdminRequest(
    BaseModel
):
    email: EmailStr

    password: str

    school_id: UUID


class SchoolAdminResponse(
    BaseModel
):
    id: UUID

    email: str

    school_id: UUID

    is_active: bool

    class Config:
        from_attributes = True