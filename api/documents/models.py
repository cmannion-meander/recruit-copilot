import uuid

from django.db import models
from django.utils import timezone

from common.offsets import PageSpan, ParagraphSpan, Spans


class Document(models.Model):
    """A CV or attachment. The file itself goes through the Django storage API — never
    an open() call on a path (CLAUDE.md rule 1) — local disk in dev, Azure Blob in prod.

    Real extraction from two-column PDFs, scans and DOCX is slice 6's budget, out of
    scope here (docs/backend-prd.md non-goals). `parsed_text` is accepted as already
    extracted; pages and paragraphs are derived from it with common/offsets.spans_of(),
    the same function a real parser's output will run through unchanged.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(
        "organizations.Organization", on_delete=models.PROTECT, related_name="+"
    )
    person = models.ForeignKey("people.Person", on_delete=models.PROTECT, related_name="documents")
    kind = models.CharField(max_length=20, default="cv")
    file = models.FileField(upload_to="documents/%Y/%m/")
    filename = models.CharField(max_length=300)
    sha256 = models.CharField(max_length=64)
    uploaded_at = models.DateTimeField(default=timezone.now)

    parsed_text = models.TextField()
    # Each a list of dicts shaped like common.offsets.PageSpan / ParagraphSpan.
    pages = models.JSONField(default=list)
    paragraphs = models.JSONField(default=list)

    author = models.CharField(max_length=300, blank=True, default="")
    producer = models.CharField(max_length=300, blank=True, default="")
    properties_created = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "document"
        constraints = [
            models.CheckConstraint(condition=models.Q(kind="cv"), name="document_kind_valid"),
        ]

    def __str__(self):
        return self.filename

    def spans(self) -> Spans:
        return Spans(
            pages=[PageSpan(**p) for p in self.pages],
            paragraphs=[ParagraphSpan(**p) for p in self.paragraphs],
        )
