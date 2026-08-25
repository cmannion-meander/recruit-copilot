import uuid

from django.db import models
from django.utils import timezone

from common.models import DerivesOrganization


class Review(DerivesOrganization, models.Model):
    """One scorecard, at one stage. Pins the BriefVersion and BriefStage it was made
    under — a Brief that changed mid-pipeline is the normal case, and every record must
    render as it was when made. A candidacy accumulates several: the sourcing read, the
    screening call, the competency call, each responsible only for the criteria its
    stage carries (ADR 0011)."""

    organization_from = ("candidacy",)

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(
        "organizations.Organization", on_delete=models.PROTECT, related_name="+"
    )
    candidacy = models.ForeignKey(
        "candidacies.Candidacy", on_delete=models.PROTECT, related_name="reviews"
    )
    brief_version = models.ForeignKey(
        "roles.BriefVersion", on_delete=models.PROTECT, related_name="+"
    )
    brief_stage = models.ForeignKey("roles.BriefStage", on_delete=models.PROTECT, related_name="+")
    created_by = models.ForeignKey("organizations.User", on_delete=models.PROTECT, related_name="+")
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = "review"
        constraints = [
            models.UniqueConstraint(
                fields=["candidacy", "brief_stage"], name="review_candidacy_stage_unique"
            ),
        ]

    def __str__(self):
        return f"{self.candidacy_id} @ {self.brief_stage_id}"

    def advance(self):
        """Invariant 3. Raises reviews.exceptions.IncompleteScorecard, naming the
        criteria with no entry, if this review's stage is not fully evidenced."""
        from .services import require_stage_complete

        require_stage_complete(self.brief_stage, self)
