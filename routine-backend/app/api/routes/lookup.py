from uuid import UUID
from datetime import time

from fastapi import APIRouter
from fastapi import Depends
from fastapi import HTTPException
from pydantic import BaseModel

from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.core.database import SessionLocal

from app.core.permissions import school_admin_only
from app.core.dependencies import get_current_school_id

from app.models.classroom import Classroom
from app.models.section import Section
from app.models.subject import Subject
from app.models.working_day import WorkingDay
from app.models.period import Period
from app.models.academic_year import AcademicYear
from app.models.teacher import Teacher
from app.models.class_subject import ClassSubject
from app.models.teacher_subject import TeacherSubject
from app.models.teacher_availability import TeacherAvailability
from app.models.class_availability import ClassAvailability

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


class PeriodUpdate(BaseModel):
    name: str | None = None
    start_time: time | None = None
    end_time: time | None = None
    is_break: bool | None = None


class ClassroomCreate(BaseModel):
    name: str
    start_time: time | None = None
    end_time: time | None = None


class ClassroomUpdate(BaseModel):
    name: str | None = None
    start_time: time | None = None
    end_time: time | None = None
    clear_time_range: bool = False


class SectionCreate(BaseModel):
    name: str
    classroom_id: UUID


class SubjectCreate(BaseModel):
    name: str


class TeacherCreate(BaseModel):
    name: str
    teacher_code: str | None = None
    max_periods_per_day: int = 5


class TeacherUpdate(BaseModel):
    name: str | None = None
    teacher_code: str | None = None
    max_periods_per_day: int | None = None


class ClassSubjectCreate(BaseModel):
    classroom_id: UUID
    section_id: UUID
    subject_id: UUID
    periods_per_week: int
    teacher_id: UUID | None = None
    # Days per week this subject is taught. Leave unset for subjects
    # taught throughout the week.
    days_per_week: int | None = None


class TeacherSubjectCreate(BaseModel):
    teacher_id: UUID
    subject_id: UUID


class TeacherAvailabilityCreate(BaseModel):
    teacher_id: UUID
    working_day_id: UUID
    period_id: UUID
    available: bool = False


class ClassAvailabilityCreate(BaseModel):
    classroom_id: UUID
    section_id: UUID
    working_day_id: UUID
    period_id: UUID
    available: bool = False


def _delete_or_conflict(db: Session, row):
    db.delete(row)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Cannot delete: still referenced by other records (curriculum, timetable entries, etc). Remove those first."
        )


def _teacher_to_dict(t):
    return {
        "id": str(t.id),
        "name": t.name,
        "teacher_code": t.teacher_code,
        "max_periods_per_day": t.max_periods_per_day,
        "is_active": t.is_active,
    }


@router.get("/teachers")
def list_teachers(
    db: Session = Depends(get_db),
    school_id=Depends(get_current_school_id),
    _=Depends(school_admin_only)
):
    teachers = TeacherService.list_teachers(db, school_id)
    return [_teacher_to_dict(t) for t in teachers]


@router.post("/teachers")
def create_teacher(
    data: TeacherCreate,
    db: Session = Depends(get_db),
    school_id=Depends(get_current_school_id),
    _=Depends(school_admin_only)
):
    teacher = TeacherService.create_teacher(
        db, school_id, data.name, data.teacher_code, data.max_periods_per_day
    )
    return _teacher_to_dict(teacher)


@router.patch("/teachers/{teacher_id}")
def update_teacher(
    teacher_id: UUID,
    data: TeacherUpdate,
    db: Session = Depends(get_db),
    school_id=Depends(get_current_school_id),
    _=Depends(school_admin_only)
):
    try:
        teacher = TeacherService.update_teacher(
            db,
            teacher_id,
            school_id,
            data.name,
            data.max_periods_per_day,
            data.teacher_code
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return _teacher_to_dict(teacher)


@router.patch("/teachers/{teacher_id}/activate")
def activate_teacher(
    teacher_id: UUID,
    db: Session = Depends(get_db),
    school_id=Depends(get_current_school_id),
    _=Depends(school_admin_only)
):
    try:
        teacher = TeacherService.activate_teacher(db, teacher_id, school_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return _teacher_to_dict(teacher)


@router.patch("/teachers/{teacher_id}/deactivate")
def deactivate_teacher(
    teacher_id: UUID,
    db: Session = Depends(get_db),
    school_id=Depends(get_current_school_id),
    _=Depends(school_admin_only)
):
    try:
        teacher = TeacherService.deactivate_teacher(db, teacher_id, school_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return _teacher_to_dict(teacher)


@router.delete("/teachers/{teacher_id}")
def delete_teacher(
    teacher_id: UUID,
    db: Session = Depends(get_db),
    school_id=Depends(get_current_school_id),
    _=Depends(school_admin_only)
):
    teacher = (
        db.query(Teacher)
        .filter(Teacher.id == teacher_id, Teacher.school_id == school_id)
        .first()
    )
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found.")
    _delete_or_conflict(db, teacher)
    return {"deleted": True}


def _classroom_to_dict(c):
    return {
        "id": str(c.id),
        "name": c.name,
        "start_time": c.start_time.isoformat() if c.start_time else None,
        "end_time": c.end_time.isoformat() if c.end_time else None,
    }


@router.get("/classrooms")
def list_classrooms(
    db: Session = Depends(get_db),
    school_id=Depends(get_current_school_id),
    _=Depends(school_admin_only)
):
    classrooms = db.query(Classroom).filter(Classroom.school_id == school_id).all()
    return [_classroom_to_dict(c) for c in classrooms]


@router.post("/classrooms")
def create_classroom(
    data: ClassroomCreate,
    db: Session = Depends(get_db),
    school_id=Depends(get_current_school_id),
    _=Depends(school_admin_only)
):
    if (
        data.start_time is not None
        and data.end_time is not None
        and data.end_time <= data.start_time
    ):
        raise HTTPException(
            status_code=400,
            detail="End time must be after start time.",
        )

    classroom = Classroom(
        school_id=school_id,
        name=data.name,
        start_time=data.start_time,
        end_time=data.end_time,
    )
    db.add(classroom)
    db.commit()
    db.refresh(classroom)
    return _classroom_to_dict(classroom)


@router.patch("/classrooms/{classroom_id}")
def update_classroom(
    classroom_id: UUID,
    data: ClassroomUpdate,
    db: Session = Depends(get_db),
    school_id=Depends(get_current_school_id),
    _=Depends(school_admin_only)
):
    classroom = (
        db.query(Classroom)
        .filter(Classroom.id == classroom_id, Classroom.school_id == school_id)
        .first()
    )
    if not classroom:
        raise HTTPException(status_code=404, detail="Classroom not found.")

    if data.name is not None:
        classroom.name = data.name
    if data.clear_time_range:
        classroom.start_time = None
        classroom.end_time = None
    elif data.start_time is not None or data.end_time is not None:
        new_start = data.start_time if data.start_time is not None else classroom.start_time
        new_end = data.end_time if data.end_time is not None else classroom.end_time
        if new_start is not None and new_end is not None and new_end <= new_start:
            raise HTTPException(
                status_code=400,
                detail="End time must be after start time.",
            )
        classroom.start_time = data.start_time
        classroom.end_time = data.end_time

    db.commit()
    db.refresh(classroom)
    return _classroom_to_dict(classroom)


@router.delete("/classrooms/{classroom_id}")
def delete_classroom(
    classroom_id: UUID,
    db: Session = Depends(get_db),
    school_id=Depends(get_current_school_id),
    _=Depends(school_admin_only)
):
    classroom = (
        db.query(Classroom)
        .filter(Classroom.id == classroom_id, Classroom.school_id == school_id)
        .first()
    )
    if not classroom:
        raise HTTPException(status_code=404, detail="Classroom not found.")
    _delete_or_conflict(db, classroom)
    return {"deleted": True}


@router.get("/sections")
def list_sections(
    db: Session = Depends(get_db),
    school_id=Depends(get_current_school_id),
    _=Depends(school_admin_only)
):
    sections = db.query(Section).filter(Section.school_id == school_id).all()
    return [{"id": str(s.id), "name": s.name, "classroom_id": str(s.classroom_id)} for s in sections]


@router.post("/sections")
def create_section(
    data: SectionCreate,
    db: Session = Depends(get_db),
    school_id=Depends(get_current_school_id),
    _=Depends(school_admin_only)
):
    classroom = (
        db.query(Classroom)
        .filter(Classroom.id == data.classroom_id, Classroom.school_id == school_id)
        .first()
    )
    if not classroom:
        raise HTTPException(status_code=404, detail="Classroom not found.")

    section = Section(
        school_id=school_id, classroom_id=data.classroom_id, name=data.name
    )
    db.add(section)
    db.commit()
    db.refresh(section)
    return {"id": str(section.id), "name": section.name, "classroom_id": str(section.classroom_id)}


@router.delete("/sections/{section_id}")
def delete_section(
    section_id: UUID,
    db: Session = Depends(get_db),
    school_id=Depends(get_current_school_id),
    _=Depends(school_admin_only)
):
    section = (
        db.query(Section)
        .filter(Section.id == section_id, Section.school_id == school_id)
        .first()
    )
    if not section:
        raise HTTPException(status_code=404, detail="Section not found.")
    _delete_or_conflict(db, section)
    return {"deleted": True}


@router.get("/subjects")
def list_subjects(
    db: Session = Depends(get_db),
    school_id=Depends(get_current_school_id),
    _=Depends(school_admin_only)
):
    subjects = db.query(Subject).filter(Subject.school_id == school_id).all()
    return [{"id": str(s.id), "name": s.name} for s in subjects]


@router.post("/subjects")
def create_subject(
    data: SubjectCreate,
    db: Session = Depends(get_db),
    school_id=Depends(get_current_school_id),
    _=Depends(school_admin_only)
):
    subject = Subject(school_id=school_id, name=data.name)
    db.add(subject)
    db.commit()
    db.refresh(subject)
    return {"id": str(subject.id), "name": subject.name}


@router.delete("/subjects/{subject_id}")
def delete_subject(
    subject_id: UUID,
    db: Session = Depends(get_db),
    school_id=Depends(get_current_school_id),
    _=Depends(school_admin_only)
):
    subject = (
        db.query(Subject)
        .filter(Subject.id == subject_id, Subject.school_id == school_id)
        .first()
    )
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found.")
    _delete_or_conflict(db, subject)
    return {"deleted": True}


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
    return [_period_to_dict(p) for p in periods]


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
    return _period_to_dict(period)


def _period_to_dict(p):
    return {
        "id": str(p.id),
        "name": p.name,
        "start_time": p.start_time.isoformat(),
        "end_time": p.end_time.isoformat(),
        "is_break": p.is_break,
    }


@router.patch("/periods/{period_id}")
def update_period(
    period_id: UUID,
    data: PeriodUpdate,
    db: Session = Depends(get_db),
    school_id=Depends(get_current_school_id),
    _=Depends(school_admin_only)
):
    period = (
        db.query(Period)
        .filter(Period.id == period_id, Period.school_id == school_id)
        .first()
    )
    if not period:
        raise HTTPException(status_code=404, detail="Period not found.")

    if data.name is not None:
        period.name = data.name
    if data.start_time is not None:
        period.start_time = data.start_time
    if data.end_time is not None:
        period.end_time = data.end_time
    if data.is_break is not None:
        period.is_break = data.is_break

    db.commit()
    db.refresh(period)
    return _period_to_dict(period)


@router.delete("/periods/{period_id}")
def delete_period(
    period_id: UUID,
    db: Session = Depends(get_db),
    school_id=Depends(get_current_school_id),
    _=Depends(school_admin_only)
):
    period = (
        db.query(Period)
        .filter(Period.id == period_id, Period.school_id == school_id)
        .first()
    )
    if not period:
        raise HTTPException(status_code=404, detail="Period not found.")
    _delete_or_conflict(db, period)
    return {"deleted": True}


@router.delete("/working-days/{working_day_id}")
def delete_working_day(
    working_day_id: UUID,
    db: Session = Depends(get_db),
    school_id=Depends(get_current_school_id),
    _=Depends(school_admin_only)
):
    day = (
        db.query(WorkingDay)
        .filter(WorkingDay.id == working_day_id, WorkingDay.school_id == school_id)
        .first()
    )
    if not day:
        raise HTTPException(status_code=404, detail="Working day not found.")
    _delete_or_conflict(db, day)
    return {"deleted": True}


@router.get("/class-subjects")
def list_class_subjects(
    db: Session = Depends(get_db),
    school_id=Depends(get_current_school_id),
    _=Depends(school_admin_only)
):
    rows = db.query(ClassSubject).filter(ClassSubject.school_id == school_id).all()
    return [
        {
            "id": str(r.id),
            "classroom_id": str(r.classroom_id),
            "section_id": str(r.section_id),
            "subject_id": str(r.subject_id),
            "teacher_id": str(r.teacher_id) if r.teacher_id else None,
            "periods_per_week": r.periods_per_week,
            "days_per_week": r.days_per_week,
        }
        for r in rows
    ]


@router.post("/class-subjects")
def create_class_subject(
    data: ClassSubjectCreate,
    db: Session = Depends(get_db),
    school_id=Depends(get_current_school_id),
    _=Depends(school_admin_only)
):
    if data.teacher_id:
        teacher = (
            db.query(Teacher)
            .filter(Teacher.id == data.teacher_id, Teacher.school_id == school_id)
            .first()
        )
        if not teacher:
            raise HTTPException(status_code=404, detail="Teacher not found.")

    if data.days_per_week is not None and (
        data.days_per_week < 1 or data.days_per_week > data.periods_per_week
    ):
        raise HTTPException(
            status_code=400,
            detail="Days per week must be between 1 and periods per week.",
        )

    row = ClassSubject(
        school_id=school_id,
        classroom_id=data.classroom_id,
        section_id=data.section_id,
        subject_id=data.subject_id,
        teacher_id=data.teacher_id,
        periods_per_week=data.periods_per_week,
        days_per_week=data.days_per_week,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return {
        "id": str(row.id),
        "classroom_id": str(row.classroom_id),
        "section_id": str(row.section_id),
        "subject_id": str(row.subject_id),
        "teacher_id": str(row.teacher_id) if row.teacher_id else None,
        "periods_per_week": row.periods_per_week,
        "days_per_week": row.days_per_week,
    }


@router.delete("/class-subjects/{class_subject_id}")
def delete_class_subject(
    class_subject_id: UUID,
    db: Session = Depends(get_db),
    school_id=Depends(get_current_school_id),
    _=Depends(school_admin_only)
):
    row = (
        db.query(ClassSubject)
        .filter(ClassSubject.id == class_subject_id, ClassSubject.school_id == school_id)
        .first()
    )
    if not row:
        raise HTTPException(status_code=404, detail="Curriculum requirement not found.")
    db.delete(row)
    db.commit()
    return {"deleted": True}


@router.get("/teacher-subjects")
def list_teacher_subjects(
    db: Session = Depends(get_db),
    school_id=Depends(get_current_school_id),
    _=Depends(school_admin_only)
):
    rows = db.query(TeacherSubject).filter(TeacherSubject.school_id == school_id).all()
    return [
        {"id": str(r.id), "teacher_id": str(r.teacher_id), "subject_id": str(r.subject_id)}
        for r in rows
    ]


@router.post("/teacher-subjects")
def create_teacher_subject(
    data: TeacherSubjectCreate,
    db: Session = Depends(get_db),
    school_id=Depends(get_current_school_id),
    _=Depends(school_admin_only)
):
    row = TeacherSubject(
        school_id=school_id, teacher_id=data.teacher_id, subject_id=data.subject_id
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return {"id": str(row.id), "teacher_id": str(row.teacher_id), "subject_id": str(row.subject_id)}


@router.delete("/teacher-subjects/{teacher_subject_id}")
def delete_teacher_subject(
    teacher_subject_id: UUID,
    db: Session = Depends(get_db),
    school_id=Depends(get_current_school_id),
    _=Depends(school_admin_only)
):
    row = (
        db.query(TeacherSubject)
        .filter(TeacherSubject.id == teacher_subject_id, TeacherSubject.school_id == school_id)
        .first()
    )
    if not row:
        raise HTTPException(status_code=404, detail="Teacher subject assignment not found.")
    db.delete(row)
    db.commit()
    return {"deleted": True}


@router.get("/teacher-availability")
def list_teacher_availability(
    db: Session = Depends(get_db),
    school_id=Depends(get_current_school_id),
    _=Depends(school_admin_only)
):
    rows = (
        db.query(TeacherAvailability)
        .filter(TeacherAvailability.school_id == school_id)
        .all()
    )
    return [
        {
            "id": str(r.id),
            "teacher_id": str(r.teacher_id),
            "working_day_id": str(r.working_day_id),
            "period_id": str(r.period_id),
            "available": r.available,
        }
        for r in rows
    ]


@router.post("/teacher-availability")
def create_teacher_availability(
    data: TeacherAvailabilityCreate,
    db: Session = Depends(get_db),
    school_id=Depends(get_current_school_id),
    _=Depends(school_admin_only)
):
    row = TeacherAvailability(
        school_id=school_id,
        teacher_id=data.teacher_id,
        working_day_id=data.working_day_id,
        period_id=data.period_id,
        available=data.available,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return {
        "id": str(row.id),
        "teacher_id": str(row.teacher_id),
        "working_day_id": str(row.working_day_id),
        "period_id": str(row.period_id),
        "available": row.available,
    }


@router.delete("/teacher-availability/{availability_id}")
def delete_teacher_availability(
    availability_id: UUID,
    db: Session = Depends(get_db),
    school_id=Depends(get_current_school_id),
    _=Depends(school_admin_only)
):
    row = (
        db.query(TeacherAvailability)
        .filter(TeacherAvailability.id == availability_id, TeacherAvailability.school_id == school_id)
        .first()
    )
    if not row:
        raise HTTPException(status_code=404, detail="Teacher availability record not found.")
    db.delete(row)
    db.commit()
    return {"deleted": True}


@router.get("/class-availability")
def list_class_availability(
    db: Session = Depends(get_db),
    school_id=Depends(get_current_school_id),
    _=Depends(school_admin_only)
):
    rows = (
        db.query(ClassAvailability)
        .filter(ClassAvailability.school_id == school_id)
        .all()
    )
    return [
        {
            "id": str(r.id),
            "classroom_id": str(r.classroom_id),
            "section_id": str(r.section_id),
            "working_day_id": str(r.working_day_id),
            "period_id": str(r.period_id),
            "available": r.available,
        }
        for r in rows
    ]


@router.post("/class-availability")
def create_class_availability(
    data: ClassAvailabilityCreate,
    db: Session = Depends(get_db),
    school_id=Depends(get_current_school_id),
    _=Depends(school_admin_only)
):
    row = ClassAvailability(
        school_id=school_id,
        classroom_id=data.classroom_id,
        section_id=data.section_id,
        working_day_id=data.working_day_id,
        period_id=data.period_id,
        available=data.available,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return {
        "id": str(row.id),
        "classroom_id": str(row.classroom_id),
        "section_id": str(row.section_id),
        "working_day_id": str(row.working_day_id),
        "period_id": str(row.period_id),
        "available": row.available,
    }


@router.delete("/class-availability/{availability_id}")
def delete_class_availability(
    availability_id: UUID,
    db: Session = Depends(get_db),
    school_id=Depends(get_current_school_id),
    _=Depends(school_admin_only)
):
    row = (
        db.query(ClassAvailability)
        .filter(ClassAvailability.id == availability_id, ClassAvailability.school_id == school_id)
        .first()
    )
    if not row:
        raise HTTPException(status_code=404, detail="Class availability record not found.")
    db.delete(row)
    db.commit()
    return {"deleted": True}
