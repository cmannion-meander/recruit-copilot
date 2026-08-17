from common.refusals import Refusal


class BriefIncomplete(Refusal):
    """Invariant 1, either half: too few criteria, or a criterion assigned to no stage.

    The two halves refuse in sequence — count first, coverage second — because they are
    different sentences with different next actions, not one error with two causes.
    """
