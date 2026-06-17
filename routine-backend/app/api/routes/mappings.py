from fastapi import APIRouter
from fastapi import Depends
from sqlalchemy.orm import Session

from app.core.database import SessionLocal

from app.schemas.field_mapping import MappingCreate
from app.services.mapping_service import MappingService

router = APIRouter(
    prefix="/mappings",
    tags=["Mappings"]
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/")
def create_mapping(
    data: MappingCreate,
    db: Session = Depends(get_db)
):

    return MappingService.create_mapping(
        db=db,
        school_id=data.school_id,
        entity_type=data.entity_type,
        excel_column=data.excel_column,
        system_field=data.system_field
    )