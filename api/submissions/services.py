"""create_submission: invariant 5, both halves — no unresolved signal, and the whole
rubric carries a finding, checked once here rather than per-stage (advance_stage checks
only the stage being left; this is the one place the complete record is required)."""

import re

from django.db import transaction
from django.utils import timezone

from candidacies.models import CandidateMessage
from common.refusals import RefusalItem
from decisions.models import DecisionEvent
from findings.models import Finding

from .exceptions import SubmissionIncomplete, UnresolvedCrosscheck
from .models import SubmissionRecord


def _reference_prefix(organization):
    letters = "".join(word[0].upper() for word in re.findall(r"[A-Za-z]+", organization.name))
    return letters[:4] or "SR"


def _next_reference(organization):
    prefix = _reference_prefix(organization)
    year = timezone.now().year
    count = SubmissionRecord.objects.filter(
        organization=organization, reference__startswith=f"{prefix}-{year}-"
    ).count()
    return f"{prefix}-{year}-{count + 1:04d}"


def _current_findings(candidacy):
    """Most recent Finding per criterion across every review on this candidacy —
    carry-forward means a criterion may have more than one reading; the current one
    wins (ADR 0011)."""
    findings = (
        Finding.objects.filter(review__candidacy=candidacy)
        .select_related("evidence", "evidence__document", "evidence__sighting")
        .order_by("criterion_id", "-recorded_at")
    )
    current = {}
    for finding in findings:
        current.setdefault(finding.criterion_id, finding)
    return current


def _provenance(evidence):
    if evidence is None:
        return None
    if evidence.document_id:
        return f"{evidence.document.filename} · {evidence.document.uploaded_at.date().isoformat()}"
    if evidence.sighting_id:
        source = evidence.sighting.source_name or evidence.sighting.source_url
        return f"{source} · read {evidence.sighting.retrieved_at.date().isoformat()}"
    return None


def create_submission(candidacy, *, actor=None):
    """actor is optional at the signature only so the contract's refusal test
    (test_submission_blocked_while_crosscheck_signal_unresolved) can call this with just
    a candidacy — every refusal below is checked before actor is ever read. The real
    path, past both gates, needs a real actor: signed_off_by is NOT NULL and raises its
    own IntegrityError if this is ever reached with none."""
    open_signals = list(candidacy.crosscheck_signals.filter(resolution_kind__isnull=True))
    if open_signals:
        raise UnresolvedCrosscheck(
            requirement="A submission cannot be created while any signal is unresolved.",
            reason=(
                "1 signal is unresolved."
                if len(open_signals) == 1
                else f"{len(open_signals)} signals are unresolved."
            ),
            action="Resolve or override each signal, then create the submission.",
            items=tuple(
                RefusalItem(label=s.get_type_display(), detail=s.detail) for s in open_signals
            ),
            invariant=5,
        )

    criteria = list(candidacy.brief_version.criteria.order_by("position"))
    current = _current_findings(candidacy)
    missing = [c for c in criteria if c.id not in current]
    if missing:
        raise SubmissionIncomplete(
            requirement="The whole rubric is required once, before this leaves the building.",
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
            invariant=5,
        )

    lines = [
        {
            "position": c.position,
            "criterion_text": c.text,
            "status": current[c.id].status,
            "quote": current[c.id].evidence.quote if current[c.id].evidence_id else None,
            "provenance": _provenance(current[c.id].evidence),
        }
        for c in criteria
    ]

    with transaction.atomic():
        record = SubmissionRecord.objects.create(
            organization=candidacy.organization,
            candidacy=candidacy,
            brief_version=candidacy.brief_version,
            signed_off_by=actor,
            reference=_next_reference(candidacy.organization),
            snapshot={
                "person_name": candidacy.person.full_name,
                "person_headline": candidacy.person.headline,
                "client_name": candidacy.role.client.name,
                "role_title": candidacy.role.title,
                "brief_version": candidacy.brief_version.version,
                "lines": lines,
            },
        )
        CandidateMessage.objects.create(
            candidacy=candidacy,
            kind=CandidateMessage.Kind.SUBMISSION,
            sent_by=actor,
            body=f"Your details were sent to {candidacy.role.client.name} for {candidacy.role.title}.",
        )
        DecisionEvent.objects.create(
            candidacy=candidacy,
            type=DecisionEvent.Type.SUBMISSION_CREATED,
            actor=actor,
            summary=f"Submission created: {record.reference}.",
        )
    return record
