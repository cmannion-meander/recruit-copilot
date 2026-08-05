import { cn } from "@/lib/utils";

/* The fixed-order cell row, and the count beside it.
 *
 * One component, on purpose. Invariant 2 says the count never renders without the
 * cells, and the way to make that true is to leave no way of rendering a count on its
 * own — there is no export here that returns "4 of 5" and nothing else. If a screen
 * wants a number, it gets the row.
 *
 * Three states, not two. `evidenced` and `not-found` are the two values a Finding can
 * hold; `no-entry` is the absence of a finding, which is a different thing and has to
 * look like one, or a half-done scorecard reads as a finished one.
 *
 * Fill is the primary signal and it is a shape: solid, thick outline, thin dotted. The
 * row reads the same in greyscale, and every cell carries a written label for a screen
 * reader. The colours are the product's semantic pair used for exactly what they mean.
 */
export type CriterionCellState = "evidenced" | "not-found" | "no-entry";

export type CriterionCell = {
  /** The criterion, in words. Read out per cell; never truncated into a code. */
  label: string;
  state: CriterionCellState;
};

const CELL_SHAPE: Record<CriterionCellState, string> = {
  evidenced: "bg-evidenced",
  "not-found": "border-2 border-open bg-transparent",
  "no-entry": "border border-dotted border-ink-muted bg-transparent",
};

const CELL_WORD: Record<CriterionCellState, string> = {
  evidenced: "evidenced",
  "not-found": "not found",
  "no-entry": "no entry",
};

export function CriteriaRow({
  cells,
  subject,
  size = "md",
  className,
}: {
  cells: CriterionCell[];
  /** Whose row this is, for the accessible name. */
  subject: string;
  size?: "sm" | "md";
  className?: string;
}) {
  const evidenced = cells.filter((cell) => cell.state === "evidenced").length;
  const noEntry = cells.filter((cell) => cell.state === "no-entry").length;
  const box = size === "sm" ? "size-4" : "size-5";

  return (
    <div className={cn("flex flex-wrap items-center gap-x-4 gap-y-2", className)}>
      <ul
        aria-label={`Criteria for ${subject}, in the order of The Brief`}
        className="flex items-center gap-1.5"
      >
        {cells.map((cell, index) => (
          <li
            key={cell.label}
            aria-label={`${index + 1}. ${cell.label}: ${CELL_WORD[cell.state]}`}
            title={`${cell.label} — ${CELL_WORD[cell.state]}`}
            className={cn(box, "shrink-0", CELL_SHAPE[cell.state])}
          />
        ))}
      </ul>
      <p className="text-14 tabular text-ink-secondary">
        {evidenced} of {cells.length} evidenced
        {noEntry > 0 ? (
          <span className="text-ink-muted">
            {" · "}
            {noEntry} with no entry
          </span>
        ) : null}
      </p>
    </div>
  );
}

/** The written key. Any screen showing more than one row owes the reader this. */
export function CriteriaKey({ className }: { className?: string }) {
  return (
    <dl className={cn("flex flex-col gap-2 sm:flex-row sm:gap-8", className)}>
      {(["evidenced", "not-found", "no-entry"] as const).map((state) => (
        <div key={state} className="flex items-center gap-3">
          <span className={cn("size-4 shrink-0", CELL_SHAPE[state])} />
          <dt className="rc-label text-ink-muted">
            {state === "evidenced" ? "Filled" : state === "not-found" ? "Outlined" : "Dotted"}
          </dt>
          <dd className="text-14 text-ink-secondary">
            {state === "evidenced"
              ? "evidenced, with a quoted passage"
              : state === "not-found"
                ? "looked for, not found"
                : "no finding recorded yet"}
          </dd>
        </div>
      ))}
    </dl>
  );
}
