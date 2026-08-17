import uuid

from django.db import models
from django.utils import timezone


class Search(models.Model):
    """One sourcing run against one pinned Brief version, within one pinned scope
    revision (ADR 0015). A brief that changed mid-search is the normal case, not the
    exception — the record must render as it was when the run was made.

    A database trigger refuses attachment to a role that is not open: you cannot look
    for someone before agreeing what counts (invariant 1).
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(
        "organizations.Organization", on_delete=models.PROTECT, related_name="+"
    )
    role = models.ForeignKey("roles.Role", on_delete=models.PROTECT, related_name="searches")
    brief_version = models.ForeignKey(
        "roles.BriefVersion", on_delete=models.PROTECT, related_name="+"
    )
    sourcing_scope = models.ForeignKey(
        "roles.SourcingScope", on_delete=models.PROTECT, related_name="searches"
    )
    ran_by = models.ForeignKey("organizations.User", on_delete=models.PROTECT, related_name="+")
    ran_at = models.DateTimeField(default=timezone.now)
    coverage_note = models.TextField(blank=True, default="")

    class Meta:
        db_table = "search"
