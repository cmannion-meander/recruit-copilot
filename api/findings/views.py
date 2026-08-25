from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.views.decorators.http import require_POST

from candidacies.models import Candidacy
from common.http import json_body, require_user
from documents.models import Document
from roles.models import BriefStage, Criterion
from sightings.models import Sighting

from . import services


def _finding_payload(finding):
    return {
        "id": str(finding.id),
        "review_id": str(finding.review_id),
        "criterion_id": str(finding.criterion_id),
        "status": finding.status,
        "evidence": {"id": str(finding.evidence_id), "quote": finding.evidence.quote}
        if finding.evidence_id
        else None,
    }


@require_POST
@require_user
def record_finding_view(request, candidacy_id):
    candidacy = get_object_or_404(Candidacy, pk=candidacy_id)
    body = json_body(request)
    stage = get_object_or_404(BriefStage, pk=body.get("stage_id"))
    criterion = get_object_or_404(Criterion, pk=body.get("criterion_id"))

    passage = None
    passage_body = body.get("passage")
    if passage_body:
        document = sighting = None
        if passage_body.get("kind") == "document":
            document = get_object_or_404(Document, pk=passage_body.get("document_id"))
        elif passage_body.get("kind") == "sighting":
            sighting = get_object_or_404(Sighting, pk=passage_body.get("sighting_id"))
        passage = services.Passage(
            char_start=passage_body.get("char_start"),
            char_end=passage_body.get("char_end"),
            document=document,
            sighting=sighting,
        )

    finding = services.record_finding(
        candidacy,
        stage=stage,
        criterion=criterion,
        status=body.get("status", ""),
        passage=passage,
        actor=request.user,
    )
    return JsonResponse({"finding": _finding_payload(finding)}, status=201)
