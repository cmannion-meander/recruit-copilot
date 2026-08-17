import json

from django.contrib.auth import authenticate, login, logout
from django.http import HttpResponse, JsonResponse
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.http import require_http_methods


def _user_payload(request):
    if not request.user.is_authenticated:
        return {"user": None}
    user = request.user
    return {
        "user": {
            "username": user.get_username(),
            "name": user.get_full_name() or user.get_username(),
            "title": user.title,
        },
        "organization": {"id": str(user.organization_id), "name": user.organization.name},
    }


@ensure_csrf_cookie
@require_http_methods(["GET", "POST", "DELETE"])
def session_view(request):
    if request.method == "GET":
        return JsonResponse(_user_payload(request))

    if request.method == "DELETE":
        logout(request)
        return HttpResponse(status=204)

    try:
        body = json.loads(request.body or b"{}")
    except json.JSONDecodeError:
        return JsonResponse({"detail": "The request body is not JSON."}, status=400)
    user = authenticate(request, username=body.get("username"), password=body.get("password"))
    if user is None:
        return JsonResponse({"detail": "The username and password did not match."}, status=401)
    login(request, user)
    request.session["org_id"] = str(user.organization_id)
    return JsonResponse(_user_payload(request))
