from fastapi import APIRouter
from fastapi import Depends

from sqlalchemy.orm import Session

from app.core.database import SessionLocal

from app.core.permissions import school_admin_only
from app.core.dependencies import get_current_school_id

from app.schemas.import_processor import (
    ImportRequest
)

from app.services.import_processor import (
    ImportProcessor
)

router = APIRouter(
    prefix="/imports",
    tags=["Imports"]
)


def get_db():

    db = SessionLocal()

    try:
        yield db

    finally:
        db.close()


@router.post("/process")
def process_import(
    request: ImportRequest,
    db: Session = Depends(get_db),
    school_id=Depends(get_current_school_id),
    _=Depends(school_admin_only)
):

    imported_count = (
        ImportProcessor.process(
            db=db,
            school_id=school_id,
            entity_type=request.entity_type,
            rows=request.rows
        )
    )

    return {
        "imported": imported_count
    }