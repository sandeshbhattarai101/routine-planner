from sqlalchemy.orm import Session
from app.models.field_mapping import FieldMapping
from app.models.teacher import Teacher
from app.models.classroom import Classroom
from app.models.section import Section
from app.models.subject import Subject
from app.models.class_subject import ClassSubject
from app.models.teacher_subject import TeacherSubject

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
    def import_classrooms(db: Session, school_id, rows):
        classrooms = []

        for index, row in enumerate(rows):
            name = row.get("name")

            if not name:
                raise ValueError(f"Import failed: 'name' is missing or null on row {index + 1}.")

            classrooms.append(Classroom(school_id=school_id, name=name))

        db.add_all(classrooms)
        db.commit()

        return len(classrooms)

    @staticmethod
    def import_sections(db: Session, school_id, rows):
        sections = []

        for index, row in enumerate(rows):
            name = row.get("name")
            classroom_name = row.get("classroom_name")

            if not name or not classroom_name:
                raise ValueError(
                    f"Import failed: 'name' or 'classroom_name' is missing or null on row {index + 1}."
                )

            classroom = (
                db.query(Classroom)
                .filter(Classroom.school_id == school_id, Classroom.name == classroom_name)
                .first()
            )
            if not classroom:
                raise ValueError(f"Row {index + 1}: classroom '{classroom_name}' not found.")

            sections.append(Section(school_id=school_id, classroom_id=classroom.id, name=name))

        db.add_all(sections)
        db.commit()

        return len(sections)

    @staticmethod
    def import_subjects(db: Session, school_id, rows):
        subjects = []

        for index, row in enumerate(rows):
            name = row.get("name")

            if not name:
                raise ValueError(f"Import failed: 'name' is missing or null on row {index + 1}.")

            subjects.append(Subject(school_id=school_id, name=name))

        db.add_all(subjects)
        db.commit()

        return len(subjects)

    @staticmethod
    def import_class_subjects(db: Session, school_id, rows):
        class_subjects = []

        for index, row in enumerate(rows):
            classroom_name = row.get("classroom_name")
            section_name = row.get("section_name")
            subject_name = row.get("subject_name")
            periods_per_week = row.get("periods_per_week")

            if not classroom_name or not section_name or not subject_name or not periods_per_week:
                raise ValueError(
                    f"Import failed: required fields missing or null on row {index + 1}."
                )

            classroom = (
                db.query(Classroom)
                .filter(Classroom.school_id == school_id, Classroom.name == classroom_name)
                .first()
            )
            if not classroom:
                raise ValueError(f"Row {index + 1}: classroom '{classroom_name}' not found.")

            section = (
                db.query(Section)
                .filter(Section.classroom_id == classroom.id, Section.name == section_name)
                .first()
            )
            if not section:
                raise ValueError(f"Row {index + 1}: section '{section_name}' not found.")

            subject = (
                db.query(Subject)
                .filter(Subject.school_id == school_id, Subject.name == subject_name)
                .first()
            )
            if not subject:
                raise ValueError(f"Row {index + 1}: subject '{subject_name}' not found.")

            teacher_id = None
            teacher_name = row.get("teacher_name")
            if teacher_name:
                teacher = (
                    db.query(Teacher)
                    .filter(Teacher.school_id == school_id, Teacher.name == teacher_name)
                    .first()
                )
                if not teacher:
                    raise ValueError(f"Row {index + 1}: teacher '{teacher_name}' not found.")
                teacher_id = teacher.id

            days_per_week = row.get("days_per_week")

            class_subjects.append(
                ClassSubject(
                    school_id=school_id,
                    classroom_id=classroom.id,
                    section_id=section.id,
                    subject_id=subject.id,
                    teacher_id=teacher_id,
                    periods_per_week=int(periods_per_week),
                    days_per_week=int(days_per_week) if days_per_week else None
                )
            )

        db.add_all(class_subjects)
        db.commit()

        return len(class_subjects)

    @staticmethod
    def import_teacher_subjects(db: Session, school_id, rows):
        teacher_subjects = []

        for index, row in enumerate(rows):
            teacher_name = row.get("teacher_name")
            subject_name = row.get("subject_name")

            if not teacher_name or not subject_name:
                raise ValueError(
                    f"Import failed: required fields missing or null on row {index + 1}."
                )

            teacher = (
                db.query(Teacher)
                .filter(Teacher.school_id == school_id, Teacher.name == teacher_name)
                .first()
            )
            if not teacher:
                raise ValueError(f"Row {index + 1}: teacher '{teacher_name}' not found.")

            subject = (
                db.query(Subject)
                .filter(Subject.school_id == school_id, Subject.name == subject_name)
                .first()
            )
            if not subject:
                raise ValueError(f"Row {index + 1}: subject '{subject_name}' not found.")

            teacher_subjects.append(
                TeacherSubject(
                    school_id=school_id,
                    teacher_id=teacher.id,
                    subject_id=subject.id,
                )
            )

        db.add_all(teacher_subjects)
        db.commit()

        return len(teacher_subjects)

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
        required_fields_map = {
            "teacher": ["name"],
            "classroom": ["name"],
            "section": ["name", "classroom_name"],
            "subject": ["name"],
            "class_subject": ["classroom_name", "section_name", "subject_name", "periods_per_week"],
            "teacher_subject": ["teacher_name", "subject_name"],
        }
        required_fields = required_fields_map.get(entity_type, [])

        transformed_rows = ImportProcessor.transform_rows(
            rows,
            mapping_dict,
            required_fields=required_fields
        )

        if entity_type == "teacher":
            return ImportProcessor.import_teachers(db, school_id, transformed_rows)
        if entity_type == "classroom":
            return ImportProcessor.import_classrooms(db, school_id, transformed_rows)
        if entity_type == "section":
            return ImportProcessor.import_sections(db, school_id, transformed_rows)
        if entity_type == "subject":
            return ImportProcessor.import_subjects(db, school_id, transformed_rows)
        if entity_type == "class_subject":
            return ImportProcessor.import_class_subjects(db, school_id, transformed_rows)
        if entity_type == "teacher_subject":
            return ImportProcessor.import_teacher_subjects(db, school_id, transformed_rows)

        raise ValueError(f"Unsupported entity type: {entity_type}")