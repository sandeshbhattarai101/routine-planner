from fastapi import APIRouter
from fastapi import Depends
from fastapi import HTTPException

from sqlalchemy.orm import Session
from uuid import UUID

from app.core.database import (
    get_db
)

from app.core.permissions import (
    super_admin_only
)

from app.schemas.user_admin import (
    CreateSchoolAdminRequest,
    SchoolAdminResponse
)

from app.services.user_service import (
    UserService
)

router = APIRouter(
    prefix="/users",
    tags=["Users"]
)

@router.post(
    "/school-admin",
    response_model=
    SchoolAdminResponse
)
def create_school_admin(
    payload:
    CreateSchoolAdminRequest,

    db: Session = Depends(
        get_db
    ),

    _=Depends(
        super_admin_only
    )
):

    try:

        return (
            UserService
            .create_school_admin(
                db=db,
                email=
                payload.email,
                password=
                payload.password,
                school_id=
                payload.school_id
            )
        )

    except ValueError as e:

        raise HTTPException(
            status_code=400,
            detail=str(e)
        )
    

@router.get(
    "/school-admins",
    response_model=
    list[SchoolAdminResponse]
)
def list_school_admins(
    db: Session = Depends(
        get_db
    ),

    _=Depends(
        super_admin_only
    )
):

    return (
        UserService
        .list_school_admins(
            db
        )
    )


@router.patch(
    "/{user_id}/deactivate",
    response_model=SchoolAdminResponse
)
def deactivate_school_admin(
    user_id: UUID,

    db: Session = Depends(
        get_db
    ),

    _=Depends(
        super_admin_only
    )
):

    try:

        return (
            UserService
            .deactivate_user(
                db,
                user_id
            )
        )

    except ValueError as e:

        raise HTTPException(
            status_code=404,
            detail=str(e)
        )
    
@router.patch(
    "/{user_id}/activate",
    response_model=SchoolAdminResponse
)
def activate_school_admin(
    user_id: UUID,

    db: Session = Depends(
        get_db
    ),

    _=Depends(
        super_admin_only
    )
):

    try:

        return (
            UserService
            .activate_user(
                db,
                user_id
            )
        )

    except ValueError as e:

        raise HTTPException(
            status_code=404,
            detail=str(e)
        ) 