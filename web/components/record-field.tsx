import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/* Label and value, in a column. The register of a record rather than an application:
 * hairline rules, no cards, no shadows, and tabular figures wherever a number could be
 * compared with the number above it.
 *
 * `empty` exists because half these records have no email address, and an empty field
 * is not the same as a field with nothing in it. A blank looks like a bug; a sentence
 * saying nobody has spoken to them yet is the truth about a sourced person.
 */
export function RecordFields({
  children,
  columns = 1,
  className,
}: {
  children: ReactNode;
  columns?: 1 | 2 | 3;
  className?: string;
}) {
  return (
    <dl
      className={cn(
        "border-rule border-t",
        columns === 2 ? "sm:grid sm:grid-cols-2 sm:gap-x-10" : "",
        columns === 3 ? "sm:grid sm:grid-cols-3 sm:gap-x-10" : "",
        className,
      )}
    >
      {children}
    </dl>
  );
}

export function RecordField({
  label,
  value,
  empty,
  children,
  className,
}: {
  label: string;
  value?: ReactNode;
  /** What to say when there is nothing. A written clause, not a dash. */
  empty?: string;
  children?: ReactNode;
  className?: string;
}) {
  const filled = children ?? value;
  return (
    <div className={cn("border-rule border-b py-3", className)}>
      <dt className="rc-label text-ink-muted">{label}</dt>
      <dd
        className={cn(
          "mt-1.5 text-16 tabular",
          filled ? "text-ink" : "text-ink-muted max-w-[46ch]",
        )}
      >
        {filled ?? empty ?? "Not recorded"}
      </dd>
    </div>
  );
}
