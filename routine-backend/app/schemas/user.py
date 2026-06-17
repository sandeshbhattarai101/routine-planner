from uuid import UUID

from pydantic import BaseModel

from app.models.user import (
    UserRole
)


class CurrentUserResponse(
    BaseModel
):

    id: UUID

    email: str

    role: UserRole

    school_id: UUID | None

    is_active: bool

    class Config:
        from_attributes = True