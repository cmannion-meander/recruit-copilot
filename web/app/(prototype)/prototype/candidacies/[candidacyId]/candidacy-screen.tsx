"use client";

/* Screen 5 — the candidacy.
 *
 * The stage control is live on every candidacy, including the ones where it will refuse.
 * On a candidacy with an incomplete scorecard it names the criteria with no entry, and
 * that refusal is drawn as a screen state with the next action attached — not a toast,
 * not a red border on a button, not a tooltip that vanishes when the pointer moves.
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
  clientById,
  decisionFor,
  eventsFor,
  exclusionFor,
  nextStage,
  personById,
  roleById,
  signalsFor,
  stageById,
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
  const stage = stageById(state, candidacy.stage_id);
  const onward = nextStage(state, candidacy.stage_id);
  const cells = cellsFor(state, candidacy);
  const signals = signalsFor(state, candidacy.id);
  const decision = decisionFor(state, candidacy.id);
  const exclusion = exclusionFor(state, candidacy.id);
  const submission = submissionFor(state, candidacy.id);
  const days = daysFromNow(candidacy.auto_close_at);

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
        title="Against The Brief"
        note={`Read against version ${version?.version}, pinned when this candidacy was created. A later version of The Brief does not move this record.`}
        aside={
          <Link
            href={`/prototype/candidacies/${candidacy.id}/review`}
            className="text-16 text-ink focus-visible:outline-ink underline decoration-1 underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4"
          >
            The scorecard
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
              className="border-rule grid gap-x-6 gap-y-1 border-b py-3 sm:grid-cols-[3rem_1fr_9rem]"
            >
              <p className="text-16 text-ink-muted tabular">{cell.criterion.position}</p>
              <p className="text-16 text-ink">{cell.criterion.text}</p>
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
            footnote={`Invariant ${refusal.invariant} · no advancement without a scorecard`}
          >
            <Link
              href={`/prototype/candidacies/${candidacy.id}/review`}
              className="rounded-rc bg-ink text-ink-inverse hover:bg-ink-strong focus-visible:outline-ink px-4 py-2.5 text-16 font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              Open the scorecard
            </Link>
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
          note="The artifact this whole product exists to produce. It cannot be created while a Crosscheck signal is open, and it cannot be edited once it is."
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
        note="A reason code and written text. Both are required, and the refusal says which one is missing."
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
            label="How this candidacy started"
            value={
              candidacy.origin === "search"
                ? "Sourced. A search found them; they did not apply."
                : candidacy.origin === "inbound"
                  ? "Inbound. They applied."
                  : "Imported by hand."
            }
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
