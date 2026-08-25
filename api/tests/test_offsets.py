"""Tests for the offsets port (common/offsets.py), ported from
web/app/(prototype)/_fixtures/offsets.ts. Pure logic, no database — a citation's honesty
starts here, before any model exists to store one.
"""

import pytest

from common.offsets import OffsetError, locate, place_of, sentences_of, spans_of


def test_locate_finds_an_exact_quote():
    source = "I led the migration from Sage 200 to Dynamics 365."
    located = locate(source, "led the migration", "test")
    assert source[located.char_start : located.char_end] == "led the migration"
    assert located.quote == "led the migration"


def test_locate_is_whitespace_insensitive_across_a_line_wrap():
    """The core reason locate() exists: parsed text wraps mid-sentence, a quote taken
    from a rendered sentence does not."""
    source = "I led the migration from Sage 200\nto Microsoft Dynamics 365 Business Central."
    quote = "migration from Sage 200 to Microsoft Dynamics 365"
    located = locate(source, quote, "test")
    assert located.quote == "migration from Sage 200\nto Microsoft Dynamics 365"
    assert source[located.char_start : located.char_end] == located.quote


def test_locate_raises_when_the_quote_is_absent():
    with pytest.raises(OffsetError, match="not found"):
        locate("The quick brown fox.", "a sentence never written here", "test")


def test_locate_raises_when_the_quote_is_ambiguous():
    source = "She led the team in March. Later, she led the team again in June."
    with pytest.raises(OffsetError, match="more than once"):
        locate(source, "led the team", "test")


def test_locate_raises_on_an_empty_quote():
    with pytest.raises(OffsetError, match="empty quote"):
        locate("Some text.", "   ", "test")


def test_spans_of_splits_pages_on_form_feed():
    parsed = "Page one text.\fPage two text.\fPage three text."
    spans = spans_of(parsed)
    assert [p.page for p in spans.pages] == [1, 2, 3]
    assert parsed[spans.pages[0].char_start : spans.pages[0].char_end] == "Page one text."
    assert parsed[spans.pages[1].char_start : spans.pages[1].char_end] == "Page two text."
    assert parsed[spans.pages[2].char_start : spans.pages[2].char_end] == "Page three text."


def test_spans_of_splits_paragraphs_on_blank_lines():
    parsed = "First paragraph, one line.\n\nSecond paragraph,\nstill one block."
    spans = spans_of(parsed)
    assert len(spans.paragraphs) == 2
    assert spans.paragraphs[0].index == 1
    assert parsed[spans.paragraphs[0].char_start : spans.paragraphs[0].char_end] == (
        "First paragraph, one line."
    )
    assert spans.paragraphs[1].index == 2
    assert parsed[spans.paragraphs[1].char_start : spans.paragraphs[1].char_end] == (
        "Second paragraph,\nstill one block."
    )


def test_spans_of_assigns_paragraphs_to_their_page():
    parsed = "Page one paragraph.\fPage two paragraph."
    spans = spans_of(parsed)
    assert [p.page for p in spans.paragraphs] == [1, 2]


def test_sentences_of_splits_on_terminal_punctuation():
    source = "I led the migration. I also managed a team of five."
    sentences = sentences_of(source)
    assert [s.text for s in sentences] == [
        "I led the migration.",
        "I also managed a team of five.",
    ]
    for sentence in sentences:
        assert source[sentence.char_start : sentence.char_end] == sentence.text


def test_sentences_of_admits_a_heading_with_no_terminal_punctuation():
    """CVs are full of headings with no full stop, and a heading is a legitimate span to
    cite even though it is not a sentence."""
    source = "Employment History\n\nFinance Director, Kestrel Components."
    sentences = sentences_of(source)
    assert sentences[0].text == "Employment History"
    assert sentences[1].text == "Finance Director, Kestrel Components."


def test_sentences_of_stops_at_a_page_break():
    source = "First page, no full stop\fSecond page starts here."
    sentences = sentences_of(source)
    assert sentences[0].text == "First page, no full stop"
    assert sentences[1].text == "Second page starts here."


def test_place_of_reports_one_based_page_and_paragraph():
    parsed = "Page one, paragraph one.\fPage two, paragraph one.\n\nPage two, paragraph two."
    spans = spans_of(parsed)
    page, paragraph = place_of(spans, parsed.index("Page two, paragraph two"))
    assert page == 2
    assert paragraph == 3
