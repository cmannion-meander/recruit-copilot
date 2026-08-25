import uuid

from django.db import models
from django.utils import timezone

from candidacies.models import TerminalStage
from common.models import DerivesOrganization


class Decision(DerivesOrganization, models.Model):
    """Invariant 4: no free-text-only rejection. Both reason_code and reason_text are
    required at the database, not just in a form — an omitted reason_code inserts as an
    empty string, which the CHECK below refuses exactly as it refuses an empty text."""

    organization_from = ("candidacy",)

    class Kind(models.TextChoices):
        REJECT = "reject"

    class ReasonCode(models.TextChoices):
        BELOW_CRITERIA = "below_criteria"
        SALARY_EXPECTATION = "salary_expectation"
        LOCATION = "location"
        WITHDREW = "withdrew"
        COUNTER_OFFER = "counter_offer"
        CLIENT_DECLINED = "client_declined"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(
        "organizations.Organization", on_delete=models.PROTECT, related_name="+"
    )
    candidacy = models.ForeignKey(
        "candidacies.Candidacy", on_delete=models.CASCADE, related_name="decisions"
    )
    kind = models.CharField(max_length=10, choices=Kind.choices, default=Kind.REJECT)
    reason_code = models.CharField(max_length=30, choices=ReasonCode.choices)
    reason_text = models.TextField()
    decided_by = models.ForeignKey("organizations.User", on_delete=models.PROTECT, related_name="+")
    decided_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = "decision"
        constraints = [
            models.CheckConstraint(condition=models.Q(kind="reject"), name="decision_kind_valid"),
            models.CheckConstraint(
                condition=models.Q(
                    reason_code__in=[
                        "below_criteria",
                        "salary_expectation",
                        "location",
                        "withdrew",
                        "counter_offer",
                        "client_declined",
                    ]
                ),
                name="decision_reason_code_valid",
            ),
            models.CheckConstraint(
                condition=~models.Q(reason_text=""), name="decision_reason_text_not_empty"
            ),
        ]


class DecisionEvent(DerivesOrganization, models.Model):
    """Append-only audit log. Everything consequential writes here, with the stage it
    happened at — 'how far did this one get' is answerable from this log rather than from
    a column that can disagree with it (ADR 0011). UPDATE and DELETE are revoked from
    rcp_app in this app's migration (invariant 8)."""

    organization_from = ("candidacy",)

    class Type(models.TextChoices):
        CANDIDACY_CREATED = "candidacy_created"
        STAGE_CHANGED = "stage_changed"
        REVIEW_RECORDED = "review_recorded"
        FINDING_RECORDED = "finding_recorded"
        SIGNAL_RESOLVED = "signal_resolved"
        SIGNAL_OVERRIDDEN = "signal_overridden"
        REJECTED = "rejected"
        EXCLUDED = "excluded"
        SUBMISSION_CREATED = "submission_created"
        MESSAGE_SENT = "message_sent"
        DEADLINE_EXTENDED = "deadline_extended"
        CHECKPOINT_RECORDED = "checkpoint_recorded"
        # Not in the prototype's reducer action union — the one writer that is not a user
        # command. See docs/backend-prd.md, "Designed, not transcribed."
        AUTO_CLOSED = "auto_closed"
        # Also not in the prototype's action union: the reducer never modeled hiring as
        # a transition (its fixtures simply hold already-placed candidacies). Added for
        # the same reason auto_closed was — a real event needs a real type.
        PLACED = "placed"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(
        "organizations.Organization", on_delete=models.PROTECT, related_name="+"
    )
    candidacy = models.ForeignKey(
        "candidacies.Candidacy", on_delete=models.CASCADE, related_name="events"
    )
    type = models.CharField(max_length=20, choices=Type.choices)
    # Null for the auto-closer — the one event with no human actor.
    actor = models.ForeignKey(
        "organizations.User", on_delete=models.PROTECT, null=True, blank=True, related_name="+"
    )
    at = models.DateTimeField(default=timezone.now)
    summary = models.TextField()
    brief_stage = models.ForeignKey(
        "roles.BriefStage", on_delete=models.PROTECT, null=True, blank=True, related_name="+"
    )
    terminal_stage = models.CharField(
        max_length=20, choices=TerminalStage.choices, null=True, blank=True
    )

    class Meta:
        db_table = "decision_event"
        constraints = [
            models.CheckConstraint(
                condition=models.Q(
                    type__in=[
                        "candidacy_created",
                        "stage_changed",
                        "review_recorded",
                        "finding_recorded",
                        "signal_resolved",
                        "signal_overridden",
                        "rejected",
                        "excluded",
                        "submission_created",
                        "message_sent",
                        "deadline_extended",
                        "checkpoint_recorded",
                        "auto_closed",
                        "placed",
                    ]
                ),
                name="decision_event_type_valid",
            ),
            models.CheckConstraint(
                condition=~(
                    models.Q(brief_stage__isnull=False) & models.Q(terminal_stage__isnull=False)
                ),
                name="decision_event_stage_not_both",
            ),
        ]
