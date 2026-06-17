class LoadValidator:

    @staticmethod
    def can_assign(
        daily_loads,
        teacher_id,
        day_id,
        max_periods
    ):

        current_load = daily_loads.get(
            (
                teacher_id,
                day_id
            ),
            0
        )

        return current_load < max_periods