"""Character offsets are computed, never typed.

Ported from web/app/(prototype)/_fixtures/offsets.ts — the same functions, the same
tolerance, so a citation means the same thing in the fixtures and in the real pipeline.
A hand-written char_start is a number that looks like provenance and is not; it would go
unnoticed for as long as the quote happened to read correctly. `locate()` finds a quote in
parsed text and returns real offsets into that exact string, plus the exact substring at
those offsets — which is what Evidence.quote stores, line breaks and all. If the quote is
not present, or is present twice, this raises, so the failure surfaces before it ships
rather than in front of a client.

Matching is whitespace-insensitive because parsed text from a PDF wraps mid-sentence and a
quote taken from a rendered sentence does not. The offsets returned are always into the
original string.

Framework-free on purpose: no Django import here, so this stays testable as pure logic and
reusable from documents (spans_of, at ingest) and findings (locate, when recording).
"""

import re
from dataclasses import dataclass


class OffsetError(Exception):
    """A quote could not be located unambiguously. The caller decides how this becomes a
    refusal — this module has no opinion on HTTP or the product's voice."""


def _normalise(source: str) -> tuple[str, list[int]]:
    """Collapse runs of whitespace to one space, keeping a map back to the original index."""
    chars: list[str] = []
    index_map: list[int] = []
    pending_space = False

    for index, char in enumerate(source):
        if char.isspace():
            if chars:
                pending_space = True
            continue
        if pending_space:
            chars.append(" ")
            index_map.append(index)
            pending_space = False
        chars.append(char)
        index_map.append(index)

    return "".join(chars), index_map


@dataclass(frozen=True)
class Located:
    char_start: int
    char_end: int
    quote: str  # the original substring, not the quote as it was written


def locate(source: str, quote: str, where: str) -> Located:
    haystack_text, haystack_map = _normalise(source)
    needle, _ = _normalise(quote)

    if len(needle) == 0:
        raise OffsetError(f"offsets: empty quote for {where}.")

    first = haystack_text.find(needle)
    if first == -1:
        raise OffsetError(
            f"offsets: quote not found in {where}.\n"
            f"  Looking for: {needle[:90]}…\n"
            "  The source text and the quote have drifted apart. Fix one of them."
        )
    if haystack_text.find(needle, first + 1) != -1:
        raise OffsetError(
            f"offsets: quote appears more than once in {where}.\n  {needle[:90]}…\n"
            "  An ambiguous citation is not a citation. Quote more of the sentence."
        )

    char_start = haystack_map[first]
    char_end = haystack_map[first + len(needle) - 1] + 1
    return Located(char_start=char_start, char_end=char_end, quote=source[char_start:char_end])


@dataclass(frozen=True)
class PageSpan:
    page: int
    char_start: int
    char_end: int


@dataclass(frozen=True)
class ParagraphSpan:
    index: int
    page: int
    char_start: int
    char_end: int


@dataclass(frozen=True)
class Spans:
    pages: list[PageSpan]
    paragraphs: list[ParagraphSpan]


# \Z (absolute end of string), not $, because Python's $ also matches just before a
# trailing newline — a difference from JS's unflagged $ that would silently shrink the
# last paragraph of any text ending in "\n".
_PARAGRAPH_BLOCK = re.compile(r"[^\n\f][\s\S]*?(?=\n\s*\n|\f|\Z)")


def spans_of(parsed: str) -> Spans:
    """Parsed text carries a form feed at each page break, which is what a PDF text
    extractor emits and therefore what the pipeline will really see. Pages and paragraphs
    are derived from the string rather than declared beside it, so they cannot disagree
    with it."""
    pages: list[PageSpan] = []
    page_start = 0
    page_number = 1
    for index in range(len(parsed) + 1):
        if index == len(parsed) or parsed[index] == "\f":
            pages.append(PageSpan(page=page_number, char_start=page_start, char_end=index))
            page_number += 1
            page_start = index + 1

    paragraphs: list[ParagraphSpan] = []
    paragraph_index = 1
    for match in _PARAGRAPH_BLOCK.finditer(parsed):
        char_start = match.start()
        char_end = char_start + len(match.group(0).rstrip())
        page = next((s for s in pages if s.char_start <= char_start < s.char_end), None)
        paragraphs.append(
            ParagraphSpan(
                index=paragraph_index,
                page=page.page if page else 1,
                char_start=char_start,
                char_end=char_end,
            )
        )
        paragraph_index += 1

    return Spans(pages=pages, paragraphs=paragraphs)


@dataclass(frozen=True)
class Sentence:
    char_start: int
    char_end: int
    text: str


_BLANK_LINE = re.compile(r"^\n[ \t]*\n")


def sentences_of(source: str) -> list[Sentence]:
    """Sentence spans, for recording a finding by hand.

    The recorder does not ask anyone to type a quotation — it shows the parsed text and
    asks which sentence supports the criterion. The offsets then come from the document
    rather than from a person's retyping, which is the only way a citation can be trusted
    to point at what it says it points at.

    A sentence ends at terminal punctuation followed by whitespace, at a blank line, at a
    page break, or at the end of the text. CVs are full of headings with no full stop, and
    a heading is a legitimate span to cite even though it is not a sentence.
    """
    found: list[Sentence] = []
    index = 0
    length = len(source)

    while index < length:
        while index < length and source[index].isspace():
            index += 1
        if index >= length:
            break

        start = index
        end = length

        for scan in range(index, length):
            char = source[scan]
            next_char = source[scan + 1] if scan + 1 < length else None
            if char in ".!?" and (next_char is None or next_char.isspace()):
                end = scan + 1
                break
            if char == "\f":
                end = scan
                break
            if char == "\n" and _BLANK_LINE.match(source[scan:]):
                end = scan
                break

        text = source[start:end].rstrip()
        if len(text) > 0:
            found.append(Sentence(char_start=start, char_end=start + len(text), text=text))
        index = end

    return found


def place_of(spans: Spans, char_start: int) -> tuple[int, int]:
    """Which page and paragraph a character offset falls in. Both 1-based."""
    page = next((s for s in spans.pages if s.char_start <= char_start < s.char_end), None)
    paragraph = next(
        (p for p in spans.paragraphs if p.char_start <= char_start <= p.char_end), None
    )
    return (page.page if page else 1, paragraph.index if paragraph else 1)
