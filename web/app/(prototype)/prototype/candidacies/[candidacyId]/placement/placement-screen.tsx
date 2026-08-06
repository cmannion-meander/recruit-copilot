"use client";

/* Screen 11 — the first ninety days, and the loop back into The Brief.
 *
 * The step everyone forgets. For a permanent-placement agency the fee is earned at the
 * end of probation, not on the start date, so the checkpoints are the agency's own
 * exposure written down rather than a courtesy — and the plan exists before the offer
 * is signed, which is the only time it can be agreed with anybody.
 *
 * There is no quality-of-hire figure on this screen and there will not be one. It is a
 * score attached to a named individual, applied after the fact, and it is the same
 * object invariant 2 refuses at the front of the process wearing a hat. A checkpoint
 * records what happened, in words, on a date.
 *
 * The field that matters most is the second one: what the next Brief for this client
 * should say differently. That is the only part of a post-placement review that changes
 * anything, and it lands on the Brief screen of the next role at the same client.
 */
import Link from "next/link";
import { useState } from "react";
import { CheckpointList } from "@/components/checkpoint-list";
import { Control } from "@/components/control";
import { RecordField, RecordFields } from "@/components/record-field";
import { Refusal } from "@/components/refusal";
import { daysFromNow, formatDate } from "../../../../_fixtures/clock";
import { usePrototype } from "../../../../_state/provider";
import { type Refusal as RefusalShape, refuseCheckpoint } from "../../../../_state/refusals";
import {
  briefVersionById,
  candidacyById,
  channelById,
  checkpointsFor,
  clientById,
  personById,
  placementFor,
  roleById,
} from "../../../../_state/selectors";
import { Crumbs, Screen, ScreenTitle, Section } from "../../../../screen";

export function PlacementScreen({ candidacyId }: { candidacyId: string }) {
  const { state, dispatch } = usePrototype();
  const [openId, setOpenId] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [feedback, setFeedback] = useState("");
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
  const placement = placementFor(state, candidacy.id);
  const version = briefVersionById(state, candidacy.brief_version_id);

  const trail = [
    { href: "/prototype", label: "The desk" },
    { href: `/prototype/roles/${candidacy.role_id}`, label: role?.title ?? "Role" },
    { href: `/prototype/candidacies/${candidacy.id}`, label: person?.full_name ?? "" },
    { label: "The first ninety days" },
  ];

  if (!placement) {
    return (
      <Screen>
        <Crumbs trail={trail} />
        <ScreenTitle
          eyebrow={`${client?.name} · ${role?.title}`}
          title="The first ninety days"
          lede="Nobody has started. This screen exists from the moment an offer is signed, and the checkpoints on it are agreed before that — the plan is what the candidate is told they are joining, not something assembled afterwards."
        />
      </Screen>
    );
  }

  const checkpoints = checkpointsFor(state, placement.id);
  const outstanding = checkpoints.filter((checkpoint) => checkpoint.recorded_at === null);

  return (
    <Screen>
      <Crumbs trail={trail} />
      <ScreenTitle
        eyebrow={`${client?.name} · ${role?.title}`}
        title="The first ninety days"
        lede={`${person?.full_name} started on ${formatDate(placement.started_on)}. Probation ends ${formatDate(placement.probation_ends_on)}.`}
      />

      <Section title="The placement">
        <RecordFields columns={2} className="max-w-4xl">
          <RecordField label="Started" value={formatDate(placement.started_on)} />
          <RecordField label="Probation ends" value={formatDate(placement.probation_ends_on)} />
          <RecordField
            label="Hired against"
            value={
              <Link
                href={`/prototype/roles/${candidacy.role_id}`}
                className="focus-visible:outline-ink underline decoration-1 underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4"
              >
                The Brief, version {version?.version}
              </Link>
            }
          />
          <RecordField
            label="Channel"
            value={channelById(state, candidacy.channel_id)?.name}
            empty="Not recorded."
          />
        </RecordFields>
      </Section>

      <Section
        title="Checkpoints"
        note="Agreed before the offer was signed. What happened, in words, on a date — there is no rating here and no satisfaction figure, because neither would be true and both would be quoted back."
      >
        <CheckpointList
          className="max-w-4xl"
          checkpoints={checkpoints.map((checkpoint) => {
            const due = daysFromNow(checkpoint.due_on);
            return {
              id: checkpoint.id,
              day: checkpoint.day,
              dueOn: formatDate(checkpoint.due_on),
              standing:
                checkpoint.recorded_at === null && due < 0
                  ? `${Math.abs(due)} days ago, and nobody has asked`
                  : undefined,
              recordedOn: checkpoint.recorded_at ? formatDate(checkpoint.recorded_at) : null,
              note: checkpoint.note,
              briefFeedback: checkpoint.brief_feedback,
              action:
                checkpoint.recorded_at === null ? (
                  openId === checkpoint.id ? null : (
                    <Control variant="secondary" onClick={() => setOpenId(checkpoint.id)}>
                      Record day {checkpoint.day}
                    </Control>
                  )
                ) : null,
            };
          })}
        />
      </Section>

      {openId ? (
        <Section
          title={`Record day ${checkpoints.find((item) => item.id === openId)?.day}`}
          note="Two fields. The first is the record. The second is the only part of a post-placement review that ever changes anything."
        >
          <div className="max-w-[62ch]">
            <label htmlFor="checkpoint-note" className="text-14 text-ink block font-medium">
              What happened
              <span className="text-ink-muted font-normal">
                {" "}
                — what the manager said, and what the person said
              </span>
            </label>
            <textarea
              id="checkpoint-note"
              rows={4}
              value={note}
              onChange={(fired) => setNote(fired.target.value)}
              className="border-rule-control bg-paper-raised text-16 text-ink focus:border-ink focus:outline-ink rounded-rc mt-1.5 w-full border px-3 py-2.5 focus:border-2 focus:outline focus:outline-2 focus:outline-offset-2"
            />

            <label
              htmlFor="checkpoint-feedback"
              className="text-14 text-ink mt-6 block font-medium"
            >
              What the next Brief for {client?.name} should say differently
              <span className="text-ink-muted font-normal"> — leave it empty if nothing</span>
            </label>
            <textarea
              id="checkpoint-feedback"
              rows={4}
              value={feedback}
              onChange={(fired) => setFeedback(fired.target.value)}
              className="border-rule-control bg-paper-raised text-16 text-ink focus:border-ink focus:outline-ink rounded-rc mt-1.5 w-full border px-3 py-2.5 focus:border-2 focus:outline focus:outline-2 focus:outline-offset-2"
            />
            <p className="text-14 text-ink-muted mt-2">
              This lands on the Brief of the next role at this client, which is the only place it
              can still change what gets asked for.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Control
                onClick={() => {
                  const refused = refuseCheckpoint(note);
                  setRefusal(refused);
                  if (refused) return;
                  dispatch({
                    type: "record_checkpoint",
                    checkpoint_id: openId,
                    note,
                    brief_feedback: feedback,
                  });
                  setNote("");
                  setFeedback("");
                  setOpenId(null);
                }}
              >
                Record it
              </Control>
              <Control
                variant="secondary"
                onClick={() => {
                  setOpenId(null);
                  setRefusal(null);
                }}
              >
                Not now
              </Control>
            </div>

            {refusal ? (
              <Refusal
                className="mt-6"
                requirement={refusal.requirement}
                reason={refusal.reason}
                action={refusal.action}
                footnote="Invariant 6 · a record nobody wrote is a step nobody took"
              />
            ) : null}
          </div>
        </Section>
      ) : null}

      {outstanding.length > 0 && !openId ? (
        <Section title="Still outstanding">
          <p className="text-16 text-ink-secondary max-w-[62ch]">
            {outstanding.length === 1
              ? "One checkpoint has not been recorded."
              : `${outstanding.length} checkpoints have not been recorded.`}{" "}
            The rows stay on the screen unrecorded rather than disappearing, because a plan that
            hides the parts nobody did is not a plan.
          </p>
        </Section>
      ) : null}
    </Screen>
  );
}
