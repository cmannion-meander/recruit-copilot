"use client";

/* Screen 3 — roles. Same table grammar as Candidacies: a 3px selection bar, a
 * row per role, and an attention cell that is written, never coloured. */
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect } from "react";
import { StateMarker } from "@/components/state-marker";
import { cn } from "@/lib/utils";
import { usePrototype } from "../../_state/provider";
import {
  candidaciesForRole,
  clientById,
  criteriaFor,
  needsAttention,
  roleAttention,
  workingBriefVersion,
} from "../../_state/selectors";
import { RoleDrawer } from "../../role-drawer";

const FOCUS =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink";

const GRID =
  "grid grid-cols-[3px_minmax(0,1.2fr)_minmax(0,1fr)_140px_170px_108px_92px] items-center gap-x-4";

const ROLE_MARKER = {
  open: "filled",
  draft: "dotted",
  closed: "outlined",
} as const;

export function RolesScreen() {
  const { state } = usePrototype();
  const router = useRouter();
  const params = useSearchParams();

  const selected = params.get("role");

  const setSelected = useCallback(
    (value: string | null) => {
      router.push(value ? `/prototype/roles?role=${value}` : "/prototype/roles");
    },
    [router],
  );

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && selected) setSelected(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected, setSelected]);

  const clients = new Set(state.roles.map((role) => role.client_id)).size;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <h1 className="text-22 text-ink font-medium tracking-[-.01em]">Roles</h1>
        <p className="text-14 text-ink-muted tabular">
          {state.roles.length} roles · {clients} clients
        </p>
      </div>

      <div className="mt-3 overflow-x-auto">
        <div className="border-ink min-w-[940px] border-t">
          <div className={cn(GRID, "border-rule border-b py-[6px]")}>
            <span />
            <span className="rc-label text-ink-muted">Role</span>
            <span className="rc-label text-ink-muted">Client</span>
            <span className="rc-label text-ink-muted">State</span>
            <span className="rc-label text-ink-muted">The Brief</span>
            <span className="rc-label text-ink-muted">Candidacies</span>
            <span className="rc-label text-ink-muted">Attention</span>
          </div>

          {state.roles.map((role) => {
            const client = clientById(state, role.client_id);
            const version = workingBriefVersion(state, role);
            const criteria = version ? criteriaFor(state, version.id) : [];
            const held = candidaciesForRole(state, role.id);
            const flag = roleAttention(state, role);
            const flagged = held.filter(
              (candidacy) => needsAttention(state, candidacy) !== null,
            ).length;
            const isSelected = selected === role.id;

            return (
              <button
                key={role.id}
                type="button"
                onClick={() => setSelected(isSelected ? null : role.id)}
                className={cn(
                  GRID,
                  "border-rule w-full cursor-pointer border-b py-[9px] text-left",
                  isSelected ? "bg-paper-sunk" : "hover:bg-paper-sunk",
                  FOCUS,
                  "focus-visible:-outline-offset-2",
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn("h-5 w-[3px]", isSelected ? "bg-ink" : "bg-transparent")}
                />
                <span className="text-16 text-ink truncate">{role.title}</span>
                <span className="text-14 text-ink-secondary truncate">{client?.name}</span>
                <StateMarker
                  label={role.state.charAt(0).toUpperCase() + role.state.slice(1)}
                  shape={ROLE_MARKER[role.state]}
                />
                <span className="text-14 text-ink-secondary tabular truncate">
                  Version {version?.version} · {criteria.length} criteria
                </span>
                <span className="text-14 text-ink-secondary tabular">
                  {held.length > 0 ? held.length : "—"}
                </span>
                {flag ? (
                  <span className="rc-label text-ink whitespace-nowrap">{flag.flag}</span>
                ) : flagged > 0 ? (
                  <span className="text-ink tabular font-mono text-12">{flagged}</span>
                ) : (
                  <span />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {selected ? <RoleDrawer roleId={selected} onClose={() => setSelected(null)} /> : null}
    </div>
  );
}
