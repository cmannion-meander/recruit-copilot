"""Document ingestion. Real extraction (two-column PDFs, scans, DOCX) is slice 6's
budget and out of scope here — this accepts text already extracted and derives pages and
paragraphs from it with the same spans_of() a real parser's output will run through
unchanged (docs/backend-prd.md non-goals)."""

import hashlib

from django.utils import timezone

from common.offsets import spans_of
from common.refusals import Refusal

from .models import Document


def ingest_document(person, *, file, parsed_text, author="", producer="", properties_created=None):
    if not parsed_text.strip():
        raise Refusal(
            requirement="A document needs text to cite from.",
            reason="No text was extracted.",
            action="Check the file and try again.",
            invariant=9,
        )
    spans = spans_of(parsed_text)
    digest = hashlib.sha256()
    for chunk in file.chunks():
        digest.update(chunk)
    file.seek(0)

    return Document.objects.create(
        organization=person.organization,
        person=person,
        file=file,
        filename=file.name,
        sha256=digest.hexdigest(),
        uploaded_at=timezone.now(),
        parsed_text=parsed_text,
        pages=[
            {"page": p.page, "char_start": p.char_start, "char_end": p.char_end}
            for p in spans.pages
        ],
        paragraphs=[
            {"index": p.index, "page": p.page, "char_start": p.char_start, "char_end": p.char_end}
            for p in spans.paragraphs
        ],
        author=author,
        producer=producer,
        properties_created=properties_created,
    )
