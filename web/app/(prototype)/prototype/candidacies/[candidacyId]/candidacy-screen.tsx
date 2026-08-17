"use client";

/* Screen 5 — the candidacy record.
 *
 * One window at a time. The header says who and where; the tabs hold the depth
 * — Overview for the state and the decisions, The Brief for the readings and
 * the pipeline, then Messages, Crosscheck and History. Nothing renders twelve
 * sections at once: a record you scroll through is a record nobody reads.
 *
 * The stage control is live on every candidacy, including the ones where it
 * will refuse. It refuses on the criteria the CURRENT stage carries — The
 * Brief says which those are. The whole rubric is required once, at submission.
 *
 * auto_close_at moves only in the same act that tells the candidate something
 * — a stage transition, or an extension whose message goes to them verbatim.
 * ADR 0012.
 */
import Link from "next/link";
import { useEffect, useState } from "react";
import { ActivityList } from "@/components/activity-list";
import { Control } from "@/components/control";
import { CriteriaKey, CriteriaRow } from "@/components/criteria-row";
import { DaysRemaining } from "@/components/days-remaining";
import { Refusal } from "@/components/refusal";
import { StageRail } from "@/components/stage-rail";
import { StateMarker } from "@/components/state-marker";
import { cn } from "@/lib/utils";
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
  extensionCount,
  messageSentAtStage,
  messagesFor,
  nextStage,
  openSignalsFor,
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

type Tab = "overview" | "brief" | "messages" | "crosscheck" | "history";

const TAB_LABEL: Record<Tab, string> = {
  overview: "Overview",
  brief: "The Brief",
  messages: "Messages",
  crosscheck: "Crosscheck",
  history: "History",
};

export function CandidacyScreen({ candidacyId }: { candidacyId: string }) {
  const { state, dispatch } = usePrototype();
  const [refusal, setRefusal] = useState<RefusalShape | null>(null);
  const [tab, setTab] = useState<Tab>("overview");
  const [rejecting, setRejecting] = useState(false);

  /* ?tab= deep-links a window (the drawer's "see the artifact" uses it). Read
   * after mount so the server render and the first client render agree. */
  useEffect(() => {
    const wanted = new URLSearchParams(window.location.search).get("tab");
    if (wanted && wanted in TAB_LABEL) setTab(wanted as Tab);
  }, []);

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
  const openSignals = openSignalsFor(state, candidacy.id);
  const decision = decisionFor(state, candidacy.id);
  const exclusion = exclusionFor(state, candidacy.id);
  const submission = submissionFor(state, candidacy.id);
  const placement = placementFor(state, candidacy.id);
  const messages = messagesFor(state, candidacy.id);
  const days = daysFromNow(candidacy.auto_close_at);
  const extended = extensionCount(state, candidacy.id);

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
          <div className="flex flex-col items-end gap-2">
            {candidacy.closed_at === null && stage && !stage.terminal ? (
              <StageRail
                stages={stages.map((item) => ({ id: item.id, label: item.label }))}
                currentId={stage.id}
              />
            ) : (
              <StateMarker label={stage?.label ?? ""} shape="outlined" />
            )}
            <p className="text-14 text-ink-muted tabular">
              {candidacy.closed_at !== null
                ? `Closed ${formatDate(candidacy.closed_at)}`
                : `Auto-closes ${formatDate(candidacy.auto_close_at)}`}
              {extended > 0 ? ` · extended ${extended === 1 ? "once" : "twice"}` : ""}
            </p>
          </div>
        }
      />

      <div className="border-rule mt-6 flex flex-wrap gap-x-6 border-b" role="tablist">
        {(Object.keys(TAB_LABEL) as Tab[]).map((key) => {
          const current = tab === key;
          const count = key === "crosscheck" ? openSignals.length : 0;
          return (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={current}
              onClick={() => setTab(key)}
              className={cn(
                "text-16 -mb-px flex items-center gap-2 border-b-[3px] px-1 pb-2",
                current
                  ? "border-ink text-ink font-medium"
                  : "hover:text-ink border-transparent text-ink-secondary",
                "focus-visible:outline-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4",
              )}
            >
              {TAB_LABEL[key]}
              {count > 0 ? (
                <span className="text-ink tabular font-mono text-12">{count}</span>
              ) : null}
            </button>
          );
        })}
      </div>

      {tab === "overview" ? (
        <>
          <Section title="Stage">
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
            )}
          </Section>

          <Section
            title="Against The Brief"
            note={`Version ${version?.version}, pinned when this candidacy was created.`}
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
          </Section>

          <Section title="Auto-closure">
            <DaysRemaining days={days} on={formatDate(candidacy.auto_close_at)} />
          </Section>

          {submission ? (
            <Section title="Submission Record">
              <div className="max-w-[62ch]">
                <p className="text-16 text-ink">
                  {submission.reference} · signed off by{" "}
                  {userById(state, submission.signed_off_by)?.name} on{" "}
                  {formatDate(submission.signed_off_at)}
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
            <Section title="Submission Record">
              <Link
                href={`/prototype/candidacies/${candidacy.id}/submission`}
                className="rounded-rc border-rule-control bg-paper-raised text-ink hover:bg-paper-sunk focus-visible:outline-ink inline-block border px-4 py-2.5 text-16 font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                Create the Submission Record
              </Link>
            </Section>
          ) : null}

          {placement ? (
            <Section title="Placement">
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

          {exclusion ? (
            <Section title="Exclusion">
              <div className="max-w-[62ch] border-l-2 border-l-ink pl-5">
                <p className="text-16 text-ink">{exclusion.reason_text}</p>
                <p className="text-14 text-ink-muted mt-3 tabular">
                  {userById(state, exclusion.excluded_by)?.name} ·{" "}
                  {formatDate(exclusion.excluded_at)}
                </p>
              </div>
            </Section>
          ) : null}

          {decision ? (
            <Section title="Decision">
              <RejectionPanel candidacy={candidacy} decision={decision} />
            </Section>
          ) : !stage?.terminal ? (
            <Section title="Decision">
              {rejecting ? (
                <RejectionPanel candidacy={candidacy} decision={decision} />
              ) : (
                <Control variant="secondary" onClick={() => setRejecting(true)}>
                  Reject this candidacy…
                </Control>
              )}
            </Section>
          ) : null}

          <p className="text-14 text-ink-muted border-rule mt-10 border-t pt-4">
            {[
              [person?.email, person?.phone].filter(Boolean).join(" · ") ||
                "No email or phone on the record",
              channelById(state, candidacy.channel_id)?.name,
              `added ${formatDate(candidacy.created_at)}`,
            ]
              .filter(Boolean)
              .join(" · ")}
            {" · "}
            <Link
              href={`/prototype/people/${candidacy.person_id}`}
              className="text-ink focus-visible:outline-ink underline decoration-1 underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4"
            >
              Person record
            </Link>
          </p>
        </>
      ) : null}

      {tab === "brief" ? (
        <>
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
            <ol className="border-rule max-w-4xl border-t">
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
            <CriteriaKey className="mt-6" />
          </Section>

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
                      <p
                        className={`text-16 ${here ? "text-ink font-medium" : "text-ink-secondary"}`}
                      >
                        {item.label}
                        {item.owner === "client" ? (
                          <span className="text-ink-muted"> · the client&rsquo;s call</span>
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
        </>
      ) : null}

      {tab === "messages" ? (
        <Section title="What this person has been told" note="The candidate reads these same rows.">
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
                            : message.kind === "extension"
                              ? "Deadline extended"
                              : message.kind === "submission"
                                ? "Submitted"
                                : (stages.find((item) => item.id === message.stage_id)?.label ??
                                  "Stage")}
                      </p>
                      <p className="text-14 text-ink-muted tabular">
                        {formatDate(message.sent_at)}
                      </p>
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
                <p className="text-14 text-ink-muted mt-2 max-w-[70ch]">
                  {stage.candidate_message}
                </p>
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
      ) : null}

      {tab === "crosscheck" ? (
        <Section title="Crosscheck">
          <CrosscheckPanel signals={signals} />
        </Section>
      ) : null}

      {tab === "history" ? (
        <Section title="Activity">
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
      ) : null}
    </Screen>
  );
}
