"""GET /api/workspace: one org-scoped snapshot, shaped exactly like the prototype's
PrototypeState (web/app/(prototype)/_fixtures/types.ts) so the cockpit's selectors —
needsAttention, cellsFor, attentionItems, furthestPosition, all of _state/selectors.ts —
run unmodified against real data (ADR 0013: "reads are one snapshot, not a query layer").

Where the real schema diverges from the prototype's types on purpose, this is the one
place that bridges the gap:

  - Candidacy.stage_id (prototype: one polymorphic id) is our brief_stage_id XOR
    terminal_stage. Terminal candidacies get a synthesised id — "stg_placed",
    "stg_rejected", "stg_excluded", "stg_closed_no_response" — matching the fixture
    convention exactly, and `terminal_stages()` below emits the four Stage rows those
    ids resolve to. Same synthesis for DecisionEvent.stage_id.
  - Evidence.finding_id (prototype) doesn't exist as a column here (ADR 0016: Evidence
    is scoped to (review, criterion), Finding points at it, not the reverse) — derived
    via the reverse accessor Finding.evidence's related_name.
  - CrosscheckSignal.resolution (prototype: a Resolution | Override union) is
    reconstructed from our flat resolution_kind/resolved_by/resolved_at/resolution_note.
  - SubmissionRecord.snapshot.candidate_token is injected at serialization time from the
    real column, candidate_link_id (renamed so invariant 10's catalogue scan doesn't
    mistake a value meant to be handed out for a credential — see ADR 0017).

Every timestamp serializes to ISO 8601; every id to a plain string.
"""

from candidacies.models import Candidacy, CandidateMessage, TerminalStage
from channels.models import Channel
from clients.models import Client, Contact
from crosscheck.models import CrosscheckSignal
from decisions.models import Decision, DecisionEvent
from documents.models import Document
from evidence.models import Evidence
from findings.models import Finding
from people.models import Person
from placements.models import Placement, PlacementCheckpoint
from reviews.models import Review
from roles.models import Brief, BriefStage, BriefVersion, Criterion, Role, SourcingScope
from searches.models import Search
from sightings.models import Sighting
from submissions.models import SubmissionRecord


def _id(value):
    return str(value) if value is not None else None


def _ts(value):
    return value.isoformat() if value is not None else None


def _terminal_stage_id(kind):
    return f"stg_{kind}" if kind else None


TERMINAL_STAGE_LABELS = {
    TerminalStage.PLACED: "Placed",
    TerminalStage.REJECTED: "Rejected",
    TerminalStage.EXCLUDED: "Excluded",
    TerminalStage.CLOSED_NO_RESPONSE: "Closed — no response",
}


def _terminal_stages():
    return [
        {"id": _terminal_stage_id(kind), "position": None, "label": label, "terminal": True}
        for kind, label in TERMINAL_STAGE_LABELS.items()
    ]


def _candidacy_stage_id(candidacy):
    return candidacy.brief_stage_id and str(candidacy.brief_stage_id) or _terminal_stage_id(
        candidacy.terminal_stage
    )


def _organization(organization):
    return {
        "id": _id(organization.id),
        "name": organization.name,
        "wordmark": organization.wordmark,
        "place": organization.place,
    }


def _users(organization):
    return [
        {
            "id": _id(u.id),
            "organization_id": _id(organization.id),
            "name": u.get_full_name() or u.username,
            "title": u.title,
        }
        for u in organization.users.all()
    ]


def _clients(organization):
    return [
        {
            "id": _id(c.id),
            "organization_id": _id(organization.id),
            "name": c.name,
            "description": c.description,
        }
        for c in Client.objects.filter(organization=organization)
    ]


def _contacts(organization):
    return [
        {
            "id": _id(c.id),
            "organization_id": _id(organization.id),
            "client_id": _id(c.client_id),
            "name": c.name,
            "title": c.title,
            "email": c.email,
        }
        for c in Contact.objects.filter(organization=organization)
    ]


def _roles(organization):
    return [
        {
            "id": _id(r.id),
            "organization_id": _id(organization.id),
            "client_id": _id(r.client_id),
            "title": r.title,
            "state": r.state,
            "brief_id": _id(r.brief.id) if hasattr(r, "brief") else None,
            "pinned_brief_version_id": _id(r.pinned_brief_version_id),
            "opened_at": _ts(r.opened_at),
            "closed_at": _ts(r.closed_at),
            "closed_reason": r.closed_reason,
        }
        for r in Role.objects.filter(organization=organization).select_related("brief")
    ]


def _briefs(organization):
    return [
        {"id": _id(b.id), "organization_id": _id(organization.id), "role_id": _id(b.role_id)}
        for b in Brief.objects.filter(organization=organization)
    ]


def _brief_versions(organization):
    return [
        {
            "id": _id(v.id),
            "brief_id": _id(v.brief_id),
            "version": v.version,
            "created_at": _ts(v.created_at),
            "created_by": _id(v.created_by_id),
            "note": v.note,
            "criterion_ids": [
                _id(cid)
                for cid in v.criteria.order_by("position").values_list("id", flat=True)
            ],
        }
        for v in BriefVersion.objects.filter(organization=organization)
    ]


def _criteria(organization):
    return [
        {
            "id": _id(c.id),
            "brief_version_id": _id(c.brief_version_id),
            "position": c.position,
            "text": c.text,
            "cell_label": c.cell_label,
        }
        for c in Criterion.objects.filter(organization=organization)
    ]


def _brief_stages(organization):
    return [
        {
            "id": _id(s.id),
            "brief_version_id": _id(s.brief_version_id),
            "position": s.position,
            "label": s.label,
            "purpose": s.purpose,
            "owner": s.owner,
            "criterion_ids": [
                _id(cid) for cid in s.criterion_assignments.values_list("criterion_id", flat=True)
            ],
            "candidate_message": s.candidate_message,
        }
        for s in BriefStage.objects.filter(organization=organization)
    ]


def _sourcing_scopes(organization):
    return [
        {
            "id": _id(s.id),
            "brief_version_id": _id(s.brief_version_id),
            "revision": s.revision,
            "created_at": _ts(s.created_at),
            "created_by": _id(s.created_by_id),
            "note": s.note,
            "markets": s.markets,
            "employers": s.employers,
            "geography": s.geography,
            "exclusions": s.exclusions,
        }
        for s in SourcingScope.objects.filter(organization=organization)
    ]


def _channels(organization):
    return [
        {
            "id": _id(c.id),
            "organization_id": _id(organization.id),
            "name": c.name,
            "kind": c.kind,
            "note": c.note,
        }
        for c in Channel.objects.filter(organization=organization)
    ]


def _searches(organization):
    return [
        {
            "id": _id(s.id),
            "organization_id": _id(organization.id),
            "role_id": _id(s.role_id),
            "brief_version_id": _id(s.brief_version_id),
            "sourcing_scope_id": _id(s.sourcing_scope_id),
            "ran_by": _id(s.ran_by_id),
            "ran_at": _ts(s.ran_at),
            "coverage_note": s.coverage_note,
        }
        for s in Search.objects.filter(organization=organization)
    ]


def _people(organization):
    return [
        {
            "id": _id(p.id),
            "organization_id": _id(organization.id),
            "full_name": p.full_name,
            "headline": p.headline,
            "current_employer": p.current_employer,
            "location": p.location,
            "email": p.email,
            "phone": p.phone,
        }
        for p in Person.objects.filter(organization=organization)
    ]


def _sightings(organization):
    return [
        {
            "id": _id(s.id),
            "organization_id": _id(organization.id),
            "person_id": _id(s.person_id),
            "search_id": _id(s.search_id),
            "source_url": s.source_url,
            "source_name": s.source_name,
            "source_kind": s.source_kind,
            "retrieved_at": _ts(s.retrieved_at),
            "snapshot_excerpt": s.snapshot_excerpt,
            "resolving": s.resolving,
        }
        for s in Sighting.objects.filter(organization=organization)
    ]


def _candidacies(organization):
    return [
        {
            "id": _id(c.id),
            "organization_id": _id(organization.id),
            "person_id": _id(c.person_id),
            "role_id": _id(c.role_id),
            "brief_version_id": _id(c.brief_version_id),
            "stage_id": _candidacy_stage_id(c),
            "channel_id": _id(c.channel_id),
            "created_at": _ts(c.created_at),
            "auto_close_at": _ts(c.auto_close_at),
            "closed_at": _ts(c.closed_at),
        }
        for c in Candidacy.objects.filter(organization=organization)
    ]


def _candidate_messages(organization):
    return [
        {
            "id": _id(m.id),
            "organization_id": _id(organization.id),
            "candidacy_id": _id(m.candidacy_id),
            "kind": m.kind,
            "stage_id": _id(m.brief_stage_id),
            "sent_at": _ts(m.sent_at),
            "sent_by": _id(m.sent_by_id),
            "body": m.body,
        }
        for m in CandidateMessage.objects.filter(organization=organization)
    ]


def _documents(organization):
    return [
        {
            "id": _id(d.id),
            "organization_id": _id(organization.id),
            "person_id": _id(d.person_id),
            "kind": d.kind,
            "filename": d.filename,
            "sha256": d.sha256,
            "uploaded_at": _ts(d.uploaded_at),
            "parsed_text": d.parsed_text,
            "pages": d.pages,
            "paragraphs": d.paragraphs,
            "properties": {
                "author": d.author or None,
                "producer": d.producer or None,
                "created": _ts(d.properties_created),
            },
        }
        for d in Document.objects.filter(organization=organization)
    ]


def _reviews(organization):
    return [
        {
            "id": _id(r.id),
            "organization_id": _id(organization.id),
            "candidacy_id": _id(r.candidacy_id),
            "brief_version_id": _id(r.brief_version_id),
            "stage_id": _id(r.brief_stage_id),
            "created_at": _ts(r.created_at),
            "created_by": _id(r.created_by_id),
        }
        for r in Review.objects.filter(organization=organization)
    ]


def _findings(organization):
    return [
        {
            "id": _id(f.id),
            "review_id": _id(f.review_id),
            "criterion_id": _id(f.criterion_id),
            "status": f.status,
            "recorded_by": _id(f.recorded_by_id),
            "recorded_at": _ts(f.recorded_at),
        }
        for f in Finding.objects.filter(organization=organization)
    ]


def _evidence_target(e):
    if e.document_id:
        return {
            "kind": "document",
            "document_id": _id(e.document_id),
            "char_start": e.char_start,
            "char_end": e.char_end,
            "page": e.page,
            "paragraph": e.paragraph,
        }
    return {
        "kind": "sighting",
        "sighting_id": _id(e.sighting_id),
        "char_start": e.char_start,
        "char_end": e.char_end,
    }


def _evidence(organization):
    return [
        {
            "id": _id(e.id),
            "organization_id": _id(organization.id),
            # Reverse accessor onto Finding.evidence (related_name="finding") — Evidence
            # has no finding_id column of its own (ADR 0016).
            "finding_id": _id(e.finding.id) if hasattr(e, "finding") else None,
            "quote": e.quote,
            "target": _evidence_target(e),
            "created_at": _ts(e.created_at),
        }
        for e in Evidence.objects.filter(organization=organization).select_related("finding")
    ]


def _crosscheck_resolution(s):
    if s.resolution_kind == CrosscheckSignal.ResolutionKind.RESOLVED:
        return {
            "kind": "resolution",
            "resolved_by": _id(s.resolved_by_id),
            "resolved_at": _ts(s.resolved_at),
            "note": s.resolution_note,
        }
    if s.resolution_kind == CrosscheckSignal.ResolutionKind.OVERRIDDEN:
        return {
            "kind": "override",
            "user_id": _id(s.resolved_by_id),
            "reason_text": s.resolution_note,
            "created_at": _ts(s.resolved_at),
        }
    return None


def _crosscheck_signals(organization):
    return [
        {
            "id": _id(s.id),
            "organization_id": _id(organization.id),
            "candidacy_id": _id(s.candidacy_id),
            "type": s.type,
            "detail": s.detail,
            "artifact": s.artifact,
            "observed_at": _ts(s.observed_at),
            "resolution": _crosscheck_resolution(s),
        }
        for s in CrosscheckSignal.objects.filter(organization=organization)
    ]


def _decisions(organization):
    return [
        {
            "id": _id(d.id),
            "organization_id": _id(organization.id),
            "candidacy_id": _id(d.candidacy_id),
            "type": d.kind,
            "reason_code": d.reason_code,
            "reason_text": d.reason_text,
            "decided_by": _id(d.decided_by_id),
            "decided_at": _ts(d.decided_at),
        }
        for d in Decision.objects.filter(organization=organization)
    ]


def _decision_events(organization):
    return [
        {
            "id": _id(e.id),
            "organization_id": _id(organization.id),
            "candidacy_id": _id(e.candidacy_id),
            "type": e.type,
            "actor": _id(e.actor_id),
            "at": _ts(e.at),
            "summary": e.summary,
            "stage_id": _id(e.brief_stage_id) or _terminal_stage_id(e.terminal_stage),
        }
        for e in DecisionEvent.objects.filter(organization=organization)
    ]


def _submission_records(organization):
    result = []
    for r in SubmissionRecord.objects.filter(organization=organization):
        snapshot = dict(r.snapshot)
        snapshot["candidate_token"] = r.candidate_link_id
        result.append(
            {
                "id": _id(r.id),
                "organization_id": _id(organization.id),
                "candidacy_id": _id(r.candidacy_id),
                "brief_version_id": _id(r.brief_version_id),
                "created_at": _ts(r.created_at),
                "signed_off_by": _id(r.signed_off_by_id),
                "signed_off_at": _ts(r.signed_off_at),
                "reference": r.reference,
                "snapshot": snapshot,
            }
        )
    return result


def _placements(organization):
    return [
        {
            "id": _id(p.id),
            "organization_id": _id(organization.id),
            "candidacy_id": _id(p.candidacy_id),
            "brief_version_id": _id(p.brief_version_id),
            "started_on": _ts(p.started_on),
            "probation_ends_on": _ts(p.probation_ends_on),
        }
        for p in Placement.objects.filter(organization=organization)
    ]


def _placement_checkpoints(organization):
    return [
        {
            "id": _id(c.id),
            "placement_id": _id(c.placement_id),
            "day": c.day,
            "due_on": _ts(c.due_on),
            "recorded_at": _ts(c.recorded_at),
            "recorded_by": _id(c.recorded_by_id),
            "note": c.note,
            "brief_feedback": c.brief_feedback,
        }
        for c in PlacementCheckpoint.objects.filter(organization=organization)
    ]


def build_workspace(organization):
    return {
        "organization": _organization(organization),
        "users": _users(organization),
        "clients": _clients(organization),
        "contacts": _contacts(organization),
        "roles": _roles(organization),
        "briefs": _briefs(organization),
        "briefVersions": _brief_versions(organization),
        "criteria": _criteria(organization),
        "briefStages": _brief_stages(organization),
        "sourcingScopes": _sourcing_scopes(organization),
        "channels": _channels(organization),
        "searches": _searches(organization),
        "people": _people(organization),
        "sightings": _sightings(organization),
        "terminalStages": _terminal_stages(),
        "candidacies": _candidacies(organization),
        "candidateMessages": _candidate_messages(organization),
        "placements": _placements(organization),
        "placementCheckpoints": _placement_checkpoints(organization),
        "documents": _documents(organization),
        "reviews": _reviews(organization),
        "findings": _findings(organization),
        "evidence": _evidence(organization),
        "crosscheckSignals": _crosscheck_signals(organization),
        "decisions": _decisions(organization),
        "exclusions": [],
        "decisionEvents": _decision_events(organization),
        "submissionRecords": _submission_records(organization),
    }
