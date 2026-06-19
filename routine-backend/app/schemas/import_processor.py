from pydantic import BaseModel


class ImportRequest(BaseModel):
    entity_type: str
    rows: list[dict]