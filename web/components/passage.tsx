"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

/* Parsed text with one range marked.
 *
 * This is what character offsets are for. A citation that says "page 1, paragraph 6"
 * asks the reader to take it on trust; showing the passage in the document, with the
 * quoted range marked and the rest of the page still around it, does not. The context
 * either supports the quote or embarrasses it, and both are worth seeing.
 *
 * Whitespace is preserved because the offsets index into the parsed string exactly as
 * it came out of the extractor, line breaks included. Serif, because this is a quoted
 * candidate passage and that is the only thing serif is for here.
 *
 * The mark is an underline as well as a tint: colour is never the only signal.
 *
 * The container scrolls itself to the mark on open. Without that, a reveal on a
 * two-page CV shows the top of the document and the reader has to go hunting for the
 * sentence they just asked to be shown — which is the one job this component has.
 */
export function Passage({
  text,
  start,
  end,
  label,
  className,
}: {
  text: string;
  /** Character offsets into `text`. Omit both to render the document unmarked. */
  start?: number;
  end?: number;
  /** Accessible name for the marked range. */
  label?: string;
  className?: string;
}) {
  const marked = typeof start === "number" && typeof end === "number" && end > start;
  const mark = useRef<HTMLElement>(null);
  const frame = useRef<HTMLElement>(null);

  useEffect(() => {
    const target = mark.current;
    const container = frame.current;
    if (!target || !container) return;
    // Measured from laid-out boxes rather than offsetTop, which is relative to whichever
    // ancestor happens to be positioned and is therefore wrong here by however much the
    // page above the citation is tall.
    //
    // The container scrolls; the page does not. scrollIntoView would move the window as
    // well, taking the citation the reader is reading off the screen.
    const mine = target.getBoundingClientRect();
    const box = container.getBoundingClientRect();
    container.scrollTop += mine.top - box.top - container.clientHeight / 3;
  }, []);

  return (
    // A scrolling region, labelled and reachable from the keyboard: a citation the
    // reader cannot get to is a citation for other people.
    <section
      ref={frame}
      // biome-ignore lint/a11y/noNoninteractiveTabindex: a scroll container has to be reachable
      tabIndex={0}
      aria-label={label ?? "Parsed document"}
      className={cn(
        "border-rule bg-paper-raised focus-visible:outline-ink max-h-[28rem] overflow-y-auto border px-6 py-5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
        className,
      )}
    >
      <p className="font-serif text-16 text-ink whitespace-pre-wrap leading-relaxed">
        {marked ? (
          <>
            {text.slice(0, start)}
            <mark
              ref={mark}
              className="bg-evidenced-tint text-ink decoration-evidenced underline decoration-2 underline-offset-4"
            >
              {text.slice(start, end)}
            </mark>
            {text.slice(end)}
          </>
        ) : (
          text
        )}
      </p>
    </section>
  );
}
