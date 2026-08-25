from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.views.decorators.http import require_POST

from common.http import require_user
from people.models import Person

from . import services


@require_POST
@require_user
def upload_document_view(request, person_id):
    person = get_object_or_404(Person, pk=person_id)
    file = request.FILES.get("file")
    if file is None:
        return JsonResponse({"detail": "No file was uploaded."}, status=400)
    document = services.ingest_document(
        person,
        file=file,
        parsed_text=request.POST.get("parsed_text", ""),
        author=request.POST.get("author", ""),
        producer=request.POST.get("producer", ""),
    )
    return JsonResponse(
        {
            "document": {
                "id": str(document.id),
                "filename": document.filename,
                "sha256": document.sha256,
            }
        },
        status=201,
    )
