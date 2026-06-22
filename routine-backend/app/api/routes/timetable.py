from fastapi import APIRouter
from fastapi import Depends
from fastapi import HTTPException

from sqlalchemy.orm import Session

from app.core.database import SessionLocal

from app.core.permissions import school_admin_only
from app.core.dependencies import get_current_school_id

from app.models.timetable import Timetable

from app.schemas.timetable import (
    GenerateTimetableRequest,
    TimetableEntryCreate,
    TimetableEntryUpdate,
    TimetableRenameRequest
)

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


@router.get("/")
def list_timetables(
    db: Session = Depends(get_db),
    school_id=Depends(get_current_school_id),
    _=Depends(school_admin_only)
):
    timetables = db.query(Timetable).filter(Timetable.school_id == school_id).all()
    return [
        {
            "id": str(t.id),
            "academic_year_id": str(t.academic_year_id),
            "name": t.name,
            "status": t.status,
        }
        for t in timetables
    ]


@router.post("/")
def create_timetable(
    request: GenerateTimetableRequest,
    db: Session = Depends(get_db),
    school_id=Depends(get_current_school_id),
    _=Depends(school_admin_only)
):
    timetable = Timetable(
        school_id=school_id,
        academic_year_id=request.academic_year_id,
        name="Manual Timetable",
        status="DRAFT"
    )
    db.add(timetable)
    db.commit()
    db.refresh(timetable)
    return {
        "id": str(timetable.id),
        "academic_year_id": str(timetable.academic_year_id),
        "name": timetable.name,
        "status": timetable.status,
    }


@router.post("/generate")
def generate_timetable(
    request: GenerateTimetableRequest,
    db: Session = Depends(get_db),
    school_id=Depends(get_current_school_id),
    _=Depends(school_admin_only)
):

    generator = TimetableGenerator(
        db,
        school_id
    )

    try:
        result = generator.generate(
            request.academic_year_id
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    return result


@router.patch("/{timetable_id}")
def rename_timetable(
    timetable_id: UUID,
    data: TimetableRenameRequest,
    db: Session = Depends(get_db),
    school_id=Depends(get_current_school_id),
    _=Depends(school_admin_only)
):
    try:
        timetable = TimetableService.rename_timetable(
            db, school_id, timetable_id, data.name
        )
    except ValueError as e:
        status_code = 404 if "not found" in str(e) else 400
        raise HTTPException(status_code=status_code, detail=str(e))

    return {
        "id": str(timetable.id),
        "academic_year_id": str(timetable.academic_year_id),
        "name": timetable.name,
        "status": timetable.status,
    }


@router.delete("/{timetable_id}")
def delete_timetable(
    timetable_id: UUID,
    db: Session = Depends(get_db),
    school_id=Depends(get_current_school_id),
    _=Depends(school_admin_only)
):
    try:
        TimetableService.delete_timetable(db, school_id, timetable_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    return {"deleted": True}


@router.get("/{timetable_id}")
def get_timetable(
    timetable_id: UUID,
    db: Session = Depends(get_db),
    school_id=Depends(get_current_school_id),
    _=Depends(school_admin_only)
):

    entries = (
        TimetableService.get_timetable(
            db,
            timetable_id,
            school_id
        )
    )

    return [_entry_to_dict(entry) for entry in entries]


def _entry_to_dict(entry):
    return {
        "id": str(entry.id),
        "timetable_id": str(entry.timetable_id),
        "working_day_id": str(entry.working_day_id),
        "period_id": str(entry.period_id),
        "classroom_id": str(entry.classroom_id),
        "section_id": str(entry.section_id),
        "teacher_id": str(entry.teacher_id),
        "subject_id": str(entry.subject_id),
    }


@router.post("/{timetable_id}/entries")
def create_entry(
    timetable_id: UUID,
    data: TimetableEntryCreate,
    db: Session = Depends(get_db),
    school_id=Depends(get_current_school_id),
    _=Depends(school_admin_only)
):

    timetable = (
        db.query(Timetable)
        .filter(Timetable.id == timetable_id, Timetable.school_id == school_id)
        .first()
    )
    if not timetable:
        raise HTTPException(status_code=404, detail="Timetable not found.")

    try:
        entry = TimetableService.create_entry(db, school_id, timetable_id, data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return _entry_to_dict(entry)


@router.put("/entries/{entry_id}")
def update_entry(
    entry_id: UUID,
    data: TimetableEntryUpdate,
    db: Session = Depends(get_db),
    school_id=Depends(get_current_school_id),
    _=Depends(school_admin_only)
):

    try:
        entry = TimetableService.update_entry(db, school_id, entry_id, data)
    except ValueError as e:
        status_code = 404 if "not found" in str(e) else 400
        raise HTTPException(status_code=status_code, detail=str(e))

    return _entry_to_dict(entry)


@router.delete("/entries/{entry_id}")
def delete_entry(
    entry_id: UUID,
    db: Session = Depends(get_db),
    school_id=Depends(get_current_school_id),
    _=Depends(school_admin_only)
):

    try:
        TimetableService.delete_entry(db, school_id, entry_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    return {"deleted": True}