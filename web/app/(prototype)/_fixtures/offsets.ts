/* Character offsets are computed, never typed.
 *
 * The point of the prototype is that components/evidence-citation.tsx and the passage
 * viewer are fed what they will really be fed. A hand-written char_start is a number
 * that looks like provenance and is not, and it would go unnoticed for as long as the
 * quote happened to read correctly.
 *
 * locate() finds a quote in parsed text and returns real offsets into that exact
 * string, plus the exact substring at those offsets — which is what Evidence.quote
 * stores, line breaks and all. If the quote is not present, or is present twice, the
 * module throws at import, so the failure surfaces at build rather than on screen.
 *
 * Matching is whitespace-insensitive because parsed text from a PDF wraps mid-sentence
 * and a quote written by hand does not. The offsets returned are into the original.
 * The real pipeline needs the same tolerance for the same reason.
 */

type Normalised = { text: string; map: number[] };

/** Collapse runs of whitespace to one space, keeping a map back to the original index. */
function normalise(source: string): Normalised {
  const chars: string[] = [];
  const map: number[] = [];
  let pendingSpace = false;

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    if (char === undefined) continue;
    if (/\s/.test(char)) {
      if (chars.length > 0) pendingSpace = true;
      continue;
    }
    if (pendingSpace) {
      chars.push(" ");
      map.push(index);
      pendingSpace = false;
    }
    chars.push(char);
    map.push(index);
  }

  return { text: chars.join(""), map };
}

export type Located = {
  char_start: number;
  char_end: number;
  /** The original substring, not the quote as it was written. */
  quote: string;
};

export function locate(source: string, quote: string, where: string): Located {
  const haystack = normalise(source);
  const needle = normalise(quote).text;

  if (needle.length === 0) {
    throw new Error(`offsets: empty quote for ${where}.`);
  }

  const first = haystack.text.indexOf(needle);
  if (first === -1) {
    throw new Error(
      `offsets: quote not found in ${where}.\n  Looking for: ${needle.slice(0, 90)}…\n` +
        "  The fixture text and the quote have drifted apart. Fix one of them.",
    );
  }
  if (haystack.text.indexOf(needle, first + 1) !== -1) {
    throw new Error(
      `offsets: quote appears more than once in ${where}.\n  ${needle.slice(0, 90)}…\n` +
        "  An ambiguous citation is not a citation. Quote more of the sentence.",
    );
  }

  const startIndex = haystack.map[first];
  const endIndex = haystack.map[first + needle.length - 1];
  if (startIndex === undefined || endIndex === undefined) {
    throw new Error(`offsets: index map is inconsistent for ${where}.`);
  }

  const char_start = startIndex;
  const char_end = endIndex + 1;
  return { char_start, char_end, quote: source.slice(char_start, char_end) };
}

export type Spans = {
  pages: { page: number; char_start: number; char_end: number }[];
  paragraphs: { index: number; page: number; char_start: number; char_end: number }[];
};

/* Parsed text carries a form feed at each page break, which is what a PDF text
 * extractor emits and therefore what the pipeline will really see. Pages and
 * paragraphs are derived from the string rather than declared beside it, so they
 * cannot disagree with it. */
export function spansOf(parsed: string): Spans {
  const pages: Spans["pages"] = [];
  let pageStart = 0;
  let pageNumber = 1;

  for (let index = 0; index <= parsed.length; index += 1) {
    if (index === parsed.length || parsed[index] === "\f") {
      pages.push({ page: pageNumber, char_start: pageStart, char_end: index });
      pageNumber += 1;
      pageStart = index + 1;
    }
  }

  const paragraphs: Spans["paragraphs"] = [];
  let paragraphIndex = 1;
  const blocks = /[^\n\f][\s\S]*?(?=\n\s*\n|\f|$)/g;
  let match = blocks.exec(parsed);
  while (match !== null) {
    const char_start = match.index;
    const char_end = char_start + match[0].trimEnd().length;
    const page = pages.find((span) => char_start >= span.char_start && char_start < span.char_end);
    paragraphs.push({
      index: paragraphIndex,
      page: page ? page.page : 1,
      char_start,
      char_end,
    });
    paragraphIndex += 1;
    match = blocks.exec(parsed);
  }

  return { pages, paragraphs };
}

export type Sentence = { char_start: number; char_end: number; text: string };

/* Sentence spans, for recording a finding by hand.
 *
 * The recorder does not ask anyone to type a quotation — it shows the parsed text and
 * asks which sentence supports the criterion. The offsets then come from the document
 * rather than from a person's retyping, which is the only way a citation can be trusted
 * to point at what it says it points at.
 *
 * A sentence ends at terminal punctuation followed by whitespace, at a blank line, at a
 * page break, or at the end of the text. CVs are full of headings with no full stop,
 * and a heading is a legitimate span to cite even though it is not a sentence.
 */
export function sentencesOf(source: string): Sentence[] {
  const found: Sentence[] = [];
  let index = 0;

  while (index < source.length) {
    while (index < source.length && /\s/.test(source[index] ?? "")) index += 1;
    if (index >= source.length) break;

    const start = index;
    let end = source.length;

    for (let scan = index; scan < source.length; scan += 1) {
      const char = source[scan] ?? "";
      const next = source[scan + 1];
      if (
        (char === "." || char === "!" || char === "?") &&
        (next === undefined || /\s/.test(next))
      ) {
        end = scan + 1;
        break;
      }
      if (char === "\f") {
        end = scan;
        break;
      }
      if (char === "\n" && /^\n[ \t]*\n/.test(source.slice(scan))) {
        end = scan;
        break;
      }
    }

    const text = source.slice(start, end).trimEnd();
    if (text.length > 0) {
      found.push({ char_start: start, char_end: start + text.length, text });
    }
    index = end;
  }

  return found;
}

/** Which page and paragraph a character offset falls in. Both are 1-based. */
export function placeOf(spans: Spans, char_start: number): { page: number; paragraph: number } {
  const page = spans.pages.find(
    (span) => char_start >= span.char_start && char_start < span.char_end,
  );
  const paragraph = spans.paragraphs.find(
    (span) => char_start >= span.char_start && char_start <= span.char_end,
  );
  return { page: page ? page.page : 1, paragraph: paragraph ? paragraph.index : 1 };
}
