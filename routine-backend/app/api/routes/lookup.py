from datetime import time

from fastapi import APIRouter
from fastapi import Depends
from pydantic import BaseModel

from sqlalchemy.orm import Session

from app.core.database import SessionLocal

from app.core.permissions import school_admin_only
from app.core.dependencies import get_current_school_id

from app.models.classroom import Classroom
from app.models.section import Section
from app.models.subject import Subject
from app.models.working_day import WorkingDay
from app.models.period import Period
from app.models.academic_year import AcademicYear

from app.services.teacher_service import TeacherService

router = APIRouter(
    tags=["Lookup"]
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class AcademicYearCreate(BaseModel):
    name: str


class WorkingDayCreate(BaseModel):
    name: str


class PeriodCreate(BaseModel):
    name: str
    start_time: time
    end_time: time
    is_break: bool = False


@router.get("/teachers")
def list_teachers(
    db: Session = Depends(get_db),
    school_id=Depends(get_current_school_id),
    _=Depends(school_admin_only)
):
    teachers = TeacherService.list_teachers(db, school_id)
    return [{"id": str(t.id), "name": t.name, "max_periods_per_day": t.max_periods_per_day} for t in teachers]


@router.get("/classrooms")
def list_classrooms(
    db: Session = Depends(get_db),
    school_id=Depends(get_current_school_id),
    _=Depends(school_admin_only)
):
    classrooms = db.query(Classroom).filter(Classroom.school_id == school_id).all()
    return [{"id": str(c.id), "name": c.name} for c in classrooms]


@router.get("/sections")
def list_sections(
    db: Session = Depends(get_db),
    school_id=Depends(get_current_school_id),
    _=Depends(school_admin_only)
):
    sections = db.query(Section).filter(Section.school_id == school_id).all()
    return [{"id": str(s.id), "name": s.name, "classroom_id": str(s.classroom_id)} for s in sections]


@router.get("/subjects")
def list_subjects(
    db: Session = Depends(get_db),
    school_id=Depends(get_current_school_id),
    _=Depends(school_admin_only)
):
    subjects = db.query(Subject).filter(Subject.school_id == school_id).all()
    return [{"id": str(s.id), "name": s.name} for s in subjects]


@router.get("/working-days")
def list_working_days(
    db: Session = Depends(get_db),
    school_id=Depends(get_current_school_id),
    _=Depends(school_admin_only)
):
    days = db.query(WorkingDay).filter(WorkingDay.school_id == school_id).all()
    return [{"id": str(d.id), "name": d.name, "is_active": d.is_active} for d in days]


@router.get("/periods")
def list_periods(
    db: Session = Depends(get_db),
    school_id=Depends(get_current_school_id),
    _=Depends(school_admin_only)
):
    periods = db.query(Period).filter(Period.school_id == school_id).all()
    return [
        {
            "id": str(p.id),
            "name": p.name,
            "start_time": p.start_time.isoformat(),
            "end_time": p.end_time.isoformat(),
            "is_break": p.is_break,
        }
        for p in periods
    ]


@router.get("/academic-years")
def list_academic_years(
    db: Session = Depends(get_db),
    school_id=Depends(get_current_school_id),
    _=Depends(school_admin_only)
):
    years = db.query(AcademicYear).filter(AcademicYear.school_id == school_id).all()
    return [{"id": str(y.id), "name": y.name, "is_active": y.is_active} for y in years]


@router.post("/academic-years")
def create_academic_year(
    data: AcademicYearCreate,
    db: Session = Depends(get_db),
    school_id=Depends(get_current_school_id),
    _=Depends(school_admin_only)
):
    year = AcademicYear(school_id=school_id, name=data.name)
    db.add(year)
    db.commit()
    db.refresh(year)
    return {"id": str(year.id), "name": year.name, "is_active": year.is_active}


@router.post("/working-days")
def create_working_day(
    data: WorkingDayCreate,
    db: Session = Depends(get_db),
    school_id=Depends(get_current_school_id),
    _=Depends(school_admin_only)
):
    day = WorkingDay(school_id=school_id, name=data.name)
    db.add(day)
    db.commit()
    db.refresh(day)
    return {"id": str(day.id), "name": day.name, "is_active": day.is_active}


@router.post("/periods")
def create_period(
    data: PeriodCreate,
    db: Session = Depends(get_db),
    school_id=Depends(get_current_school_id),
    _=Depends(school_admin_only)
):
    period = Period(
        school_id=school_id,
        name=data.name,
        start_time=data.start_time,
        end_time=data.end_time,
        is_break=data.is_break
    )
    db.add(period)
    db.commit()
    db.refresh(period)
    return {
        "id": str(period.id),
        "name": period.name,
        "start_time": period.start_time.isoformat(),
        "end_time": period.end_time.isoformat(),
        "is_break": period.is_break,
    }
