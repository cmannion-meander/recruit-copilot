"use client";

/* Screen 2 — candidacies.
 *
 * One row is one person on one role, against the criteria of the Brief version
 * pinned when the role opened. Twelve rows fit without vertical scrolling at
 * 1440×900 in compact density. The Channel column was removed to pay for the
 * attention column's width; the filter and the drawer keep it.
 *
 * Sorting is a filing order. There is deliberately no sort by evidence count,
 * because a column ordered by assessment reads as a shortlist — invariant 2.
 *
 * The selected row is the URL (?candidacy=…), so a flagged record is linkable and
 * the browser's Back button closes the drawer. Filters the Desk links into are
 * also the URL; the rest are local.
 */
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { CriteriaKey, CriteriaRow } from "@/components/criteria-row";
import { cn } from "@/lib/utils";
import { daysFromNow, formatDateShort } from "../../_fixtures/clock";
import type { Candidacy, Person } from "../../_fixtures/types";
import { usePrototype } from "../../_state/provider";
import {
  cellsFor,
  channelById,
  needsAttention,
  personById,
  roleById,
  stageLabels,
  stageOf,
} from "../../_state/selectors";
import { CandidacyDrawer } from "../../candidacy-drawer";
import { AboutButton, AboutPanel, useCockpitQuery } from "../../cockpit";
import { PipelineBoard } from "../../pipeline-board";

const FOCUS =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink";

const SELECT =
  "border-rule-control rounded-rc text-14 text-ink-secondary border bg-transparent px-1.5 py-[3px]";

const GRID =
  "grid grid-cols-[3px_minmax(210px,1.25fr)_152px_232px_128px_330px] items-center gap-x-4";

const CELL_STATE = {
  evidenced: "evidenced",
  not_found: "not-found",
  no_entry: "no-entry",
} as const;

function familyName(person: Person | undefined): string {
  if (!person) return "";
  const parts = person.full_name.split(" ");
  return parts[parts.length - 1] ?? person.full_name;
}

export function CandidaciesScreen() {
  const { state } = usePrototype();
  const router = useRouter();
  const params = useSearchParams();
  const { query } = useCockpitQuery();

  const roleFilter = params.get("role") ?? "all";
  const selected = params.get("candidacy");
  const flaggedOnly = params.get("flagged") === "1";
  const stateFilter = params.get("state") ?? "all";
  const view = params.get("view") === "board" ? "board" : "list";

  const [stageFilter, setStageFilter] = useState("all");
  const [channelFilter, setChannelFilter] = useState("all");
  const [sort, setSort] = useState<"family" | "stage" | "closing" | "added">("family");
  const [aboutOpen, setAboutOpen] = useState(false);

  const setParam = useCallback(
    (name: string, value: string | null) => {
      const next = new URLSearchParams(params.toString());
      if (value === null) next.delete(name);
      else next.set(name, value);
      const search = next.toString();
      router.push(`/prototype/candidacies${search ? `?${search}` : ""}`);
    },
    [params, router],
  );

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && selected) setParam("candidacy", null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected, setParam]);

  const labels = stageLabels(state);
  const q = query.trim().toLowerCase();

  const rows = state.candidacies
    .filter((candidacy) => {
      const person = personById(state, candidacy.person_id);
      if (roleFilter !== "all" && candidacy.role_id !== roleFilter) return false;
      if (stageFilter !== "all" && stageOf(state, candidacy)?.label !== stageFilter) return false;
      if (
        channelFilter !== "all" &&
        channelById(state, candidacy.channel_id)?.name !== channelFilter
      )
        return false;
      if (stateFilter === "open" && candidacy.closed_at !== null) return false;
      if (stateFilter === "closed" && candidacy.closed_at === null) return false;
      if (flaggedOnly && needsAttention(state, candidacy) === null) return false;
      if (
        q &&
        !`${person?.full_name ?? ""} ${person?.current_employer ?? ""}`.toLowerCase().includes(q)
      )
        return false;
      return true;
    })
    .sort((left, right) => {
      const family = (candidacy: Candidacy) => familyName(personById(state, candidacy.person_id));
      const byFamily = family(left).localeCompare(family(right));
      if (sort === "stage") {
        const at = (candidacy: Candidacy) => labels.indexOf(stageOf(state, candidacy)?.label ?? "");
        return at(left) - at(right) || byFamily;
      }
      if (sort === "closing") {
        return daysFromNow(left.auto_close_at) - daysFromNow(right.auto_close_at);
      }
      if (sort === "added") {
        return Date.parse(left.created_at) - Date.parse(right.created_at) || byFamily;
      }
      const roleTitle = (candidacy: Candidacy) => roleById(state, candidacy.role_id)?.title ?? "";
      return byFamily || roleTitle(left).localeCompare(roleTitle(right));
    });

  const scopedRole = roleFilter !== "all" ? roleById(state, roleFilter) : undefined;
  const total = state.candidacies.length;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <h1 className="text-22 text-ink font-medium tracking-[-.01em]">
          {scopedRole ? scopedRole.title : "Candidacies"}
        </h1>
        <p className="text-14 text-ink-muted tabular">
          {rows.length === total ? `${total} records` : `${rows.length} of ${total} records`}
        </p>
        <AboutButton open={aboutOpen} onToggle={() => setAboutOpen(!aboutOpen)} />
      </div>

      <AboutPanel open={aboutOpen}>
        <p className="text-14 text-ink-secondary max-w-[70ch]">
          One row is one person on one role, against the criteria of the Brief version pinned when
          the role opened. Sorting is a filing order: there is no sort by evidence, because a column
          ordered by assessment reads as a shortlist.
        </p>
        <CriteriaKey className="mt-3" />
      </AboutPanel>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <fieldset
          className="border-rule-control rounded-rc mr-2 flex overflow-hidden border"
          aria-label="View"
        >
          {(["list", "board"] as const).map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={view === option}
              onClick={() => setParam("view", option === "list" ? null : option)}
              className={cn(
                "rc-label px-2 py-[4px] transition-colors",
                view === option ? "bg-ink text-ink-inverse" : "text-ink-muted hover:text-ink",
                FOCUS,
              )}
            >
              {option === "list" ? "List" : "Board"}
            </button>
          ))}
        </fieldset>

        {view === "list" ? (
          <>
            <label>
              <span className="sr-only">Stage</span>
              <select
                value={stageFilter}
                onChange={(event) => setStageFilter(event.target.value)}
                className={cn(SELECT, FOCUS)}
              >
                <option value="all">Any stage</option>
                {labels.map((label) => (
                  <option key={label} value={label}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span className="sr-only">Channel</span>
              <select
                value={channelFilter}
                onChange={(event) => setChannelFilter(event.target.value)}
                className={cn(SELECT, FOCUS)}
              >
                <option value="all">Any channel</option>
                {state.channels.map((channel) => (
                  <option key={channel.id} value={channel.name}>
                    {channel.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span className="sr-only">Record state</span>
              <select
                value={stateFilter}
                onChange={(event) =>
                  setParam("state", event.target.value === "all" ? null : event.target.value)
                }
                className={cn(SELECT, FOCUS)}
              >
                <option value="all">Open and closed</option>
                <option value="open">Open records</option>
                <option value="closed">Closed records</option>
              </select>
            </label>

            <button
              type="button"
              aria-pressed={flaggedOnly}
              onClick={() => setParam("flagged", flaggedOnly ? null : "1")}
              className={cn(
                "rc-label rounded-rc border px-2 py-[4px] transition-colors",
                flaggedOnly ? "border-ink text-ink" : "border-rule-control text-ink-muted",
                FOCUS,
              )}
            >
              {flaggedOnly ? "Needs attention · on" : "Needs attention"}
            </button>

            <label className="ml-auto flex items-center gap-2">
              <span className="rc-label text-ink-muted">Sort</span>
              <select
                value={sort}
                onChange={(event) => setSort(event.target.value as typeof sort)}
                className={cn(SELECT, FOCUS)}
              >
                <option value="family">Family name</option>
                <option value="stage">Stage</option>
                <option value="closing">Days to auto-closure</option>
                <option value="added">Date added</option>
              </select>
            </label>
          </>
        ) : null}
      </div>

      {view === "board" ? (
        scopedRole?.pinned_brief_version_id ? (
          <PipelineBoard
            roleId={scopedRole.id}
            selected={selected}
            onSelect={(id) => setParam("candidacy", id)}
          />
        ) : (
          <div className="mt-6 max-w-[70ch]">
            <p className="text-16 text-ink">
              {scopedRole
                ? "This role is draft. The board is an open role's pipeline — open the role first."
                : "The board is one role's pipeline. Choose the role."}
            </p>
            {!scopedRole ? (
              <div className="mt-3 flex flex-wrap gap-3">
                {state.roles
                  .filter((role) => role.pinned_brief_version_id !== null)
                  .map((role) => (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => {
                        const next = new URLSearchParams(params.toString());
                        next.set("role", role.id);
                        next.set("view", "board");
                        router.push(`/prototype/candidacies?${next.toString()}`);
                      }}
                      className={cn(
                        "rc-label text-ink border-rule-control rounded-rc hover:bg-paper-sunk border px-2 py-[3px] transition-colors",
                        FOCUS,
                      )}
                    >
                      {role.title}
                    </button>
                  ))}
              </div>
            ) : null}
          </div>
        )
      ) : (
        <div className="mt-3 overflow-x-auto">
          <div className="border-ink min-w-[1141px] border-t">
            <div className={cn(GRID, "border-rule border-b py-[6px]")}>
              <span />
              <span className="rc-label text-ink-muted">Candidate</span>
              <span className="rc-label text-ink-muted">Role</span>
              <span className="rc-label text-ink-muted">Criteria, in Brief order</span>
              <span className="rc-label text-ink-muted">Stage</span>
              <span className="rc-label text-ink-muted">Attention</span>
            </div>

            {rows.map((candidacy) => {
              const person = personById(state, candidacy.person_id);
              const role = roleById(state, candidacy.role_id);
              const flag = needsAttention(state, candidacy);
              const isSelected = selected === candidacy.id;
              const cells = cellsFor(state, candidacy).map((cell) => ({
                label: cell.criterion.cell_label,
                state: CELL_STATE[cell.state],
              }));

              return (
                <button
                  key={candidacy.id}
                  type="button"
                  onClick={() => setParam("candidacy", isSelected ? null : candidacy.id)}
                  className={cn(
                    GRID,
                    "border-rule w-full cursor-pointer border-b py-[7px] text-left",
                    isSelected ? "bg-paper-sunk" : "hover:bg-paper-sunk",
                    FOCUS,
                    "focus-visible:-outline-offset-2",
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={cn("h-[19px] w-[3px]", isSelected ? "bg-ink" : "bg-transparent")}
                  />
                  <span className="min-w-0">
                    <span
                      className={cn(
                        "text-16 block whitespace-nowrap",
                        flag ? "text-ink" : "text-ink-secondary",
                      )}
                    >
                      {person?.full_name}
                    </span>
                    <span className="text-14 text-ink-muted block truncate">
                      {person?.current_employer}
                    </span>
                  </span>
                  <span className="text-14 text-ink-secondary truncate">{role?.title}</span>
                  <CriteriaRow
                    cells={cells}
                    subject={person?.full_name ?? ""}
                    size="sm"
                    count="short"
                  />
                  <span className="text-14 text-ink-secondary truncate">
                    {stageOf(state, candidacy)?.label}
                  </span>
                  {flag ? (
                    <span className="rc-label text-ink">{flag.flag}</span>
                  ) : (
                    <span className="text-14 text-ink-muted tabular whitespace-nowrap">
                      {candidacy.closed_at !== null
                        ? `Closed ${formatDateShort(candidacy.closed_at)}`
                        : formatDateShort(candidacy.auto_close_at)}
                    </span>
                  )}
                </button>
              );
            })}

            {rows.length === 0 ? (
              <div className="py-8">
                <p className="text-16 text-ink-secondary">No records match.</p>
                <button
                  type="button"
                  onClick={() => {
                    setStageFilter("all");
                    setChannelFilter("all");
                    const next = new URLSearchParams(params.toString());
                    next.delete("flagged");
                    next.delete("state");
                    const search = next.toString();
                    router.push(`/prototype/candidacies${search ? `?${search}` : ""}`);
                  }}
                  className={cn(
                    "rc-label text-ink border-rule-control rounded-rc hover:bg-paper-sunk mt-3 border px-2 py-[3px] transition-colors",
                    FOCUS,
                  )}
                >
                  Clear the filters
                </button>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {selected ? (
        <CandidacyDrawer candidacyId={selected} onClose={() => setParam("candidacy", null)} />
      ) : null}
    </div>
  );
}
