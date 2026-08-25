import uuid

from django.db import models
from django.utils import timezone

from common.models import DerivesOrganization


class TerminalStage(models.TextChoices):
    """Fixed outcomes of the pipeline, not customisable per organisation — unlike
    BriefStage, which is per-Brief-version. A candidacy is at exactly one of a BriefStage
    or a TerminalStage, never both, never neither."""

    PLACED = "placed"
    REJECTED = "rejected"
    EXCLUDED = "excluded"
    CLOSED_NO_RESPONSE = "closed_no_response"


class Candidacy(DerivesOrganization, models.Model):
    """Person × Role. The central join, and the billable unit. Created by sourcing,
    import, or inbound. `auto_close_at` is not null from the moment of insert — invariant
    6 — and moves only through the trigger in this app's migration (ADR 0012)."""

    organization_from = ("role",)

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(
        "organizations.Organization", on_delete=models.PROTECT, related_name="+"
    )
    person = models.ForeignKey(
        "people.Person", on_delete=models.PROTECT, related_name="candidacies"
    )
    role = models.ForeignKey("roles.Role", on_delete=models.PROTECT, related_name="candidacies")
    # Pinned at creation from role.pinned_brief_version — a brief that changed mid-pipeline
    # is the normal case, and every record must render as it was when made.
    brief_version = models.ForeignKey(
        "roles.BriefVersion", on_delete=models.PROTECT, related_name="+"
    )
    channel = models.ForeignKey("channels.Channel", on_delete=models.PROTECT, related_name="+")
    brief_stage = models.ForeignKey(
        "roles.BriefStage", on_delete=models.PROTECT, null=True, blank=True, related_name="+"
    )
    terminal_stage = models.CharField(
        max_length=20, choices=TerminalStage.choices, null=True, blank=True
    )
    created_at = models.DateTimeField(default=timezone.now)
    auto_close_at = models.DateTimeField()
    closed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "candidacy"
        constraints = [
            models.UniqueConstraint(fields=["role", "person"], name="candidacy_role_person_unique"),
            models.CheckConstraint(
                condition=(
                    (models.Q(brief_stage__isnull=False) & models.Q(terminal_stage__isnull=True))
                    | (models.Q(brief_stage__isnull=True) & models.Q(terminal_stage__isnull=False))
                ),
                name="candidacy_stage_xor_terminal",
            ),
            models.CheckConstraint(
                condition=models.Q(terminal_stage__isnull=True) | models.Q(closed_at__isnull=False),
                name="candidacy_terminal_has_closed_at",
            ),
        ]

    def __str__(self):
        return f"{self.person_id} × {self.role_id}"


class CandidateMessage(DerivesOrganization, models.Model):
    """What the candidate was told, and when. Append-only in spirit: no service function
    ever calls .save() on an existing row, and what a candidate reads is what was written
    — there is no internal version and no second, softer text (invariant 6)."""

    organization_from = ("candidacy",)

    class Kind(models.TextChoices):
        STAGE = "stage"
        REJECTION = "rejection"
        AUTO_CLOSURE = "auto_closure"
        SUBMISSION = "submission"
        EXTENSION = "extension"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(
        "organizations.Organization", on_delete=models.PROTECT, related_name="+"
    )
    candidacy = models.ForeignKey(Candidacy, on_delete=models.CASCADE, related_name="messages")
    kind = models.CharField(max_length=20, choices=Kind.choices)
    brief_stage = models.ForeignKey(
        "roles.BriefStage", on_delete=models.PROTECT, null=True, blank=True, related_name="+"
    )
    sent_at = models.DateTimeField(default=timezone.now)
    # Null for the one message a user did not send: the auto-closer.
    sent_by = models.ForeignKey(
        "organizations.User", on_delete=models.PROTECT, null=True, blank=True, related_name="+"
    )
    body = models.TextField()

    class Meta:
        db_table = "candidate_message"
        constraints = [
            models.CheckConstraint(
                condition=~models.Q(body=""), name="candidate_message_body_not_empty"
            ),
        ]
