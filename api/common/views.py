from django.http import JsonResponse
from django.views.decorators.http import require_GET

from .http import require_user
from .workspace import build_workspace


@require_GET
@require_user
def workspace_view(request):
    return JsonResponse(build_workspace(request.user.organization))
