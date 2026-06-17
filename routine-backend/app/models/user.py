from sqlalchemy import Column, String, Boolean, Enum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
import uuid
import enum
from app.core.database import Base


class UserRole(str, enum.Enum):
    SUPER_ADMIN = "SUPER_ADMIN"
    SCHOOL_ADMIN = "SCHOOL_ADMIN"


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    email = Column(String, unique=True, nullable=False)
    password = Column(String, nullable=False)

    role = Column(Enum(UserRole), nullable=False)

    school_id = Column(UUID(as_uuid=True), ForeignKey("schools.id"), nullable=True)

    is_active = Column(Boolean, default=True)