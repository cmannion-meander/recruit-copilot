import uuid

from django.db import models


class Person(models.Model):
    """A candidate. Thin at M1 — the isolation tests read this table, so it exists from
    the first migration. Provenance (no person without a resolving Sighting, invariant 9)
    lands in M3 with the sightings app; until then the model has no public creation path.

    Email and phone are nullable because absent is the correct state for someone nobody
    has spoken to — eight of the twelve fixture people have neither
    (docs/prototype-findings.md §3).
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(
        "organizations.Organization", on_delete=models.PROTECT, related_name="+"
    )
    full_name = models.CharField(max_length=300)
    headline = models.CharField(max_length=300, blank=True, default="")
    current_employer = models.CharField(max_length=300, blank=True, default="")
    location = models.CharField(max_length=300, blank=True, default="")
    email = models.EmailField(null=True, blank=True)
    phone = models.CharField(max_length=50, null=True, blank=True)

    class Meta:
        db_table = "person"

    def __str__(self):
        return self.full_name
