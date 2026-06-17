from uuid import UUID

from pydantic import BaseModel


class MappingCreate(BaseModel):
    school_id: UUID
    entity_type: str
    excel_column: str
    system_field: str


class MappingResponse(BaseModel):
    id: UUID
    school_id: UUID
    entity_type: str
    excel_column: str
    system_field: str

    class Config:
        from_attributes = True