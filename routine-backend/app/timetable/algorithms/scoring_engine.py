class ScoringEngine:

    @staticmethod
    def score_slot(
        day_load,
        teacher_load
    ):

        score = 100

        score -= day_load * 5

        score -= teacher_load * 3

        return score