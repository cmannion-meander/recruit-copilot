from common.refusals import Refusal


class UnresolvedCrosscheck(Refusal):
    """Invariant 5: a submission cannot be created while any CrosscheckSignal on the
    candidacy is unresolved."""


class SubmissionIncomplete(Refusal):
    """The whole rubric is required once, at submission (invariant 3's own
    cross-reference to invariant 5; ADR 0011). Distinct from the per-stage gate in
    advance_stage — this is checked across every criterion in the pinned BriefVersion,
    not just the current stage's."""
