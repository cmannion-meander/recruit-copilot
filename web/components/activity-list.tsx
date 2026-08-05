import { cn } from "@/lib/utils";

/* The append-only log on a record. Oldest first, because that is the order a log is
 * read in, and there is no control to remove or amend an entry — invariant 8 revokes
 * DELETE and UPDATE on decision_event at the permission level, so an interface offering
 * either would be teaching a lie.
 */
export type ActivityEntry = {
  id: string;
  /** The date, written out. Formatting belongs to the caller; this renders what it is given. */
  at: string;
  actor: string;
  summary: string;
};

export function ActivityList({
  entries,
  className,
}: {
  entries: ActivityEntry[];
  className?: string;
}) {
  if (entries.length === 0) {
    return <p className={cn("text-16 text-ink-muted", className)}>Nothing has happened yet.</p>;
  }

  return (
    <ol className={cn("border-rule border-t", className)}>
      {entries.map((entry) => (
        <li
          key={entry.id}
          className="border-rule grid gap-x-6 gap-y-1 border-b py-3 sm:grid-cols-[11rem_1fr]"
        >
          <p className="text-14 text-ink-muted tabular">{entry.at}</p>
          <div>
            <p className="text-16 text-ink">{entry.summary}</p>
            <p className="text-14 text-ink-muted mt-0.5">{entry.actor}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
