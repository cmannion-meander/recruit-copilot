import { cn } from "@/lib/utils";

/* Days to the auto-closure deadline. A plain integer and a date.
 *
 * No bar, no ring, no colour ramp from green to red. A progress bar filled by a
 * countdown turns a promise to a candidate into a gauge, and the number stops being
 * read the moment the shape can be glanced at instead.
 *
 * There is no control here and there is not one anywhere else either: invariant 6 says
 * the deadline cannot be extended or disabled, so the interface offers nothing to press.
 * A deadline you can quietly turn off is not a promise.
 */
export function DaysRemaining({
  days,
  on,
  className,
}: {
  days: number;
  /** The deadline itself, written out. The number alone is not a date. */
  on: string;
  className?: string;
}) {
  const past = days < 0;
  const soon = !past && days <= 7;

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <p className="text-16 text-ink tabular">
        {past ? (
          <>
            Closed {Math.abs(days)} {Math.abs(days) === 1 ? "day" : "days"} ago
          </>
        ) : (
          <>
            <span
              className={cn("font-medium", soon ? "underline decoration-2 underline-offset-4" : "")}
            >
              {days} {days === 1 ? "day" : "days"}
            </span>{" "}
            until this candidacy closes on its own
          </>
        )}
      </p>
      <p className="text-14 text-ink-muted tabular">{on}</p>
    </div>
  );
}
