import uuid

from django.db import models

from common.models import DerivesOrganization


class Placement(DerivesOrganization, models.Model):
    """After the start date. Exists from the moment an offer is signed — the plan is
    what the candidate is told they are joining. Pins the BriefVersion hired against,
    the same pinning discipline as every other record on the candidacy."""

    organization_from = ("candidacy",)

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(
        "organizations.Organization", on_delete=models.PROTECT, related_name="+"
    )
    candidacy = models.OneToOneField(
        "candidacies.Candidacy", on_delete=models.PROTECT, related_name="placement"
    )
    brief_version = models.ForeignKey(
        "roles.BriefVersion", on_delete=models.PROTECT, related_name="+"
    )
    started_on = models.DateField()
    probation_ends_on = models.DateField()

    class Meta:
        db_table = "placement"

    def __str__(self):
        return f"{self.candidacy_id} from {self.started_on}"


class PlacementCheckpoint(DerivesOrganization, models.Model):
    """Day 7, 30, 60, 90. A checkpoint records what happened, in words, on a date — not
    a rating. `brief_feedback` is the part that matters: what the next Brief for this
    client should ask for differently, surfaced on that Brief's screen (ADR 0011)."""

    organization_from = ("placement",)

    class Day(models.IntegerChoices):
        SEVEN = 7
        THIRTY = 30
        SIXTY = 60
        NINETY = 90

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(
        "organizations.Organization", on_delete=models.PROTECT, related_name="+"
    )
    placement = models.ForeignKey(Placement, on_delete=models.CASCADE, related_name="checkpoints")
    day = models.PositiveSmallIntegerField(choices=Day.choices)
    due_on = models.DateField()
    recorded_at = models.DateTimeField(null=True, blank=True)
    recorded_by = models.ForeignKey(
        "organizations.User", on_delete=models.PROTECT, null=True, blank=True, related_name="+"
    )
    note = models.TextField(null=True, blank=True)
    brief_feedback = models.TextField(null=True, blank=True)

    class Meta:
        db_table = "placement_checkpoint"
        constraints = [
            models.UniqueConstraint(
                fields=["placement", "day"], name="checkpoint_placement_day_unique"
            ),
            models.CheckConstraint(
                condition=models.Q(day__in=[7, 30, 60, 90]), name="checkpoint_day_valid"
            ),
            models.CheckConstraint(
                condition=(
                    models.Q(recorded_at__isnull=True)
                    & models.Q(recorded_by__isnull=True)
                    & models.Q(note__isnull=True)
                )
                | (
                    models.Q(recorded_at__isnull=False)
                    & models.Q(recorded_by__isnull=False)
                    & models.Q(note__isnull=False)
                    & ~models.Q(note="")
                ),
                name="checkpoint_recorded_complete_or_absent",
            ),
        ]

    def __str__(self):
        return f"day {self.day}"
