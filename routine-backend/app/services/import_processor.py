from sqlalchemy.orm import Session
from app.models.field_mapping import FieldMapping
from app.models.teacher import Teacher

class ImportProcessor:

    @staticmethod
    def get_mapping_dictionary(db: Session, school_id, entity_type):
        mappings = (
            db.query(FieldMapping)
            .filter(
                FieldMapping.school_id == school_id,
                FieldMapping.entity_type == entity_type
            )
            .all()
        )
        return {m.excel_column: m.system_field for m in mappings}
    
    @staticmethod
    def transform_rows(rows, mapping_dict, required_fields=None):
        transformed_rows = []
        required_fields = required_fields or []

        for index, row in enumerate(rows):
            transformed = {}
            for excel_col, value in row.items():
                if excel_col in mapping_dict:
                    system_field = mapping_dict[excel_col]
                    transformed[system_field] = value

            # Check if any required system fields are missing after mapping
            missing_fields = [field for field in required_fields if field not in transformed]
            if missing_fields:
                raise ValueError(
                    f"Row {index + 1} is missing required mapped fields: {missing_fields}. "
                    f"Please check your column mappings."
                )

            transformed_rows.append(transformed)

        return transformed_rows
    
    @staticmethod
    def import_teachers(db: Session, school_id, rows):
        teachers = []

        for index, row in enumerate(rows):
            name = row.get("name")
            
            # Application level safety fallback check
            if not name:
                raise ValueError(f"Import failed: 'name' is missing or null on row {index + 1}.")

            teacher = Teacher(
                school_id=school_id,
                name=name,
                max_periods_per_day=row.get("max_periods_per_day", 5)
            )
            teachers.append(teacher)

        db.add_all(teachers)
        db.commit()

        return len(teachers)
    
    @staticmethod
    def process(db: Session, school_id, entity_type, rows):
        mapping_dict = ImportProcessor.get_mapping_dictionary(db, school_id, entity_type)

        # ==========================================
        # 🛑 TEMPORARY DEBUG PRINTS — LOOK AT YOUR TERMINAL
        # ==========================================
        # print("\n=== DEBUG: DATABASE MAPPINGS FOUND ===")
        # print(mapping_dict)
        # print("=== DEBUG: INCOMING FIRST ROW FROM PAYLOAD ===")
        # if rows:
        #     print(rows[0])
        # else:
        #     print("Rows array is empty!")
        # print("============================================\n")
        # ==========================================

        # Define fields that MUST exist in the system after mapping
        required_fields = []
        if entity_type == "teacher":
            required_fields = ["name"]

        transformed_rows = ImportProcessor.transform_rows(
            rows, 
            mapping_dict, 
            required_fields=required_fields
        )

        if entity_type == "teacher":
            return ImportProcessor.import_teachers(db, school_id, transformed_rows)

        raise ValueError(f"Unsupported entity type: {entity_type}")