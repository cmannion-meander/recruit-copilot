import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/* `action` is a slot, not a behaviour. The citation itself stays a figure — a quoted
 * passage is not a control — but a caller may hang one control off the provenance line,
 * which is where a "show this in the document" affordance belongs. The landing page
 * passes nothing and renders exactly as it did. There is no edit affordance and there
 * will not be one: invariant 8 revokes UPDATE on evidence at the permission level, and
 * a control that offers an edit and then refuses it teaches the wrong thing. */
type EvidencedProps = {
  state: "evidenced";
  criterion?: string;
  quote: string;
  provenance: string;
  action?: ReactNode;
  className?: string;
};

type NotFoundProps = {
  state: "not-found";
  criterion?: string;
  quote?: never;
  provenance?: never;
  action?: ReactNode;
  className?: string;
};

export type EvidenceCitationProps = EvidencedProps | NotFoundProps;

export function EvidenceCitation(props: EvidenceCitationProps) {
  const { state, criterion, action, className } = props;
  const evidenced = state === "evidenced";

  return (
    <figure
      className={cn(
        // Colour is never the only signal: evidenced is a solid rule, not-found
        // is a dashed one, and each carries a written label as well.
        // Square corners: this is a quoted passage, not a card.
        "rounded-none border-l-2 px-5 py-4",
        evidenced
          ? "border-l-evidenced border-solid bg-evidenced-tint"
          : "border-l-open border-dashed bg-open-tint",
        className,
      )}
    >
      {criterion ? <p className="text-14 text-ink-secondary mb-3">{criterion}</p> : null}

      <p className={cn("rc-label", evidenced ? "text-evidenced" : "text-open")}>
        {evidenced ? "Evidenced" : "Not found"}
      </p>

      {evidenced ? (
        <>
          <blockquote className="font-serif text-18 text-ink mt-3 leading-relaxed">
            {"\u201C"}
            {props.quote}
            {"\u201D"}
          </blockquote>
          <figcaption className="text-ink-secondary mt-3 flex flex-wrap items-baseline gap-x-4 gap-y-2 font-mono text-12 tabular">
            <span>{props.provenance}</span>
            {action}
          </figcaption>
        </>
      ) : (
        <figcaption className="text-ink-secondary mt-3 flex flex-wrap items-baseline gap-x-4 gap-y-2 font-mono text-12">
          <span>Nothing to cite · ask at interview</span>
          {action}
        </figcaption>
      )}
    </figure>
  );
}
