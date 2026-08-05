"use client";

/* Screen 4 — the person.
 *
 * The contact block is the interesting part of this screen, and it is interesting
 * because it is usually empty. Eight of the twelve people here have no email address and
 * no telephone number, because nobody has spoken to them. An ATS schema that assumes an
 * identity anchor draws a blank field there; what the record actually holds is a source,
 * so that is what the screen offers as the route to them.
 */
import Link from "next/link";
import { CriteriaKey, CriteriaRow } from "@/components/criteria-row";
import { RecordField, RecordFields } from "@/components/record-field";
import { SightingCard } from "@/components/sighting-card";
import { StateMarker } from "@/components/state-marker";
import { formatAge, formatDate } from "../../../_fixtures/clock";
import { usePrototype } from "../../../_state/provider";
import {
  candidaciesForPerson,
  cellsFor,
  clientById,
  documentsForPerson,
  personById,
  roleById,
  sightingsForPerson,
  stageById,
} from "../../../_state/selectors";
import { Crumbs, Screen, ScreenTitle, Section } from "../../../screen";

export function PersonScreen({ personId }: { personId: string }) {
  const { state } = usePrototype();
  const person = personById(state, personId);

  if (!person) {
    return (
      <Screen>
        <p className="text-16 text-ink">No person with that identifier.</p>
      </Screen>
    );
  }

  const sightings = sightingsForPerson(state, person.id);
  const held = candidaciesForPerson(state, person.id);
  const documents = documentsForPerson(state, person.id);
  const resolving = sightings.find((sighting) => sighting.resolving);

  return (
    <Screen>
      <Crumbs trail={[{ href: "/prototype", label: "The desk" }, { label: person.full_name }]} />
      <ScreenTitle
        eyebrow={person.current_employer}
        title={person.full_name}
        lede={person.headline}
      />

      <Section
        title="The record"
        note="A person exists here because a source resolved to them. Everything else is what has been learned since."
      >
        <RecordFields columns={2} className="max-w-4xl">
          <RecordField label="Location" value={person.location} />
          <RecordField label="Current employer" value={person.current_employer} />
          <RecordField
            label="Email"
            value={person.email}
            empty="No email address. This person was sourced, not applied — the route to them is the source below."
          />
          <RecordField
            label="Telephone"
            value={person.phone}
            empty="No telephone number is held."
          />
        </RecordFields>

        {!person.email && resolving ? (
          <p className="text-16 text-ink-secondary mt-6 max-w-[62ch]">
            The only way to reach this person is the page they were found on, so that is what a
            contact affordance can honestly offer:{" "}
            <a
              href={resolving.source_url}
              rel="nofollow noreferrer"
              className="text-ink focus-visible:outline-ink underline decoration-1 underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4"
            >
              {resolving.source_name}
            </a>
            .
          </p>
        ) : null}
      </Section>

      <Section
        title="Sightings"
        note="Where this person was found, and what each source said on the day it was read. A sighting keeps its snapshot because the page will not keep itself."
      >
        <ul className="flex max-w-4xl flex-col gap-5">
          {sightings.map((sighting) => (
            <li key={sighting.id}>
              <SightingCard
                sourceName={sighting.source_name}
                sourceKind={sighting.source_kind}
                url={sighting.source_url}
                readOn={formatDate(sighting.retrieved_at)}
                age={formatAge(sighting.retrieved_at)}
                snapshot={sighting.snapshot_excerpt}
                resolving={sighting.resolving}
              />
            </li>
          ))}
        </ul>
        <p className="text-14 text-ink-muted mt-5 max-w-[62ch]">
          The age is how long ago the source was read. It is not a claim that the page still says
          this — the record cannot know that without going back, and until it does, the age is the
          only honest thing to show.
        </p>
      </Section>

      {documents.length > 0 ? (
        <Section title="Documents">
          <RecordFields className="max-w-4xl">
            {documents.map((document) => (
              <RecordField
                key={document.id}
                label={document.kind === "cv" ? "CV" : "Attachment"}
                value={
                  <span className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                    <span>{document.filename}</span>
                    <span className="text-ink-muted font-mono text-12 tabular">
                      {document.parsed_text.length} characters parsed · {document.pages.length}{" "}
                      {document.pages.length === 1 ? "page" : "pages"} · received{" "}
                      {formatDate(document.uploaded_at)}
                    </span>
                  </span>
                }
              />
            ))}
          </RecordFields>
        </Section>
      ) : null}

      <Section
        title="Candidacies"
        note="Every role this person is held against, across clients. A person accumulates; a candidacy does not move between roles."
      >
        {held.length === 0 ? (
          <p className="text-16 text-ink-secondary max-w-[62ch]">
            This person is on no role. They exist because a source resolved to them, which is the
            only thing required to hold a record.
          </p>
        ) : (
          <>
            <CriteriaKey className="mb-6" />
            <div className="border-rule border-t">
              {held.map((candidacy) => {
                const role = roleById(state, candidacy.role_id);
                const client = role ? clientById(state, role.client_id) : undefined;
                const stage = stageById(state, candidacy.stage_id);
                const cells = cellsFor(state, candidacy);

                return (
                  <div key={candidacy.id} className="border-rule border-b py-5">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-2">
                      <p className="text-16 text-ink">
                        <Link
                          href={`/prototype/candidacies/${candidacy.id}`}
                          className="focus-visible:outline-ink underline decoration-1 underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4"
                        >
                          {role?.title}
                        </Link>
                        <span className="text-ink-muted"> · {client?.name}</span>
                      </p>
                      <StateMarker
                        label={stage?.label ?? ""}
                        shape={stage?.terminal ? "outlined" : "filled"}
                      />
                    </div>
                    <CriteriaRow
                      className="mt-4"
                      subject={`${person.full_name} on ${role?.title}`}
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
                    <p className="text-14 text-ink-muted mt-3 tabular">
                      Created {formatDate(candidacy.created_at)} ·{" "}
                      {candidacy.closed_at
                        ? `closed ${formatDate(candidacy.closed_at)}`
                        : `closes ${formatDate(candidacy.auto_close_at)}`}
                    </p>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </Section>
    </Screen>
  );
}
