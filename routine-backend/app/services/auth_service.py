from sqlalchemy.orm import Session

from app.models.user import User

from app.core.security import (
    verify_password,
    create_access_token
)


class AuthService:

    @staticmethod
    def login(
        db: Session,
        email: str,
        password: str
    ):

        user = (
            db.query(User)
            .filter(
                User.email == email
            )
            .first()
        )

        if not user:
            return None

        if not verify_password(
            password,
            user.password
        ):
            return None

        if not user.is_active:
            return None

        token = (
            create_access_token(
                {
                    "sub": str(user.id),
                    "role": user.role.value
                }
            )
        )

        return token