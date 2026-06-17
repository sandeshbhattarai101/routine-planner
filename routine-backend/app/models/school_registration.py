from sqlalchemy import (
    Column,
    String,
    Enum,
    DateTime
)

from sqlalchemy.dialects.postgresql import UUID

from datetime import datetime

import uuid
import enum

from app.core.database import Base


class RequestStatus(
    str,
    enum.Enum
):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class SchoolRegistrationRequest(
    Base
):
    __tablename__ = (
        "school_registration_requests"
    )

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )

    school_name = Column(
        String,
        nullable=False
    )

    admin_name = Column(
        String,
        nullable=False
    )

    email = Column(
        String,
        nullable=False,
        unique=True
    )

    password_hash = Column(
        String,
        nullable=False
    )

    phone = Column(
        String,
        nullable=True
    )

    address = Column(
        String,
        nullable=True
    )

    status = Column(
        Enum(RequestStatus),
        nullable=False,
        default=RequestStatus.PENDING
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )