from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.views.decorators.http import require_POST

from common.http import json_body, require_user

from . import services
from .models import CrosscheckSignal


def _signal_payload(signal):
    return {
        "id": str(signal.id),
        "type": signal.type,
        "detail": signal.detail,
        "resolution_kind": signal.resolution_kind,
    }


@require_POST
@require_user
def resolve_signal_view(request, signal_id):
    signal = get_object_or_404(CrosscheckSignal, pk=signal_id)
    services.resolve_signal(signal, note=json_body(request).get("note", ""), actor=request.user)
    return JsonResponse({"signal": _signal_payload(signal)})


@require_POST
@require_user
def override_signal_view(request, signal_id):
    signal = get_object_or_404(CrosscheckSignal, pk=signal_id)
    services.override_signal(
        signal, reason_text=json_body(request).get("reason_text", ""), actor=request.user
    )
    return JsonResponse({"signal": _signal_payload(signal)})
