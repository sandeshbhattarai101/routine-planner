from fastapi import Depends
from fastapi import HTTPException

from app.core.auth import (
    get_current_user
)

from app.models.user import (
    User,
    UserRole
)


def get_current_school_id(
    current_user: User = Depends(
        get_current_user
    )
):

    if (
        current_user.role
        != UserRole.SCHOOL_ADMIN
    ):
        raise HTTPException(
            status_code=403,
            detail="School admin required"
        )

    return current_user.school_id