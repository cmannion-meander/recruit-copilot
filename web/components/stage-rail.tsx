import { cn } from "@/lib/utils";

/* The pipeline as a rail: one mark per stage, the current one written out.
 *
 * Same shape grammar as the record's stage list — passed is outlined, here is
 * filled, ahead is dotted — so it survives greyscale, and every mark carries
 * its label for a reader. The written part is the current stage and its
 * position, which is the only sentence the rail needs.
 *
 * For a record that has left the pipeline (Placed, Rejected…) use StateMarker
 * with the terminal word instead: a rail with no current stage is a lie about
 * where the record is.
 */
export type RailStage = { id: string; label: string };

const MARK: Record<"passed" | "here" | "ahead", string> = {
  passed: "border-2 border-ink bg-transparent",
  here: "bg-ink",
  ahead: "border border-dotted border-ink-muted bg-transparent",
};

const WORD: Record<"passed" | "here" | "ahead", string> = {
  passed: "passed",
  here: "here now",
  ahead: "ahead",
};

export function StageRail({
  stages,
  currentId,
  className,
}: {
  stages: RailStage[];
  currentId: string;
  className?: string;
}) {
  const at = stages.findIndex((stage) => stage.id === currentId);
  if (at < 0) return null;

  return (
    <div className={cn("flex flex-wrap items-center gap-x-3 gap-y-1", className)}>
      <ol aria-label="Stages, in pipeline order" className="flex items-center gap-1.5">
        {stages.map((stage, index) => {
          const state = index < at ? "passed" : index === at ? "here" : "ahead";
          return (
            <li
              key={stage.id}
              aria-label={`${index + 1}. ${stage.label}: ${WORD[state]}`}
              title={`${stage.label} — ${WORD[state]}`}
              className={cn("size-3 shrink-0", MARK[state])}
            />
          );
        })}
      </ol>
      <p className="text-14 text-ink-secondary tabular">
        {stages[at].label} · {at + 1} of {stages.length}
      </p>
    </div>
  );
}
