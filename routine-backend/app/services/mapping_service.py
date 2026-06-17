from sqlalchemy.orm import Session

from app.models.field_mapping import FieldMapping


class MappingService:

    @staticmethod
    def create_mapping(
        db: Session,
        school_id,
        entity_type,
        excel_column,
        system_field
    ):

        mapping = FieldMapping(
            school_id=school_id,
            entity_type=entity_type,
            excel_column=excel_column,
            system_field=system_field
        )

        db.add(mapping)
        db.commit()
        db.refresh(mapping)

        return mapping