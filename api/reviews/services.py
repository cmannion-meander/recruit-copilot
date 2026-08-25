"""Invariant 3, in one place. Both Review.advance() (called directly, and by the
contract) and candidacies.services.advance_stage (the command a request actually hits)
share this — the rule is stated once."""

from common.refusals import RefusalItem

from .exceptions import IncompleteScorecard


def require_stage_complete(brief_stage, review):
    """Every criterion `brief_stage` carries must have a Finding on `review`. `review`
    may be None (no Review row exists yet for this stage, i.e. no finding was ever
    recorded there) — treated as zero coverage. A stage with no criteria always passes:
    it gates nothing (ADR 0011)."""
    criteria = [a.criterion for a in brief_stage.criterion_assignments.select_related("criterion")]
    if not criteria:
        return

    covered = set(review.findings.values_list("criterion_id", flat=True)) if review else set()
    missing = [c for c in criteria if c.id not in covered]
    if missing:
        raise IncompleteScorecard(
            requirement="This candidate can't advance until the scorecard is complete.",
            reason=(
                "1 criterion has no entry."
                if len(missing) == 1
                else f"{len(missing)} criteria have no entry."
            ),
            action="Open the scorecard and record a finding against each.",
            items=tuple(
                RefusalItem(label=c.text, detail=f"Criterion {c.position} of {len(criteria)}")
                for c in missing
            ),
            invariant=3,
        )
