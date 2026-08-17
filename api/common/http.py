"""Small HTTP helpers for the command views. Commands are POST-only, session-authenticated,
and answer refusals through RefusalMiddleware — nothing here catches a Refusal."""

import json
from functools import wraps

from django.http import JsonResponse


def require_user(view):
    @wraps(view)
    def wrapped(request, *args, **kwargs):
        if not request.user.is_authenticated:
            return JsonResponse({"detail": "Sign in to use this."}, status=401)
        return view(request, *args, **kwargs)

    return wrapped


def json_body(request) -> dict:
    try:
        body = json.loads(request.body or b"{}")
    except json.JSONDecodeError:
        return {}
    return body if isinstance(body, dict) else {}
