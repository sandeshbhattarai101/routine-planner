from sqlalchemy.orm import Session

from app.models.school_registration import (
    SchoolRegistrationRequest,
    RequestStatus
)

from app.core.security import (
    hash_password
)

from app.models.school import School

from app.models.user import (
    User,
    UserRole
)

from app.core.security import (
    hash_password
)


class RegistrationService:

    @staticmethod
    def create_request(
        db: Session,
        data
    ):
        existing = (
            db.query(
                SchoolRegistrationRequest
            )
            .filter(
                SchoolRegistrationRequest.email
                == data.email
            )
            .first()
        )

        if existing:
            raise ValueError(
                "Email already registered"
            )

        request = (
            SchoolRegistrationRequest(
                school_name=data.school_name,
                admin_name=data.admin_name,
                email=data.email,
                password_hash=hash_password(
                    data.password
                ),
                phone=data.phone,
                address=data.address
            )
        )

        db.add(request)

        db.commit()

        db.refresh(request)

        return request
    

    @staticmethod
    def get_all_requests(
        db: Session
    ):

        return (
            db.query(
                SchoolRegistrationRequest
            )
            .order_by(
                SchoolRegistrationRequest.created_at.desc()
            )
            .all()
        )
    

    @staticmethod
    def approve_request(
        db: Session,
        request_id
    ):

        request = (
            db.query(
                SchoolRegistrationRequest
            )
            .filter(
                SchoolRegistrationRequest.id
                == request_id
            )
            .first()
        )

        if not request:
            raise ValueError(
                "Request not found"
            )

        if (
            request.status
            != RequestStatus.PENDING
        ):
            raise ValueError(
                "Already processed"
            )
        
# --- Added Duplicate Check ---
        existing_school = (
            db.query(School)
            .filter(
                School.name
                == request.school_name
            )
            .first()
        )

        if existing_school:
            raise ValueError(
                "School already exists"
            )
        # -----------------------------

        school = School(
            name=request.school_name
        )

        db.add(school)

        db.flush()

        user = User(
            email=request.email,

            password=request.password_hash,

            role=UserRole.SCHOOL_ADMIN,

            school_id=school.id,

            is_active=True
        )

        db.add(user)

        request.status = (
            RequestStatus.APPROVED
        )

        db.commit()

        return request
    
    @staticmethod
    def reject_request(
        db: Session,
        request_id
    ):

        request = (
            db.query(
                SchoolRegistrationRequest
            )
            .filter(
                SchoolRegistrationRequest.id
                == request_id
            )
            .first()
        )

        if not request:
            raise ValueError(
                "Request not found"
            )

        request.status = (
            RequestStatus.REJECTED
        )

        db.commit()

        return request