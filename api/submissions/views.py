from django.db import connection
from django.http import Http404, JsonResponse
from django.shortcuts import get_object_or_404
from django.views.decorators.http import require_GET, require_POST

from candidacies.models import Candidacy
from common.http import require_user

from . import services


@require_POST
@require_user
def create_submission_view(request, candidacy_id):
    candidacy = get_object_or_404(Candidacy, pk=candidacy_id)
    record = services.create_submission(candidacy, actor=request.user)
    return JsonResponse(
        {"submission": {"id": str(record.id), "reference": record.reference}}, status=201
    )


@require_GET
def candidate_view(request, token):
    """No session, no org context — the token is the only credential. Crosses RLS
    through candidate_view_by_token(), the one function built for exactly this
    (ADR 0017). A token that matches nothing looks identical to a wrong guess."""
    with connection.cursor() as cursor:
        cursor.execute("SELECT candidate_view_by_token(%s)", [token])
        row = cursor.fetchone()
    payload = row[0] if row else None
    if payload is None:
        raise Http404
    return JsonResponse(payload)
