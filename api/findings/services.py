"""The recorder's one command. The API takes offsets, never a typed quotation
(docs/backend-prd.md delta #2, docs/prototype-findings.md §9): the caller names a
document or a sighting and a character range within it; the quote is extracted here,
server-side, and that extracted string is the only thing that ever becomes Evidence.quote.

The sighting path is the majority path, not the degraded one (prototype finding 4) — this
function treats a sighting's snapshot_excerpt exactly the way it treats a document's
parsed_text, because the recorder does too.
"""

from dataclasses import dataclass

from django.db import transaction

from common.offsets import place_of
from common.refusals import Refusal
from decisions.models import DecisionEvent
from documents.models import Document
from evidence.models import Evidence
from roles.models import BriefStageCriterion
from sightings.models import Sighting

from .models import Finding


@dataclass(frozen=True)
class Passage:
    """Already-resolved — the view turns document_id/sighting_id into a real instance
    before calling record_finding, the same split as every other command."""

    char_start: int
    char_end: int
    document: Document | None = None
    sighting: Sighting | None = None


def record_finding(candidacy, *, stage, criterion, status, passage=None, actor):
    if not BriefStageCriterion.objects.filter(brief_stage=stage, criterion=criterion).exists():
        raise Refusal(
            requirement="A finding is recorded against a criterion this stage evidences.",
            reason=f"{criterion.text} is not assigned to {stage.label}.",
            action="Record it at the stage The Brief assigns it to.",
            invariant=3,
        )
    if status == Finding.Status.EVIDENCED and passage is None:
        raise Refusal(
            requirement="An evidenced finding needs a passage.",
            reason="No passage was selected.",
            action="Pick the sentence that supports this criterion, or record no entry.",
            invariant=9,
        )

    from reviews.models import Review

    with transaction.atomic():
        review, _created = Review.objects.get_or_create(
            candidacy=candidacy,
            brief_stage=stage,
            defaults={"brief_version": candidacy.brief_version, "created_by": actor},
        )
        if Finding.objects.filter(review=review, criterion=criterion).exists():
            raise Refusal(
                requirement="A criterion is read once per review.",
                reason="This criterion already has a finding on this review.",
                action="A later stage offers it again; this reading stands.",
                invariant=3,
            )

        finding_evidence = None
        if status == Finding.Status.EVIDENCED:
            finding_evidence = _record_evidence(review, criterion, passage)

        finding = Finding.objects.create(
            review=review,
            criterion=criterion,
            status=status,
            evidence=finding_evidence,
            recorded_by=actor,
        )
        DecisionEvent.objects.create(
            candidacy=candidacy,
            type=DecisionEvent.Type.FINDING_RECORDED,
            actor=actor,
            summary=f"{criterion.text}: {status}.",
            brief_stage=stage,
        )
    return finding


def _record_evidence(review, criterion, passage):
    if passage.document is not None and passage.sighting is None:
        source_text = passage.document.parsed_text
    elif passage.sighting is not None and passage.document is None:
        source_text = passage.sighting.snapshot_excerpt
    else:
        raise Refusal(
            requirement="A passage points at a document or a sighting, never both or neither.",
            reason="The passage did not name exactly one source.",
            action="Pick a document or a sighting.",
            invariant=9,
        )

    if not (0 <= passage.char_start < passage.char_end <= len(source_text)):
        raise Refusal(
            requirement="A passage's offsets must fall within the source text.",
            reason="The offsets are out of range for this source.",
            action="Pick the sentence again.",
            invariant=9,
        )

    quote = source_text[passage.char_start : passage.char_end]
    page = paragraph = None
    if passage.document is not None:
        page, paragraph = place_of(passage.document.spans(), passage.char_start)

    return Evidence.objects.create(
        review=review,
        criterion=criterion,
        document=passage.document,
        sighting=passage.sighting,
        char_start=passage.char_start,
        char_end=passage.char_end,
        page=page,
        paragraph=paragraph,
        quote=quote,
    )
