import uuid

from django.db import models

from common.models import DerivesOrganization


class Sighting(DerivesOrganization, models.Model):
    """Where a person was found: source URL, when it was read, and what it said on the
    day. Mandatory — no resolving source, no person record (invariant 9), and the
    snapshot is stored because the live page moves on and the citation must not rot
    into a dead link.

    Sightings accumulate; they do not update. A re-fetch is a new sighting with a new
    `retrieved_at`, never a mutation of the first (docs/prototype-findings.md §5).
    """

    organization_from = ("person", "search")

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(
        "organizations.Organization", on_delete=models.PROTECT, related_name="+"
    )
    # Null until the sighting is resolved into a person — the triage state on the
    # sourcing screen is exactly this: read, and not yet anybody.
    person = models.ForeignKey(
        "people.Person", on_delete=models.PROTECT, null=True, blank=True, related_name="sightings"
    )
    search = models.ForeignKey(
        "searches.Search", on_delete=models.PROTECT, null=True, blank=True, related_name="sightings"
    )
    source_url = models.TextField()
    source_name = models.CharField(max_length=300, blank=True, default="")
    source_kind = models.CharField(max_length=100, blank=True, default="")
    retrieved_at = models.DateTimeField()
    snapshot_excerpt = models.TextField(blank=True, default="")
    resolving = models.BooleanField(default=False)

    class Meta:
        db_table = "sighting"
        constraints = [
            models.CheckConstraint(
                condition=~models.Q(source_url=""),
                name="sighting_has_source_url",
            ),
        ]

    def __str__(self):
        return self.source_url
