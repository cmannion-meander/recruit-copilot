/* Reads over the fixture state. Pure, and none of them sorts by anything that could be
 * read as quality: roles sort by title, candidacies by the person's family name, events
 * by time. There is no "best first" anywhere, because there is nothing to sort on.
 */

import type { PrototypeState } from "../_fixtures";
import { formatDateShort } from "../_fixtures/clock";
import type {
  Candidacy,
  CandidacyId,
  Criterion,
  Document,
  Evidence,
  EvidenceTarget,
  Finding,
  Person,
  PersonId,
  Role,
  RoleId,
  Sighting,
} from "../_fixtures/types";

export function roleById(state: PrototypeState, id: RoleId) {
  return state.roles.find((role) => role.id === id);
}
export function personById(state: PrototypeState, id: PersonId) {
  return state.people.find((person) => person.id === id);
}
export function candidacyById(state: PrototypeState, id: CandidacyId) {
  return state.candidacies.find((candidacy) => candidacy.id === id);
}
export function clientById(state: PrototypeState, id: string) {
  return state.clients.find((client) => client.id === id);
}
export function stageById(state: PrototypeState, id: string) {
  return state.stages.find((stage) => stage.id === id);
}
export function userById(state: PrototypeState, id: string) {
  return state.users.find((user) => user.id === id);
}
export function documentById(state: PrototypeState, id: string) {
  return state.documents.find((document) => document.id === id);
}
export function sightingById(state: PrototypeState, id: string) {
  return state.sightings.find((sighting) => sighting.id === id);
}
export function briefVersionById(state: PrototypeState, id: string) {
  return state.briefVersions.find((version) => version.id === id);
}
export function searchById(state: PrototypeState, id: string) {
  return state.searches.find((search) => search.id === id);
}
export function sourcingScopeById(state: PrototypeState, id: string) {
  return state.sourcingScopes.find((scope) => scope.id === id);
}

/** The latest version of a role's Brief, whether or not the role has opened. */
export function latestBriefVersion(state: PrototypeState, role: Role) {
  return state.briefVersions
    .filter((version) => version.brief_id === role.brief_id)
    .sort((left, right) => right.version - left.version)[0];
}

/** The version the role is pinned to, or the latest draft if it has not opened. */
export function workingBriefVersion(state: PrototypeState, role: Role) {
  if (role.pinned_brief_version_id) {
    return briefVersionById(state, role.pinned_brief_version_id);
  }
  return latestBriefVersion(state, role);
}

/** Fixed order, always, and the order never changes between candidates. */
export function criteriaFor(state: PrototypeState, briefVersionId: string): Criterion[] {
  return state.criteria
    .filter((criterion) => criterion.brief_version_id === briefVersionId)
    .sort((left, right) => left.position - right.position);
}

export function reviewFor(state: PrototypeState, candidacyId: CandidacyId) {
  return state.reviews.find((review) => review.candidacy_id === candidacyId);
}

export function findingsFor(state: PrototypeState, candidacyId: CandidacyId): Finding[] {
  const review = reviewFor(state, candidacyId);
  if (!review) return [];
  return state.findings.filter((finding) => finding.review_id === review.id);
}

export function evidenceFor(state: PrototypeState, findingId: string): Evidence | undefined {
  return state.evidence.find((item) => item.finding_id === findingId);
}

/* ── The cell row ────────────────────────────────────────────────────────────────
 * Three states, not two. Finding.status has two values and that is correct — a
 * finding is evidenced or it is not found. But a criterion with no finding at all is
 * not a finding with a third value; it is the absence of one, and the row has to say
 * so or the scorecard reads as complete when it is not.
 *
 * Written up in docs/prototype-findings.md: this is the first thing the interface
 * forced that the schema does not carry.
 * ─────────────────────────────────────────────────────────────────────────────── */
export type CellState = "evidenced" | "not_found" | "no_entry";

export type Cell = {
  criterion: Criterion;
  state: CellState;
  finding: Finding | undefined;
  evidence: Evidence | undefined;
};

export function cellsFor(state: PrototypeState, candidacy: Candidacy): Cell[] {
  const findings = findingsFor(state, candidacy.id);
  return criteriaFor(state, candidacy.brief_version_id).map((criterion) => {
    const finding = findings.find((item) => item.criterion_id === criterion.id);
    return {
      criterion,
      state: finding ? finding.status : "no_entry",
      finding,
      evidence: finding ? evidenceFor(state, finding.id) : undefined,
    };
  });
}

export type CellCount = {
  evidenced: number;
  notFound: number;
  noEntry: number;
  total: number;
};

/** The count that sits beside the cells, and never renders without them — invariant 2. */
export function countOf(cells: Cell[]): CellCount {
  return {
    evidenced: cells.filter((cell) => cell.state === "evidenced").length,
    notFound: cells.filter((cell) => cell.state === "not_found").length,
    noEntry: cells.filter((cell) => cell.state === "no_entry").length,
    total: cells.length,
  };
}

function familyName(person: Person | undefined) {
  if (!person) return "";
  const parts = person.full_name.split(" ");
  return parts[parts.length - 1] ?? person.full_name;
}

/** Alphabetical by family name. Deliberately not by anything else. */
export function candidaciesForRole(state: PrototypeState, roleId: RoleId): Candidacy[] {
  return state.candidacies
    .filter((candidacy) => candidacy.role_id === roleId)
    .sort((left, right) =>
      familyName(personById(state, left.person_id)).localeCompare(
        familyName(personById(state, right.person_id)),
      ),
    );
}

export function candidaciesForPerson(state: PrototypeState, personId: PersonId): Candidacy[] {
  return state.candidacies
    .filter((candidacy) => candidacy.person_id === personId)
    .sort((left, right) => Date.parse(right.created_at) - Date.parse(left.created_at));
}

export function sightingsForPerson(state: PrototypeState, personId: PersonId): Sighting[] {
  return state.sightings
    .filter((sighting) => sighting.person_id === personId)
    .sort((left, right) => Date.parse(right.retrieved_at) - Date.parse(left.retrieved_at));
}

export function sightingsForSearch(state: PrototypeState, searchId: string): Sighting[] {
  return state.sightings.filter((sighting) => sighting.search_id === searchId);
}

export function searchesForRole(state: PrototypeState, roleId: RoleId) {
  return state.searches
    .filter((search) => search.role_id === roleId)
    .sort((left, right) => Date.parse(right.ran_at) - Date.parse(left.ran_at));
}

export function documentsForPerson(state: PrototypeState, personId: PersonId): Document[] {
  return state.documents.filter((document) => document.person_id === personId);
}

export function signalsFor(state: PrototypeState, candidacyId: CandidacyId) {
  return state.crosscheckSignals.filter((signal) => signal.candidacy_id === candidacyId);
}

export function openSignalsFor(state: PrototypeState, candidacyId: CandidacyId) {
  return signalsFor(state, candidacyId).filter((signal) => signal.resolution === null);
}

/** Append-only, oldest first. The order a log is read in. */
export function eventsFor(state: PrototypeState, candidacyId: CandidacyId) {
  return state.decisionEvents
    .filter((event) => event.candidacy_id === candidacyId)
    .sort((left, right) => Date.parse(left.at) - Date.parse(right.at));
}

export function decisionFor(state: PrototypeState, candidacyId: CandidacyId) {
  return state.decisions.find((decision) => decision.candidacy_id === candidacyId);
}

export function exclusionFor(state: PrototypeState, candidacyId: CandidacyId) {
  return state.exclusions.find((exclusion) => exclusion.candidacy_id === candidacyId);
}

export function submissionFor(state: PrototypeState, candidacyId: CandidacyId) {
  return state.submissionRecords.find((record) => record.candidacy_id === candidacyId);
}

export function submissionByToken(state: PrototypeState, token: string) {
  return state.submissionRecords.find((record) => record.snapshot.candidate_token === token);
}

/** Counts by stage on a role. Counts, not a composite of them. */
export function stageCountsForRole(state: PrototypeState, roleId: RoleId) {
  const held = candidaciesForRole(state, roleId);
  return state.stages
    .map((stage) => ({
      stage,
      count: held.filter((candidacy) => candidacy.stage_id === stage.id).length,
    }))
    .filter((entry) => entry.count > 0);
}

/** The next stage along the pipeline, or undefined at the end of it. */
export function nextStage(state: PrototypeState, stageId: string) {
  const current = stageById(state, stageId);
  if (!current || current.position === null) return undefined;
  return state.stages.find((stage) => stage.position === (current.position ?? 0) + 1);
}

/* The provenance line, read from live state rather than from the fixture modules, so a
 * record made during the session cites correctly too. The fixtures have their own copy
 * for building the frozen submission snapshot at module scope. */
export function provenanceIn(state: PrototypeState, target: EvidenceTarget): string {
  if (target.kind === "document") {
    const document = documentById(state, target.document_id);
    const name = document ? document.filename : target.document_id;
    return `${name} · page ${target.page} ¶ ${target.paragraph} · chars ${target.char_start}–${target.char_end}`;
  }
  const sighting = sightingById(state, target.sighting_id);
  const name = sighting ? sighting.source_name : target.sighting_id;
  const read = sighting ? `read ${formatDateShort(sighting.retrieved_at)}` : "read date unknown";
  return `${name} · ${read} · chars ${target.char_start}–${target.char_end}`;
}

/** The text an evidence target points into, whichever kind it is. */
export function sourceTextOf(state: PrototypeState, target: EvidenceTarget): string {
  if (target.kind === "document") {
    return documentById(state, target.document_id)?.parsed_text ?? "";
  }
  return sightingById(state, target.sighting_id)?.snapshot_excerpt ?? "";
}
