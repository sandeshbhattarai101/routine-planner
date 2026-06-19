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

        mapping = (
            db.query(FieldMapping)
            .filter(
                FieldMapping.school_id == school_id,
                FieldMapping.entity_type == entity_type,
                FieldMapping.excel_column == excel_column
            )
            .first()
        )

        if mapping:
            mapping.system_field = system_field
        else:
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

    @staticmethod
    def get_mappings(db: Session, school_id, entity_type):
        return (
            db.query(FieldMapping)
            .filter(
                FieldMapping.school_id == school_id,
                FieldMapping.entity_type == entity_type
            )
            .all()
        )