from datetime import date

from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.views.decorators.http import require_POST

from candidacies.models import Candidacy
from common.http import json_body, require_user

from . import services
from .models import PlacementCheckpoint


@require_POST
@require_user
def create_placement_view(request, candidacy_id):
    candidacy = get_object_or_404(Candidacy, pk=candidacy_id)
    body = json_body(request)
    placement = services.create_placement(
        candidacy,
        started_on=date.fromisoformat(body.get("started_on", "")),
        probation_ends_on=date.fromisoformat(body.get("probation_ends_on", "")),
        actor=request.user,
    )
    return JsonResponse({"placement": {"id": str(placement.id)}}, status=201)


@require_POST
@require_user
def record_checkpoint_view(request, checkpoint_id):
    checkpoint = get_object_or_404(PlacementCheckpoint, pk=checkpoint_id)
    body = json_body(request)
    services.record_checkpoint(
        checkpoint,
        note=body.get("note", ""),
        brief_feedback=body.get("brief_feedback", ""),
        actor=request.user,
    )
    return JsonResponse(
        {
            "checkpoint": {
                "id": str(checkpoint.id),
                "day": checkpoint.day,
                "recorded_at": checkpoint.recorded_at.isoformat()
                if checkpoint.recorded_at
                else None,
            }
        }
    )
