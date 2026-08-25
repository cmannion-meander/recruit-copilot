from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.views.decorators.http import require_POST

from channels.models import Channel
from common.http import json_body, require_user
from people.models import Person
from roles.models import BriefStage, Role

from . import services
from .models import Candidacy


def _candidacy_payload(candidacy):
    return {
        "id": str(candidacy.id),
        "person_id": str(candidacy.person_id),
        "role_id": str(candidacy.role_id),
        "brief_stage_id": str(candidacy.brief_stage_id) if candidacy.brief_stage_id else None,
        "terminal_stage": candidacy.terminal_stage,
        "auto_close_at": candidacy.auto_close_at.isoformat(),
        "closed_at": candidacy.closed_at.isoformat() if candidacy.closed_at else None,
    }


@require_POST
@require_user
def create_candidacy_view(request):
    body = json_body(request)
    role = get_object_or_404(Role, pk=body.get("role_id"))
    person = get_object_or_404(Person, pk=body.get("person_id"))
    channel = get_object_or_404(Channel, pk=body.get("channel_id"))
    candidacy = services.create_candidacy(role, person, channel, actor=request.user)
    return JsonResponse({"candidacy": _candidacy_payload(candidacy)}, status=201)


@require_POST
@require_user
def advance_stage_view(request, candidacy_id):
    candidacy = get_object_or_404(Candidacy, pk=candidacy_id)
    services.advance_stage(candidacy, actor=request.user)
    return JsonResponse({"candidacy": _candidacy_payload(candidacy)})


@require_POST
@require_user
def extend_auto_close_view(request, candidacy_id):
    candidacy = get_object_or_404(Candidacy, pk=candidacy_id)
    body = json_body(request)
    services.extend_auto_close(
        candidacy, message_text=body.get("message_text", ""), actor=request.user
    )
    return JsonResponse({"candidacy": _candidacy_payload(candidacy)})


@require_POST
@require_user
def reject_candidacy_view(request, candidacy_id):
    candidacy = get_object_or_404(Candidacy, pk=candidacy_id)
    body = json_body(request)
    services.reject_candidacy(
        candidacy,
        reason_code=body.get("reason_code", ""),
        reason_text=body.get("reason_text", ""),
        actor=request.user,
    )
    return JsonResponse({"candidacy": _candidacy_payload(candidacy)})


@require_POST
@require_user
def send_stage_message_view(request, candidacy_id):
    candidacy = get_object_or_404(Candidacy, pk=candidacy_id)
    stage = get_object_or_404(BriefStage, pk=json_body(request).get("stage_id"))
    services.send_stage_message(candidacy, stage, actor=request.user)
    return JsonResponse({"candidacy": _candidacy_payload(candidacy)})
