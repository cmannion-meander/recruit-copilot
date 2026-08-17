"use client";

/* Screen 1 — the desk.
 *
 * One thing: everything that needs the recruiter, and nothing else. Every item
 * comes from attentionItems() in _state/selectors.ts — derived, never authored,
 * so the sentences regenerate from state and stay true. Roles have their own
 * screen; nothing here ranks a person.
 */
import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { formatDate, NOW } from "../_fixtures/clock";
import { usePrototype } from "../_state/provider";
import { attentionItems } from "../_state/selectors";
import { AboutButton, AboutPanel } from "../cockpit";

const FOCUS =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink";

export function DeskScreen() {
  const { state } = usePrototype();
  const [aboutOpen, setAboutOpen] = useState(false);

  const items = attentionItems(state);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <h1 className="text-22 text-ink font-medium tracking-[-.01em]">The desk</h1>
        <p className="text-14 text-ink-muted tabular">{formatDate(NOW)}</p>
        <AboutButton open={aboutOpen} onToggle={() => setAboutOpen(!aboutOpen)} />
      </div>

      <AboutPanel open={aboutOpen}>
        <p className="text-14 text-ink-secondary max-w-[70ch]">
          This screen stays empty unless something needs you. Nothing on it ranks a person, and no
          figure here stands in for a role, a client or a candidate.
        </p>
      </AboutPanel>

      <p className="rc-label text-ink-muted mt-[22px]">
        {items.length > 0 ? `Needs you · ${items.length}` : "Nothing needs you today"}
      </p>

      {items.length > 0 ? (
        <ul className="border-ink mt-2 border-t">
          {items.map((item) => (
            <li key={item.key}>
              <Link
                href={item.href}
                className={cn(
                  "border-rule hover:bg-paper-sunk grid w-full grid-cols-[3px_148px_minmax(0,1fr)_auto] items-baseline gap-x-4 border-b py-[11px] pr-2 text-left",
                  FOCUS,
                )}
              >
                <span aria-hidden="true" className="bg-ink self-stretch" />
                <span className="rc-label text-ink-secondary">{item.kind}</span>
                <span className="min-w-0">
                  <span className="text-16 text-ink block">{item.subject}</span>
                  <span className="text-14 text-ink-muted mt-0.5 block max-w-[70ch]">
                    {item.fact}
                  </span>
                </span>
                <span className="rc-label text-ink-muted whitespace-nowrap">{item.verb}</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
