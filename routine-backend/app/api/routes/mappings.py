from fastapi import APIRouter
from fastapi import Depends
from sqlalchemy.orm import Session

from app.core.database import SessionLocal

from app.core.permissions import school_admin_only
from app.core.dependencies import get_current_school_id

from app.schemas.field_mapping import MappingCreate, MappingResponse
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
    db: Session = Depends(get_db),
    school_id=Depends(get_current_school_id),
    _=Depends(school_admin_only)
):

    return MappingService.create_mapping(
        db=db,
        school_id=school_id,
        entity_type=data.entity_type,
        excel_column=data.excel_column,
        system_field=data.system_field
    )


@router.get("/{entity_type}", response_model=list[MappingResponse])
def get_mappings(
    entity_type: str,
    db: Session = Depends(get_db),
    school_id=Depends(get_current_school_id),
    _=Depends(school_admin_only)
):

    return MappingService.get_mappings(
        db=db,
        school_id=school_id,
        entity_type=entity_type
    )