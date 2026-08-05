"use client";

/* Screen 6 — the evaluation.
 *
 * Each criterion in the order of The Brief, with its Finding, rendered through
 * components/evidence-citation.tsx. Every evidenced finding sits beside the passage that
 * produced it and the line saying where that passage is. Clicking the citation reveals
 * the passage inside the parsed document with the quoted range marked — that is what the
 * character offsets are for, and it is the only way to see that the quote has not been
 * lifted out of a sentence that meant the opposite.
 *
 * There is no control to edit a quoted passage. Not a disabled one: none. Invariant 8
 * revokes UPDATE on evidence at the permission level, and an interface that offers an
 * edit and then refuses it teaches the wrong thing about what this record is.
 *
 * Recording by hand is part of the flow, and the recorder does not accept typing. It
 * shows the sources held and asks which sentence supports the criterion, so the offsets
 * come from the document rather than from someone's retyping of it.
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
  candidacyById,
  cellsFor,
  clientById,
  documentsForPerson,
  personById,
  provenanceIn,
  reviewFor,
  roleById,
  sightingsForPerson,
  sourceTextOf,
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
  const review = reviewFor(state, candidacy.id);
  const cells = cellsFor(state, candidacy);

  const documents = person ? documentsForPerson(state, person.id) : [];
  const sightings = person ? sightingsForPerson(state, person.id) : [];

  return (
    <Screen>
      <Crumbs
        trail={[
          { href: "/prototype", label: "The desk" },
          { href: `/prototype/roles/${candidacy.role_id}`, label: role?.title ?? "Role" },
          { href: `/prototype/candidacies/${candidacy.id}`, label: person?.full_name ?? "" },
          { label: "The scorecard" },
        ]}
      />
      <ScreenTitle
        eyebrow={`${client?.name} · ${role?.title}`}
        title="The scorecard"
        lede={
          <>
            {person?.full_name} against The Brief, version {version?.version}.{" "}
            {review
              ? `Opened ${formatDate(review.created_at)} by ${userById(state, review.created_by)?.name}.`
              : "No review has been opened on this candidacy yet."}
          </>
        }
      />

      <Section
        title="Findings"
        note="In the order of The Brief. Two values: evidenced, with the passage that evidences it, or not found. There is no third value, no partial, and nothing beside a finding that says how sure anyone is."
      >
        <ol className="flex max-w-4xl flex-col gap-10">
          {cells.map((cell) => {
            const citationId = `${cell.criterion.id}`;
            const showing = revealed === citationId;

            return (
              <li key={cell.criterion.id}>
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
                      cell.state === "evidenced"
                        ? "evidenced"
                        : cell.state === "not_found"
                          ? "open"
                          : "ink"
                    }
                  />
                </div>

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
                            onClick={() => setRevealed(showing ? null : citationId)}
                          >
                            {showing ? "Hide the source" : "Show it in the source"}
                          </InlineControl>
                        }
                      />
                      {showing ? (
                        <div className="mt-4">
                          <p className="rc-label text-ink-muted mb-3">
                            {sourceLabel(cell.evidence.target)}
                          </p>
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
                            of the text as it was parsed. There is no control to change it, here or
                            anywhere.
                          </p>
                        </div>
                      ) : null}
                    </>
                  ) : cell.state === "not_found" ? (
                    <EvidenceCitation state="not-found" />
                  ) : (
                    <NoEntry
                      criterionId={cell.criterion.id}
                      candidacyId={candidacy.id}
                      open={recording === cell.criterion.id}
                      onOpen={() =>
                        setRecording(recording === cell.criterion.id ? null : cell.criterion.id)
                      }
                      onRecord={(status, passage, quote) => {
                        dispatch({
                          type: "record_finding",
                          candidacy_id: candidacy.id,
                          criterion_id: cell.criterion.id,
                          status,
                          passage,
                          quote,
                        });
                        setRecording(null);
                      }}
                      sources={[
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
                      ]}
                    />
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </Section>

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

type Source = {
  key: string;
  label: string;
  text: string;
  make: (start: number, end: number) => PassageSource;
};

/* Recording a finding. Two values and nothing else — no confidence control, no "maybe",
 * no slider. Evidenced requires a passage, because an evidenced finding with nothing to
 * cite is the thing this whole product exists not to produce. */
function NoEntry({
  criterionId,
  candidacyId,
  open,
  onOpen,
  onRecord,
  sources,
}: {
  criterionId: string;
  candidacyId: string;
  open: boolean;
  onOpen: () => void;
  onRecord: (
    status: "evidenced" | "not_found",
    passage: PassageSource | null,
    quote: string | null,
  ) => void;
  sources: Source[];
}) {
  const [picking, setPicking] = useState(false);

  if (!open) {
    return (
      <div className="border-rule border border-dotted px-5 py-5">
        <p className="text-16 text-ink-secondary max-w-[62ch]">
          Nothing recorded against this criterion. A criterion with no entry is not a finding that
          came back empty; it is work not yet done, and it holds this candidacy where it is.
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
          <p className="text-16 text-ink max-w-[62ch] font-medium">
            Is this evidenced in what we hold?
          </p>
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

          <Control
            variant="secondary"
            className="mt-5"
            onClick={() => setPicking(false)}
            data-criterion={criterionId}
            data-candidacy={candidacyId}
          >
            Back
          </Control>
        </>
      )}
    </div>
  );
}
