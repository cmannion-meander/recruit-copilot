/* Reads over the fixture state. Pure, and none of them sorts by anything that could be
 * read as quality: roles sort by client, candidacies by the person's family name,
 * events by time. There is no "best first" anywhere, because there is nothing to sort on.
 *
 * Nothing here returns a percentage. Funnel figures are counts and count pairs — "6 of
 * 10 reached the screening call" — because a rate on n=10 is false precision, and
 * because a percentage is the shape a judgement arrives in.
 */

import type { PrototypeState } from "../_fixtures";
import { formatDateShort } from "../_fixtures/clock";
import type {
  BriefStage,
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
  Stage,
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
export function channelById(state: PrototypeState, id: string) {
  return state.channels.find((channel) => channel.id === id);
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

// ── The stages The Brief defines ────────────────────────────────────────────────

export function stagesFor(state: PrototypeState, briefVersionId: string): BriefStage[] {
  return state.briefStages
    .filter((stage) => stage.brief_version_id === briefVersionId)
    .sort((left, right) => left.position - right.position);
}

/** A pipeline stage or a terminal outcome, normalised so callers need not care which. */
export type ResolvedStage = {
  id: string;
  label: string;
  position: number | null;
  terminal: boolean;
  purpose: string;
  criterion_ids: string[];
  owner: "recruiter" | "client" | null;
  candidate_message: string | null;
};

function fromTerminal(stage: Stage): ResolvedStage {
  return {
    id: stage.id,
    label: stage.label,
    position: null,
    terminal: true,
    purpose: "",
    criterion_ids: [],
    owner: null,
    candidate_message: null,
  };
}

function fromBrief(stage: BriefStage): ResolvedStage {
  return {
    id: stage.id,
    label: stage.label,
    position: stage.position,
    terminal: false,
    purpose: stage.purpose,
    criterion_ids: stage.criterion_ids,
    owner: stage.owner,
    candidate_message: stage.candidate_message,
  };
}

export function stageById(state: PrototypeState, id: string): ResolvedStage | undefined {
  const brief = state.briefStages.find((stage) => stage.id === id);
  if (brief) return fromBrief(brief);
  const terminal = state.terminalStages.find((stage) => stage.id === id);
  return terminal ? fromTerminal(terminal) : undefined;
}

export function stageOf(state: PrototypeState, candidacy: Candidacy) {
  return stageById(state, candidacy.stage_id);
}

/** The next stage along the pipeline of this candidacy's pinned Brief. */
export function nextStage(state: PrototypeState, candidacy: Candidacy) {
  const current = stageOf(state, candidacy);
  if (!current || current.position === null) return undefined;
  const stages = stagesFor(state, candidacy.brief_version_id);
  const found = stages.find((stage) => stage.position === (current.position ?? 0) + 1);
  return found ? fromBrief(found) : undefined;
}

/* Which criteria this stage is responsible for, in the order of The Brief. Empty is a
 * legitimate answer: an early stage tests interest and money, and neither is a criterion. */
export function criteriaAtStage(
  state: PrototypeState,
  candidacy: Candidacy,
  stageId: string,
): Criterion[] {
  const stage = stageById(state, stageId);
  if (!stage) return [];
  return criteriaFor(state, candidacy.brief_version_id).filter((criterion) =>
    stage.criterion_ids.includes(criterion.id),
  );
}

// ── Scorecards ──────────────────────────────────────────────────────────────────

export function reviewsFor(state: PrototypeState, candidacyId: CandidacyId) {
  return state.reviews
    .filter((review) => review.candidacy_id === candidacyId)
    .sort((left, right) => Date.parse(left.created_at) - Date.parse(right.created_at));
}

export function reviewAtStage(state: PrototypeState, candidacyId: CandidacyId, stageId: string) {
  return state.reviews.find(
    (review) => review.candidacy_id === candidacyId && review.stage_id === stageId,
  );
}

export function findingsFor(state: PrototypeState, candidacyId: CandidacyId): Finding[] {
  const ids = new Set(reviewsFor(state, candidacyId).map((review) => review.id));
  return state.findings
    .filter((finding) => ids.has(finding.review_id))
    .sort((left, right) => Date.parse(left.recorded_at) - Date.parse(right.recorded_at));
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
 * Where a criterion has been read twice — thin at the screening call, properly at the
 * competency call — the row shows the most recent reading and `earlier` carries the
 * ones before it. Nothing is overwritten; both are on the record with their dates.
 * ─────────────────────────────────────────────────────────────────────────────── */
export type CellState = "evidenced" | "not_found" | "no_entry";

export type Cell = {
  criterion: Criterion;
  state: CellState;
  finding: Finding | undefined;
  evidence: Evidence | undefined;
  /** The stage the current reading was recorded at. */
  stage: ResolvedStage | undefined;
  /** Earlier readings of the same criterion, oldest first. */
  earlier: { finding: Finding; stage: ResolvedStage | undefined }[];
};

export function cellsFor(state: PrototypeState, candidacy: Candidacy): Cell[] {
  const findings = findingsFor(state, candidacy.id);
  const reviews = reviewsFor(state, candidacy.id);
  const stageOfReview = (reviewId: string) => {
    const review = reviews.find((item) => item.id === reviewId);
    return review ? stageById(state, review.stage_id) : undefined;
  };

  return criteriaFor(state, candidacy.brief_version_id).map((criterion) => {
    const all = findings.filter((finding) => finding.criterion_id === criterion.id);
    const finding = all[all.length - 1];
    return {
      criterion,
      state: finding ? finding.status : "no_entry",
      finding,
      evidence: finding ? evidenceFor(state, finding.id) : undefined,
      stage: finding ? stageOfReview(finding.review_id) : undefined,
      earlier: all.slice(0, -1).map((item) => ({
        finding: item,
        stage: stageOfReview(item.review_id),
      })),
    };
  });
}

/* Criteria whose most recent reading is not_found. A later stage is offered these for
 * a second look, whether or not it carries them — a candidate who gave a thin example
 * on a bad day should not be eliminated by one reading, and a second reading is a new
 * finding beside the first rather than a correction of it. */
export function carriedForward(state: PrototypeState, candidacy: Candidacy, stageId: string) {
  const stage = stageById(state, stageId);
  return cellsFor(state, candidacy).filter(
    (cell) =>
      cell.state === "not_found" &&
      cell.stage !== undefined &&
      cell.stage.id !== stageId &&
      !(stage?.criterion_ids ?? []).includes(cell.criterion.id),
  );
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

// ── Communication ───────────────────────────────────────────────────────────────

export function messagesFor(state: PrototypeState, candidacyId: CandidacyId) {
  return state.candidateMessages
    .filter((message) => message.candidacy_id === candidacyId)
    .sort((left, right) => Date.parse(left.sent_at) - Date.parse(right.sent_at));
}

export function lastMessageTo(state: PrototypeState, candidacyId: CandidacyId) {
  const sent = messagesFor(state, candidacyId);
  return sent[sent.length - 1];
}

/** Whether the candidate has been told they are at the stage they are at. */
export function messageSentAtStage(
  state: PrototypeState,
  candidacyId: CandidacyId,
  stageId: string,
) {
  return messagesFor(state, candidacyId).some((message) => message.stage_id === stageId);
}

// ── After the placement ─────────────────────────────────────────────────────────

export function placementFor(state: PrototypeState, candidacyId: CandidacyId) {
  return state.placements.find((placement) => placement.candidacy_id === candidacyId);
}

export function checkpointsFor(state: PrototypeState, placementId: string) {
  return state.placementCheckpoints
    .filter((checkpoint) => checkpoint.placement_id === placementId)
    .sort((left, right) => left.day - right.day);
}

/** Feedback recorded at a placement for this client, newest first. The loop. */
export function briefFeedbackForClient(state: PrototypeState, clientId: string) {
  return state.placements
    .flatMap((placement) => {
      const candidacy = candidacyById(state, placement.candidacy_id);
      const role = candidacy ? roleById(state, candidacy.role_id) : undefined;
      if (!role || role.client_id !== clientId) return [];
      const person = candidacy ? personById(state, candidacy.person_id) : undefined;
      return checkpointsFor(state, placement.id)
        .filter((checkpoint) => checkpoint.brief_feedback !== null)
        .map((checkpoint) => ({
          checkpoint,
          placement,
          role,
          person_name: person?.full_name ?? "",
        }));
    })
    .sort(
      (left, right) => Date.parse(right.checkpoint.due_on) - Date.parse(left.checkpoint.due_on),
    );
}

// ── The funnel ──────────────────────────────────────────────────────────────────

/* How far a candidacy got, from the append-only log rather than a column that can
 * disagree with it. A rejected candidate who reached the competency call counts as
 * having reached it — which is the only reading that makes a funnel mean anything. */
export function furthestPosition(state: PrototypeState, candidacy: Candidacy): number {
  const stages = stagesFor(state, candidacy.brief_version_id);
  const positionOf = (stageId: string | null) =>
    stageId ? (stages.find((stage) => stage.id === stageId)?.position ?? 0) : 0;

  const fromEvents = eventsFor(state, candidacy.id).map((event) => positionOf(event.stage_id));
  return Math.max(positionOf(candidacy.stage_id), ...fromEvents, 0);
}

export type FunnelStep = {
  stage: BriefStage;
  /** How many candidacies reached this stage or beyond. A count, never a rate. */
  reached: number;
};

export function funnelForRole(state: PrototypeState, role: Role): FunnelStep[] {
  const version = workingBriefVersion(state, role);
  if (!version) return [];
  const held = candidaciesForRole(state, role.id);
  return stagesFor(state, version.id).map((stage) => ({
    stage,
    reached: held.filter((candidacy) => furthestPosition(state, candidacy) >= stage.position)
      .length,
  }));
}

export type ChannelRow = {
  channel: { id: string; name: string; note: string };
  added: number;
  reachedScreening: number;
  reachedSubmitted: number;
};

/* By channel, as counts. What this answers is "which of the five things I do produces
 * people who survive contact with the criteria" — a question about the agency's own
 * effort, not about anybody's worth. */
export function channelsForRole(state: PrototypeState, role: Role): ChannelRow[] {
  const version = workingBriefVersion(state, role);
  if (!version) return [];
  const stages = stagesFor(state, version.id);
  const screening = stages.find((stage) => stage.criterion_ids.length > 0 && stage.position > 1);
  const submitted = stages.find((stage) => stage.label === "Submitted");
  const held = candidaciesForRole(state, role.id);

  return state.channels
    .map((channel) => {
      const mine = held.filter((candidacy) => candidacy.channel_id === channel.id);
      return {
        channel,
        added: mine.length,
        reachedScreening: screening
          ? mine.filter((c) => furthestPosition(state, c) >= screening.position).length
          : 0,
        reachedSubmitted: submitted
          ? mine.filter((c) => furthestPosition(state, c) >= submitted.position).length
          : 0,
      };
    })
    .filter((row) => row.added > 0);
}

// ── Provenance ──────────────────────────────────────────────────────────────────

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
