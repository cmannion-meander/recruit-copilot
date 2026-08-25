"""The signal commands, and the computed detectors.

Two of the four signal types are implemented here: duplicate_candidacy and
document_author, both pure arithmetic over data the schema already holds. The other two
— timeline_overlap (comparing sighting snapshots) and contact_collision (matching against
the org's own contact records) — are named in the type enum and the schema is ready for
them, but their detectors are not built in this milestone; there is no test that needs
them and no data shape they would require beyond what is already here. Named, not
silently dropped (docs/backend-prd.md's non-goals discipline).
"""

from django.db import transaction
from django.utils import timezone

from .exceptions import SignalRefused
from .models import CrosscheckSignal


def resolve_signal(signal, *, note, actor):
    _refuse_unless_open(signal)
    if not note.strip():
        raise SignalRefused(
            requirement="Resolving a signal is a written note, not a checkbox.",
            reason="The note is empty.",
            action="Write what you checked, then resolve it.",
            invariant=5,
        )
    signal.resolution_kind = CrosscheckSignal.ResolutionKind.RESOLVED
    signal.resolved_by = actor
    signal.resolved_at = timezone.now()
    signal.resolution_note = note.strip()
    signal.save(update_fields=["resolution_kind", "resolved_by", "resolved_at", "resolution_note"])
    return signal


def override_signal(signal, *, reason_text, actor):
    _refuse_unless_open(signal)
    if not reason_text.strip():
        raise SignalRefused(
            requirement="An override carries a user and a written reason.",
            reason="The reason is empty.",
            action="Write why this is being set aside, then override it.",
            invariant=5,
        )
    signal.resolution_kind = CrosscheckSignal.ResolutionKind.OVERRIDDEN
    signal.resolved_by = actor
    signal.resolved_at = timezone.now()
    signal.resolution_note = reason_text.strip()
    signal.save(update_fields=["resolution_kind", "resolved_by", "resolved_at", "resolution_note"])
    return signal


def _refuse_unless_open(signal):
    if signal.resolution_kind is not None:
        raise SignalRefused(
            requirement="A signal is resolved once.",
            reason="This signal already has a resolution on the record.",
            action="Nothing to do.",
            invariant=5,
        )


def detect_duplicate_candidacy(candidacy):
    """The same person holding more than one live candidacy at the same client, across
    different roles — deterministic, no fuzzy matching, and exactly the case dedup
    across roles (not across organizations, invariant-adjacent) is meant to catch."""
    from candidacies.models import Candidacy

    others = (
        Candidacy.objects.filter(
            person=candidacy.person,
            role__client_id=candidacy.role.client_id,
            closed_at__isnull=True,
        )
        .exclude(pk=candidacy.pk)
        .select_related("role")
    )
    created = []
    with transaction.atomic():
        for other in others:
            if CrosscheckSignal.objects.filter(
                candidacy=candidacy,
                type=CrosscheckSignal.Type.DUPLICATE_CANDIDACY,
                artifact__candidacy_id=str(other.id),
            ).exists():
                continue
            created.append(
                CrosscheckSignal.objects.create(
                    candidacy=candidacy,
                    type=CrosscheckSignal.Type.DUPLICATE_CANDIDACY,
                    detail=(
                        f"{candidacy.person.full_name} already has a live candidacy on "
                        f"{other.role.title}, at the same client."
                    ),
                    artifact={
                        "kind": "record",
                        "label": other.role.title,
                        "detail": "Another live candidacy at this client.",
                        "candidacy_id": str(other.id),
                    },
                )
            )
    return created


def detect_document_author(candidacy, document):
    """A CV's embedded author metadata naming someone other than the candidate is not
    in the parsed text, so it has no character range to cite — a key-value block, not
    a quoted passage (prototype finding 6)."""
    if not document.author.strip():
        return None
    if document.author.strip().lower() in candidacy.person.full_name.strip().lower():
        return None
    if CrosscheckSignal.objects.filter(
        candidacy=candidacy,
        type=CrosscheckSignal.Type.DOCUMENT_AUTHOR,
        artifact__document_id=str(document.id),
    ).exists():
        return None
    return CrosscheckSignal.objects.create(
        candidacy=candidacy,
        type=CrosscheckSignal.Type.DOCUMENT_AUTHOR,
        detail=f"The document's author metadata names {document.author!r}, not {candidacy.person.full_name}.",
        artifact={
            "kind": "document_property",
            "document_id": str(document.id),
            "property": "author",
            "value": document.author,
        },
    )
