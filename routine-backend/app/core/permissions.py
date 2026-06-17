from fastapi import Depends
from fastapi import HTTPException

from app.models.user import UserRole
from app.models.user import User

from app.core.dependencies import get_current_user


def super_admin_only(
    current_user: User = Depends(get_current_user),
):

    if current_user.role != UserRole.SUPER_ADMIN:

        raise HTTPException(
            status_code=403,
            detail="Super admin only",
        )

    return current_user


def school_admin_only(
    current_user: User = Depends(get_current_user),
):

    if current_user.role != UserRole.SCHOOL_ADMIN:

        raise HTTPException(
            status_code=403,
            detail="School admin only",
        )

    return current_user