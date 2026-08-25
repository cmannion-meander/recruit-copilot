import uuid

from django.db import models
from django.utils import timezone

from common.models import DerivesOrganization


class CrosscheckSignal(DerivesOrganization, models.Model):
    """An integrity observation. Type, detail, artifact reference — never a probability,
    never a severity (docs/data-model.md: "Crosscheck signals are observations, not
    judgements"). Prefer computed signals to model calls: timeline arithmetic,
    duplicates across the org's own history, document metadata — deterministic, cheap,
    and defensible to a client in a way a model's opinion is not.

    `artifact` is a JSONField, deliberately wider than Evidence's target (ADR 0016's
    EvidenceTarget stays FK-based because it is the product's citation mechanism).
    Two of the four kinds — document_property, record — cannot render as a quoted
    passage at all; whether that is permanent or Evidence should widen to admit an
    internal record is an ADR owed before slice 9 (docs/backend-prd.md), not resolved
    here. The shapes, matching the prototype's CrosscheckArtifact:
      {"kind": "document_text", "document_id": ..., "char_start": ..., "char_end": ...}
      {"kind": "document_property", "document_id": ..., "property": ..., "value": ...}
      {"kind": "sighting", "sighting_id": ..., "char_start": ..., "char_end": ...}
      {"kind": "record", "label": ..., "detail": ..., "candidacy_id": ... | None}
    """

    organization_from = ("candidacy",)

    class Type(models.TextChoices):
        TIMELINE_OVERLAP = "timeline_overlap"
        CONTACT_COLLISION = "contact_collision"
        DOCUMENT_AUTHOR = "document_author"
        DUPLICATE_CANDIDACY = "duplicate_candidacy"

    class ResolutionKind(models.TextChoices):
        RESOLVED = "resolved"
        OVERRIDDEN = "overridden"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(
        "organizations.Organization", on_delete=models.PROTECT, related_name="+"
    )
    candidacy = models.ForeignKey(
        "candidacies.Candidacy", on_delete=models.PROTECT, related_name="crosscheck_signals"
    )
    type = models.CharField(max_length=30, choices=Type.choices)
    detail = models.TextField()
    artifact = models.JSONField()
    observed_at = models.DateTimeField(default=timezone.now)

    # A signal is resolved by either a recorded resolution or an override carrying a
    # user and a written reason (invariant 5) — the same shape either way (who, when,
    # why), so one set of columns with a kind discriminator rather than two sub-objects.
    resolution_kind = models.CharField(
        max_length=10, choices=ResolutionKind.choices, null=True, blank=True
    )
    resolved_by = models.ForeignKey(
        "organizations.User", on_delete=models.PROTECT, null=True, blank=True, related_name="+"
    )
    resolved_at = models.DateTimeField(null=True, blank=True)
    resolution_note = models.TextField(null=True, blank=True)

    class Meta:
        db_table = "crosscheck_signal"
        constraints = [
            models.CheckConstraint(
                condition=models.Q(
                    type__in=[
                        "timeline_overlap",
                        "contact_collision",
                        "document_author",
                        "duplicate_candidacy",
                    ]
                ),
                name="crosscheck_signal_type_valid",
            ),
            models.CheckConstraint(
                condition=(
                    models.Q(resolution_kind__isnull=True)
                    & models.Q(resolved_by__isnull=True)
                    & models.Q(resolved_at__isnull=True)
                    & models.Q(resolution_note__isnull=True)
                )
                | (
                    models.Q(resolution_kind__in=["resolved", "overridden"])
                    & models.Q(resolved_by__isnull=False)
                    & models.Q(resolved_at__isnull=False)
                    & ~models.Q(resolution_note="")
                    & models.Q(resolution_note__isnull=False)
                ),
                name="crosscheck_signal_resolution_complete_or_absent",
            ),
        ]

    def __str__(self):
        return f"{self.type}: {self.detail}"
