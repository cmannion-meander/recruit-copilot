"use client";

/* Screen 3 — one sourcing run.
 *
 * The Brief version and the sourcing scope are drawn as two separate panels with two
 * separate revision numbers, because that is what the record actually holds: one rubric
 * at version 2, and two scopes against it. Whether they should be one object is the open
 * question in docs/data-model.md, and this screen is where it stops being deferrable —
 * see docs/prototype-findings.md.
 *
 * Turning a Sighting into a Person and then a Candidacy happens here, in that order,
 * because that is the order the database requires: the source exists first, and the
 * person is created from it.
 */
import Link from "next/link";
import { useState } from "react";
import { Control } from "@/components/control";
import { TextField } from "@/components/fields";
import { Refusal } from "@/components/refusal";
import { SightingCard } from "@/components/sighting-card";
import { formatAge, formatDate } from "../../../../_fixtures/clock";
import { usePrototype } from "../../../../_state/provider";
import {
  type Refusal as RefusalShape,
  refusePerson,
  refuseSearch,
} from "../../../../_state/refusals";
import {
  briefVersionById,
  candidaciesForRole,
  clientById,
  criteriaFor,
  personById,
  roleById,
  searchesForRole,
  sightingsForSearch,
  sourcingScopeById,
  userById,
} from "../../../../_state/selectors";
import { Crumbs, Screen, ScreenTitle, Section } from "../../../../screen";

export function SearchScreen({ roleId }: { roleId: string }) {
  const { state, dispatch } = usePrototype();
  const role = roleById(state, roleId);
  const runs = searchesForRole(state, roleId);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [byHand, setByHand] = useState({
    full_name: "",
    headline: "",
    current_employer: "",
    location: "",
    source_url: "",
    source_name: "",
    snapshot_excerpt: "",
  });
  const [handRefusal, setHandRefusal] = useState<RefusalShape | null>(null);

  if (!role) {
    return (
      <Screen>
        <p className="text-16 text-ink">No role with that identifier.</p>
      </Screen>
    );
  }

  const client = clientById(state, role.client_id);
  const refusal = refuseSearch(state, role.id);

  if (refusal) {
    return (
      <Screen>
        <Crumbs
          trail={[
            { href: "/prototype", label: "The desk" },
            { href: `/prototype/roles/${role.id}`, label: role.title },
            { label: "Sourcing" },
          ]}
        />
        <ScreenTitle eyebrow={client?.name} title="Sourcing" />
        <Section title="This run">
          <Refusal
            requirement={refusal.requirement}
            reason={refusal.reason}
            action={refusal.action}
            items={refusal.items}
            footnote={`Invariant ${refusal.invariant} · rubric before pipeline`}
          >
            <Link
              href={`/prototype/roles/${role.id}`}
              className="rounded-rc bg-ink text-ink-inverse hover:bg-ink-strong focus-visible:outline-ink px-4 py-2.5 text-16 font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              Open The Brief
            </Link>
          </Refusal>
          <p className="text-14 text-ink-muted mt-4 max-w-[62ch]">
            A search pins the Brief version it ran against, so a run that happened before the
            criteria existed could never render as it was made. That is why the refusal is here
            rather than at the point the results come back.
          </p>
        </Section>
      </Screen>
    );
  }

  const selected = runs.find((run) => run.id === selectedId) ?? runs[0];
  if (!selected) {
    return (
      <Screen>
        <p className="text-16 text-ink">No search has run against this role.</p>
      </Screen>
    );
  }

  const version = briefVersionById(state, selected.brief_version_id);
  const scope = sourcingScopeById(state, selected.sourcing_scope_id);
  const ranBy = userById(state, selected.ran_by);
  const found = sightingsForSearch(state, selected.id);
  const onThisRole = candidaciesForRole(state, role.id);

  function submitByHand() {
    if (!role) return;
    const refused = refusePerson(byHand.source_url, byHand.snapshot_excerpt);
    setHandRefusal(refused);
    if (refused) return;
    dispatch({
      type: "create_person_by_hand",
      full_name: byHand.full_name.trim() || "Unnamed",
      headline: byHand.headline.trim(),
      current_employer: byHand.current_employer.trim(),
      location: byHand.location.trim() || "Not recorded",
      source_url: byHand.source_url.trim(),
      source_name: byHand.source_name.trim() || byHand.source_url.trim(),
      snapshot_excerpt: byHand.snapshot_excerpt.trim(),
      role_id: role.id,
    });
    setByHand({
      full_name: "",
      headline: "",
      current_employer: "",
      location: "",
      source_url: "",
      source_name: "",
      snapshot_excerpt: "",
    });
  }

  return (
    <Screen>
      <Crumbs
        trail={[
          { href: "/prototype", label: "The desk" },
          { href: `/prototype/roles/${role.id}`, label: role.title },
          { label: "Sourcing" },
        ]}
      />
      <ScreenTitle
        eyebrow={client?.name}
        title="Sourcing"
        lede={`Two runs against this role. Each one is pinned to the Brief version and the scope it was run under, so it renders as it was made.`}
      />

      <Section title="Runs">
        <div className="border-rule flex flex-wrap gap-3 border-t pt-5">
          {runs.map((run) => {
            const runScope = sourcingScopeById(state, run.sourcing_scope_id);
            const active = run.id === selected.id;
            return (
              <button
                key={run.id}
                type="button"
                onClick={() => setSelectedId(run.id)}
                className={`rounded-rc focus-visible:outline-ink border px-4 py-3 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
                  active
                    ? "border-ink bg-paper-sunk border-2"
                    : "border-rule-control bg-paper-raised hover:bg-paper-sunk"
                }`}
              >
                <p className="text-16 text-ink tabular">{formatDate(run.ran_at)}</p>
                <p className="text-14 text-ink-muted mt-0.5 tabular">
                  Scope revision {runScope?.revision} · {sightingsForSearch(state, run.id).length}{" "}
                  sightings
                </p>
              </button>
            );
          })}
        </div>
      </Section>

      <div className="mt-12 grid gap-10 lg:grid-cols-2">
        <section>
          <h2 className="rc-label text-ink-muted">The Brief, pinned</h2>
          <div className="border-rule bg-paper-sunk mt-5 border px-5 py-5">
            <p className="text-16 text-ink tabular">Version {version?.version}</p>
            <p className="text-14 text-ink-muted mt-1 tabular">
              {version ? formatDate(version.created_at) : ""}
            </p>
            <ol className="border-rule mt-4 border-t">
              {(version ? criteriaFor(state, version.id) : []).map((criterion) => (
                <li key={criterion.id} className="border-rule border-b py-2.5">
                  <p className="text-14 text-ink-secondary">
                    <span className="tabular text-ink-muted">{criterion.position}. </span>
                    {criterion.text}
                  </p>
                </li>
              ))}
            </ol>
            <p className="text-14 text-ink-muted mt-4 max-w-[46ch]">
              What has to be evidenced in a person. This did not change between the two runs.
            </p>
          </div>
        </section>

        <section>
          <h2 className="rc-label text-ink-muted">The scope, pinned</h2>
          <div className="border-rule bg-paper-sunk mt-5 border px-5 py-5">
            <p className="text-16 text-ink tabular">Revision {scope?.revision}</p>
            <p className="text-14 text-ink-muted mt-1 tabular">
              {scope ? formatDate(scope.created_at) : ""}
            </p>
            <dl className="border-rule mt-4 border-t">
              <div className="border-rule border-b py-2.5">
                <dt className="rc-label text-ink-muted">Markets</dt>
                <dd className="text-14 text-ink-secondary mt-1">{scope?.markets.join(" · ")}</dd>
              </div>
              <div className="border-rule border-b py-2.5">
                <dt className="rc-label text-ink-muted">Named employers</dt>
                <dd className="text-14 text-ink-secondary mt-1">{scope?.employers.join(" · ")}</dd>
              </div>
              <div className="border-rule border-b py-2.5">
                <dt className="rc-label text-ink-muted">Geography</dt>
                <dd className="text-14 text-ink-secondary mt-1">{scope?.geography}</dd>
              </div>
              <div className="border-rule border-b py-2.5">
                <dt className="rc-label text-ink-muted">Off limits</dt>
                <dd className="text-14 text-ink-secondary mt-1">{scope?.exclusions.join(" · ")}</dd>
              </div>
            </dl>
            <p className="text-14 text-ink-muted mt-4 max-w-[46ch]">
              Where to look. This was renegotiated in June when the pool came back thin, and nothing
              anyone is assessed against moved with it.
            </p>
          </div>
        </section>
      </div>

      <Section
        title="Sightings returned"
        note={selected.coverage_note}
        aside={
          <p className="text-14 text-ink-muted tabular">
            Run by {ranBy?.name} · {formatDate(selected.ran_at)}
          </p>
        }
      >
        <ul className="flex flex-col gap-5">
          {found.map((sighting) => {
            const person = sighting.person_id ? personById(state, sighting.person_id) : undefined;
            const candidacy = person
              ? onThisRole.find((item) => item.person_id === person.id)
              : undefined;

            return (
              <li key={sighting.id}>
                <SightingCard
                  sourceName={sighting.source_name}
                  sourceKind={sighting.source_kind}
                  url={sighting.source_url}
                  readOn={formatDate(sighting.retrieved_at)}
                  age={formatAge(sighting.retrieved_at)}
                  snapshot={sighting.snapshot_excerpt}
                  resolving={sighting.resolving}
                  action={
                    candidacy ? (
                      <Link
                        href={`/prototype/candidacies/${candidacy.id}`}
                        className="text-ink focus-visible:outline-ink ml-auto font-mono text-12 underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4"
                      >
                        On this role · open the candidacy
                      </Link>
                    ) : person ? (
                      <span className="ml-auto flex items-center gap-4">
                        <Link
                          href={`/prototype/people/${person.id}`}
                          className="text-ink-secondary hover:text-ink font-mono text-12 underline underline-offset-4 transition-colors"
                        >
                          {person.full_name}
                        </Link>
                        <Control
                          variant="secondary"
                          className="px-3 py-1.5 text-14"
                          onClick={() =>
                            dispatch({
                              type: "create_candidacy",
                              person_id: person.id,
                              role_id: role.id,
                              /* The channel a sighting came from is the run that found
                               * it, not a field somebody types afterwards. */
                              channel_id:
                                sighting.source_kind === "Trade press article"
                                  ? "chn_trade_press"
                                  : "chn_company_sites",
                            })
                          }
                        >
                          Put forward on this role
                        </Control>
                      </span>
                    ) : (
                      <Control
                        variant="secondary"
                        className="ml-auto px-3 py-1.5 text-14"
                        onClick={() =>
                          dispatch({
                            type: "create_person_from_sighting",
                            sighting_id: sighting.id,
                          })
                        }
                      >
                        Create a person from this sighting
                      </Control>
                    )
                  }
                />
              </li>
            );
          })}
        </ul>
      </Section>

      <Section
        title="Add a person by hand"
        note="A person found somewhere this run did not reach. The record still needs the source that resolves to them, and what it said."
      >
        <div className="grid max-w-4xl gap-5 sm:grid-cols-2">
          <TextField
            id="by-hand-name"
            label="Name"
            value={byHand.full_name}
            onChange={(event) => setByHand({ ...byHand, full_name: event.target.value })}
          />
          <TextField
            id="by-hand-employer"
            label="Current employer"
            value={byHand.current_employer}
            onChange={(event) => setByHand({ ...byHand, current_employer: event.target.value })}
          />
          <TextField
            id="by-hand-source"
            label="Source"
            hint="the address of the page you read"
            value={byHand.source_url}
            onChange={(event) => setByHand({ ...byHand, source_url: event.target.value })}
          />
          <TextField
            id="by-hand-source-name"
            label="Source name"
            hint="optional"
            value={byHand.source_name}
            onChange={(event) => setByHand({ ...byHand, source_name: event.target.value })}
          />
          <div className="sm:col-span-2">
            <label htmlFor="by-hand-snapshot" className="text-14 text-ink font-medium">
              What it said
              <span className="text-ink-muted font-normal">
                {" "}
                — the sentence that names them, kept as it read today
              </span>
            </label>
            <textarea
              id="by-hand-snapshot"
              rows={3}
              value={byHand.snapshot_excerpt}
              onChange={(event) => setByHand({ ...byHand, snapshot_excerpt: event.target.value })}
              className="border-rule-control bg-paper-raised text-16 text-ink placeholder:text-ink-muted focus:border-ink focus:outline-ink rounded-rc mt-1.5 w-full border px-3 py-2.5 focus:border-2 focus:outline focus:outline-2 focus:outline-offset-2"
            />
          </div>
        </div>

        <div className="mt-6">
          <Control onClick={submitByHand}>Add this person</Control>
        </div>

        {handRefusal ? (
          <Refusal
            className="mt-6 max-w-3xl"
            requirement={handRefusal.requirement}
            reason={handRefusal.reason}
            action={handRefusal.action}
            items={handRefusal.items}
            footnote={`Invariant ${handRefusal.invariant} · no person without a source`}
          />
        ) : null}
      </Section>
    </Screen>
  );
}
