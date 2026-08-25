import uuid

from django.db import models


class Channel(models.Model):
    """Where a candidacy came from. Named by the agency. Counts by channel, never a rate."""

    class Kind(models.TextChoices):
        OUTBOUND = "outbound"
        INBOUND = "inbound"
        REFERRAL = "referral"
        NETWORK = "network"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(
        "organizations.Organization", on_delete=models.PROTECT, related_name="+"
    )
    name = models.CharField(max_length=200)
    kind = models.CharField(max_length=10, choices=Kind.choices)
    note = models.TextField(blank=True, default="")

    class Meta:
        db_table = "channel"
        constraints = [
            models.CheckConstraint(
                condition=models.Q(kind__in=["outbound", "inbound", "referral", "network"]),
                name="channel_kind_valid",
            ),
        ]

    def __str__(self):
        return self.name
