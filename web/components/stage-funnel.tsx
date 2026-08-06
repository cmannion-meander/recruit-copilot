import { cn } from "@/lib/utils";

/* The stages of a role, in order, with how many candidacies reached each.
 *
 * Counts, never rates. A four-person agency runs a role with ten people on it, and a
 * percentage on ten is false precision dressed as insight — "60%" and "6 of 10" carry
 * the same information, and only one of them is honest about the sample. It is also
 * the shape a judgement arrives in, and the shape this product refuses everywhere else.
 *
 * The bar is the count drawn to width, not a proportion of a target. There is no goal
 * line, no colour ramp, and nothing turns amber when a stage is thin: what the numbers
 * mean is the reader's to decide, and the sentence under them says which question they
 * answer — about the agency's own effort, never about anybody's worth.
 */
export type FunnelRow = {
  id: string;
  label: string;
  /** What this stage is for, in one line. */
  purpose?: string;
  /** The criteria this stage evidences, written out. */
  criteria?: string[];
  reached: number;
  owner?: string;
};

export function StageFunnel({
  rows,
  total,
  className,
}: {
  rows: FunnelRow[];
  /** The denominator, stated once rather than repeated on every line. */
  total: number;
  className?: string;
}) {
  const widest = Math.max(1, ...rows.map((row) => row.reached));

  return (
    <ol className={cn("border-rule border-t", className)}>
      {rows.map((row) => (
        <li key={row.id} className="border-rule border-b py-4">
          <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
            <p className="text-16 text-ink">
              {row.label}
              {row.owner ? <span className="text-ink-muted"> · {row.owner}</span> : null}
            </p>
            <p className="text-16 text-ink-secondary tabular">
              {row.reached} of {total} reached
            </p>
          </div>

          <div
            aria-hidden="true"
            className="bg-paper-sunk mt-3 h-2 w-full max-w-md overflow-hidden"
          >
            <div
              className="bg-ink h-full"
              style={{ width: `${Math.round((row.reached / widest) * 100)}%` }}
            />
          </div>

          {row.purpose ? (
            <p className="text-14 text-ink-secondary mt-3 max-w-[62ch]">{row.purpose}</p>
          ) : null}

          {row.criteria && row.criteria.length > 0 ? (
            <ul className="mt-2 flex flex-col gap-1">
              {row.criteria.map((criterion) => (
                <li key={criterion} className="text-14 text-ink-muted">
                  Evidences · {criterion}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-14 text-ink-muted mt-2">Evidences nothing in the rubric.</p>
          )}
        </li>
      ))}
    </ol>
  );
}
