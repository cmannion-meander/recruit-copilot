import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/* A refusal, drawn as a considered screen state.
 *
 * Not a toast, not an alert, not a red anything. The system has declined to write a
 * record and it owes the reader three things in this order: the requirement, why it is
 * not met, and what to do next. Where the reason is a count, the count is followed by
 * the names — "two criteria have no entry" without saying which two is a riddle.
 *
 * There is no icon. There is no colour carrying meaning: this is drawn in ink, with a
 * heavy left rule, and it reads identically in greyscale. Nothing here apologises,
 * nothing exclaims, and nothing says "you must".
 */
export function Refusal({
  requirement,
  reason,
  action,
  items,
  footnote,
  children,
  className,
}: {
  requirement: string;
  reason: string;
  action: string;
  items?: { label: string; detail?: string }[];
  /** Where the rule comes from. Shown small, so the prototype can be read against the document. */
  footnote?: string;
  /** The control that performs the named action, if there is one. */
  children?: ReactNode;
  className?: string;
}) {
  return (
    <section
      aria-live="polite"
      className={cn("border-l-4 border-ink bg-paper-sunk px-6 py-6", className)}
    >
      <h2 className="text-22 font-medium text-ink max-w-[46ch]">{requirement}</h2>
      <p className="text-18 text-ink-secondary mt-3 max-w-[52ch]">{reason}</p>

      {items && items.length > 0 ? (
        <ul className="border-rule mt-5 border-t">
          {items.map((item) => (
            <li key={item.label} className="border-rule border-b py-3">
              <p className="text-16 text-ink">{item.label}</p>
              {item.detail ? (
                <p className="text-14 text-ink-muted mt-1 tabular">{item.detail}</p>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}

      <p className="text-16 text-ink mt-5 max-w-[52ch] font-medium">{action}</p>

      {children ? <div className="mt-5 flex flex-wrap gap-3">{children}</div> : null}

      {footnote ? <p className="rc-label text-ink-muted mt-6">{footnote}</p> : null}
    </section>
  );
}
