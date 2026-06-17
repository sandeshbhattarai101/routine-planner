from sqlalchemy import Column
from sqlalchemy import String
from sqlalchemy import Boolean

from sqlalchemy.dialects.postgresql import UUID

import uuid

from app.core.database import Base


class School(Base):
    __tablename__ = "schools"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )

    name = Column(
        String,
        nullable=False,
        unique=True
    )

    is_active = Column(
        Boolean,
        default=True
    )