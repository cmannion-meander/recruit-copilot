"use client";

/* Screen 1 — the desk.
 *
 * The default screen, and it stays empty unless something needs the recruiter.
 * Every item in the list comes from attentionItems() in _state/selectors.ts —
 * derived, never authored, so the sentences regenerate from state and stay true.
 * Nothing here ranks a person, and no figure stands in for a role, a client or a
 * candidate.
 */
import Link from "next/link";
import { useState } from "react";
import { StateMarker } from "@/components/state-marker";
import { cn } from "@/lib/utils";
import { formatDate, NOW } from "../_fixtures/clock";
import { usePrototype } from "../_state/provider";
import {
  attentionItems,
  candidaciesForRole,
  clientById,
  needsAttention,
  roleAttention,
  stageOf,
  stagesFor,
  workingBriefVersion,
} from "../_state/selectors";
import { AboutButton, AboutPanel } from "../cockpit";

const FOCUS =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink";

const ROLE_MARKER = {
  open: "filled",
  draft: "dotted",
  closed: "outlined",
} as const;

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

      <p className="rc-label text-ink-muted mt-[26px]">Roles</p>
      <div className="overflow-x-auto">
        <ul className="min-w-[880px]">
          {state.roles.map((role) => {
            const client = clientById(state, role.client_id);
            const held = candidaciesForRole(state, role.id);
            const version = workingBriefVersion(state, role);
            const stages = version ? stagesFor(state, version.id) : [];
            const counts = stages
              .map((stage) => ({
                label: stage.label,
                count: held.filter((candidacy) => stageOf(state, candidacy)?.id === stage.id)
                  .length,
              }))
              .filter((entry) => entry.count > 0);
            const roleFlag = roleAttention(state, role);
            const flagged = held.filter(
              (candidacy) => needsAttention(state, candidacy) !== null,
            ).length;

            return (
              <li key={role.id}>
                <Link
                  href={`/prototype/roles?role=${role.id}`}
                  className={cn(
                    "border-rule hover:bg-paper-sunk grid w-full grid-cols-[minmax(0,1fr)_190px_300px_92px] items-center gap-x-4 border-b py-[9px] text-left",
                    FOCUS,
                  )}
                >
                  <span className="min-w-0">
                    <span className="text-16 text-ink block truncate">{role.title}</span>
                    <span className="text-14 text-ink-muted block truncate">{client?.name}</span>
                  </span>
                  <StateMarker
                    label={role.state.charAt(0).toUpperCase() + role.state.slice(1)}
                    shape={ROLE_MARKER[role.state]}
                  />
                  <span className="text-14 text-ink-muted tabular truncate">
                    {counts.length > 0
                      ? counts.map((entry) => `${entry.label} ${entry.count}`).join(" · ")
                      : "No candidacies"}
                  </span>
                  {roleFlag ? (
                    <span className="rc-label text-ink text-right whitespace-nowrap">
                      {roleFlag.flag}
                    </span>
                  ) : flagged > 0 ? (
                    <span className="text-ink tabular text-right font-mono text-12">{flagged}</span>
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
