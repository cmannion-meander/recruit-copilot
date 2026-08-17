from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.views.decorators.http import require_POST

from common.http import json_body, require_user
from sightings.models import Sighting

from . import services


def _person_payload(person):
    return {
        "id": str(person.id),
        "full_name": person.full_name,
        "headline": person.headline,
        "current_employer": person.current_employer,
        "location": person.location,
        "email": person.email,
        "phone": person.phone,
    }


@require_POST
@require_user
def create_person_view(request):
    body = json_body(request)
    person = services.create_person_by_hand(
        request.user.organization,
        full_name=body.get("full_name", ""),
        headline=body.get("headline", ""),
        current_employer=body.get("current_employer", ""),
        location=body.get("location", ""),
        source_url=body.get("source_url", ""),
        source_name=body.get("source_name", ""),
        snapshot_excerpt=body.get("snapshot_excerpt", ""),
    )
    return JsonResponse({"person": _person_payload(person)}, status=201)


@require_POST
@require_user
def create_person_from_sighting_view(request, sighting_id):
    sighting = get_object_or_404(Sighting, pk=sighting_id)
    body = json_body(request)
    person = services.create_person_from_sighting(
        sighting,
        full_name=body.get("full_name", ""),
        headline=body.get("headline", ""),
        current_employer=body.get("current_employer", ""),
        location=body.get("location", ""),
    )
    return JsonResponse({"person": _person_payload(person)}, status=201)
