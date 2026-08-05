"use client";

/* Screen 2 — the role, its Brief, and the candidacies on it.
 *
 * The draft role shows the refusal in place of the pipeline. Not a banner above a
 * greyed-out table: there is no pipeline to grey out, because there is nothing in it and
 * there cannot be until The Brief has three criteria.
 */
import Link from "next/link";
import { useState } from "react";
import { Control } from "@/components/control";
import { CriteriaKey, CriteriaRow } from "@/components/criteria-row";
import { DaysRemaining } from "@/components/days-remaining";
import { Refusal } from "@/components/refusal";
import { StateMarker } from "@/components/state-marker";
import { daysFromNow, formatDate } from "../../../_fixtures/clock";
import { usePrototype } from "../../../_state/provider";
import {
  type Refusal as RefusalShape,
  refuseCandidacy,
  refuseSearch,
} from "../../../_state/refusals";
import {
  candidaciesForRole,
  cellsFor,
  clientById,
  criteriaFor,
  personById,
  roleById,
  stageById,
  workingBriefVersion,
} from "../../../_state/selectors";
import { Crumbs, Screen, ScreenTitle, Section } from "../../../screen";

const STATE_MARKER = {
  draft: { label: "Draft", shape: "dotted" as const },
  open: { label: "Open", shape: "filled" as const },
  closed: { label: "Closed", shape: "outlined" as const },
};

export function RoleScreen({ roleId }: { roleId: string }) {
  const { state } = usePrototype();
  const [pressed, setPressed] = useState<RefusalShape | null>(null);

  const role = roleById(state, roleId);
  if (!role) {
    return (
      <Screen>
        <p className="text-16 text-ink">No role with that identifier.</p>
      </Screen>
    );
  }

  const client = clientById(state, role.client_id);
  const version = workingBriefVersion(state, role);
  const criteria = version ? criteriaFor(state, version.id) : [];
  const held = candidaciesForRole(state, role.id);
  const marker = STATE_MARKER[role.state];

  const candidacyRefusal = refuseCandidacy(state, role.id);
  const searchRefusal = refuseSearch(state, role.id);

  return (
    <Screen>
      <Crumbs trail={[{ href: "/prototype", label: "The desk" }, { label: role.title }]} />
      <ScreenTitle
        eyebrow={client?.name}
        title={role.title}
        lede={client?.description}
        aside={<StateMarker label={marker.label} shape={marker.shape} />}
      />

      <Section
        title="The Brief"
        note={version?.note}
        aside={
          version ? (
            <p className="text-14 text-ink-muted tabular">
              Version {version.version} · {formatDate(version.created_at)}
            </p>
          ) : null
        }
      >
        <ol className="border-rule border-t">
          {criteria.map((criterion) => (
            <li
              key={criterion.id}
              className="border-rule grid gap-x-6 gap-y-1 border-b py-4 sm:grid-cols-[3rem_1fr]"
            >
              <p className="text-16 text-ink-muted tabular">{criterion.position}</p>
              <p className="text-18 text-ink max-w-[62ch]">{criterion.text}</p>
            </li>
          ))}
        </ol>
        {role.state === "draft" ? (
          <p className="text-14 text-ink-muted mt-4 max-w-[62ch]">
            The order is fixed once the role opens. Every candidate on this role is read against
            these criteria in this sequence, and the cell row on every screen follows it.
          </p>
        ) : null}
      </Section>

      {role.state === "draft" ? (
        <Section title="Pipeline">
          <Refusal
            requirement={pressed ? pressed.requirement : (candidacyRefusal?.requirement ?? "")}
            reason={pressed ? pressed.reason : (candidacyRefusal?.reason ?? "")}
            action={pressed ? pressed.action : (candidacyRefusal?.action ?? "")}
            items={pressed ? pressed.items : candidacyRefusal?.items}
            footnote={`Invariant ${pressed ? pressed.invariant : (candidacyRefusal?.invariant ?? 1)} · rubric before pipeline`}
          >
            <Control variant="secondary" onClick={() => setPressed(candidacyRefusal)}>
              Add a candidate
            </Control>
            <Control variant="secondary" onClick={() => setPressed(searchRefusal)}>
              Run a search
            </Control>
          </Refusal>
          <p className="text-14 text-ink-muted mt-4 max-w-[62ch]">
            Both controls are live. They are not greyed out, because a control that declines without
            saying why teaches the reader nothing about what to do next.
          </p>
        </Section>
      ) : (
        <Section
          title="Candidacies"
          note="Sorted by family name. There is no ranking, no shortlist and no order that could be read as preference."
          aside={
            role.state === "open" ? (
              <Link
                href={`/prototype/roles/${role.id}/search`}
                className="text-16 text-ink focus-visible:outline-ink underline decoration-1 underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4"
              >
                Sourcing runs
              </Link>
            ) : null
          }
        >
          <CriteriaKey className="mb-6" />

          <div className="border-rule border-t">
            <div className="border-rule text-ink-muted hidden gap-6 border-b py-3 lg:grid lg:grid-cols-[minmax(0,15rem)_minmax(0,22rem)_minmax(0,9rem)_minmax(0,13rem)]">
              <p className="rc-label">Candidate</p>
              <p className="rc-label">Criteria, in the order of The Brief</p>
              <p className="rc-label">Stage</p>
              <p className="rc-label">Auto-closure</p>
            </div>

            {held.map((candidacy) => {
              const person = personById(state, candidacy.person_id);
              const stage = stageById(state, candidacy.stage_id);
              const cells = cellsFor(state, candidacy);
              const days = daysFromNow(candidacy.auto_close_at);

              return (
                <div
                  key={candidacy.id}
                  className="border-rule flex flex-col gap-4 border-b py-5 lg:grid lg:grid-cols-[minmax(0,15rem)_minmax(0,22rem)_minmax(0,9rem)_minmax(0,13rem)] lg:items-center lg:gap-6"
                >
                  <div className="min-w-0">
                    <p className="text-16 text-ink">
                      <Link
                        href={`/prototype/candidacies/${candidacy.id}`}
                        className="focus-visible:outline-ink underline decoration-1 underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4"
                      >
                        {person?.full_name}
                      </Link>
                    </p>
                    <p className="text-14 text-ink-muted mt-0.5">{person?.current_employer}</p>
                  </div>

                  <CriteriaRow
                    subject={person?.full_name ?? "this candidate"}
                    cells={cells.map((cell) => ({
                      label: cell.criterion.cell_label,
                      state:
                        cell.state === "evidenced"
                          ? "evidenced"
                          : cell.state === "not_found"
                            ? "not-found"
                            : "no-entry",
                    }))}
                  />

                  <p className="text-14 text-ink-secondary">{stage?.label}</p>

                  <div>
                    {candidacy.closed_at ? (
                      <p className="text-14 text-ink-muted tabular">
                        Closed {formatDate(candidacy.closed_at)}
                      </p>
                    ) : (
                      <p className="text-14 text-ink-secondary tabular">
                        <span
                          className={days <= 7 ? "underline decoration-2 underline-offset-4" : ""}
                        >
                          {days} days
                        </span>{" "}
                        · {formatDate(candidacy.auto_close_at)}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {role.state === "closed" ? (
            <p className="text-16 text-ink-secondary mt-6 max-w-[62ch]">{role.closed_reason}</p>
          ) : null}
        </Section>
      )}

      {role.state === "open" ? (
        <Section title="Auto-closure">
          <div className="max-w-[62ch]">
            <p className="text-16 text-ink-secondary">
              Every candidacy on this role carries a closing date, set when the record was made.
              There is no control on this screen, or on any other, to extend or remove one.
            </p>
            <div className="border-rule mt-5 border-t pt-5">
              {held
                .filter((candidacy) => !candidacy.closed_at)
                .map((candidacy) => ({ candidacy, days: daysFromNow(candidacy.auto_close_at) }))
                .sort((left, right) => left.days - right.days)
                .slice(0, 1)
                .map(({ candidacy, days }) => (
                  <div key={candidacy.id}>
                    <p className="rc-label text-ink-muted mb-2">Closing first</p>
                    <p className="text-16 text-ink">
                      {personById(state, candidacy.person_id)?.full_name}
                    </p>
                    <DaysRemaining
                      days={days}
                      on={formatDate(candidacy.auto_close_at)}
                      className="mt-2"
                    />
                  </div>
                ))}
            </div>
          </div>
        </Section>
      ) : null}
    </Screen>
  );
}
