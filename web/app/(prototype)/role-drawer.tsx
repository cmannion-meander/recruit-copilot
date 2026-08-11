"use client";

/* The role drawer: what must be evidenced, and where.
 *
 * The Brief in its two halves — the criteria, and the stage each one is evidenced
 * at. A criterion assigned to no stage renders in full ink, because it is a
 * refusal waiting to happen: the role cannot open until somebody says where it is
 * evidenced. The flag block above says so in the words of the refusal itself.
 */
import { useRouter } from "next/navigation";
import { StateMarker } from "@/components/state-marker";
import { cn } from "@/lib/utils";
import { formatDate } from "./_fixtures/clock";
import { usePrototype } from "./_state/provider";
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

export function RoleDrawer({ roleId, onClose }: { roleId: string; onClose: () => void }) {
  const { state } = usePrototype();
  const router = useRouter();

  const role = state.roles.find((item) => item.id === roleId);
  if (!role) return null;

  const client = clientById(state, role.client_id);
  const version = workingBriefVersion(state, role);
  const criteria = version ? criteriaFor(state, version.id) : [];
  const stages = version ? stagesFor(state, version.id) : [];
  const held = candidaciesForRole(state, role.id);
  const flag = roleAttention(state, role);

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
            </div>
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
