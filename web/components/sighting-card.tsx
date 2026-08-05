import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/* Where a person was found, and what the source said on the day it was read.
 *
 * The snapshot is the whole point. A company bio or a conference listing changes under
 * you, and a citation that is only a URL rots into a dead link — the same failure as an
 * invented profile URL, just slower. So the card leads with what was read, and the link
 * is secondary.
 *
 * `age` is how long ago the source was read. It is not a staleness verdict, because the
 * record cannot honestly give one: knowing whether the page still says this would take
 * another fetch, and until there is one, the age is all that is true.
 */
export function SightingCard({
  sourceName,
  sourceKind,
  url,
  readOn,
  age,
  snapshot,
  resolving,
  action,
  className,
}: {
  sourceName: string;
  sourceKind: string;
  url: string;
  /** The date the source was read, written out. */
  readOn: string;
  /** How long ago that was, in words. */
  age: string;
  snapshot: string;
  /** A resolving sighting identifies the person; a corroborating one adds to the picture. */
  resolving: boolean;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <article className={cn("border-rule bg-paper-raised border px-5 py-5", className)}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <p className="rc-label text-ink-muted">{sourceKind}</p>
        <p className="rc-label text-ink-muted">{resolving ? "Resolving" : "Corroborating"}</p>
      </div>

      <blockquote className="font-serif text-16 text-ink mt-4 leading-relaxed">
        {"“"}
        {snapshot}
        {"”"}
      </blockquote>

      <div className="border-rule mt-4 flex flex-wrap items-baseline gap-x-6 gap-y-2 border-t pt-4">
        <a
          href={url}
          rel="nofollow noreferrer"
          className="text-ink-secondary hover:text-ink focus-visible:outline-ink break-all font-mono text-12 underline underline-offset-4 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4"
        >
          {sourceName}
        </a>
        <p className="text-ink-muted font-mono text-12 tabular">
          Read {readOn} · {age}
        </p>
        {action}
      </div>
    </article>
  );
}
