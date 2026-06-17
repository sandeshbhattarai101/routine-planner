from fastapi import APIRouter
from fastapi import Depends
from fastapi import HTTPException
from uuid import UUID

from sqlalchemy.orm import Session

from app.core.database import get_db

from app.schemas.school_registration import (
    RegistrationCreate,
    RegistrationResponse
)

from app.services.registration_service import (
    RegistrationService
)

from app.core.permissions import (
    super_admin_only
)

router = APIRouter(
    prefix="/registration",
    tags=["Registration"]
)

@router.post(
    "",
    response_model=RegistrationResponse
)
def register_school(
    payload: RegistrationCreate,
    db: Session = Depends(get_db)
):

    try:

        return (
            RegistrationService
            .create_request(
                db,
                payload
            )
        )

    except ValueError as e:

        raise HTTPException(
            status_code=400,
            detail=str(e)
        )
    

@router.get(
    "",
    response_model=list[
        RegistrationResponse
    ]
)
def list_requests(
    db: Session = Depends(get_db),
    _=Depends(super_admin_only)
):

    return (
        RegistrationService
        .get_all_requests(
            db
        )
    )


@router.post(
    "/{request_id}/approve",
    response_model=RegistrationResponse
)
def approve_request(
    request_id: UUID,

    db: Session = Depends(
        get_db
    ),

    _=Depends(
        super_admin_only
    )
):

    try:

        return (
            RegistrationService
            .approve_request(
                db,
                request_id
            )
        )

    except ValueError as e:

        raise HTTPException(
            status_code=400,
            detail=str(e)
        )
    


@router.post(
    "/{request_id}/reject",
    response_model=RegistrationResponse
)
def reject_request(
    request_id: UUID,

    db: Session = Depends(
        get_db
    ),

    _=Depends(
        super_admin_only
    )
):

    try:

        return (
            RegistrationService
            .reject_request(
                db,
                request_id
            )
        )

    except ValueError as e:

        raise HTTPException(
            status_code=400,
            detail=str(e)
        )