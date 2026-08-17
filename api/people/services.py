"""The person commands. Both cross the same constraint: a person cannot exist without a
resolving sighting (invariant 9).

The provenance trigger is INITIALLY IMMEDIATE, so a bare insert refuses at the statement.
The legitimate path defers it: the person row goes in before its sighting, and the check
runs at commit — the promise is kept by the transaction, not by statement order.
"""

from django.db import connection
from django.utils import timezone

from common.refusals import Refusal, RefusalItem
from sightings.models import Sighting

from .models import Person


def _defer_provenance():
    with connection.cursor() as cursor:
        cursor.execute("SET CONSTRAINTS person_provenance DEFERRED")


def create_person_from_sighting(
    sighting, *, full_name, headline="", current_employer="", location=""
):
    """Resolve a triage sighting into a person. The sighting is the provenance."""
    if not sighting.resolving or sighting.person_id is not None:
        raise Refusal(
            requirement="A person is created from a sighting that resolves and is not yet anybody.",
            reason=(
                "This sighting is already somebody's."
                if sighting.person_id
                else "This sighting does not resolve a person."
            ),
            action="Open the sourcing screen and pick a sighting from the triage list.",
            invariant=9,
        )
    if not full_name.strip():
        raise Refusal(
            requirement="A person record starts with a name.",
            reason="The name is empty.",
            action="Write the name as the source shows it.",
            invariant=9,
        )
    _defer_provenance()
    person = Person.objects.create(
        organization=sighting.organization,
        full_name=full_name.strip(),
        headline=headline.strip(),
        current_employer=current_employer.strip(),
        location=location.strip(),
    )
    sighting.person = person
    sighting.save(update_fields=["person"])
    return person


def create_person_by_hand(
    organization,
    *,
    full_name,
    headline="",
    current_employer="",
    location="",
    source_url="",
    source_name="",
    snapshot_excerpt="",
):
    """Add a person the recruiter found themselves. The source and what it said are not
    optional fields — they are the record's licence to exist."""
    missing = []
    if not full_name.strip():
        missing.append(RefusalItem(label="The person's name"))
    if not source_url.strip():
        missing.append(RefusalItem(label="The source URL", detail="Where this person was read"))
    if not snapshot_excerpt.strip():
        missing.append(
            RefusalItem(label="What the source said", detail="The passage as it read today")
        )
    if missing:
        raise Refusal(
            requirement=(
                "A person can't exist without a name, a resolving source, and what the source said."
            ),
            reason=f"{len(missing)} of the three are not on the record.",
            action="Fill in what is named below, then add the person again.",
            items=tuple(missing),
            invariant=9,
        )
    _defer_provenance()
    person = Person.objects.create(
        organization=organization,
        full_name=full_name.strip(),
        headline=headline.strip(),
        current_employer=current_employer.strip(),
        location=location.strip(),
    )
    Sighting.objects.create(
        organization=organization,
        person=person,
        source_url=source_url.strip(),
        source_name=source_name.strip(),
        source_kind="manual",
        retrieved_at=timezone.now(),
        snapshot_excerpt=snapshot_excerpt.strip(),
        resolving=True,
    )
    return person
