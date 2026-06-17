from sqlalchemy.orm import Session

from app.models.school import School


class SchoolService:

    @staticmethod
    def create_school(
        db: Session,
        name: str
    ):

        existing = (
            db.query(School)
            .filter(
                School.name == name
            )
            .first()
        )

        if existing:
            raise ValueError(
                "School already exists"
            )

        school = School(
            name=name
        )

        db.add(school)

        db.commit()

        db.refresh(school)

        return school

    @staticmethod
    def get_all(
        db: Session
    ):

        return (
            db.query(School)
            .order_by(
                School.name
            )
            .all()
        )

    @staticmethod
    def get_by_id(
        db: Session,
        school_id
    ):

        return (
            db.query(School)
            .filter(
                School.id == school_id
            )
            .first()
        )

    @staticmethod
    def update_school(
        db: Session,
        school: School,
        data
    ):

        if data.name is not None:
            school.name = data.name

        if data.is_active is not None:
            school.is_active = data.is_active

        db.commit()

        db.refresh(school)

        return school