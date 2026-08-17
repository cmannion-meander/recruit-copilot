from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.views.decorators.http import require_POST

from common.http import json_body, require_user

from . import services
from .models import BriefStage, Criterion, Role


def _role_payload(role):
    return {
        "id": str(role.id),
        "title": role.title,
        "state": role.state,
        "pinned_brief_version_id": (
            str(role.pinned_brief_version_id) if role.pinned_brief_version_id else None
        ),
        "opened_at": role.opened_at.isoformat() if role.opened_at else None,
    }


@require_POST
@require_user
def add_criterion_view(request, role_id):
    role = get_object_or_404(Role, pk=role_id)
    body = json_body(request)
    criterion = services.add_criterion(
        role, text=body.get("text", ""), cell_label=body.get("cell_label", "")
    )
    return JsonResponse(
        {
            "criterion": {
                "id": str(criterion.id),
                "brief_version_id": str(criterion.brief_version_id),
                "position": criterion.position,
                "text": criterion.text,
                "cell_label": criterion.cell_label,
            }
        },
        status=201,
    )


@require_POST
@require_user
def assign_criterion_view(request, criterion_id):
    criterion = get_object_or_404(Criterion, pk=criterion_id)
    stage = get_object_or_404(BriefStage, pk=json_body(request).get("stage_id"))
    assignment = services.assign_criterion(criterion, stage)
    return JsonResponse(
        {
            "assignment": {
                "criterion_id": str(assignment.criterion_id),
                "stage_id": str(assignment.brief_stage_id),
            }
        }
    )


@require_POST
@require_user
def open_role_view(request, role_id):
    role = get_object_or_404(Role, pk=role_id)
    role.open()
    return JsonResponse({"role": _role_payload(role)})
