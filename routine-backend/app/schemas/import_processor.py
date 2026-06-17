from uuid import UUID

from pydantic import BaseModel


class ImportRequest(BaseModel):
    school_id: UUID
    entity_type: str
    rows: list[dict]