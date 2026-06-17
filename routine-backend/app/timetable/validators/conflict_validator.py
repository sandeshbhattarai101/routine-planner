class ConflictValidator:

    @staticmethod
    def teacher_available(
        teacher_schedule,
        teacher_id,
        day_id,
        period_id
    ):

        return (
            teacher_id,
            day_id,
            period_id
        ) not in teacher_schedule

    @staticmethod
    def class_available(
        class_schedule,
        classroom_id,
        section_id,
        day_id,
        period_id
    ):

        return (
            classroom_id,
            section_id,
            day_id,
            period_id
        ) not in class_schedule