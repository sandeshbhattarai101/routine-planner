from fastapi import APIRouter
from fastapi import Depends

from sqlalchemy.orm import Session

from app.core.database import SessionLocal

from app.timetable.services.timetable_generator import (
    TimetableGenerator
)
from uuid import UUID

from app.services.timetable_service import (
    TimetableService
)

router = APIRouter(
    prefix="/timetable",
    tags=["Timetable"]
)


def get_db():

    db = SessionLocal()

    try:
        yield db

    finally:
        db.close()


@router.post("/generate")
def generate_timetable(
    db: Session = Depends(get_db)
):

    generator = TimetableGenerator(
        db
    )

    entries = generator.generate()

    return {
        "generated_entries":
            len(entries)
    }


@router.get("/{timetable_id}")
def get_timetable(
    timetable_id: UUID,
    db: Session = Depends(get_db)
):

    entries = (
        TimetableService.get_timetable(
            db,
            timetable_id
        )
    )

    return entries