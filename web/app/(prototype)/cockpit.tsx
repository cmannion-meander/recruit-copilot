"use client";

/* The application shell: a persistent left nav, a top bar carrying client/role
 * context and search, and the content region. See docs/handoffs/cockpit.
 *
 * The organising idea is dark cockpit: nothing is illuminated unless it needs
 * action. It is not a dark theme — the paper stays cream and "illuminated" means
 * full-contrast ink plus a 3px ink bar plus a written mono label, never a new
 * colour. Every count on the rail is a count of the needsAttention predicate in
 * _state/selectors.ts, and a badge is absent, not zero, when the count is 0.
 *
 * Deliberately NOT in web/components/: it reads the prototype state, so it dies
 * with the prototype. See docs/decisions/0010.
 */
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { createContext, useContext, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { usePrototype } from "./_state/provider";
import { attentionCounts, clientById } from "./_state/selectors";

/* The search box lives in the top bar; the list it filters lives in a screen. The
 * query sits in context above both, and survives moving between views. */
const QueryContext = createContext<{ query: string; setQuery: (value: string) => void } | null>(
  null,
);

export function CockpitQueryProvider({ children }: { children: React.ReactNode }) {
  const [query, setQuery] = useState("");
  const value = useMemo(() => ({ query, setQuery }), [query]);
  return <QueryContext.Provider value={value}>{children}</QueryContext.Provider>;
}

export function useCockpitQuery() {
  const store = useContext(QueryContext);
  if (!store) throw new Error("useCockpitQuery must be used inside the /prototype route group.");
  return store;
}

export type CockpitView = "The Desk" | "Roles" | "Candidacies" | "Sourcing runs" | "Settings";

const NAV: { label: CockpitView; href: string }[] = [
  { label: "The Desk", href: "/prototype" },
  { label: "Roles", href: "/prototype/roles" },
  { label: "Candidacies", href: "/prototype/candidacies" },
  { label: "Sourcing runs", href: "/prototype/sourcing" },
  { label: "Settings", href: "/prototype/settings" },
];

const FOCUS =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink";

export function Cockpit({ view, children }: { view: CockpitView; children: React.ReactNode }) {
  const { state } = usePrototype();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const { query, setQuery } = useCockpitQuery();

  const counts = attentionCounts(state);
  const badge: Record<CockpitView, number> = {
    "The Desk": counts.desk,
    Roles: counts.roles,
    Candidacies: counts.candidacies,
    "Sourcing runs": counts.sourcing,
    Settings: 0,
  };

  const contextValue =
    pathname === "/prototype/candidacies" ? (params.get("role") ?? "all") : "all";

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden">
      <nav
        aria-label="Workspace"
        className="bg-paper-sunk border-rule flex w-[206px] shrink-0 flex-col border-r"
      >
        <div className="px-4 pt-[13px] pb-3">
          <p className="rc-label text-ink">{state.organization.wordmark}</p>
        </div>

        <ul className="flex flex-col gap-[2px] px-2">
          {NAV.map((item) => {
            const current = item.label === view;
            const count = badge[item.label];
            return (
              <li key={item.label}>
                <Link
                  href={item.href}
                  aria-current={current ? "page" : undefined}
                  className={cn(
                    "rounded-rc text-16 grid grid-cols-[3px_1fr_auto] items-center gap-[9px] py-[5px] pr-2",
                    current
                      ? "bg-paper text-ink font-medium"
                      : "text-ink-secondary hover:bg-paper-sunk-hover",
                    FOCUS,
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={cn("h-4 w-[3px]", current ? "bg-ink" : "bg-transparent")}
                  />
                  <span>{item.label}</span>
                  {count > 0 ? (
                    <span className="text-ink tabular font-mono text-12">{count}</span>
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="border-rule mt-auto border-t px-4 py-[11px]">
          <p className="rc-label text-ink-muted">Prototype · synthetic data</p>
        </div>
      </nav>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="border-rule flex min-h-[45px] flex-wrap items-center gap-[14px] border-b px-5 py-1.5">
          <label className="flex min-w-0 flex-[0_1_auto] items-center">
            <span className="sr-only">Client and role context</span>
            <select
              value={contextValue}
              onChange={(event) => {
                const next = event.target.value;
                router.push(
                  next === "all" ? "/prototype/candidacies" : `/prototype/candidacies?role=${next}`,
                );
              }}
              className={cn(
                "border-rule-control rounded-rc text-14 text-ink-secondary min-w-[150px] max-w-[330px] border bg-transparent px-1.5 py-[3px]",
                FOCUS,
              )}
            >
              <option value="all">All clients · all roles</option>
              {state.roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {clientById(state, role.client_id)?.name} · {role.title}
                </option>
              ))}
            </select>
          </label>

          <div className="ml-auto flex min-w-0 flex-[1_1_200px] items-center justify-end gap-[14px]">
            <input
              type="search"
              placeholder="Search"
              aria-label="Search candidacies"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className={cn(
                "border-rule-control rounded-rc text-14 text-ink min-w-[110px] max-w-[240px] flex-[1_1_220px] border bg-transparent px-1.5 py-[3px]",
                FOCUS,
              )}
            />
            <p className="text-14 text-ink-muted whitespace-nowrap">{state.users[0]?.name}</p>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-auto px-5 pt-4 pb-6">{children}</div>
      </div>
    </div>
  );
}

/* The About disclosure: every explanatory paragraph that used to sit in the flow of
 * a screen collapses behind this. Quiet comes from position, not lowered contrast. */
export function AboutButton({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      aria-expanded={open}
      onClick={onToggle}
      className={cn(
        "rc-label text-ink-muted border-rule-control rounded-rc hover:text-ink ml-auto border px-2 py-[3px] transition-colors",
        FOCUS,
      )}
    >
      {open ? "Less" : "About"}
    </button>
  );
}

export function AboutPanel({ open, children }: { open: boolean; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="border-rule mt-3 max-w-[70ch] border-b pb-4 [text-wrap:pretty] motion-safe:animate-[rc-fade_140ms_ease-out]">
      {children}
    </div>
  );
}
