"use client";

/* Screen 5 — the candidacy.
 *
 * The stage control is live on every candidacy, including the ones where it will refuse.
 * It refuses on the criteria the CURRENT stage carries, not on the whole rubric —
 * The Brief says which those are, and a stage that carries none gates nothing, because
 * you contact somebody in order to learn the things.
 *
 * The whole rubric is still required, once, at submission.
 *
 * auto_close_at is on this screen and there is no control anywhere to extend or remove
 * it. Invariant 6: a deadline you can quietly turn off is not a promise to a candidate.
 */
import Link from "next/link";
import { useState } from "react";
import { ActivityList } from "@/components/activity-list";
import { Control } from "@/components/control";
import { CriteriaKey, CriteriaRow } from "@/components/criteria-row";
import { DaysRemaining } from "@/components/days-remaining";
import { RecordField, RecordFields } from "@/components/record-field";
import { Refusal } from "@/components/refusal";
import { StateMarker } from "@/components/state-marker";
import { daysFromNow, formatDate } from "../../../_fixtures/clock";
import { usePrototype } from "../../../_state/provider";
import { type Refusal as RefusalShape, refuseAdvance } from "../../../_state/refusals";
import {
  briefVersionById,
  candidacyById,
  cellsFor,
  channelById,
  clientById,
  criteriaAtStage,
  decisionFor,
  eventsFor,
  exclusionFor,
  messageSentAtStage,
  messagesFor,
  nextStage,
  personById,
  placementFor,
  roleById,
  signalsFor,
  stageOf,
  stagesFor,
  submissionFor,
  userById,
} from "../../../_state/selectors";
import { Crumbs, Screen, ScreenTitle, Section } from "../../../screen";
import { CrosscheckPanel } from "./crosscheck-panel";
import { RejectionPanel } from "./rejection-panel";

export function CandidacyScreen({ candidacyId }: { candidacyId: string }) {
  const { state, dispatch } = usePrototype();
  const [refusal, setRefusal] = useState<RefusalShape | null>(null);

  const candidacy = candidacyById(state, candidacyId);
  if (!candidacy) {
    return (
      <Screen>
        <p className="text-16 text-ink">No candidacy with that identifier.</p>
      </Screen>
    );
  }

  const person = personById(state, candidacy.person_id);
  const role = roleById(state, candidacy.role_id);
  const client = role ? clientById(state, role.client_id) : undefined;
  const version = briefVersionById(state, candidacy.brief_version_id);
  const stage = stageOf(state, candidacy);
  const onward = nextStage(state, candidacy);
  const stages = stagesFor(state, candidacy.brief_version_id);
  const cells = cellsFor(state, candidacy);
  const signals = signalsFor(state, candidacy.id);
  const decision = decisionFor(state, candidacy.id);
  const exclusion = exclusionFor(state, candidacy.id);
  const submission = submissionFor(state, candidacy.id);
  const placement = placementFor(state, candidacy.id);
  const messages = messagesFor(state, candidacy.id);
  const days = daysFromNow(candidacy.auto_close_at);

  const owedHere = stage ? criteriaAtStage(state, candidacy, stage.id) : [];
  const toldAtThisStage = stage ? messageSentAtStage(state, candidacy.id, stage.id) : true;

  return (
    <Screen>
      <Crumbs
        trail={[
          { href: "/prototype", label: "The desk" },
          { href: `/prototype/roles/${candidacy.role_id}`, label: role?.title ?? "Role" },
          { label: person?.full_name ?? "Candidacy" },
        ]}
      />
      <ScreenTitle
        eyebrow={`${client?.name} · ${role?.title}`}
        title={person?.full_name ?? ""}
        lede={person?.headline}
        aside={
          <StateMarker label={stage?.label ?? ""} shape={stage?.terminal ? "outlined" : "filled"} />
        }
      />

      <Section
        title="Where this candidacy is"
        note="The stages The Brief defined before anybody was sourced, and what each one is responsible for."
      >
        <ol className="border-rule max-w-4xl border-t">
          {stages.map((item) => {
            const here = item.id === stage?.id;
            const passed = stage?.position !== null && item.position < (stage?.position ?? 0);
            return (
              <li
                key={item.id}
                className={`border-rule border-b py-4 ${here ? "bg-paper-sunk -mx-4 px-4" : ""}`}
              >
                <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                  <p className={`text-16 ${here ? "text-ink font-medium" : "text-ink-secondary"}`}>
                    {item.label}
                    {item.owner === "client" ? (
                      <span className="text-ink-muted"> · the client's call</span>
                    ) : null}
                  </p>
                  <StateMarker
                    label={here ? "Here now" : passed ? "Passed" : "Ahead"}
                    shape={here ? "filled" : passed ? "outlined" : "dotted"}
                  />
                </div>
                <p className="text-14 text-ink-muted mt-1 max-w-[62ch]">{item.purpose}</p>
                {item.criterion_ids.length > 0 ? (
                  <ul className="mt-2">
                    {criteriaAtStage(state, candidacy, item.id).map((criterion) => (
                      <li key={criterion.id} className="text-14 text-ink-secondary">
                        Evidences · {criterion.text}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            );
          })}
        </ol>
      </Section>

      <Section
        title="Against The Brief"
        note={`Read against version ${version?.version}, pinned when this candidacy was created. A later version of The Brief does not move this record.`}
        aside={
          <Link
            href={`/prototype/candidacies/${candidacy.id}/review`}
            className="text-16 text-ink focus-visible:outline-ink underline decoration-1 underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4"
          >
            The scorecards
          </Link>
        }
      >
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
        <CriteriaKey className="mt-6" />

        <ol className="border-rule mt-8 max-w-4xl border-t">
          {cells.map((cell) => (
            <li
              key={cell.criterion.id}
              className="border-rule grid gap-x-6 gap-y-1 border-b py-3 sm:grid-cols-[3rem_1fr_10rem]"
            >
              <p className="text-16 text-ink-muted tabular">{cell.criterion.position}</p>
              <div>
                <p className="text-16 text-ink">{cell.criterion.text}</p>
                {cell.stage ? (
                  <p className="text-14 text-ink-muted mt-0.5">
                    {cell.earlier.length > 0
                      ? `Read at ${cell.earlier.map((item) => item.stage?.label).join(", then ")}, then ${cell.stage.label}`
                      : `Read at ${cell.stage.label}`}
                  </p>
                ) : null}
              </div>
              <p className="text-14 text-ink-secondary sm:text-right">
                {cell.state === "evidenced"
                  ? "Evidenced"
                  : cell.state === "not_found"
                    ? "Not found"
                    : "No entry"}
              </p>
            </li>
          ))}
        </ol>
      </Section>

      <Section
        title="Stage"
        note="The control is live. It answers when it is pressed, which is the only way to learn what the record is missing."
      >
        {refusal ? (
          <Refusal
            className="max-w-3xl"
            requirement={refusal.requirement}
            reason={refusal.reason}
            action={refusal.action}
            items={refusal.items}
            footnote={
              refusal.invariant === 6
                ? "Invariant 6 · ghosting is impossible"
                : `Invariant ${refusal.invariant} · no advancement without a scorecard`
            }
          >
            {refusal.invariant === 6 && stage ? (
              <Control
                onClick={() => {
                  dispatch({
                    type: "send_stage_message",
                    candidacy_id: candidacy.id,
                    stage_id: stage.id,
                  });
                  setRefusal(null);
                }}
              >
                Send the {stage.label} message
              </Control>
            ) : (
              <Link
                href={`/prototype/candidacies/${candidacy.id}/review`}
                className="rounded-rc bg-ink text-ink-inverse hover:bg-ink-strong focus-visible:outline-ink px-4 py-2.5 text-16 font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                Open the scorecard
              </Link>
            )}
            <Control variant="secondary" onClick={() => setRefusal(null)}>
              Leave it here
            </Control>
          </Refusal>
        ) : (
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-5">
              <p className="text-18 text-ink">
                {stage?.label}
                {onward ? <span className="text-ink-muted"> → {onward.label}</span> : null}
              </p>
              {onward ? (
                <Control
                  onClick={() => {
                    const refused = refuseAdvance(state, candidacy.id);
                    setRefusal(refused);
                    if (refused) return;
                    dispatch({ type: "advance_stage", candidacy_id: candidacy.id });
                  }}
                >
                  Advance to {onward.label}
                </Control>
              ) : (
                <p className="text-16 text-ink-muted">
                  This candidacy is closed. Nothing moves it from here.
                </p>
              )}
            </div>
            {owedHere.length > 0 ? (
              <p className="text-14 text-ink-muted mt-4 max-w-[62ch]">
                {stage?.label} is responsible for {owedHere.length}{" "}
                {owedHere.length === 1 ? "criterion" : "criteria"}:{" "}
                {owedHere.map((criterion) => criterion.cell_label).join(", ")}. Nothing else on the
                rubric holds this candidacy here.
              </p>
            ) : (
              <p className="text-14 text-ink-muted mt-4 max-w-[62ch]">
                {stage?.label} carries no criteria. It tests interest, availability and money, and
                none of those is on the rubric — so it gates nothing.
              </p>
            )}
          </div>
        )}
      </Section>

      <Section
        title="What this person has been told"
        note="The same rows the candidate reads. There is no internal version of a message, and no note about somebody that they cannot see."
      >
        <div className="max-w-4xl">
          {messages.length === 0 ? (
            <p className="text-16 text-ink-secondary">Nothing has been sent.</p>
          ) : (
            <ol className="border-rule border-t">
              {messages.map((message) => (
                <li key={message.id} className="border-rule border-b py-4">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                    <p className="rc-label text-ink-muted">
                      {message.kind === "rejection"
                        ? "Rejection"
                        : message.kind === "auto_closure"
                          ? "Auto-closure"
                          : message.kind === "submission"
                            ? "Submitted"
                            : (stagesFor(state, candidacy.brief_version_id).find(
                                (item) => item.id === message.stage_id,
                              )?.label ?? "Stage")}
                    </p>
                    <p className="text-14 text-ink-muted tabular">{formatDate(message.sent_at)}</p>
                  </div>
                  <p className="text-16 text-ink-secondary mt-2 max-w-[70ch]">{message.body}</p>
                </li>
              ))}
            </ol>
          )}

          {stage && !stage.terminal && !toldAtThisStage ? (
            <div className="border-rule mt-6 border border-dotted px-5 py-5">
              <p className="text-16 text-ink max-w-[62ch]">
                Nothing has been sent since this candidacy reached {stage.label}.
              </p>
              <p className="text-14 text-ink-muted mt-2 max-w-[70ch]">{stage.candidate_message}</p>
              <Control
                variant="secondary"
                className="mt-4"
                onClick={() =>
                  dispatch({
                    type: "send_stage_message",
                    candidacy_id: candidacy.id,
                    stage_id: stage.id,
                  })
                }
              >
                Send it
              </Control>
            </div>
          ) : null}
        </div>
      </Section>

      <Section
        title="Auto-closure"
        note="Set when the record was made. There is no control on this screen, or on any other, to extend it or turn it off."
      >
        <DaysRemaining days={days} on={formatDate(candidacy.auto_close_at)} />
      </Section>

      <Section
        title="Crosscheck"
        note="Observations drawn from records already held. Each one points at the artifact it came from. None of them is a judgement, and none of them is a probability."
      >
        <CrosscheckPanel signals={signals} />
      </Section>

      {placement ? (
        <Section
          title="Placement"
          note="The fee is earned at the end of probation, not on the start date. The checkpoints are the agency's own exposure written down."
        >
          <div className="max-w-[62ch]">
            <p className="text-16 text-ink">
              Started {formatDate(placement.started_on)} · probation ends{" "}
              {formatDate(placement.probation_ends_on)}
            </p>
            <Link
              href={`/prototype/candidacies/${candidacy.id}/placement`}
              className="rounded-rc bg-ink text-ink-inverse hover:bg-ink-strong focus-visible:outline-ink mt-5 inline-block px-4 py-2.5 text-16 font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              The first ninety days
            </Link>
          </div>
        </Section>
      ) : null}

      {submission ? (
        <Section title="Submission Record">
          <div className="max-w-[62ch]">
            <p className="text-16 text-ink">
              {submission.reference} · signed off by{" "}
              {userById(state, submission.signed_off_by)?.name} on{" "}
              {formatDate(submission.signed_off_at)}
            </p>
            <p className="text-14 text-ink-muted mt-2">
              Created and immutable. It renders from the snapshot taken at sign-off, not from these
              rows.
            </p>
            <Link
              href={`/prototype/candidacies/${candidacy.id}/submission`}
              className="rounded-rc bg-ink text-ink-inverse hover:bg-ink-strong focus-visible:outline-ink mt-5 inline-block px-4 py-2.5 text-16 font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              Open the record
            </Link>
          </div>
        </Section>
      ) : !stage?.terminal ? (
        <Section
          title="Submission Record"
          note="The artifact this whole product exists to produce. It cannot be created while a Crosscheck signal is open, it needs a finding against every criterion, and it cannot be edited once it exists."
        >
          <Link
            href={`/prototype/candidacies/${candidacy.id}/submission`}
            className="rounded-rc border-rule-control bg-paper-raised text-ink hover:bg-paper-sunk focus-visible:outline-ink inline-block border px-4 py-2.5 text-16 font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            Create the Submission Record
          </Link>
        </Section>
      ) : null}

      {exclusion ? (
        <Section title="Exclusion">
          <div className="max-w-[62ch] border-l-2 border-l-ink pl-5">
            <p className="text-16 text-ink">{exclusion.reason_text}</p>
            <p className="text-14 text-ink-muted mt-3 tabular">
              {userById(state, exclusion.excluded_by)?.name} · {formatDate(exclusion.excluded_at)}
            </p>
            <p className="text-14 text-ink-muted mt-5">
              An exclusion answers &ldquo;why not them?&rdquo; the next time this person surfaces on
              a search for this client.
            </p>
          </div>
        </Section>
      ) : null}

      <Section
        title="Rejection"
        note="A reason code and written text. Both are required, the refusal says which one is missing, and what you write is what the candidate reads."
      >
        <RejectionPanel candidacy={candidacy} decision={decision} />
      </Section>

      <Section
        title="Activity"
        note="Append-only. There is no control here to remove or amend an entry, because there is none in the database either."
      >
        <ActivityList
          className="max-w-4xl"
          entries={eventsFor(state, candidacy.id).map((event) => ({
            id: event.id,
            at: formatDate(event.at),
            actor: userById(state, event.actor)?.name ?? event.actor,
            summary: event.summary,
          }))}
        />
      </Section>

      <Section title="The person">
        <RecordFields columns={2} className="max-w-4xl">
          <RecordField
            label="Record"
            value={
              <Link
                href={`/prototype/people/${candidacy.person_id}`}
                className="focus-visible:outline-ink underline decoration-1 underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4"
              >
                {person?.full_name}
              </Link>
            }
          />
          <RecordField
            label="Channel"
            value={channelById(state, candidacy.channel_id)?.name}
            empty="Not recorded."
          />
          <RecordField
            label="Email"
            value={person?.email}
            empty="No email address is held. This person was sourced."
          />
          <RecordField label="Created" value={formatDate(candidacy.created_at)} />
        </RecordFields>
      </Section>
    </Screen>
  );
}
