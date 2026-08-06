import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/* The checkpoints after a placement — day 7, 30, 60, 90.
 *
 * The plan exists before the offer is signed, which is the only time it can be agreed
 * with anybody, so every row is present from the start and the unrecorded ones say so
 * rather than being absent. An empty list would read as "nothing to do here"; four
 * rows with three dates and one gap reads as what it is.
 *
 * A checkpoint records what happened, in words, on a date. There is no rating, no
 * satisfaction figure, and no traffic light on a human being who started six weeks ago.
 */
export type Checkpoint = {
  id: string;
  day: number;
  /** The due date, written out. */
  dueOn: string;
  /** How the date sits relative to now, in words. Empty once recorded. */
  standing?: string;
  recordedOn: string | null;
  note: string | null;
  /** What the next Brief for this client should say differently. */
  briefFeedback: string | null;
  action?: ReactNode;
};

export function CheckpointList({
  checkpoints,
  className,
}: {
  checkpoints: Checkpoint[];
  className?: string;
}) {
  return (
    <ol className={cn("border-rule border-t", className)}>
      {checkpoints.map((checkpoint) => (
        <li key={checkpoint.id} className="border-rule border-b py-5">
          <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
            <p className="text-18 text-ink font-medium tabular">Day {checkpoint.day}</p>
            <p className="text-14 text-ink-muted tabular">
              {checkpoint.recordedOn
                ? `Recorded ${checkpoint.recordedOn}`
                : `Due ${checkpoint.dueOn}`}
              {!checkpoint.recordedOn && checkpoint.standing ? ` · ${checkpoint.standing}` : ""}
            </p>
          </div>

          {checkpoint.note ? (
            <p className="text-16 text-ink-secondary mt-3 max-w-[62ch]">{checkpoint.note}</p>
          ) : (
            <p className="text-16 text-ink-muted mt-3 max-w-[62ch]">
              Not recorded. Nobody has asked how it is going.
            </p>
          )}

          {checkpoint.briefFeedback ? (
            <div className="border-l-evidenced bg-evidenced-tint mt-4 border-l-2 px-5 py-4">
              <p className="rc-label text-evidenced">For the next Brief at this client</p>
              <p className="text-16 text-ink mt-3 max-w-[62ch]">{checkpoint.briefFeedback}</p>
            </div>
          ) : null}

          {checkpoint.action ? <div className="mt-4">{checkpoint.action}</div> : null}
        </li>
      ))}
    </ol>
  );
}
