from common.refusals import Refusal


class IncompleteScorecard(Refusal):
    """Invariant 3: a candidacy cannot leave a stage while any criterion that stage
    carries has no Finding. The refusal names the criteria, never a bare count
    (docs/prototype-findings.md §11)."""
