import uuid

from django.db import models
from django.utils import timezone

from common.models import DerivesOrganization


class Evidence(DerivesOrganization, models.Model):
    """The quoted passage. Points at a Document or a Sighting, never at nothing
    (invariant 9) — and the offsets are always computed by common.offsets, never typed
    (docs/backend-prd.md delta #2: the API takes offsets, the server extracts the
    substring, a typed quotation never ships). Append-only: UPDATE and DELETE are
    revoked from rcp_app in this app's migration (invariant 8).

    Scoped to (review, criterion) — the same axis Finding is scoped to — so a composite
    foreign key from Finding.evidence (findings/migrations) can guarantee a finding only
    ever backs onto evidence for its own review and criterion, never someone else's.
    """

    organization_from = ("review",)

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(
        "organizations.Organization", on_delete=models.PROTECT, related_name="+"
    )
    review = models.ForeignKey("reviews.Review", on_delete=models.PROTECT, related_name="+")
    criterion = models.ForeignKey("roles.Criterion", on_delete=models.PROTECT, related_name="+")
    document = models.ForeignKey(
        "documents.Document", on_delete=models.PROTECT, null=True, blank=True, related_name="+"
    )
    sighting = models.ForeignKey(
        "sightings.Sighting", on_delete=models.PROTECT, null=True, blank=True, related_name="+"
    )
    char_start = models.IntegerField(null=True, blank=True)
    char_end = models.IntegerField(null=True, blank=True)
    page = models.IntegerField(null=True, blank=True)  # document targets only
    paragraph = models.IntegerField(null=True, blank=True)  # document targets only
    quote = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = "evidence"
        constraints = [
            models.UniqueConstraint(
                fields=["review", "criterion"], name="evidence_review_criterion_unique"
            ),
            # One valid row is a complete document citation or a complete sighting
            # citation, never neither — a single combined condition rather than plain
            # NOT NULL columns, so an empty row fails on THIS rule rather than on an
            # incidental missing-offset violation that would leave the real rule untested.
            models.CheckConstraint(
                condition=(
                    models.Q(
                        document__isnull=False,
                        sighting__isnull=True,
                        char_start__isnull=False,
                        char_end__isnull=False,
                        page__isnull=False,
                        paragraph__isnull=False,
                        quote__isnull=False,
                    )
                    | models.Q(
                        document__isnull=True,
                        sighting__isnull=False,
                        char_start__isnull=False,
                        char_end__isnull=False,
                        quote__isnull=False,
                    )
                ),
                name="evidence_points_at_document_or_sighting",
            ),
        ]

    def __str__(self):
        return self.quote or ""
