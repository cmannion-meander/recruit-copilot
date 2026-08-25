import uuid

from django.db import models
from django.utils import timezone

from common.models import DerivesOrganization


class Finding(DerivesOrganization, models.Model):
    """Review × Criterion. `evidenced` | `not_found` — two values, nothing else.
    Scannability comes from the fixed-order cell row plus a count; the count never
    renders without the cells (invariant 2: no score column, anywhere).

    One finding per (review, criterion): a second reading at a later stage is a new
    Review and a new Finding, never an update to this one (ADR 0011's carry-forward —
    both readings stay on the record, with their dates and the stage each was taken at).
    """

    organization_from = ("review",)

    class Status(models.TextChoices):
        EVIDENCED = "evidenced"
        NOT_FOUND = "not_found"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(
        "organizations.Organization", on_delete=models.PROTECT, related_name="+"
    )
    review = models.ForeignKey("reviews.Review", on_delete=models.PROTECT, related_name="findings")
    criterion = models.ForeignKey("roles.Criterion", on_delete=models.PROTECT, related_name="+")
    status = models.CharField(max_length=10, choices=Status.choices)
    # Same-(review, criterion) composite FK to evidence.Evidence added in this app's
    # migration — a Finding can only ever back onto Evidence scoped to its own pair.
    evidence = models.OneToOneField(
        "evidence.Evidence", on_delete=models.PROTECT, null=True, blank=True, related_name="finding"
    )
    recorded_by = models.ForeignKey(
        "organizations.User", on_delete=models.PROTECT, related_name="+"
    )
    recorded_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = "finding"
        constraints = [
            models.UniqueConstraint(
                fields=["review", "criterion"], name="finding_review_criterion_unique"
            ),
            models.CheckConstraint(
                condition=models.Q(status__in=["evidenced", "not_found"]),
                name="finding_status_valid",
            ),
            models.CheckConstraint(
                condition=~models.Q(status="evidenced") | models.Q(evidence__isnull=False),
                name="finding_evidenced_requires_evidence",
            ),
        ]

    def __str__(self):
        return f"{self.criterion_id}: {self.status}"
