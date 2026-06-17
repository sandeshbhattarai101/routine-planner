from sqlalchemy.orm import Session

from app.models.user import (
    User,
    UserRole
)

from app.core.security import (
    hash_password
)


class UserService:

    @staticmethod
    def create_school_admin(
        db: Session,
        email: str,
        password: str,
        school_id
    ):

        existing = (
            db.query(User)
            .filter(
                User.email == email
            )
            .first()
        )

        if existing:
            raise ValueError(
                "Email already exists"
            )

        user = User(
            email=email,
            password=hash_password(
                password
            ),
            role=UserRole.SCHOOL_ADMIN,
            school_id=school_id,
            is_active=True
        )

        db.add(user)

        db.commit()

        db.refresh(user)

        return user
    

    @staticmethod
    def list_school_admins(
        db: Session
    ):

        return (
            db.query(User)
            .filter(
                User.role ==
                UserRole.SCHOOL_ADMIN
            )
            .all()
        )
    
    @staticmethod
    def activate_user(
        db: Session,
        user_id
    ):

        user = (
            db.query(User)
            .filter(
                User.id == user_id
            )
            .first()
        )

        if not user:
            raise ValueError(
                "User not found"
            )

        user.is_active = True

        db.commit()

        db.refresh(user)

        return user


    @staticmethod
    def deactivate_user(
        db: Session,
        user_id
    ):

        user = (
            db.query(User)
            .filter(
                User.id == user_id
            )
            .first()
        )

        if not user:
            raise ValueError(
                "User not found"
            )

        user.is_active = False

        db.commit()

        db.refresh(user)

        return user