"use client";

/* The right-hand detail drawer: one candidacy, read in place.
 *
 * A reading surface, not a workspace — advancement, scorecards, signals and
 * rejection live on the record page it links to. The two exceptions are the two
 * things that cannot wait for a page: closing the drawer, and extending the
 * auto-closure deadline, which is only offered while the deadline is the flag.
 *
 * No scrim and no shadow: a 1px ink edge is the whole separation. Escape closes,
 * handled by the screen that owns the URL.
 */
import Link from "next/link";
import { useState } from "react";
import { CriterionCellMark } from "@/components/criteria-row";
import { Refusal } from "@/components/refusal";
import { StateMarker } from "@/components/state-marker";
import { cn } from "@/lib/utils";
import { daysFromNow, formatDate, formatDateShort } from "./_fixtures/clock";
import type { Candidacy } from "./_fixtures/types";
import { usePrototype } from "./_state/provider";
import { refuseExtension } from "./_state/refusals";
import {
  briefVersionById,
  cellsFor,
  channelById,
  clientById,
  extensionCount,
  needsAttention,
  personById,
  provenanceIn,
  roleById,
  stageOf,
} from "./_state/selectors";

const FOCUS =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

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
  const flag = needsAttention(state, candidacy);
  const cells = cellsFor(state, candidacy);
  const extended = extensionCount(state, candidacy.id);

  const contact =
    [person?.email, person?.phone].filter(Boolean).join(" · ") || "No email or phone on the record";

  const closesIn = daysFromNow(candidacy.auto_close_at);
  const extendable =
    candidacy.closed_at === null && stage !== undefined && !stage.terminal && closesIn <= 7;

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
        {flag ? (
          <div className="border-ink grid grid-cols-[3px_1fr] gap-x-3 border-y px-[18px] py-[9px]">
            <span aria-hidden="true" className="bg-ink self-stretch" />
            <div>
              <p className="rc-label text-ink">{flag.flag}</p>
              <p className="text-14 text-ink-secondary mt-1 max-w-[70ch]">{flag.detail}</p>
              {extendable ? <ExtendClosure candidacy={candidacy} /> : null}
            </div>
          </div>
        ) : null}

        <div className="border-rule flex flex-wrap items-center gap-x-4 gap-y-1 border-b px-[18px] py-[11px]">
          <StateMarker
            label={stage?.label ?? ""}
            shape={candidacy.closed_at !== null ? "outlined" : "filled"}
          />
          <p className="text-14 text-ink-muted tabular">
            {candidacy.closed_at !== null
              ? `Closed ${formatDateShort(candidacy.closed_at)}`
              : `Auto-closes ${formatDateShort(candidacy.auto_close_at)} · ${closesIn} days`}
            {extended > 0
              ? ` · extended ${extended === 1 ? "once" : extended === 2 ? "twice" : `${extended} times`}`
              : ""}
          </p>
        </div>

        <dl className="grid grid-cols-[104px_1fr] gap-x-[14px] gap-y-1 px-[18px] py-3">
          {(
            [
              ["Employer", person?.current_employer ?? ""],
              ["Location", person?.location ?? ""],
              ["Contact", contact],
              ["Channel", channel?.name ?? ""],
            ] as const
          ).map(([term, value]) => (
            <div key={term} className="contents">
              <dt className="text-14 text-ink-muted">{term}</dt>
              <dd className="text-14 text-ink-secondary min-w-0">{value}</dd>
            </div>
          ))}
        </dl>

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

/* Extending the deadline. One text field: what is written here goes to the
 * candidate verbatim and is the reason on the record — invariant 6, ADR 0012.
 * The control stays live and answers when pressed; an empty message is refused
 * with a reason, never a disabled button. */
function ExtendClosure({ candidacy }: { candidacy: Candidacy }) {
  const { state, dispatch } = usePrototype();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [attempted, setAttempted] = useState(false);

  const refusal = refuseExtension(state, candidacy.id, message);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "rc-label text-ink border-rule-control rounded-rc hover:bg-paper-sunk mt-3 border px-2 py-[3px] transition-colors",
          FOCUS,
        )}
      >
        Extend the deadline
      </button>
    );
  }

  return (
    <form
      className="mt-3"
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
          The message to the candidate. They read exactly what you write, and it is the reason on
          the record.
        </span>
        <textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          rows={3}
          className={cn(
            "border-rule-control rounded-rc text-14 text-ink mt-1.5 w-full border bg-transparent px-2 py-1.5",
            FOCUS,
          )}
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
        <button
          type="submit"
          className={cn(
            "rc-label text-ink-inverse bg-ink rounded-rc hover:bg-ink-strong border border-transparent px-2 py-[3px] transition-colors",
            FOCUS,
          )}
        >
          Send, and extend 30 days
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setAttempted(false);
          }}
          className={cn(
            "rc-label text-ink-muted hover:text-ink px-1 py-[3px] transition-colors",
            FOCUS,
          )}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
