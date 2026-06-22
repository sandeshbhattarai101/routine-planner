from uuid import UUID

from sqlalchemy.orm import Session

from app.models.teacher import Teacher


class TeacherService:

    @staticmethod
    def create_teacher(
        db: Session,
        school_id: UUID,
        name: str,
        teacher_code: str | None,
        max_periods_per_day: int
    ):

        teacher = Teacher(
            school_id=school_id,
            name=name,
            teacher_code=teacher_code,
            max_periods_per_day=max_periods_per_day
        )

        db.add(teacher)

        db.commit()

        db.refresh(teacher)

        return teacher

    @staticmethod
    def list_teachers(
        db: Session,
        school_id: UUID
    ):

        return (
            db.query(Teacher)
            .filter(
                Teacher.school_id
                == school_id
            )
            .order_by(
                Teacher.name
            )
            .all()
        )

    @staticmethod
    def update_teacher(
        db: Session,
        teacher_id: UUID,
        school_id: UUID,
        name: str | None,
        max_periods_per_day: int | None,
        teacher_code: str | None = None
    ):

        teacher = (
            db.query(Teacher)
            .filter(
                Teacher.id == teacher_id,
                Teacher.school_id == school_id
            )
            .first()
        )

        if not teacher:
            raise ValueError(
                "Teacher not found"
            )

        if name is not None:
            teacher.name = name

        if max_periods_per_day is not None:
            teacher.max_periods_per_day = max_periods_per_day

        if teacher_code is not None:
            teacher.teacher_code = teacher_code

        db.commit()

        db.refresh(teacher)

        return teacher

    @staticmethod
    def activate_teacher(
        db: Session,
        teacher_id: UUID,
        school_id: UUID
    ):

        teacher = (
            db.query(Teacher)
            .filter(
                Teacher.id == teacher_id,
                Teacher.school_id == school_id
            )
            .first()
        )

        if not teacher:
            raise ValueError(
                "Teacher not found"
            )

        teacher.is_active = True

        db.commit()

        db.refresh(teacher)

        return teacher

    @staticmethod
    def deactivate_teacher(
        db: Session,
        teacher_id: UUID,
        school_id: UUID
    ):

        teacher = (
            db.query(Teacher)
            .filter(
                Teacher.id == teacher_id,
                Teacher.school_id == school_id
            )
            .first()
        )

        if not teacher:
            raise ValueError(
                "Teacher not found"
            )

        teacher.is_active = False

        db.commit()

        db.refresh(teacher)

        return teacher