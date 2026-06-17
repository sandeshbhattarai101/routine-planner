class DistributionValidator:

    @staticmethod
    def subject_count_for_day(
        subject_day_count,
        classroom_id,
        section_id,
        subject_id,
        day_id
    ):

        return subject_day_count.get(
            (
                classroom_id,
                section_id,
                subject_id,
                day_id
            ),
            0
        )

    @staticmethod
    def can_assign(
        subject_day_count,
        classroom_id,
        section_id,
        subject_id,
        day_id,
        max_per_day=1
    ):

        count = (
            DistributionValidator.subject_count_for_day(
                subject_day_count,
                classroom_id,
                section_id,
                subject_id,
                day_id
            )
        )

        return count < max_per_day