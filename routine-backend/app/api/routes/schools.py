from uuid import UUID

from fastapi import APIRouter
from fastapi import Depends
from fastapi import HTTPException

from sqlalchemy.orm import Session

from app.core.database import get_db

from app.core.permissions import (
    super_admin_only
)

from app.schemas.school import (
    SchoolCreate,
    SchoolUpdate,
    SchoolResponse
)

from app.services.school_service import (
    SchoolService
)

router = APIRouter(
    prefix="/schools",
    tags=["Schools"]
)


@router.post(
    "",
    response_model=SchoolResponse
)
def create_school(
    payload: SchoolCreate,

    db: Session = Depends(
        get_db
    ),

    _=Depends(
        super_admin_only
    )
):

    try:

        return (
            SchoolService
            .create_school(
                db,
                payload.name
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
        SchoolResponse
    ]
)
def list_schools(
    db: Session = Depends(
        get_db
    ),

    _=Depends(
        super_admin_only
    )
):

    return (
        SchoolService
        .get_all(db)
    )



@router.get(
    "/{school_id}",
    response_model=
    SchoolResponse
)
def get_school(
    school_id: UUID,

    db: Session = Depends(
        get_db
    ),

    _=Depends(
        super_admin_only
    )
):

    school = (
        SchoolService
        .get_by_id(
            db,
            school_id
        )
    )

    if not school:

        raise HTTPException(
            status_code=404,
            detail="School not found"
        )

    return school




@router.put(
    "/{school_id}",
    response_model=
    SchoolResponse
)
def update_school(
    school_id: UUID,

    payload:
    SchoolUpdate,

    db: Session = Depends(
        get_db
    ),

    _=Depends(
        super_admin_only
    )
):

    school = (
        SchoolService
        .get_by_id(
            db,
            school_id
        )
    )

    if not school:

        raise HTTPException(
            status_code=404,
            detail="School not found"
        )

    return (
        SchoolService
        .update_school(
            db,
            school,
            payload
        )
    )