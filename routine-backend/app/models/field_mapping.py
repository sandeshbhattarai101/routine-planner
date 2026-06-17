import uuid

from sqlalchemy import String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class FieldMapping(Base):
    __tablename__ = "field_mappings"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )

    school_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True)
    )

    entity_type: Mapped[str] = mapped_column(
        String(50)
    )

    excel_column: Mapped[str] = mapped_column(
        String(255)
    )

    system_field: Mapped[str] = mapped_column(
        String(255)
    )