"use client";

/* Screen 2 — the role, its Brief, and the candidacies on it.
 *
 * The Brief now says two things: what must be evidenced, and where each one is
 * evidenced. Both are on this screen in one table, because a criterion nobody has
 * agreed to look for is the same failure as a criterion nobody wrote down, and the
 * only way to see it is to put the column next to the criterion.
 *
 * The draft role shows its refusals in place of the pipeline, in the order they bite:
 * three criteria first, then coverage. Both controls that answer them are live.
 */
import Link from "next/link";
import { useState } from "react";
import { Control } from "@/components/control";
import { CriteriaKey, CriteriaRow } from "@/components/criteria-row";
import { Refusal } from "@/components/refusal";
import { StageFunnel } from "@/components/stage-funnel";
import { StateMarker } from "@/components/state-marker";
import { daysFromNow, formatDate } from "../../../_fixtures/clock";
import { usePrototype } from "../../../_state/provider";
import {
  type Refusal as RefusalShape,
  refuseCandidacy,
  refuseOpenRole,
  refuseSearch,
} from "../../../_state/refusals";
import {
  briefFeedbackForClient,
  candidaciesForRole,
  cellsFor,
  channelsForRole,
  clientById,
  criteriaFor,
  funnelForRole,
  personById,
  roleById,
  stageOf,
  stagesFor,
  workingBriefVersion,
} from "../../../_state/selectors";
import { Crumbs, Screen, ScreenTitle, Section } from "../../../screen";

const STATE_MARKER = {
  draft: { label: "Draft", shape: "dotted" as const },
  open: { label: "Open", shape: "filled" as const },
  closed: { label: "Closed", shape: "outlined" as const },
};

export function RoleScreen({ roleId }: { roleId: string }) {
  const { state, dispatch } = usePrototype();
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
  const stages = version ? stagesFor(state, version.id) : [];
  const held = candidaciesForRole(state, role.id);
  const marker = STATE_MARKER[role.state];
  const feedback = briefFeedbackForClient(state, role.client_id);

  const openRefusal = refuseOpenRole(state, role.id);
  const candidacyRefusal = refuseCandidacy(state, role.id);
  const searchRefusal = refuseSearch(state, role.id);

  /** Which stage evidences a criterion, for the column beside it. */
  const evidencedAt = (criterionId: string) =>
    stages.filter((stage) => stage.criterion_ids.includes(criterionId));

  /* The first criterion nobody has said where to look for, and the stages that could
   * take it. Submitted is excluded: it is where the record leaves, not where anything
   * is found out. */
  const unassigned = criteria.find(
    (criterion) => !stages.some((stage) => stage.criterion_ids.includes(criterion.id)),
  );
  const assignable = stages.filter((stage) => stage.label !== "Submitted");

  return (
    <Screen>
      <Crumbs trail={[{ href: "/prototype", label: "The desk" }, { label: role.title }]} />
      <ScreenTitle
        eyebrow={client?.name}
        title={role.title}
        lede={client?.description}
        aside={<StateMarker label={marker.label} shape={marker.shape} />}
      />

      {/* The loop from step five, arriving at the only point it can still change
          anything: the Brief for the next role at the same client. */}
      {feedback.length > 0 ? (
        <Section
          title="Carried from an earlier placement at this client"
          note="Recorded at a probation checkpoint after somebody started. It is here because this is where it can still change what gets asked for."
        >
          <ul className="flex max-w-4xl flex-col gap-4">
            {feedback.map((entry) => (
              <li
                key={entry.checkpoint.id}
                className="border-l-evidenced bg-evidenced-tint border-l-2 px-5 py-4"
              >
                <p className="rc-label text-evidenced">
                  {entry.person_name} · {entry.role.title} · day {entry.checkpoint.day}
                </p>
                <p className="text-16 text-ink mt-3 max-w-[62ch]">
                  {entry.checkpoint.brief_feedback}
                </p>
                <Link
                  href={`/prototype/candidacies/${entry.placement.candidacy_id}/placement`}
                  className="text-ink-secondary hover:text-ink mt-3 inline-block font-mono text-12 underline underline-offset-4 transition-colors"
                >
                  The placement it came from
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

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
        <div className="border-rule max-w-4xl border-t">
          <div className="border-rule text-ink-muted hidden gap-6 border-b py-3 sm:grid sm:grid-cols-[2.5rem_1fr_minmax(0,13rem)]">
            <p className="rc-label">#</p>
            <p className="rc-label">What must be evidenced</p>
            <p className="rc-label">Where it is evidenced</p>
          </div>
          {criteria.map((criterion) => {
            const at = evidencedAt(criterion.id);
            return (
              <div
                key={criterion.id}
                className="border-rule flex flex-col gap-1 border-b py-4 sm:grid sm:grid-cols-[2.5rem_1fr_minmax(0,13rem)] sm:items-baseline sm:gap-6"
              >
                <p className="text-16 text-ink-muted tabular">{criterion.position}</p>
                <p className="text-18 text-ink max-w-[52ch]">{criterion.text}</p>
                {at.length > 0 ? (
                  <p className="text-14 text-ink-secondary">
                    {at.map((stage) => stage.label).join(", then ")}
                  </p>
                ) : (
                  <p className="text-14 text-ink border-b border-dotted pb-0.5">
                    Assigned to no stage
                  </p>
                )}
              </div>
            );
          })}
        </div>
        <p className="text-14 text-ink-muted mt-4 max-w-[62ch]">
          The order is fixed for the life of the version, and so is the column on the right. Moving
          a criterion to a later stage changes what the assessment is, so it takes a new version and
          everything repins.
        </p>
      </Section>

      {role.state === "draft" ? (
        <Section title="Pipeline">
          {openRefusal ? (
            <Refusal
              className="max-w-3xl"
              requirement={pressed ? pressed.requirement : openRefusal.requirement}
              reason={pressed ? pressed.reason : openRefusal.reason}
              action={pressed ? pressed.action : openRefusal.action}
              items={pressed ? pressed.items : openRefusal.items}
              footnote={`Invariant ${pressed ? pressed.invariant : openRefusal.invariant} · rubric before pipeline`}
            >
              {criteria.length < 3 ? (
                <Control onClick={() => dispatch({ type: "add_criterion", role_id: role.id })}>
                  Add the third criterion
                </Control>
              ) : unassigned ? (
                assignable.map((stage) => (
                  <Control
                    key={stage.id}
                    variant="secondary"
                    onClick={() =>
                      dispatch({
                        type: "assign_criterion",
                        criterion_id: unassigned.id,
                        stage_id: stage.id,
                      })
                    }
                  >
                    Evidence it at {stage.label}
                  </Control>
                ))
              ) : null}
              <Control variant="secondary" onClick={() => setPressed(candidacyRefusal)}>
                Add a candidate
              </Control>
              <Control variant="secondary" onClick={() => setPressed(searchRefusal)}>
                Run a search
              </Control>
            </Refusal>
          ) : (
            <div className="max-w-3xl">
              <p className="text-18 text-ink">
                Three criteria, and every one of them assigned to a stage. This role can open.
              </p>
              <Control
                className="mt-5"
                onClick={() => dispatch({ type: "open_role", role_id: role.id })}
              >
                Open this role
              </Control>
            </div>
          )}
          <p className="text-14 text-ink-muted mt-4 max-w-[62ch]">
            Every control here is live. They are not greyed out, because a control that declines
            without saying why teaches the reader nothing about what to do next.
          </p>
        </Section>
      ) : (
        <>
          <Section
            title="The process"
            note="Defined before anybody was sourced. Each stage is responsible for the criteria beside it, and gates nothing else — which is why a candidate can leave Contacted without a scorecard, and cannot leave the screening call without one."
          >
            <StageFunnel
              className="max-w-4xl"
              total={held.length}
              rows={funnelForRole(state, role).map((step) => ({
                id: step.stage.id,
                label: step.stage.label,
                purpose: step.stage.purpose,
                owner: step.stage.owner === "client" ? "the client's call" : undefined,
                reached: step.reached,
                criteria: step.stage.criterion_ids
                  .map((id) => criteria.find((criterion) => criterion.id === id)?.text ?? "")
                  .filter(Boolean),
              }))}
            />
            <p className="text-14 text-ink-muted mt-4 max-w-[62ch]">
              Counts, not rates. These say what this desk has done, not what anybody is worth, and a
              percentage on {held.length} would be false precision either way.
            </p>
          </Section>

          <Section
            title="Where they came from"
            note="Which of the five things this agency does produces people who survive contact with the criteria. A question about the agency's own effort."
          >
            <div className="border-rule max-w-4xl border-t">
              <div className="border-rule text-ink-muted hidden gap-6 border-b py-3 lg:grid lg:grid-cols-[minmax(0,14rem)_6rem_9rem_9rem]">
                <p className="rc-label">Channel</p>
                <p className="rc-label">Added</p>
                <p className="rc-label">Screened</p>
                <p className="rc-label">Submitted</p>
              </div>
              {channelsForRole(state, role).map((row) => (
                <div
                  key={row.channel.id}
                  className="border-rule flex flex-col gap-1 border-b py-4 lg:grid lg:grid-cols-[minmax(0,14rem)_6rem_9rem_9rem] lg:items-baseline lg:gap-6"
                >
                  <p className="text-16 text-ink">{row.channel.name}</p>
                  <p className="text-16 text-ink-secondary tabular">{row.added}</p>
                  <p className="text-16 text-ink-secondary tabular">{row.reachedScreening}</p>
                  <p className="text-16 text-ink-secondary tabular">{row.reachedSubmitted}</p>
                  <p className="text-14 text-ink-muted mt-1 max-w-[62ch] lg:col-span-4">
                    {row.channel.note}
                  </p>
                </div>
              ))}
            </div>
          </Section>

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
              <div className="border-rule text-ink-muted hidden gap-6 border-b py-3 lg:grid lg:grid-cols-[minmax(0,15rem)_minmax(0,22rem)_minmax(0,11rem)_minmax(0,11rem)]">
                <p className="rc-label">Candidate</p>
                <p className="rc-label">Criteria, in the order of The Brief</p>
                <p className="rc-label">Stage</p>
                <p className="rc-label">Auto-closure</p>
              </div>

              {held.map((candidacy) => {
                const person = personById(state, candidacy.person_id);
                const stage = stageOf(state, candidacy);
                const cells = cellsFor(state, candidacy);
                const days = daysFromNow(candidacy.auto_close_at);

                return (
                  <div
                    key={candidacy.id}
                    className="border-rule flex flex-col gap-4 border-b py-5 lg:grid lg:grid-cols-[minmax(0,15rem)_minmax(0,22rem)_minmax(0,11rem)_minmax(0,11rem)] lg:items-center lg:gap-6"
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
        </>
      )}
    </Screen>
  );
}
