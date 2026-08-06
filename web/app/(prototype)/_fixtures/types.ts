/* Fixture types for the clickable prototype.
 *
 * These mirror docs/data-model.md — same entity names, same field names — so that a
 * screen drawn against them is drawn against the shape the database will really have.
 * They are not the schema. Everything in this folder is deleted when the real workspace
 * lands; see docs/decisions/0010.
 *
 * ────────────────────────────────────────────────────────────────────────────────
 * INVARIANT 2. There is no score, rank, rating, confidence, percentile, weight or
 * priority in this file, and there is no sort by candidate quality anywhere in the
 * prototype. api/tests/test_invariants.py scans the Postgres catalogue for those
 * column names; it does not reach TypeScript, so here it is a thing you have to mean.
 * Finding.status is a two-value enum and that is the whole of the evaluation vocabulary.
 * ────────────────────────────────────────────────────────────────────────────────
 *
 * INVARIANT 10 has no surface here. There is no key field, no settings entity, and
 * nothing in this prototype talks to a model provider — so there is no UsageEvent
 * either. A usage record in a fixture would be a claim that tokens were spent.
 */

export type OrganizationId = string;
export type UserId = string;
export type ClientId = string;
export type ContactId = string;
export type RoleId = string;
export type BriefId = string;
export type BriefVersionId = string;
export type CriterionId = string;
export type SourcingScopeId = string;
export type SearchId = string;
export type PersonId = string;
export type SightingId = string;
export type CandidacyId = string;
export type StageId = string;
export type DocumentId = string;
export type ReviewId = string;
export type FindingId = string;
export type EvidenceId = string;
export type CrosscheckSignalId = string;
export type DecisionId = string;
export type ExclusionId = string;
export type DecisionEventId = string;
export type SubmissionRecordId = string;
export type ChannelId = string;
export type CandidateMessageId = string;
export type PlacementId = string;
export type CheckpointId = string;

/** ISO 8601. Every date in the fixtures is a literal string measured against NOW in
 *  ./clock.ts, never against the real clock — see the note there. */
export type Timestamp = string;

// ── The spine ───────────────────────────────────────────────────────────────────

export type Organization = {
  id: OrganizationId;
  name: string;
  /** The agency's own wordmark. It goes on the Submission Record; ours does not. */
  wordmark: string;
  place: string;
};

export type User = {
  id: UserId;
  organization_id: OrganizationId;
  name: string;
  title: string;
};

export type Client = {
  id: ClientId;
  organization_id: OrganizationId;
  name: string;
  description: string;
};

export type Contact = {
  id: ContactId;
  organization_id: OrganizationId;
  client_id: ClientId;
  name: string;
  title: string;
  email: string;
};

/** draft → open → closed. Transition to open raises below three criteria — invariant 1. */
export type RoleState = "draft" | "open" | "closed";

export type Role = {
  id: RoleId;
  organization_id: OrganizationId;
  client_id: ClientId;
  title: string;
  state: RoleState;
  brief_id: BriefId;
  /** Set when the role opens, null while it is draft. Search and Review both pin it. */
  pinned_brief_version_id: BriefVersionId | null;
  opened_at: Timestamp | null;
  closed_at: Timestamp | null;
  closed_reason: string | null;
};

export type Brief = {
  id: BriefId;
  organization_id: OrganizationId;
  role_id: RoleId;
};

export type BriefVersion = {
  id: BriefVersionId;
  brief_id: BriefId;
  version: number;
  created_at: Timestamp;
  created_by: UserId;
  note: string;
  /** The assessment rubric. Ordered, and the order is fixed for the life of the version. */
  criterion_ids: CriterionId[];
};

/* ── The Brief also says WHERE each criterion is evidenced ───────────────────────
 * A structured process defines its stages before anyone is sourced, and each stage
 * is responsible for a named subset of the rubric. Without that, "no advancement
 * without a scorecard" can only mean "every criterion, at every transition", which
 * makes the first transition impossible — you contact someone in order to learn the
 * things. See ADR 0011.
 *
 * These live inside the BriefVersion and are versioned with it. Moving a criterion
 * from the screening call to the competency call changes what the assessment is, so
 * it earns a new version and everything repins. That is the opposite of SourcingScope,
 * which is separate precisely because widening where you look changes nothing about
 * what anyone is assessed against.
 * ─────────────────────────────────────────────────────────────────────────────── */
export type StageOwner = "recruiter" | "client";

export type BriefStage = {
  id: StageId;
  brief_version_id: BriefVersionId;
  /** 1-based along the pipeline. */
  position: number;
  label: string;
  /** What this stage is for, in one line. Not every stage evidences a criterion. */
  purpose: string;
  owner: StageOwner;
  /* The criteria this stage is responsible for evidencing. May be empty — an early
   * stage that tests interest and availability gates nothing in the rubric, and
   * pretending otherwise is how a process acquires ceremony.
   *
   * A criterion may appear at two stages. That is the deliberate case the structured
   * process calls for: thin at the screening call, revisited properly at the
   * competency call, both readings on the record with their dates. */
  criterion_ids: CriterionId[];
  /* What the candidate is told on arriving here. Non-nullable: a stage with nothing
   * to say to the candidate is a stage where somebody goes quiet. */
  candidate_message: string;
};

export type Criterion = {
  id: CriterionId;
  brief_version_id: BriefVersionId;
  /** 1-based. Drives the cell row, and the row order never changes between candidates. */
  position: number;
  text: string;
  /** Short form for the cell's accessible name. Never rendered as a badge or a score. */
  cell_label: string;
};

/* ── OPEN QUESTION ───────────────────────────────────────────────────────────────
 * docs/data-model.md: "Does one Brief hold both the sourcing scope and the assessment
 * rubric?" It is not answered here, and it is not answered by accident either.
 *
 * SourcingScope is modelled as its own record pointing AT a BriefVersion. That is the
 * least committal shape that still lets the search screen render, which it cannot do
 * without a scope to show. If the answer turns out to be "one Brief, two sections,
 * versioned together", this type collapses into BriefVersion and nothing else moves.
 * If the answer is "two objects with different lifetimes", it stays as it is.
 *
 * The fixtures are arranged to make the question bite rather than hide: the open role
 * has one BriefVersion and TWO sourcing scopes, because the pool came back thin and the
 * scope was widened in June. The rubric did not change. A single versioned object would
 * have had to produce a version 3 that altered nothing anyone is assessed against —
 * and every Review pinned to version 2 would then read as out of date.
 * ─────────────────────────────────────────────────────────────────────────────── */
export type SourcingScope = {
  id: SourcingScopeId;
  brief_version_id: BriefVersionId;
  revision: number;
  created_at: Timestamp;
  created_by: UserId;
  note: string;
  markets: string[];
  employers: string[];
  geography: string;
  exclusions: string[];
};

// ── Sourcing ────────────────────────────────────────────────────────────────────

export type Search = {
  id: SearchId;
  organization_id: OrganizationId;
  role_id: RoleId;
  /** Pinned. A brief that changed mid-search is the normal case, not the exception. */
  brief_version_id: BriefVersionId;
  sourcing_scope_id: SourcingScopeId;
  ran_by: UserId;
  ran_at: Timestamp;
  coverage_note: string;
};

export type Person = {
  id: PersonId;
  organization_id: OrganizationId;
  full_name: string;
  headline: string;
  current_employer: string;
  location: string;
  /* OPEN QUESTION — docs/data-model.md: "Sourced people have no email." Eight of the
   * twelve people here have neither an email nor a telephone number, because nobody
   * has spoken to them yet. Nothing in the interface may assume an identity anchor
   * these records do not carry. */
  email: string | null;
  phone: string | null;
};

export type Sighting = {
  id: SightingId;
  organization_id: OrganizationId;
  /* Null until the sighting is turned into a person. The sighting comes first: a
   * Person cannot be inserted without at least one resolving Sighting — invariant 9. */
  person_id: PersonId | null;
  search_id: SearchId | null;
  source_url: string;
  source_name: string;
  /** What the source was, in words: a leadership page, a conference listing, an article. */
  source_kind: string;
  retrieved_at: Timestamp;
  /* What the source said at retrieved_at. Without it the citation rots into a dead link,
   * which is the same failure as an invented profile URL, just slower. */
  snapshot_excerpt: string;
  /** A resolving sighting identifies the person. A corroborating one does not. */
  resolving: boolean;
};

// ── Consideration and evaluation ────────────────────────────────────────────────

export type Stage = {
  id: StageId;
  /** 1-based along the pipeline. Terminal stages sit outside the sequence. */
  position: number | null;
  label: string;
  terminal: boolean;
};

/* Where candidacies come from, named rather than enumerated, because a four-person
 * agency's channels are its own and "search | inbound | import" cannot tell you that
 * the trade-press reads convert and the network introductions do not. */
export type ChannelKind = "outbound" | "inbound" | "referral" | "network";

export type Channel = {
  id: ChannelId;
  organization_id: OrganizationId;
  name: string;
  kind: ChannelKind;
  note: string;
};

export type Candidacy = {
  id: CandidacyId;
  organization_id: OrganizationId;
  person_id: PersonId;
  role_id: RoleId;
  /** Pinned at creation. The candidacy is assessed against this, not against latest. */
  brief_version_id: BriefVersionId;
  stage_id: StageId;
  channel_id: ChannelId;
  created_at: Timestamp;
  /* NOT NULL, defaulted on insert, and there is no control anywhere in this prototype
   * to extend or disable it — invariant 6. A deadline you can quietly turn off is not
   * a promise to a candidate. */
  auto_close_at: Timestamp;
  closed_at: Timestamp | null;
};

export type PageSpan = { page: number; char_start: number; char_end: number };
export type ParagraphSpan = {
  index: number;
  page: number;
  char_start: number;
  char_end: number;
};

export type Document = {
  id: DocumentId;
  organization_id: OrganizationId;
  person_id: PersonId;
  kind: "cv";
  filename: string;
  sha256: string;
  uploaded_at: Timestamp;
  /** Parsed text. Evidence offsets index into this string and nothing else. */
  parsed_text: string;
  pages: PageSpan[];
  paragraphs: ParagraphSpan[];
  /* Document properties as the parser read them. Not in parsed_text, which is why a
   * Crosscheck signal drawn from them cannot be an Evidence citation — see
   * CrosscheckArtifact below. */
  properties: { author: string | null; producer: string | null; created: Timestamp | null };
};

/* One evaluation, at one stage. A candidacy accumulates several — the sourcing read,
 * the screening call, the competency call — and each is responsible only for the
 * criteria its stage carries. The scorecard-per-interview is the structured process's
 * unit, and it is also the only shape in which invariant 3 is enforceable. */
export type Review = {
  id: ReviewId;
  organization_id: OrganizationId;
  candidacy_id: CandidacyId;
  /** Pinned, like Search. Every record must render as it was when it was made. */
  brief_version_id: BriefVersionId;
  /** The stage this scorecard belongs to. */
  stage_id: StageId;
  created_at: Timestamp;
  created_by: UserId;
};

/** Two values. There is no third, no partial, no maybe, and no confidence beside it. */
export type FindingStatus = "evidenced" | "not_found";

export type Finding = {
  id: FindingId;
  review_id: ReviewId;
  criterion_id: CriterionId;
  status: FindingStatus;
  recorded_by: UserId;
  recorded_at: Timestamp;
};

/** Evidence points at a Document or a Sighting, never at nothing — invariant 9. */
export type EvidenceTarget =
  | {
      kind: "document";
      document_id: DocumentId;
      char_start: number;
      char_end: number;
      page: number;
      paragraph: number;
    }
  | {
      kind: "sighting";
      sighting_id: SightingId;
      char_start: number;
      char_end: number;
    };

export type Evidence = {
  id: EvidenceId;
  organization_id: OrganizationId;
  finding_id: FindingId;
  /** The exact substring of the target text at [char_start, char_end). Computed, not typed. */
  quote: string;
  target: EvidenceTarget;
  created_at: Timestamp;
};

export type Exclusion = {
  id: ExclusionId;
  organization_id: OrganizationId;
  candidacy_id: CandidacyId;
  reason_text: string;
  excluded_by: UserId;
  excluded_at: Timestamp;
};

// ── Integrity ───────────────────────────────────────────────────────────────────

export type CrosscheckSignalType =
  | "timeline_overlap"
  | "contact_collision"
  | "document_author"
  | "duplicate_candidacy";

/* ── OPEN QUESTION, surfaced by this prototype ───────────────────────────────────
 * docs/data-model.md: "If a signal cannot render as an evidence citation, it does not
 * ship." Two of the four signal types cannot, and both are the deterministic, cheap,
 * defensible kind the same document says to prefer over model calls:
 *
 *   · document_author reads the PDF properties, which are not in parsed_text and so
 *     have no character offset to cite.
 *   · contact_collision and duplicate_candidacy point at the organisation's own
 *     records, which are not a Document and not a Sighting.
 *
 * So this union is deliberately wider than EvidenceTarget, and the two are not the
 * same type. Either the evidence union widens to admit an internal record, or the
 * rule means these signals do not ship. Not decided here.
 * ─────────────────────────────────────────────────────────────────────────────── */
export type CrosscheckArtifact =
  | { kind: "document_text"; document_id: DocumentId; char_start: number; char_end: number }
  | { kind: "document_property"; document_id: DocumentId; property: string; value: string }
  | { kind: "sighting"; sighting_id: SightingId; char_start: number; char_end: number }
  | { kind: "record"; label: string; detail: string; candidacy_id: CandidacyId | null };

/** A recorded resolution: the recruiter looked and this is what they found. */
export type Resolution = {
  kind: "resolution";
  resolved_by: UserId;
  resolved_at: Timestamp;
  note: string;
};

/** A dismissal. Carries a user and a written reason; an empty reason is refused. */
export type Override = {
  kind: "override";
  user_id: UserId;
  reason_text: string;
  created_at: Timestamp;
};

export type CrosscheckSignal = {
  id: CrosscheckSignalId;
  organization_id: OrganizationId;
  candidacy_id: CandidacyId;
  type: CrosscheckSignalType;
  /* An observation, in the words of the record. Never a probability, never a severity,
   * never an authorship estimate, and never the word fraud. */
  detail: string;
  artifact: CrosscheckArtifact;
  observed_at: Timestamp;
  resolution: Resolution | Override | null;
};

// ── Decisions, output, audit ────────────────────────────────────────────────────

/** Fixed enum. A rejection needs one of these AND written text — invariant 4. */
export type ReasonCode =
  | "below_criteria"
  | "salary_expectation"
  | "location"
  | "withdrew"
  | "counter_offer"
  | "client_declined";

export type Decision = {
  id: DecisionId;
  organization_id: OrganizationId;
  candidacy_id: CandidacyId;
  type: "reject";
  reason_code: ReasonCode;
  reason_text: string;
  decided_by: UserId;
  decided_at: Timestamp;
};

export type DecisionEventType =
  | "candidacy_created"
  | "stage_changed"
  | "review_recorded"
  | "finding_recorded"
  | "signal_resolved"
  | "signal_overridden"
  | "rejected"
  | "excluded"
  | "submission_created"
  | "message_sent"
  | "checkpoint_recorded";

/** Append-only. Nothing in the reducer removes or rewrites one. */
export type DecisionEvent = {
  id: DecisionEventId;
  organization_id: OrganizationId;
  candidacy_id: CandidacyId;
  type: DecisionEventType;
  actor: UserId;
  at: Timestamp;
  summary: string;
  /* The stage the candidacy was in after this event. Set on creation and on every
   * transition, so "how far did this one get" is answerable from the log rather than
   * from a denormalised column that can disagree with it. */
  stage_id: StageId | null;
};

/** The snapshot taken at send time: the pinned Brief version and every quoted passage,
 *  frozen. The record renders from this, never from the live entities. */
export type SubmissionSnapshotLine = {
  position: number;
  criterion_text: string;
  status: FindingStatus;
  quote: string | null;
  provenance: string | null;
};

export type SubmissionRecord = {
  id: SubmissionRecordId;
  organization_id: OrganizationId;
  candidacy_id: CandidacyId;
  brief_version_id: BriefVersionId;
  created_at: Timestamp;
  /** A named human, not an account id and not "the system". */
  signed_off_by: UserId;
  signed_off_at: Timestamp;
  reference: string;
  snapshot: {
    person_name: string;
    person_headline: string;
    client_name: string;
    role_title: string;
    brief_version: number;
    lines: SubmissionSnapshotLine[];
    /** Candidate-facing token for the view at /prototype/candidate/[token]. */
    candidate_token: string;
  };
};

// ── Communication ───────────────────────────────────────────────────────────────

/* What the candidate has been told, and when. Append-only, and the candidate reads
 * the same rows the recruiter does — there is no internal version of a message.
 *
 * Invariant 6 says ghosting is impossible. A deadline alone does not deliver that; a
 * person who hears nothing for six weeks and then receives an automated closure has
 * still been ghosted, politely. The stage messages are what make the deadline a
 * promise rather than a backstop. */
export type CandidateMessageKind = "stage" | "rejection" | "auto_closure" | "submission";

export type CandidateMessage = {
  id: CandidateMessageId;
  organization_id: OrganizationId;
  candidacy_id: CandidacyId;
  kind: CandidateMessageKind;
  /** The stage the message was sent on arriving at, where there is one. */
  stage_id: StageId | null;
  sent_at: Timestamp;
  sent_by: UserId;
  body: string;
};

// ── After the placement ─────────────────────────────────────────────────────────

/* The step everyone forgets. For a permanent-placement agency the fee is not earned
 * on the start date, it is earned on the person still being there at the end of
 * probation — so the checkpoints are the agency's own interest, not a courtesy.
 *
 * There is no quality-of-hire figure here and there will not be one. It is a score
 * attached to a named individual, applied retrospectively, and it is the same object
 * invariant 2 refuses at the front of the process wearing a different hat. A
 * checkpoint records what happened, in words, on a date. */
export type Placement = {
  id: PlacementId;
  organization_id: OrganizationId;
  candidacy_id: CandidacyId;
  /** Pinned: the version of The Brief this person was hired against. */
  brief_version_id: BriefVersionId;
  started_on: Timestamp;
  probation_ends_on: Timestamp;
};

export type PlacementCheckpoint = {
  id: CheckpointId;
  placement_id: PlacementId;
  /** 7, 30, 60, 90. The plan the transcript asks for, in place before the offer. */
  day: number;
  due_on: Timestamp;
  recorded_at: Timestamp | null;
  recorded_by: UserId | null;
  /** What happened. Not a rating. */
  note: string | null;
  /* What the next Brief for this client should say differently. This is the loop:
   * an outcome at day 30 becomes a criterion at the next kick-off, so the process
   * learns instead of repeating. Surfaced on the Brief screen of every later role
   * for the same client. */
  brief_feedback: string | null;
};
