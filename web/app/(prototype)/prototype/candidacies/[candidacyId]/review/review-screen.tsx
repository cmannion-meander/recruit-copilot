"use client";

/* Screen 6 — the scorecards. One per stage.
 *
 * Each stage shows the criteria The Brief made it responsible for, in the order of The
 * Brief, with the Finding rendered through components/evidence-citation.tsx. Every
 * evidenced finding sits beside the passage that produced it and the line saying where
 * that passage is; clicking reveals it inside the parsed document with the range marked.
 *
 * Carried forward is the handoff a structured process asks for. A criterion whose most
 * recent reading is not_found is offered again at a later stage, because somebody who
 * gave a thin example on a bad day should not be eliminated by one reading. The second
 * reading is a new finding beside the first, never a correction of it — both stay on
 * the record with their dates and the stage they were taken at.
 *
 * There is no control to edit a quoted passage. Not a disabled one: none. Invariant 8
 * revokes UPDATE on evidence at the permission level.
 */
import Link from "next/link";
import { useState } from "react";
import { Control, InlineControl } from "@/components/control";
import { EvidenceCitation } from "@/components/evidence-citation";
import { Passage } from "@/components/passage";
import { StateMarker } from "@/components/state-marker";
import { formatDate } from "../../../../_fixtures/clock";
import { sentencesOf } from "../../../../_fixtures/offsets";
import type { EvidenceTarget } from "../../../../_fixtures/types";
import { usePrototype } from "../../../../_state/provider";
import {
  briefVersionById,
  type Cell,
  candidacyById,
  carriedForward,
  cellsFor,
  clientById,
  criteriaAtStage,
  documentsForPerson,
  personById,
  provenanceIn,
  reviewAtStage,
  roleById,
  sightingsForPerson,
  sourceTextOf,
  stageOf,
  stagesFor,
  userById,
} from "../../../../_state/selectors";
import type { PassageSource } from "../../../../_state/types";
import { Crumbs, Screen, ScreenTitle, Section } from "../../../../screen";

export function ReviewScreen({ candidacyId }: { candidacyId: string }) {
  const { state, dispatch } = usePrototype();
  const [revealed, setRevealed] = useState<string | null>(null);
  const [recording, setRecording] = useState<string | null>(null);

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
  const stages = stagesFor(state, candidacy.brief_version_id);
  const here = stageOf(state, candidacy);
  const cells = cellsFor(state, candidacy);

  const documents = person ? documentsForPerson(state, person.id) : [];
  const sightings = person ? sightingsForPerson(state, person.id) : [];

  const sources = [
    ...documents.map((document) => ({
      key: document.id,
      label: `${document.filename} · CV`,
      text: document.parsed_text,
      make: (start: number, end: number): PassageSource => ({
        kind: "document",
        document_id: document.id,
        char_start: start,
        char_end: end,
      }),
    })),
    ...sightings.map((sighting) => ({
      key: sighting.id,
      label: `${sighting.source_name} · ${sighting.source_kind}, read ${formatDate(sighting.retrieved_at)}`,
      text: sighting.snapshot_excerpt,
      make: (start: number, end: number): PassageSource => ({
        kind: "sighting",
        sighting_id: sighting.id,
        char_start: start,
        char_end: end,
      }),
    })),
  ];

  return (
    <Screen>
      <Crumbs
        trail={[
          { href: "/prototype", label: "The desk" },
          { href: `/prototype/roles/${candidacy.role_id}`, label: role?.title ?? "Role" },
          { href: `/prototype/candidacies/${candidacy.id}`, label: person?.full_name ?? "" },
          { label: "The scorecards" },
        ]}
      />
      <ScreenTitle
        eyebrow={`${client?.name} · ${role?.title}`}
        title="The scorecards"
        lede={
          <>
            {person?.full_name} against The Brief, version {version?.version}. One scorecard per
            stage, each responsible for the criteria The Brief assigned to it.
          </>
        }
      />

      {stages
        .filter((stage) => stage.criterion_ids.length > 0)
        .map((stage) => {
          const review = reviewAtStage(state, candidacy.id, stage.id);
          const mine = criteriaAtStage(state, candidacy, stage.id);
          const carried = carriedForward(state, candidacy, stage.id);
          const reached = here?.terminal || (here?.position ?? 0) >= stage.position;

          return (
            <Section
              key={stage.id}
              title={stage.label}
              note={stage.purpose}
              aside={
                review ? (
                  <p className="text-14 text-ink-muted tabular">
                    Recorded {formatDate(review.created_at)} by{" "}
                    {userById(state, review.created_by)?.name}
                  </p>
                ) : (
                  <p className="text-14 text-ink-muted">
                    {reached ? "Nothing recorded yet" : "Not reached"}
                  </p>
                )
              }
            >
              <ol className="flex max-w-4xl flex-col gap-10">
                {mine.map((criterion) => {
                  const cell = cells.find((item) => item.criterion.id === criterion.id);
                  if (!cell) return null;
                  return (
                    <li key={criterion.id}>
                      <FindingRow
                        cell={cell}
                        stageLabel={stage.label}
                        revealed={revealed}
                        onReveal={setRevealed}
                      >
                        <Recorder
                          open={recording === `${stage.id}:${criterion.id}`}
                          onOpen={() =>
                            setRecording(
                              recording === `${stage.id}:${criterion.id}`
                                ? null
                                : `${stage.id}:${criterion.id}`,
                            )
                          }
                          onRecord={(status, passage, quote) => {
                            dispatch({
                              type: "record_finding",
                              candidacy_id: candidacy.id,
                              stage_id: stage.id,
                              criterion_id: criterion.id,
                              status,
                              passage,
                              quote,
                            });
                            setRecording(null);
                          }}
                          sources={sources}
                        />
                      </FindingRow>
                    </li>
                  );
                })}
              </ol>

              {carried.length > 0 && reached ? (
                <div className="border-rule mt-10 max-w-4xl border-t pt-6">
                  <p className="rc-label text-ink-muted">Carried forward</p>
                  <p className="text-16 text-ink-secondary mt-3 max-w-[62ch]">
                    Not found earlier, and worth a second look here. A second reading is recorded
                    beside the first, not instead of it — somebody who gave a thin example on a bad
                    day should not be eliminated by one reading.
                  </p>
                  <ol className="mt-6 flex flex-col gap-8">
                    {carried.map((cell) => (
                      <li key={cell.criterion.id}>
                        <div className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-2">
                          <h3 className="text-18 text-ink max-w-[52ch] font-medium">
                            <span className="text-ink-muted tabular">
                              {cell.criterion.position}.{" "}
                            </span>
                            {cell.criterion.text}
                          </h3>
                          <p className="text-14 text-ink-muted tabular">
                            Not found at {cell.stage?.label}
                            {cell.finding ? ` · ${formatDate(cell.finding.recorded_at)}` : ""}
                          </p>
                        </div>
                        <div className="mt-4">
                          <Recorder
                            open={recording === `${stage.id}:${cell.criterion.id}`}
                            onOpen={() =>
                              setRecording(
                                recording === `${stage.id}:${cell.criterion.id}`
                                  ? null
                                  : `${stage.id}:${cell.criterion.id}`,
                              )
                            }
                            onRecord={(status, passage, quote) => {
                              dispatch({
                                type: "record_finding",
                                candidacy_id: candidacy.id,
                                stage_id: stage.id,
                                criterion_id: cell.criterion.id,
                                status,
                                passage,
                                quote,
                              });
                              setRecording(null);
                            }}
                            sources={sources}
                            prompt="Did it come up here?"
                          />
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              ) : null}
            </Section>
          );
        })}

      <Section title="Back to the candidacy">
        <Link
          href={`/prototype/candidacies/${candidacy.id}`}
          className="text-16 text-ink focus-visible:outline-ink underline decoration-1 underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4"
        >
          {person?.full_name} on {role?.title}
        </Link>
      </Section>
    </Screen>
  );
}

function sourceLabel(target: EvidenceTarget) {
  return target.kind === "document"
    ? `In the document · page ${target.page}, paragraph ${target.paragraph}`
    : "In the sighting snapshot, as it read on the day it was taken";
}

function FindingRow({
  cell,
  stageLabel,
  revealed,
  onReveal,
  children,
}: {
  cell: Cell;
  stageLabel: string;
  revealed: string | null;
  onReveal: (id: string | null) => void;
  children: React.ReactNode;
}) {
  const { state } = usePrototype();
  const citationId = `${stageLabel}:${cell.criterion.id}`;
  const showing = revealed === citationId;
  /* A finding recorded at an earlier stage is shown here as what it is, rather than
   * repeated as if this stage had found it. */
  const recordedHere = cell.stage?.label === stageLabel;

  return (
    <>
      <div className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-2">
        <h3 className="text-18 text-ink max-w-[52ch] font-medium">
          <span className="text-ink-muted tabular">{cell.criterion.position}. </span>
          {cell.criterion.text}
        </h3>
        <StateMarker
          label={
            cell.state === "evidenced"
              ? "Evidenced"
              : cell.state === "not_found"
                ? "Not found"
                : "No entry"
          }
          shape={
            cell.state === "evidenced"
              ? "filled"
              : cell.state === "not_found"
                ? "outlined"
                : "dotted"
          }
          tone={
            cell.state === "evidenced" ? "evidenced" : cell.state === "not_found" ? "open" : "ink"
          }
        />
      </div>

      {cell.stage && !recordedHere ? (
        <p className="text-14 text-ink-muted mt-2">Recorded at {cell.stage.label}.</p>
      ) : null}

      <div className="mt-4">
        {cell.state === "evidenced" && cell.evidence ? (
          <>
            <EvidenceCitation
              state="evidenced"
              quote={cell.evidence.quote}
              provenance={provenanceIn(state, cell.evidence.target)}
              action={
                <InlineControl
                  className="ml-auto"
                  onClick={() => onReveal(showing ? null : citationId)}
                >
                  {showing ? "Hide the source" : "Show it in the source"}
                </InlineControl>
              }
            />
            {showing ? (
              <div className="mt-4">
                <p className="rc-label text-ink-muted mb-3">{sourceLabel(cell.evidence.target)}</p>
                <Passage
                  text={sourceTextOf(state, cell.evidence.target)}
                  start={cell.evidence.target.char_start}
                  end={cell.evidence.target.char_end}
                  label={`The quoted passage for criterion ${cell.criterion.position}, in context`}
                />
                <p className="text-14 text-ink-muted mt-3 max-w-[62ch]">
                  The marked range is characters{" "}
                  <span className="tabular">
                    {cell.evidence.target.char_start}–{cell.evidence.target.char_end}
                  </span>{" "}
                  of the text as it was parsed. There is no control to change it, here or anywhere.
                </p>
              </div>
            ) : null}
          </>
        ) : cell.state === "not_found" ? (
          <EvidenceCitation state="not-found" />
        ) : (
          children
        )}
      </div>
    </>
  );
}

type Source = {
  key: string;
  label: string;
  text: string;
  make: (start: number, end: number) => PassageSource;
};

/* Recording a finding. Two values and nothing else — no confidence control, no "maybe",
 * no slider. Evidenced requires a passage, because an evidenced finding with nothing to
 * cite is the thing this whole product exists not to produce. The recorder does not
 * accept typing: it shows the sources held and asks which sentence supports the
 * criterion, so the offsets come from the document rather than from a retyping of it. */
function Recorder({
  open,
  onOpen,
  onRecord,
  sources,
  prompt = "Is this evidenced in what we hold?",
}: {
  open: boolean;
  onOpen: () => void;
  onRecord: (
    status: "evidenced" | "not_found",
    passage: PassageSource | null,
    quote: string | null,
  ) => void;
  sources: Source[];
  prompt?: string;
}) {
  const [picking, setPicking] = useState(false);

  if (!open) {
    return (
      <div className="border-rule border border-dotted px-5 py-5">
        <p className="text-16 text-ink-secondary max-w-[62ch]">
          Nothing recorded against this criterion at this stage. A criterion with no entry is not a
          finding that came back empty; it is work not yet done, and it holds this candidacy where
          it is.
        </p>
        <Control variant="secondary" className="mt-4" onClick={onOpen}>
          Record a finding
        </Control>
      </div>
    );
  }

  return (
    <div className="border-rule border px-5 py-5">
      {!picking ? (
        <>
          <p className="text-16 text-ink max-w-[62ch] font-medium">{prompt}</p>
          <p className="text-14 text-ink-muted mt-2 max-w-[62ch]">
            Two answers. Evidenced means there is a passage that says so, and you will be asked to
            point at it.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Control onClick={() => setPicking(true)}>Evidenced — show me the sources</Control>
            <Control variant="secondary" onClick={() => onRecord("not_found", null, null)}>
              Not found
            </Control>
            <Control variant="secondary" onClick={onOpen}>
              Leave it
            </Control>
          </div>
        </>
      ) : (
        <>
          <p className="text-16 text-ink max-w-[62ch] font-medium">Which passage evidences it?</p>
          <p className="text-14 text-ink-muted mt-2 max-w-[62ch]">
            Pick a sentence. The offsets come from the text, so the citation points at what it says
            it points at.
          </p>

          {sources.length === 0 ? (
            <p className="text-16 text-ink-secondary mt-4 max-w-[62ch]">
              Nothing is held for this person that could be quoted. No CV, and no sighting snapshot.
              Record it as not found, or get a document.
            </p>
          ) : null}

          <div className="mt-5 flex flex-col gap-6">
            {sources.map((source) => (
              <div key={source.key}>
                <p className="rc-label text-ink-muted">{source.label}</p>
                <ul className="border-rule mt-3 max-h-72 overflow-y-auto border-t">
                  {sentencesOf(source.text).map((sentence) => (
                    <li
                      key={`${source.key}-${sentence.char_start}`}
                      className="border-rule border-b"
                    >
                      <button
                        type="button"
                        onClick={() =>
                          onRecord(
                            "evidenced",
                            source.make(sentence.char_start, sentence.char_end),
                            sentence.text,
                          )
                        }
                        className="hover:bg-paper-sunk focus-visible:outline-ink w-full px-3 py-2.5 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2"
                      >
                        <span className="font-serif text-14 text-ink block leading-relaxed">
                          {sentence.text}
                        </span>
                        <span className="text-ink-muted mt-1 block font-mono text-12 tabular">
                          chars {sentence.char_start}–{sentence.char_end}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <Control variant="secondary" className="mt-5" onClick={() => setPicking(false)}>
            Back
          </Control>
        </>
      )}
    </div>
  );
}
