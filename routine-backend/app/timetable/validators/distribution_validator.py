import math


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
    def max_per_day(
        periods_required,
        days_per_week
    ):
        # No days_per_week constraint: keep the original rule of one
        # period per day, spread across as many days as needed.
        if not days_per_week:
            return 1

        return math.ceil(periods_required / days_per_week)

    @staticmethod
    def can_assign(
        subject_day_count,
        subject_days_used,
        classroom_id,
        section_id,
        subject_id,
        day_id,
        periods_required,
        days_per_week,
        max_per_day=None
    ):

        if max_per_day is None:
            max_per_day = DistributionValidator.max_per_day(
                periods_required,
                days_per_week
            )

        count = (
            DistributionValidator.subject_count_for_day(
                subject_day_count,
                classroom_id,
                section_id,
                subject_id,
                day_id
            )
        )

        if count >= max_per_day:
            return False

        if days_per_week:

            days_used = subject_days_used.get(
                (
                    classroom_id,
                    section_id,
                    subject_id
                ),
                set()
            )

            if day_id not in days_used and len(days_used) >= days_per_week:
                return False

        return True
