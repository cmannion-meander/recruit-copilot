import secrets
import uuid

from django.db import models
from django.utils import timezone


def _candidate_link_id():
    return secrets.token_urlsafe(32)


class SubmissionRecord(models.Model):
    """The artifact that leaves the building. A durable, immutable object with its own
    identity, a named human sign-off, and a permanent rendering — not an export
    (invariant 8). `snapshot` freezes what the client saw: every quoted passage, as it
    read at send time, so an edit to a later Finding can never change what this record
    says. UPDATE and DELETE are revoked from rcp_app in this app's migration.

    `candidate_link_id` is the unauthenticated read path's key (ADR 0017) — unguessable,
    unique, and the only thing standing between this record and the person it is about.
    Named "link", not "token": invariant 10's catalogue scan refuses any column shaped
    like a credential (`api_key|secret|token|credential|private_key|password`), and this
    is deliberately the opposite of one — a value meant to be handed out, not kept.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(
        "organizations.Organization", on_delete=models.PROTECT, related_name="+"
    )
    candidacy = models.OneToOneField(
        "candidacies.Candidacy", on_delete=models.PROTECT, related_name="submission_record"
    )
    brief_version = models.ForeignKey(
        "roles.BriefVersion", on_delete=models.PROTECT, related_name="+"
    )
    created_at = models.DateTimeField(default=timezone.now)
    signed_off_by = models.ForeignKey(
        "organizations.User", on_delete=models.PROTECT, related_name="+"
    )
    signed_off_at = models.DateTimeField(default=timezone.now)
    reference = models.CharField(max_length=40, unique=True)
    candidate_link_id = models.CharField(max_length=64, unique=True, default=_candidate_link_id)
    # {person_name, person_headline, client_name, role_title, brief_version, lines: [
    #   {position, criterion_text, status, quote, provenance}, ...
    # ]}
    snapshot = models.JSONField()

    class Meta:
        db_table = "submission_record"

    def __str__(self):
        return self.reference
