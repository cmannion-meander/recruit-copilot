from common.refusals import Refusal


class CandidacyRefused(Refusal):
    """Any guard on a candidacy: cannot attach, cannot advance, cannot move a closed
    record. See docs/prototype-findings.md §11 — every one of these names what is missing,
    never just a count."""
