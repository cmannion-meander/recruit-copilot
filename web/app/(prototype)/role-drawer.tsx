"use client";

/* The role drawer: what must be evidenced, and where — and, on a draft role,
 * the controls to finish saying so.
 *
 * The Cannot-open loop completes in place: add the missing criterion, assign
 * each one to the stage that evidences it, press Open. The Open control is
 * live on every draft role, including where it will refuse — the refusal names
 * what is missing, which is how the reader learns the rule without a tutorial.
 */
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Refusal } from "@/components/refusal";
import { StateMarker } from "@/components/state-marker";
import { cn } from "@/lib/utils";
import { formatDate } from "./_fixtures/clock";
import { usePrototype } from "./_state/provider";
import { type Refusal as RefusalShape, refuseOpenRole } from "./_state/refusals";
import {
  candidaciesForRole,
  clientById,
  criteriaFor,
  roleAttention,
  stageOf,
  stagesFor,
  workingBriefVersion,
} from "./_state/selectors";

const FOCUS =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

const ACTION =
  "rc-label rounded-rc border px-2 py-[3px] transition-colors " +
  "border-rule-control text-ink hover:bg-paper-sunk " +
  FOCUS;

const ACTION_PRIMARY =
  "rc-label rounded-rc border border-transparent px-2 py-[3px] transition-colors " +
  "bg-ink text-ink-inverse hover:bg-ink-strong " +
  FOCUS;

export function RoleDrawer({ roleId, onClose }: { roleId: string; onClose: () => void }) {
  const { state, dispatch } = usePrototype();
  const router = useRouter();
  const [refusal, setRefusal] = useState<RefusalShape | null>(null);

  const role = state.roles.find((item) => item.id === roleId);
  if (!role) return null;

  const client = clientById(state, role.client_id);
  const version = workingBriefVersion(state, role);
  const criteria = version ? criteriaFor(state, version.id) : [];
  const stages = version ? stagesFor(state, version.id) : [];
  const held = candidaciesForRole(state, role.id);
  const flag = roleAttention(state, role);
  const draft = role.state === "draft";

  const evidencedAt = (criterionId: string) =>
    stages.filter((stage) => stage.criterion_ids.includes(criterionId)).map((stage) => stage.label);

  return (
    <aside
      aria-label={`${role.title} — detail`}
      className="border-ink bg-paper-raised fixed inset-y-0 right-0 z-40 flex w-[460px] max-w-[46vw] flex-col border-l motion-safe:animate-[rc-drawer-in_160ms_ease-out]"
    >
      <header className="border-rule border-b px-[18px] py-3">
        <div className="flex items-start justify-between gap-4">
          <p className="rc-label text-ink-muted">{client?.name}</p>
          <button
            type="button"
            onClick={onClose}
            className={cn(
              "rc-label text-ink-muted border-rule-control rounded-rc hover:text-ink border px-2 py-[3px] transition-colors",
              FOCUS,
            )}
          >
            Close
          </button>
        </div>
        <h2 className="text-22 text-ink font-semibold">{role.title}</h2>
        <p className="text-14 text-ink-muted tabular">
          The Brief · Version {version?.version} · {version ? formatDate(version.created_at) : ""}
        </p>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {flag ? (
          <div className="border-ink grid grid-cols-[3px_1fr] gap-x-3 border-y px-[18px] py-[9px]">
            <span aria-hidden="true" className="bg-ink self-stretch" />
            <div>
              <p className="rc-label text-ink">{flag.flag}</p>
              <p className="text-14 text-ink-secondary mt-1 max-w-[70ch]">{flag.detail}</p>
              {criteria.length < 3 ? (
                <button
                  type="button"
                  onClick={() => dispatch({ type: "add_criterion", role_id: role.id })}
                  className={cn(ACTION, "mt-2")}
                >
                  Add the third criterion
                </button>
              ) : null}
            </div>
          </div>
        ) : null}

        {/* The Open control belongs to the draft state, not to the flag — it must
         * survive the flag clearing, or the one moment the role can finally open
         * is the moment the button disappears. It stays live either way and
         * answers with the refusal when pressed. */}
        {draft ? (
          <div className="border-rule border-b px-[18px] py-[11px]">
            <button
              type="button"
              onClick={() => {
                const refused = refuseOpenRole(state, role.id);
                setRefusal(refused);
                if (refused) return;
                dispatch({ type: "open_role", role_id: role.id });
              }}
              className={ACTION_PRIMARY}
            >
              Open this role
            </button>
            {refusal ? (
              <Refusal
                requirement={refusal.requirement}
                reason={refusal.reason}
                action={refusal.action}
                items={refusal.items}
                footnote={`Invariant ${refusal.invariant}`}
                className="mt-3"
              />
            ) : null}
          </div>
        ) : null}

        <section className="px-[18px] py-3">
          <p className="rc-label text-ink-muted">What must be evidenced, and where</p>
          <ul className="mt-2">
            {criteria.map((criterion) => {
              const at = evidencedAt(criterion.id);
              return (
                <li
                  key={criterion.id}
                  className="border-rule grid grid-cols-[24px_1fr] gap-x-2 border-b py-2"
                >
                  <span className="text-14 text-ink-muted tabular">{criterion.position}</span>
                  <div className="min-w-0">
                    <p className="text-16 text-ink">{criterion.text}</p>
                    {at.length > 0 ? (
                      <p className="text-14 text-ink-muted mt-0.5">Evidenced at {at.join(", ")}</p>
                    ) : draft ? (
                      <label className="mt-1 flex flex-wrap items-center gap-2">
                        <span className="text-14 text-ink">Evidenced at</span>
                        <select
                          defaultValue=""
                          onChange={(event) => {
                            if (event.target.value === "") return;
                            dispatch({
                              type: "assign_criterion",
                              criterion_id: criterion.id,
                              stage_id: event.target.value,
                            });
                            setRefusal(null);
                          }}
                          className={cn(
                            "border-rule-control rounded-rc text-14 text-ink-secondary border bg-transparent px-1.5 py-[3px]",
                            FOCUS,
                          )}
                        >
                          <option value="">Choose a stage</option>
                          {stages.map((stage) => (
                            <option key={stage.id} value={stage.id}>
                              {stage.label}
                            </option>
                          ))}
                        </select>
                      </label>
                    ) : (
                      <p className="text-14 text-ink mt-0.5">Assigned to no stage</p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="px-[18px] py-3">
          <p className="rc-label text-ink-muted">Stages</p>
          <ul className="mt-2">
            {stages.map((stage) => (
              <li
                key={stage.id}
                className="border-rule flex items-baseline justify-between gap-4 border-b py-2"
              >
                <span className="text-16 text-ink-secondary">{stage.label}</span>
                <span className="text-14 text-ink-muted tabular">
                  {held.filter((candidacy) => stageOf(state, candidacy)?.id === stage.id).length}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <div className="px-[18px] py-3">
          <StateMarker
            label={role.state.charAt(0).toUpperCase() + role.state.slice(1)}
            shape={
              role.state === "open" ? "filled" : role.state === "draft" ? "dotted" : "outlined"
            }
          />
        </div>
      </div>

      <footer className="border-rule border-t px-[18px] py-3">
        <button
          type="button"
          onClick={() => {
            onClose();
            router.push(`/prototype/candidacies?role=${role.id}`);
          }}
          className={cn(
            "text-ink hover:text-ink-secondary font-mono text-12 underline decoration-1 underline-offset-4 transition-colors",
            FOCUS,
          )}
        >
          See candidacies
        </button>
      </footer>
    </aside>
  );
}
