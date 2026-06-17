from uuid import UUID

from pydantic import (
    BaseModel,
    EmailStr
)

from app.models.school_registration import (
    RequestStatus
)


class RegistrationCreate(
    BaseModel
):
    school_name: str

    admin_name: str

    email: EmailStr

    password: str

    phone: str | None = None

    address: str | None = None


class RegistrationResponse(
    BaseModel
):
    id: UUID

    school_name: str

    admin_name: str

    email: str

    status: RequestStatus

    class Config:
        from_attributes = True