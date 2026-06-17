class AvailabilityValidator:

    @staticmethod
    def teacher_available(
        unavailable_slots,
        teacher_id,
        day_id,
        period_id
    ):

        return (
            teacher_id,
            day_id,
            period_id
        ) not in unavailable_slots

    @staticmethod
    def class_available(
        unavailable_slots,
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
        ) not in unavailable_slots