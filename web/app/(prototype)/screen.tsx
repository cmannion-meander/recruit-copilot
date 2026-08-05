/* Page chrome for the prototype screens.
 *
 * Disposable. The real workspace has its own shell at app/(app)/app/layout.tsx with a
 * sidebar and a different information hierarchy, so this is scaffolding rather than an
 * early version of it.
 */
import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Screen({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("mx-auto max-w-6xl px-6 py-10", className)}>{children}</div>;
}

export function Crumbs({ trail }: { trail: { href?: string; label: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2">
      {trail.map((crumb, index) => (
        <span key={crumb.label} className="flex items-center gap-2">
          {index > 0 ? (
            <span aria-hidden="true" className="text-ink-muted rc-label">
              /
            </span>
          ) : null}
          {crumb.href ? (
            <Link
              href={crumb.href}
              className="rc-label text-ink-muted hover:text-ink focus-visible:outline-ink transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4"
            >
              {crumb.label}
            </Link>
          ) : (
            <span className="rc-label text-ink-secondary">{crumb.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

export function ScreenTitle({
  eyebrow,
  title,
  lede,
  aside,
}: {
  eyebrow?: string;
  title: string;
  lede?: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <header className="border-rule mt-6 flex flex-wrap items-end justify-between gap-x-10 gap-y-4 border-b pb-6">
      <div className="min-w-0">
        {eyebrow ? <p className="rc-label text-ink-muted">{eyebrow}</p> : null}
        <h1 className="text-36 text-ink mt-2 font-semibold tracking-tight">{title}</h1>
        {lede ? <div className="text-18 text-ink-secondary mt-3 max-w-[62ch]">{lede}</div> : null}
      </div>
      {aside ? <div className="shrink-0">{aside}</div> : null}
    </header>
  );
}

export function Section({
  title,
  note,
  aside,
  children,
  className,
}: {
  title: string;
  note?: ReactNode;
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("mt-12", className)}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-2">
        <h2 className="rc-label text-ink-muted">{title}</h2>
        {aside}
      </div>
      {note ? <p className="text-16 text-ink-secondary mt-3 max-w-[62ch]">{note}</p> : null}
      <div className="mt-5">{children}</div>
    </section>
  );
}
