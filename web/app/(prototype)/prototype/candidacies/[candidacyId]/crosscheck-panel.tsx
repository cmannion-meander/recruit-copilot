"use client";

/* Screen 7 — Crosscheck, on the candidacy.
 *
 * Signals are observations. Each one renders as a citation pointing at the artifact it
 * came from, in the same visual register as a finding, because it is the same kind of
 * claim: here is a thing the record says, and here is where it says it.
 *
 * There is no probability, no severity, no traffic light, no red, and no ordering that
 * implies one signal matters more than another. Nothing on this panel, or anywhere a
 * candidate can read, uses the word fraud.
 *
 * Two of the four signal types cannot be drawn as an EvidenceCitation, because their
 * artifact is not a passage of text — a PDF property and an internal record have no
 * character offsets to cite. They are drawn in a deliberately different shape rather
 * than dressed up as quotations. See docs/prototype-findings.md.
 */
import { useState } from "react";
import { Control } from "@/components/control";
import { EvidenceCitation } from "@/components/evidence-citation";
import { Refusal } from "@/components/refusal";
import { StateMarker } from "@/components/state-marker";
import { formatDate, formatDateShort } from "../../../_fixtures/clock";
import type { CrosscheckSignal } from "../../../_fixtures/types";
import { usePrototype } from "../../../_state/provider";
import {
  type Refusal as RefusalShape,
  refuseOverride,
  SIGNAL_LABEL,
} from "../../../_state/refusals";
import { documentById, sightingById, userById } from "../../../_state/selectors";

export function CrosscheckPanel({ signals }: { signals: CrosscheckSignal[] }) {
  if (signals.length === 0) {
    return (
      <p className="text-16 text-ink-secondary max-w-[62ch]">
        No signals on this candidacy. Crosscheck runs over the records already held — dates against
        dates, contact details against the organisation&rsquo;s own history, document properties,
        duplicates. Nothing found is not the same as nothing looked for.
      </p>
    );
  }

  return (
    <ul className="flex max-w-4xl flex-col gap-8">
      {signals.map((signal) => (
        <li key={signal.id}>
          <SignalRow signal={signal} />
        </li>
      ))}
    </ul>
  );
}

function SignalRow({ signal }: { signal: CrosscheckSignal }) {
  const { state, dispatch } = usePrototype();
  const [mode, setMode] = useState<"none" | "resolve" | "override">("none");
  const [text, setText] = useState("");
  const [refusal, setRefusal] = useState<RefusalShape | null>(null);

  const resolved = signal.resolution !== null;

  return (
    <article className="border-rule border-t pt-6">
      <div className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-2">
        <h3 className="text-18 text-ink font-medium">{SIGNAL_LABEL[signal.type]}</h3>
        <StateMarker
          label={
            resolved ? (signal.resolution?.kind === "override" ? "Overridden" : "Resolved") : "Open"
          }
          shape={resolved ? "filled" : "dotted"}
        />
      </div>

      <p className="text-16 text-ink-secondary mt-3 max-w-[62ch]">{signal.detail}</p>
      <p className="text-14 text-ink-muted mt-1 tabular">
        Observed {formatDate(signal.observed_at)}
      </p>

      <div className="mt-5">
        <Artifact signal={signal} />
      </div>

      {resolved && signal.resolution ? (
        <div className="border-rule bg-paper-sunk mt-5 border-l-2 border-l-ink px-5 py-4">
          <p className="rc-label text-ink-muted">
            {signal.resolution.kind === "override" ? "Overridden" : "Resolved"}
          </p>
          <p className="text-16 text-ink mt-3 max-w-[62ch]">
            {signal.resolution.kind === "override"
              ? signal.resolution.reason_text
              : signal.resolution.note}
          </p>
          <p className="text-14 text-ink-muted mt-3 tabular">
            {
              userById(
                state,
                signal.resolution.kind === "override"
                  ? signal.resolution.user_id
                  : signal.resolution.resolved_by,
              )?.name
            }{" "}
            ·{" "}
            {formatDate(
              signal.resolution.kind === "override"
                ? signal.resolution.created_at
                : signal.resolution.resolved_at,
            )}
          </p>
        </div>
      ) : (
        <div className="mt-5">
          {mode === "none" ? (
            <div className="flex flex-wrap gap-3">
              <Control variant="secondary" onClick={() => setMode("resolve")}>
                Record what you found
              </Control>
              <Control variant="secondary" onClick={() => setMode("override")}>
                Override this signal
              </Control>
            </div>
          ) : (
            <div className="max-w-[62ch]">
              <label htmlFor={`signal-${signal.id}`} className="text-14 text-ink block font-medium">
                {mode === "resolve" ? "What did you find?" : "Why are you dismissing this?"}
                <span className="text-ink-muted font-normal">
                  {" "}
                  — it stays on the record under your name
                </span>
              </label>
              <textarea
                id={`signal-${signal.id}`}
                rows={3}
                value={text}
                onChange={(event) => setText(event.target.value)}
                className="border-rule-control bg-paper-raised text-16 text-ink focus:border-ink focus:outline-ink rounded-rc mt-1.5 w-full border px-3 py-2.5 focus:border-2 focus:outline focus:outline-2 focus:outline-offset-2"
              />
              <div className="mt-4 flex flex-wrap gap-3">
                <Control
                  onClick={() => {
                    if (mode === "override") {
                      const refused = refuseOverride(text);
                      setRefusal(refused);
                      if (refused) return;
                      dispatch({
                        type: "override_signal",
                        signal_id: signal.id,
                        reason_text: text,
                      });
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
                      setRefusal(null);
                      dispatch({ type: "resolve_signal", signal_id: signal.id, note: text });
                    }
                    setText("");
                    setMode("none");
                  }}
                >
                  {mode === "resolve" ? "Record it" : "Override"}
                </Control>
                <Control
                  variant="secondary"
                  onClick={() => {
                    setMode("none");
                    setRefusal(null);
                    setText("");
                  }}
                >
                  Leave it open
                </Control>
              </div>

              {refusal ? (
                <Refusal
                  className="mt-6"
                  requirement={refusal.requirement}
                  reason={refusal.reason}
                  action={refusal.action}
                  footnote={`Invariant ${refusal.invariant} · verification before submission`}
                />
              ) : null}
            </div>
          )}
        </div>
      )}
    </article>
  );
}

/* The artifact the signal came from. Four shapes, because there are four kinds of thing
 * being pointed at, and pretending a PDF property is a quoted passage would be the same
 * dishonesty as a citation with no source. */
function Artifact({ signal }: { signal: CrosscheckSignal }) {
  const { state } = usePrototype();
  const artifact = signal.artifact;

  if (artifact.kind === "sighting") {
    const sighting = sightingById(state, artifact.sighting_id);
    if (!sighting) return null;
    return (
      <EvidenceCitation
        state="evidenced"
        quote={sighting.snapshot_excerpt.slice(artifact.char_start, artifact.char_end)}
        provenance={`${sighting.source_name} · read ${formatDateShort(sighting.retrieved_at)} · chars ${artifact.char_start}–${artifact.char_end}`}
      />
    );
  }

  if (artifact.kind === "document_text") {
    const document = documentById(state, artifact.document_id);
    if (!document) return null;
    return (
      <EvidenceCitation
        state="evidenced"
        quote={document.parsed_text.slice(artifact.char_start, artifact.char_end)}
        provenance={`${document.filename} · chars ${artifact.char_start}–${artifact.char_end}`}
      />
    );
  }

  if (artifact.kind === "document_property") {
    const document = documentById(state, artifact.document_id);
    return (
      <div className="border-rule bg-paper-sunk border px-5 py-4">
        <p className="rc-label text-ink-muted">Document property</p>
        <dl className="mt-3 font-mono text-14">
          <div className="flex flex-wrap gap-x-3">
            <dt className="text-ink-muted">{artifact.property}</dt>
            <dd className="text-ink">{artifact.value}</dd>
          </div>
        </dl>
        <p className="text-ink-muted mt-3 font-mono text-12">
          {document?.filename} · not in the parsed text, so it has no character range to cite
        </p>
      </div>
    );
  }

  return (
    <div className="border-rule bg-paper-sunk border px-5 py-4">
      <p className="rc-label text-ink-muted">Record held by this organisation</p>
      <p className="text-16 text-ink mt-3">{artifact.label}</p>
      <p className="text-14 text-ink-secondary mt-1 max-w-[62ch]">{artifact.detail}</p>
      {artifact.candidacy_id ? (
        <a
          href={`/prototype/candidacies/${artifact.candidacy_id}`}
          className="text-ink focus-visible:outline-ink mt-3 inline-block font-mono text-12 underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4"
        >
          Open that candidacy
        </a>
      ) : null}
    </div>
  );
}
