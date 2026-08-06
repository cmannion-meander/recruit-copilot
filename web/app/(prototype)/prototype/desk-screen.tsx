"use client";

import Link from "next/link";
/* Screen 1 — the desk.
 *
 * Open roles, and for each one the counts of candidacies by stage. Counts, plural: five
 * numbers that each mean one thing, not one number that means nothing. There is no
 * health indicator, no traffic light on a role, no "roles needing attention", and no
 * ordering that could be read as importance — roles sort by client, then by title.
 */
import { StateMarker } from "@/components/state-marker";
import { daysFromNow, formatDate } from "../_fixtures/clock";
import { usePrototype } from "../_state/provider";
import {
  candidaciesForRole,
  checkpointsFor,
  clientById,
  criteriaFor,
  funnelForRole,
  personById,
  roleById,
  searchesForRole,
  stageOf,
  workingBriefVersion,
} from "../_state/selectors";
import { Crumbs, Screen, ScreenTitle, Section } from "../screen";

export function DeskScreen() {
  const { state } = usePrototype();

  const byClient = (roleId: string) => {
    const role = state.roles.find((item) => item.id === roleId);
    return role ? (clientById(state, role.client_id)?.name ?? "") : "";
  };

  const sorted = [...state.roles].sort(
    (left, right) =>
      byClient(left.id).localeCompare(byClient(right.id)) || left.title.localeCompare(right.title),
  );

  const open = sorted.filter((role) => role.state === "open");
  const rest = sorted.filter((role) => role.state !== "open");

  return (
    <Screen>
      <Crumbs trail={[{ label: "The desk" }]} />
      <ScreenTitle
        eyebrow={state.organization.name}
        title="The desk"
        lede={
          <>
            Three roles. Two clients. Twelve candidacies, each one a person and a role held together
            by a record of why.
          </>
        }
      />

      <Section
        title="Open roles"
        note="Counts by stage. There is no figure here that stands in for a role, a client or a person."
      >
        <div className="border-rule border-t">
          {open.map((role) => {
            const client = clientById(state, role.client_id);
            const version = workingBriefVersion(state, role);
            const held = candidaciesForRole(state, role.id);
            const total = held.length;
            /* Counts by stage, from the stages The Brief defined. Five numbers that
             * each mean one thing, not one number that means nothing. */
            const counts = (version ? funnelForRole(state, role) : [])
              .map((step) => ({
                stage: step.stage,
                count: held.filter((candidacy) => stageOf(state, candidacy)?.id === step.stage.id)
                  .length,
              }))
              .filter((entry) => entry.count > 0);

            return (
              <article key={role.id} className="border-rule border-b py-7">
                <div className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-2">
                  <div className="min-w-0">
                    <p className="rc-label text-ink-muted">{client?.name}</p>
                    <h3 className="text-28 text-ink mt-2 font-medium tracking-tight">
                      <Link
                        href={`/prototype/roles/${role.id}`}
                        className="focus-visible:outline-ink hover:underline hover:decoration-1 hover:underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4"
                      >
                        {role.title}
                      </Link>
                    </h3>
                  </div>
                  <StateMarker label="Open" shape="filled" />
                </div>

                <p className="text-16 text-ink-secondary mt-3 max-w-[62ch]">
                  The Brief, version {version?.version}, pinned on{" "}
                  {role.opened_at ? formatDate(role.opened_at) : "—"}.{" "}
                  {version ? criteriaFor(state, version.id).length : 0} criteria, in a fixed order.
                </p>

                <dl className="border-rule mt-6 grid grid-cols-2 gap-px border-t bg-rule sm:grid-cols-4 lg:grid-cols-6">
                  {counts.map((entry) => (
                    <div key={entry.stage.id} className="bg-paper px-4 py-4">
                      <dt className="rc-label text-ink-muted">{entry.stage.label}</dt>
                      <dd className="text-28 text-ink mt-1 tabular">{entry.count}</dd>
                    </div>
                  ))}
                </dl>

                <p className="text-14 text-ink-muted mt-4 tabular">
                  {total} candidacies in total. {searchesForRole(state, role.id).length} sourcing
                  runs against this Brief.
                </p>
              </article>
            );
          })}
        </div>
      </Section>

      {/* Step five, on the desk, because a checkpoint nobody is reminded of is a
          checkpoint nobody does — and for a perm agency the fee is at stake. */}
      {state.placements.length > 0 ? (
        <Section
          title="After the placement"
          note="Probation checkpoints, agreed before each offer was signed. The fee is earned at the end of probation, not on the start date."
        >
          <ul className="border-rule border-t">
            {state.placements.map((placement) => {
              const candidacy = state.candidacies.find(
                (item) => item.id === placement.candidacy_id,
              );
              if (!candidacy) return null;
              const person = personById(state, candidacy.person_id);
              const role = roleById(state, candidacy.role_id);
              const outstanding = checkpointsFor(state, placement.id).filter(
                (checkpoint) => checkpoint.recorded_at === null,
              );
              const overdue = outstanding.filter(
                (checkpoint) => daysFromNow(checkpoint.due_on) < 0,
              );

              return (
                <li key={placement.id} className="border-rule border-b py-5">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-2">
                    <p className="text-16 text-ink">
                      <Link
                        href={`/prototype/candidacies/${candidacy.id}/placement`}
                        className="focus-visible:outline-ink underline decoration-1 underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4"
                      >
                        {person?.full_name}
                      </Link>
                      <span className="text-ink-muted"> · {role?.title}</span>
                    </p>
                    <p className="text-14 text-ink-muted tabular">
                      Started {formatDate(placement.started_on)} · probation ends{" "}
                      {formatDate(placement.probation_ends_on)}
                    </p>
                  </div>
                  <p className="text-14 text-ink-secondary mt-2 tabular">
                    {outstanding.length === 0
                      ? "All checkpoints recorded."
                      : overdue.length > 0
                        ? `Day ${overdue.map((checkpoint) => checkpoint.day).join(" and day ")} ${overdue.length === 1 ? "is" : "are"} past due and nobody has asked.`
                        : `${outstanding.length} still to come.`}
                  </p>
                </li>
              );
            })}
          </ul>
        </Section>
      ) : null}

      <Section
        title="Not open"
        note="A role that is not open takes no candidates and runs no search. The reason is on the role."
      >
        <ul className="border-rule border-t">
          {rest.map((role) => {
            const client = clientById(state, role.client_id);
            return (
              <li
                key={role.id}
                className="border-rule flex flex-wrap items-baseline justify-between gap-x-8 gap-y-2 border-b py-4"
              >
                <p className="text-16 text-ink">
                  <Link
                    href={`/prototype/roles/${role.id}`}
                    className="focus-visible:outline-ink hover:underline hover:decoration-1 hover:underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4"
                  >
                    {role.title}
                  </Link>
                  <span className="text-ink-muted"> · {client?.name}</span>
                </p>
                <StateMarker
                  label={role.state === "draft" ? "Draft" : "Closed"}
                  shape={role.state === "draft" ? "dotted" : "outlined"}
                />
              </li>
            );
          })}
        </ul>
      </Section>
    </Screen>
  );
}
