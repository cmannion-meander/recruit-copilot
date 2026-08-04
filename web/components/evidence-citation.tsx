import { cn } from "@/lib/utils";

type EvidencedProps = {
  state: "evidenced";
  criterion?: string;
  quote: string;
  provenance: string;
  className?: string;
};

type NotFoundProps = {
  state: "not-found";
  criterion?: string;
  quote?: never;
  provenance?: never;
  className?: string;
};

export type EvidenceCitationProps = EvidencedProps | NotFoundProps;

export function EvidenceCitation(props: EvidenceCitationProps) {
  const { state, criterion, className } = props;
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
          <figcaption className="text-ink-secondary mt-3 font-mono text-12 tabular">
            {props.provenance}
          </figcaption>
        </>
      ) : (
        <figcaption className="text-ink-secondary mt-3 font-mono text-12">
          Nothing to cite · ask at interview
        </figcaption>
      )}
    </figure>
  );
}
