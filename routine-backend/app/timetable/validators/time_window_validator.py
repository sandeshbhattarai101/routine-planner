class TimeWindowValidator:

    @staticmethod
    def within_window(
        period_start_time,
        period_end_time,
        window_start_time,
        window_end_time
    ):
        # No window configured for the class: any period is allowed.
        if window_start_time is None and window_end_time is None:
            return True

        # Without period times we can't compare; allow it through.
        if period_start_time is None or period_end_time is None:
            return True

        if window_start_time is not None and period_start_time < window_start_time:
            return False

        if window_end_time is not None and period_end_time > window_end_time:
            return False

        return True
