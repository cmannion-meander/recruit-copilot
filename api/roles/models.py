import uuid

from django.contrib.postgres.fields import ArrayField
from django.db import models
from django.utils import timezone

from .exceptions import BriefIncomplete

MINIMUM_CRITERIA = 3


class Role(models.Model):
    """A job the agency is working. draft → open → closed.

    Opening pins the Brief version, and nothing can attach to a role that is not open —
    the attach triggers land with the tables they guard (Search in M3, Candidacy in M4).
    """

    class State(models.TextChoices):
        DRAFT = "draft"
        OPEN = "open"
        CLOSED = "closed"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(
        "organizations.Organization", on_delete=models.PROTECT, related_name="+"
    )
    client = models.ForeignKey("clients.Client", on_delete=models.PROTECT, related_name="roles")
    title = models.CharField(max_length=300)
    state = models.CharField(max_length=10, choices=State.choices, default=State.DRAFT)
    pinned_brief_version = models.ForeignKey(
        "roles.BriefVersion", on_delete=models.PROTECT, null=True, blank=True, related_name="+"
    )
    opened_at = models.DateTimeField(null=True, blank=True)
    closed_at = models.DateTimeField(null=True, blank=True)
    closed_reason = models.TextField(null=True, blank=True)

    class Meta:
        db_table = "role"
        constraints = [
            models.CheckConstraint(
                condition=models.Q(state__in=["draft", "open", "closed"]),
                name="role_state_valid",
            ),
            # An open role without a pinned version is a role whose records could not
            # render as they were when made. The pin is part of what "open" means.
            models.CheckConstraint(
                condition=~models.Q(state="open")
                | (
                    models.Q(pinned_brief_version__isnull=False) & models.Q(opened_at__isnull=False)
                ),
                name="role_open_is_pinned",
            ),
            models.CheckConstraint(
                condition=~models.Q(state="closed") | models.Q(closed_at__isnull=False),
                name="role_closed_has_closed_at",
            ),
        ]

    def __str__(self):
        return self.title

    def open(self):
        """Invariant 1, two refusals in sequence: at least three criteria, then every
        criterion assigned to the stage that will evidence it. Success pins the version.
        """
        if self.state != Role.State.DRAFT:
            raise BriefIncomplete(
                requirement="Only a draft role can open.",
                reason=f"This role is {self.state}.",
                action="Nothing to do — its state does not move from here.",
                invariant=1,
            )

        version = self.brief.versions.order_by("-version").first()
        criteria = list(version.criteria.order_by("position")) if version else []
        if len(criteria) < MINIMUM_CRITERIA:
            raise BriefIncomplete(
                requirement=(
                    "This role can't open until The Brief defines at least three criteria."
                ),
                reason=f"The Brief defines {len(criteria)}.",
                action="Open The Brief and add what must be evidenced.",
                invariant=1,
            )

        assigned = set(
            BriefStageCriterion.objects.filter(brief_version=version).values_list(
                "criterion_id", flat=True
            )
        )
        unassigned = [c for c in criteria if c.id not in assigned]
        if unassigned:
            from common.refusals import RefusalItem

            raise BriefIncomplete(
                requirement=(
                    "This role can't open until every criterion is assigned to the stage "
                    "that will evidence it."
                ),
                reason=f"{len(unassigned)} of {len(criteria)} are assigned to no stage.",
                action="Assign each one to a stage in The Brief.",
                items=tuple(
                    RefusalItem(label=c.text, detail=f"Criterion {c.position} of {len(criteria)}")
                    for c in unassigned
                ),
                invariant=1,
            )

        self.state = Role.State.OPEN
        self.pinned_brief_version = version
        self.opened_at = timezone.now()
        self.save(update_fields=["state", "pinned_brief_version", "opened_at"])


class Brief(models.Model):
    """The criteria set and the stages, versioned together (ADR 0011). The sourcing
    scope is deliberately not here — see SourcingScope and ADR 0015."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(
        "organizations.Organization", on_delete=models.PROTECT, related_name="+"
    )
    role = models.OneToOneField(Role, on_delete=models.CASCADE, related_name="brief")

    class Meta:
        db_table = "brief"


class BriefVersion(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(
        "organizations.Organization", on_delete=models.PROTECT, related_name="+"
    )
    brief = models.ForeignKey(Brief, on_delete=models.CASCADE, related_name="versions")
    version = models.PositiveIntegerField()
    created_at = models.DateTimeField(default=timezone.now)
    created_by = models.ForeignKey("organizations.User", on_delete=models.PROTECT, related_name="+")
    note = models.TextField(blank=True, default="")

    class Meta:
        db_table = "brief_version"
        constraints = [
            models.UniqueConstraint(fields=["brief", "version"], name="brief_version_unique"),
        ]


class Criterion(models.Model):
    """One requirement. Ordered; the order is fixed for the life of the version and
    drives the cell row."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(
        "organizations.Organization", on_delete=models.PROTECT, related_name="+"
    )
    brief_version = models.ForeignKey(
        BriefVersion, on_delete=models.CASCADE, related_name="criteria"
    )
    position = models.PositiveIntegerField()
    text = models.TextField()
    cell_label = models.CharField(max_length=80, blank=True, default="")

    class Meta:
        db_table = "criterion"
        constraints = [
            models.UniqueConstraint(
                fields=["brief_version", "position"], name="criterion_position_unique"
            ),
        ]

    def __str__(self):
        return self.text


class BriefStage(models.Model):
    """One stage, and the criteria it evidences. Versioned with the rubric and repinned
    with it (ADR 0011). A stage may carry no criteria — Contacted and Client interview
    do real work that evidences nothing, and inventing an assessment to justify a stage
    is how a structured process turns into ceremony."""

    class Owner(models.TextChoices):
        RECRUITER = "recruiter"
        CLIENT = "client"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(
        "organizations.Organization", on_delete=models.PROTECT, related_name="+"
    )
    brief_version = models.ForeignKey(BriefVersion, on_delete=models.CASCADE, related_name="stages")
    position = models.PositiveIntegerField()
    label = models.CharField(max_length=120)
    purpose = models.TextField(blank=True, default="")
    owner = models.CharField(max_length=10, choices=Owner.choices, default=Owner.RECRUITER)
    # Invariant 6: a candidacy cannot leave a stage until the candidate has been told they
    # reached it. A stage with nothing to say to the candidate is a stage where somebody
    # goes quiet, so the message is non-nullable and non-empty at the schema.
    candidate_message = models.TextField()

    class Meta:
        db_table = "brief_stage"
        constraints = [
            models.UniqueConstraint(
                fields=["brief_version", "position"], name="brief_stage_position_unique"
            ),
            models.CheckConstraint(
                condition=~models.Q(candidate_message=""),
                name="brief_stage_message_not_empty",
            ),
            models.CheckConstraint(
                condition=models.Q(owner__in=["recruiter", "client"]),
                name="brief_stage_owner_valid",
            ),
        ]

    def __str__(self):
        return self.label


class BriefStageCriterion(models.Model):
    """The assignment: this stage evidences this criterion. brief_version is carried
    redundantly so composite foreign keys (added in the migration) make a cross-version
    assignment impossible at the database, not just unlikely in the application."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(
        "organizations.Organization", on_delete=models.PROTECT, related_name="+"
    )
    brief_version = models.ForeignKey(BriefVersion, on_delete=models.CASCADE, related_name="+")
    brief_stage = models.ForeignKey(
        BriefStage, on_delete=models.CASCADE, related_name="criterion_assignments"
    )
    criterion = models.ForeignKey(Criterion, on_delete=models.CASCADE, related_name="assignments")

    class Meta:
        db_table = "brief_stage_criterion"
        constraints = [
            models.UniqueConstraint(
                fields=["brief_stage", "criterion"], name="brief_stage_criterion_unique"
            ),
        ]


class SourcingScope(models.Model):
    """Where to look. Its own object with its own revision, pointing at a BriefVersion —
    never part of it, because widening where you look changes nothing about what anyone
    is assessed against (ADR 0015, docs/prototype-findings.md §1)."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(
        "organizations.Organization", on_delete=models.PROTECT, related_name="+"
    )
    brief_version = models.ForeignKey(BriefVersion, on_delete=models.PROTECT, related_name="scopes")
    revision = models.PositiveIntegerField()
    created_at = models.DateTimeField(default=timezone.now)
    created_by = models.ForeignKey("organizations.User", on_delete=models.PROTECT, related_name="+")
    note = models.TextField(blank=True, default="")
    markets = ArrayField(models.TextField(), default=list, blank=True)
    employers = ArrayField(models.TextField(), default=list, blank=True)
    geography = models.TextField(blank=True, default="")
    exclusions = ArrayField(models.TextField(), default=list, blank=True)

    class Meta:
        db_table = "sourcing_scope"
        constraints = [
            models.UniqueConstraint(
                fields=["brief_version", "revision"], name="sourcing_scope_revision_unique"
            ),
        ]
