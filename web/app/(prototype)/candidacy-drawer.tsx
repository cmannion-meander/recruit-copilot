"use client";

/* The right-hand drawer: one candidacy, and the work it needs, in place.
 *
 * A workspace, not a summary. Whatever put this record on the Desk can be
 * finished here: the overdue checkpoint recorded, the deadline extended, a
 * not-found finding recorded, a signal resolved or overridden, the stage
 * message sent, the stage advanced. The one thing that leaves the drawer is
 * quoting evidence, because a quote needs the document in front of you — that
 * routes to the scorecard.
 *
 * Each action card uses the Desk's own vocabulary (PROBATION, AUTO-CLOSURE,
 * SCORECARD, SIGNALS), so the item a recruiter clicked is the card they land
 * on. A card disappears when its work is done — the drawer empties the same
 * way the Desk does.
 *
 * No scrim and no shadow: a 1px ink edge is the whole separation. Escape
 * closes, handled by the screen that owns the URL.
 */
import Link from "next/link";
import { useState } from "react";
import { CriterionCellMark } from "@/components/criteria-row";
import { Refusal } from "@/components/refusal";
import { StageRail } from "@/components/stage-rail";
import { StateMarker } from "@/components/state-marker";
import { cn } from "@/lib/utils";
import { daysFromNow, formatDate, formatDateShort } from "./_fixtures/clock";
import type { Candidacy, CrosscheckSignal } from "./_fixtures/types";
import { usePrototype } from "./_state/provider";
import {
  type Refusal as RefusalShape,
  refuseAdvance,
  refuseCheckpoint,
  refuseExtension,
  refuseOverride,
} from "./_state/refusals";
import {
  briefVersionById,
  cellsFor,
  channelById,
  clientById,
  extensionCount,
  nextStage,
  openSignalsFor,
  overdueCheckpointFor,
  owedAtStage,
  personById,
  provenanceIn,
  roleById,
  SIGNAL_LABEL,
  stageOf,
  stagesFor,
} from "./_state/selectors";

const FOCUS =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

/** The small bordered action, quiet until pressed. */
const ACTION =
  "rc-label rounded-rc border px-2 py-[3px] transition-colors " +
  "border-rule-control text-ink hover:bg-paper-sunk " +
  FOCUS;

const ACTION_PRIMARY =
  "rc-label rounded-rc border border-transparent px-2 py-[3px] transition-colors " +
  "bg-ink text-ink-inverse hover:bg-ink-strong " +
  FOCUS;

const FIELD =
  "border-rule-control rounded-rc text-14 text-ink mt-1.5 w-full border bg-transparent px-2 py-1.5 " +
  FOCUS;

const CELL_STATE = {
  evidenced: "evidenced",
  not_found: "not-found",
  no_entry: "no-entry",
} as const;

export function CandidacyDrawer({
  candidacyId,
  onClose,
}: {
  candidacyId: string;
  onClose: () => void;
}) {
  const { state } = usePrototype();

  const candidacy = state.candidacies.find((item) => item.id === candidacyId);
  if (!candidacy) return null;

  const person = personById(state, candidacy.person_id);
  const role = roleById(state, candidacy.role_id);
  const client = role ? clientById(state, role.client_id) : undefined;
  const channel = channelById(state, candidacy.channel_id);
  const version = briefVersionById(state, candidacy.brief_version_id);
  const stage = stageOf(state, candidacy);
  const cells = cellsFor(state, candidacy);
  const extended = extensionCount(state, candidacy.id);

  const open = candidacy.closed_at === null && stage !== undefined && !stage.terminal;
  const pipeline = stagesFor(state, candidacy.brief_version_id).map((item) => ({
    id: item.id,
    label: item.label,
  }));
  const overdue = overdueCheckpointFor(state, candidacy.id);
  const closesIn = daysFromNow(candidacy.auto_close_at);
  const owed = open && stage ? owedAtStage(state, candidacy, stage.id) : [];
  const signals = candidacy.closed_at === null ? openSignalsFor(state, candidacy.id) : [];

  const needsCount =
    (overdue ? 1 : 0) +
    (open && closesIn <= 7 ? 1 : 0) +
    (owed.length > 0 ? 1 : 0) +
    signals.length;

  const contact =
    [person?.email, person?.phone].filter(Boolean).join(" · ") || "No email or phone on the record";

  return (
    <aside
      aria-label={`${person?.full_name ?? "Candidacy"} — detail`}
      className="border-ink bg-paper-raised fixed inset-y-0 right-0 z-40 flex w-[460px] max-w-[46vw] flex-col border-l motion-safe:animate-[rc-drawer-in_160ms_ease-out]"
    >
      <header className="border-rule border-b px-[18px] py-3">
        <div className="flex items-start justify-between gap-4">
          <p className="rc-label text-ink-muted">
            {client?.name} · {role?.title}
          </p>
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
        <h2 className="text-22 text-ink font-semibold">{person?.full_name}</h2>
        <p className="text-14 text-ink-muted">{person?.headline}</p>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {needsCount > 0 ? (
          <div className="border-ink border-b">
            <p className="rc-label text-ink-muted px-[18px] pt-3 pb-1">Needs you</p>

            {overdue ? (
              <ActionCard kind="Probation">
                <p className="text-14 text-ink-secondary tabular">
                  Day {overdue.checkpoint.day} · due {formatDateShort(overdue.checkpoint.due_on)} ·
                  probation ends {formatDateShort(overdue.placement.probation_ends_on)}
                </p>
                <CheckpointForm checkpointId={overdue.checkpoint.id} day={overdue.checkpoint.day} />
              </ActionCard>
            ) : null}

            {open && closesIn <= 7 ? (
              <ActionCard kind="Auto-closure">
                <p className="text-14 text-ink-secondary tabular">
                  Closes in {closesIn} days · {formatDateShort(candidacy.auto_close_at)}
                </p>
                <ExtendClosure candidacy={candidacy} />
              </ActionCard>
            ) : null}

            {owed.length > 0 && stage ? (
              <ActionCard kind={`Scorecard · ${stage.label}`}>
                <ul className="flex flex-col gap-3">
                  {owed.map((criterion) => (
                    <OwedCriterion
                      key={criterion.id}
                      candidacyId={candidacy.id}
                      stageId={stage.id}
                      criterionId={criterion.id}
                      text={criterion.text}
                      position={criterion.position}
                    />
                  ))}
                </ul>
              </ActionCard>
            ) : null}

            {signals.map((signal) => (
              <ActionCard key={signal.id} kind="Signals">
                <SignalForm signal={signal} candidacyId={candidacy.id} />
              </ActionCard>
            ))}
          </div>
        ) : null}

        {open ? <AdvanceRow candidacy={candidacy} /> : null}

        <div className="border-rule border-b px-[18px] py-[11px]">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            {open && stage && pipeline.length > 0 ? (
              <StageRail stages={pipeline} currentId={stage.id} />
            ) : (
              <StateMarker label={stage?.label ?? ""} shape="outlined" />
            )}
            <p className="text-14 text-ink-muted tabular">
              {candidacy.closed_at !== null
                ? `Closed ${formatDateShort(candidacy.closed_at)}`
                : `Auto-closes ${formatDateShort(candidacy.auto_close_at)} · ${closesIn} days`}
              {extended > 0
                ? ` · extended ${extended === 1 ? "once" : extended === 2 ? "twice" : `${extended} times`}`
                : ""}
            </p>
          </div>
          <p className="text-14 text-ink-muted mt-1.5">
            {[person?.current_employer, person?.location, contact, channel?.name]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>

        <section className="px-[18px] py-3">
          <p className="rc-label text-ink-muted">
            The Brief · Version {version?.version} · {version ? formatDate(version.created_at) : ""}
          </p>
          <ul className="mt-2">
            {cells.map((cell) => (
              <li
                key={cell.criterion.id}
                className="border-rule grid grid-cols-[15px_1fr] gap-x-2.5 border-b py-2"
              >
                <CriterionCellMark
                  state={CELL_STATE[cell.state]}
                  className="mt-[5px] size-[13px]"
                />
                <div className="min-w-0">
                  <p className="text-16 text-ink">
                    {cell.criterion.position}. {cell.criterion.text}
                  </p>
                  {cell.state === "evidenced" && cell.evidence ? (
                    <div className="border-evidenced mt-1.5 border-l-2 pl-2.5">
                      <p className="font-serif text-14 text-ink">
                        {"“"}
                        {cell.evidence.quote}
                        {"”"}
                      </p>
                      <p className="text-ink-muted tabular mt-1 font-mono text-12">
                        {provenanceIn(state, cell.evidence.target)}
                      </p>
                    </div>
                  ) : (
                    <p
                      className={cn(
                        "rc-label mt-1",
                        cell.state === "not_found" ? "text-open" : "text-ink-muted",
                      )}
                    >
                      {cell.state === "not_found" ? "Not found" : "No entry"}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <footer className="border-rule border-t px-[18px] py-3">
        <Link
          href={`/prototype/candidacies/${candidacy.id}`}
          className={cn(
            "text-ink hover:text-ink-secondary font-mono text-12 underline decoration-1 underline-offset-4 transition-colors",
            FOCUS,
          )}
        >
          Open the record
        </Link>
      </footer>
    </aside>
  );
}

/* One unit of work: the 3px bar, the Desk's word for it, and the action inline. */
function ActionCard({ kind, children }: { kind: string; children: React.ReactNode }) {
  return (
    <div className="border-rule grid grid-cols-[3px_1fr] gap-x-3 border-t px-[18px] py-[9px]">
      <span aria-hidden="true" className="bg-ink self-stretch" />
      <div className="min-w-0">
        <p className="rc-label text-ink">{kind}</p>
        <div className="mt-1">{children}</div>
      </div>
    </div>
  );
}

/* ── Probation: record the checkpoint where the flag is ─────────────────────── */
function CheckpointForm({ checkpointId, day }: { checkpointId: string; day: number }) {
  const { dispatch } = usePrototype();
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [feedback, setFeedback] = useState("");
  const [refusal, setRefusal] = useState<RefusalShape | null>(null);

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className={cn(ACTION, "mt-2")}>
        Record the day {day} checkpoint
      </button>
    );
  }

  return (
    <form
      className="mt-2"
      onSubmit={(event) => {
        event.preventDefault();
        const refused = refuseCheckpoint(note);
        setRefusal(refused);
        if (refused) return;
        dispatch({
          type: "record_checkpoint",
          checkpoint_id: checkpointId,
          note,
          brief_feedback: feedback,
        });
      }}
    >
      <label className="block">
        <span className="text-14 text-ink-secondary block">
          What the manager said, and what the person said.
        </span>
        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          rows={3}
          className={FIELD}
        />
      </label>
      <label className="mt-2 block">
        <span className="text-14 text-ink-muted block">
          What should the next Brief for this client say differently? Optional.
        </span>
        <textarea
          value={feedback}
          onChange={(event) => setFeedback(event.target.value)}
          rows={2}
          className={FIELD}
        />
      </label>
      {refusal ? (
        <Refusal
          requirement={refusal.requirement}
          reason={refusal.reason}
          action={refusal.action}
          className="mt-3"
        />
      ) : null}
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <button type="submit" className={ACTION_PRIMARY}>
          Record it
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setRefusal(null);
          }}
          className={cn("rc-label text-ink-muted hover:text-ink px-1 py-[3px]", FOCUS)}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

/* ── Auto-closure: the extension, which is itself a message. ADR 0012 ───────── */
function ExtendClosure({ candidacy }: { candidacy: Candidacy }) {
  const { state, dispatch } = usePrototype();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [attempted, setAttempted] = useState(false);

  const refusal = refuseExtension(state, candidacy.id, message);

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className={cn(ACTION, "mt-2")}>
        Extend the deadline
      </button>
    );
  }

  return (
    <form
      className="mt-2"
      onSubmit={(event) => {
        event.preventDefault();
        if (refusal) {
          setAttempted(true);
          return;
        }
        dispatch({
          type: "extend_auto_close",
          candidacy_id: candidacy.id,
          message_text: message,
        });
        setMessage("");
        setAttempted(false);
        setOpen(false);
      }}
    >
      <label className="block">
        <span className="text-14 text-ink-secondary block">
          Sent to the candidate word for word. It is the reason on the record.
        </span>
        <textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          rows={3}
          className={FIELD}
        />
      </label>

      {attempted && refusal ? (
        <Refusal
          requirement={refusal.requirement}
          reason={refusal.reason}
          action={refusal.action}
          footnote={`Invariant ${refusal.invariant}`}
          className="mt-3"
        />
      ) : null}

      <div className="mt-2 flex flex-wrap items-center gap-3">
        <button type="submit" className={ACTION_PRIMARY}>
          Send, and extend 30 days
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setAttempted(false);
          }}
          className={cn("rc-label text-ink-muted hover:text-ink px-1 py-[3px]", FOCUS)}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

/* ── Scorecard: a finding, or the route to one ──────────────────────────────────
 * "Not found" records here — looking and not finding needs no citation. A quote
 * needs the document in front of you, so "Evidenced" routes to the scorecard.
 * The intent comes first and the commitment second, because a finding is
 * append-only: there is no undo, only a later reading beside it. */
function OwedCriterion({
  candidacyId,
  stageId,
  criterionId,
  text,
  position,
}: {
  candidacyId: string;
  stageId: string;
  criterionId: string;
  text: string;
  position: number;
}) {
  const { dispatch } = usePrototype();
  const [recording, setRecording] = useState(false);

  return (
    <li>
      <p className="text-16 text-ink">
        {position}. {text}
      </p>
      {recording ? (
        <div className="mt-1.5 flex flex-wrap items-center gap-3">
          <Link href={`/prototype/candidacies/${candidacyId}/review`} className={ACTION}>
            Evidenced — quote the source
          </Link>
          <button
            type="button"
            onClick={() =>
              dispatch({
                type: "record_finding",
                candidacy_id: candidacyId,
                stage_id: stageId,
                criterion_id: criterionId,
                status: "not_found",
                passage: null,
                quote: null,
              })
            }
            className={ACTION}
          >
            Looked, and not found
          </button>
          <button
            type="button"
            onClick={() => setRecording(false)}
            className={cn("rc-label text-ink-muted hover:text-ink px-1 py-[3px]", FOCUS)}
          >
            Cancel
          </button>
        </div>
      ) : (
        <button type="button" onClick={() => setRecording(true)} className={cn(ACTION, "mt-1.5")}>
          Record a finding
        </button>
      )}
    </li>
  );
}

/* ── Signals: resolve or override where the flag is ─────────────────────────────
 * The artifact citations stay on the record page; what the drawer holds is the
 * observation and the two honest answers to it. */
function SignalForm({ signal, candidacyId }: { signal: CrosscheckSignal; candidacyId: string }) {
  const { dispatch } = usePrototype();
  const [mode, setMode] = useState<"none" | "resolve" | "override">("none");
  const [text, setText] = useState("");
  const [refusal, setRefusal] = useState<RefusalShape | null>(null);

  return (
    <div>
      <p className="text-14 text-ink font-medium">{SIGNAL_LABEL[signal.type]}</p>
      <p className="text-14 text-ink-secondary mt-0.5 max-w-[70ch]">{signal.detail}</p>
      <p className="text-ink-muted tabular mt-1 font-mono text-12">
        Observed {formatDateShort(signal.observed_at)} ·{" "}
        <Link
          href={`/prototype/candidacies/${candidacyId}?tab=crosscheck`}
          className={cn("text-ink underline decoration-1 underline-offset-4", FOCUS)}
        >
          see the artifact
        </Link>
      </p>

      {mode === "none" ? (
        <div className="mt-2 flex flex-wrap gap-3">
          <button type="button" onClick={() => setMode("resolve")} className={ACTION}>
            Record what you found
          </button>
          <button type="button" onClick={() => setMode("override")} className={ACTION}>
            Override
          </button>
        </div>
      ) : (
        <form
          className="mt-2"
          onSubmit={(event) => {
            event.preventDefault();
            if (mode === "override") {
              const refused = refuseOverride(text);
              setRefusal(refused);
              if (refused) return;
              dispatch({ type: "override_signal", signal_id: signal.id, reason_text: text });
            } else {
              if (text.trim().length === 0) {
                setRefusal({
                  requirement: "A resolution is a record of what you found.",
                  reason: "The note is empty.",
                  action:
                    "Write what you checked. An empty resolution says nothing to the next reader.",
                  invariant: 5,
                });
                return;
              }
              dispatch({ type: "resolve_signal", signal_id: signal.id, note: text });
            }
          }}
        >
          <label className="block">
            <span className="text-14 text-ink-secondary block">
              {mode === "resolve" ? "What did you find?" : "Why are you dismissing this?"} It stays
              on the record under your name.
            </span>
            <textarea
              value={text}
              onChange={(event) => setText(event.target.value)}
              rows={3}
              className={FIELD}
            />
          </label>
          {refusal ? (
            <Refusal
              requirement={refusal.requirement}
              reason={refusal.reason}
              action={refusal.action}
              footnote={`Invariant ${refusal.invariant}`}
              className="mt-3"
            />
          ) : null}
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <button type="submit" className={ACTION_PRIMARY}>
              {mode === "resolve" ? "Record it" : "Override"}
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("none");
                setRefusal(null);
              }}
              className={cn("rc-label text-ink-muted hover:text-ink px-1 py-[3px]", FOCUS)}
            >
              Leave it open
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

/* ── The stage, live. The control answers when pressed ──────────────────────── */
function AdvanceRow({ candidacy }: { candidacy: Candidacy }) {
  const { state, dispatch } = usePrototype();
  const [refusal, setRefusal] = useState<RefusalShape | null>(null);

  const stage = stageOf(state, candidacy);
  const onward = nextStage(state, candidacy);
  if (!stage || !onward) return null;

  return (
    <div className="border-rule border-b px-[18px] py-[11px]">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <p className="text-14 text-ink-secondary">
          {stage.label} <span className="text-ink-muted">→ {onward.label}</span>
        </p>
        <button
          type="button"
          onClick={() => {
            const refused = refuseAdvance(state, candidacy.id);
            setRefusal(refused);
            if (refused) return;
            dispatch({ type: "advance_stage", candidacy_id: candidacy.id });
          }}
          className={ACTION}
        >
          Advance
        </button>
      </div>
      {refusal ? (
        <Refusal
          requirement={refusal.requirement}
          reason={refusal.reason}
          action={refusal.action}
          items={refusal.items}
          className="mt-3"
        >
          {refusal.invariant === 6 ? (
            <button
              type="button"
              onClick={() => {
                dispatch({
                  type: "send_stage_message",
                  candidacy_id: candidacy.id,
                  stage_id: stage.id,
                });
                setRefusal(null);
              }}
              className={ACTION_PRIMARY}
            >
              Send the {stage.label} message
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => setRefusal(null)}
            className={cn("rc-label text-ink-muted hover:text-ink px-1 py-[3px]", FOCUS)}
          >
            Leave it here
          </button>
        </Refusal>
      ) : null}
    </div>
  );
}
