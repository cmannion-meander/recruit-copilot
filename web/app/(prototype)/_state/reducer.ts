/* The reducer. In memory, pure, and deterministic.
 *
 * Every refusal in refusals.ts is checked here as well as on the screen that raises it.
 * The screen's job is to say why; the reducer's job is to make sure that a path that
 * skips the screen still cannot write. In the real build the second of those is a
 * database trigger, which is the only version that is actually true — see
 * docs/invariants.md on why a conviction enforced by intention is not enforced.
 *
 * Nothing here removes or rewrites a DecisionEvent, an Evidence row, a CandidateMessage
 * or a SubmissionRecord. Invariant 8 revokes UPDATE and DELETE on those at the
 * permission level; here it is simply that no action exists.
 */
import { initialState } from "../_fixtures";
import { formatDateShort, NOW } from "../_fixtures/clock";
import { placeOf } from "../_fixtures/offsets";
import { provenanceOfEvidence } from "../_fixtures/provenance";
import { PENDING_DRAFT_CRITERION } from "../_fixtures/roles";
import type { Evidence, Review, SubmissionSnapshotLine } from "../_fixtures/types";
import {
  refuseAdvance,
  refuseCandidacy,
  refuseCheckpoint,
  refuseExtension,
  refuseOpenRole,
  refuseOverride,
  refusePerson,
  refuseRejection,
  refuseSubmission,
} from "./refusals";
import {
  candidacyById,
  cellsFor,
  clientById,
  criteriaFor,
  latestBriefVersion,
  nextStage,
  personById,
  reviewAtStage,
  roleById,
  sightingById,
  stageById,
  stageOf,
  stagesFor,
} from "./selectors";
import type { Action, State } from "./types";

export const initialPrototypeState: State = { ...initialState, seq: 0 };

const RECRUITER = "usr_ruth_halloway";

/* Fixed increments, not date pickers. Ninety days on creation and on every stage
 * transition; thirty on a manual extension, which re-flags at seven days out — so
 * a stalled candidacy costs a fresh message every month rather than disappearing.
 * ADR 0012. */
const AUTO_CLOSE_DAYS = 90;
const EXTENSION_DAYS = 30;

export function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "reset":
      return initialPrototypeState;

    case "__hydrate":
      return { ...action.payload, seq: state.seq };

    // ── The Brief ─────────────────────────────────────────────────────────────

    case "add_criterion": {
      const role = roleById(state, action.role_id);
      if (!role) return state;
      const version = latestBriefVersion(state, role);
      if (!version) return state;
      if (state.criteria.some((criterion) => criterion.id === PENDING_DRAFT_CRITERION.id)) {
        return state;
      }
      return {
        ...state,
        seq: state.seq + 1,
        criteria: [...state.criteria, PENDING_DRAFT_CRITERION],
        briefVersions: state.briefVersions.map((item) =>
          item.id === version.id
            ? { ...item, criterion_ids: [...item.criterion_ids, PENDING_DRAFT_CRITERION.id] }
            : item,
        ),
      };
    }

    case "assign_criterion": {
      const stage = state.briefStages.find((item) => item.id === action.stage_id);
      if (!stage || stage.criterion_ids.includes(action.criterion_id)) return state;
      return {
        ...state,
        seq: state.seq + 1,
        briefStages: state.briefStages.map((item) =>
          item.id === stage.id
            ? { ...item, criterion_ids: [...item.criterion_ids, action.criterion_id] }
            : item,
        ),
      };
    }

    case "open_role": {
      if (refuseOpenRole(state, action.role_id)) return state;
      const role = roleById(state, action.role_id);
      if (!role || role.state !== "draft") return state;
      const version = latestBriefVersion(state, role);
      if (!version) return state;
      return {
        ...state,
        seq: state.seq + 1,
        roles: state.roles.map((item) =>
          item.id === role.id
            ? {
                ...item,
                state: "open",
                // Opening pins the version. Every Search and every Review pins it too.
                pinned_brief_version_id: version.id,
                opened_at: NOW,
              }
            : item,
        ),
      };
    }

    // ── Sourcing ──────────────────────────────────────────────────────────────

    case "create_person_from_sighting": {
      const sighting = sightingById(state, action.sighting_id);
      if (!sighting || sighting.person_id !== null || !sighting.resolving) return state;

      const seq = state.seq + 1;
      const personId = `per_new_${seq}`;
      const name = sighting.snapshot_excerpt.split(",")[0]?.trim() ?? "Unnamed";

      return {
        ...state,
        seq,
        people: [
          ...state.people,
          {
            id: personId,
            organization_id: state.organization.id,
            full_name: name,
            headline: sighting.source_kind,
            current_employer: sighting.source_name,
            location: "Not recorded",
            // Sourced. Nobody has spoken to them, so there is nothing to contact them by.
            email: null,
            phone: null,
          },
        ],
        sightings: state.sightings.map((item) =>
          item.id === sighting.id ? { ...item, person_id: personId } : item,
        ),
      };
    }

    case "create_candidacy": {
      if (refuseCandidacy(state, action.role_id)) return state;
      const role = roleById(state, action.role_id);
      const person = personById(state, action.person_id);
      if (!role || !person || !role.pinned_brief_version_id) return state;
      if (
        state.candidacies.some((item) => item.person_id === person.id && item.role_id === role.id)
      ) {
        return state;
      }
      const first = stagesFor(state, role.pinned_brief_version_id)[0];
      if (!first) return state;

      const seq = state.seq + 1;
      const candidacyId = `cnd_new_${seq}`;

      return {
        ...state,
        seq,
        candidacies: [
          ...state.candidacies,
          {
            id: candidacyId,
            organization_id: state.organization.id,
            person_id: person.id,
            role_id: role.id,
            brief_version_id: role.pinned_brief_version_id,
            stage_id: first.id,
            channel_id: action.channel_id,
            created_at: NOW,
            // Set on insert. It moves only with a message to the candidate — ADR 0012.
            auto_close_at: addDays(NOW, AUTO_CLOSE_DAYS),
            closed_at: null,
          },
        ],
        decisionEvents: [
          ...state.decisionEvents,
          {
            id: `evt_new_${seq}`,
            organization_id: state.organization.id,
            candidacy_id: candidacyId,
            type: "candidacy_created",
            actor: RECRUITER,
            at: NOW,
            summary: `Candidacy created for ${person.full_name}.`,
            stage_id: first.id,
          },
        ],
      };
    }

    case "create_person_by_hand": {
      if (refusePerson(action.source_url, action.snapshot_excerpt)) return state;
      if (refuseCandidacy(state, action.role_id)) return state;
      const role = roleById(state, action.role_id);
      if (!role?.pinned_brief_version_id) return state;
      const first = stagesFor(state, role.pinned_brief_version_id)[0];
      if (!first) return state;

      const seq = state.seq + 1;
      const personId = `per_new_${seq}`;
      const candidacyId = `cnd_new_${seq}`;

      return {
        ...state,
        seq,
        people: [
          ...state.people,
          {
            id: personId,
            organization_id: state.organization.id,
            full_name: action.full_name,
            headline: action.headline,
            current_employer: action.current_employer,
            location: action.location,
            email: null,
            phone: null,
          },
        ],
        sightings: [
          ...state.sightings,
          {
            id: `sig_new_${seq}`,
            organization_id: state.organization.id,
            person_id: personId,
            search_id: null,
            source_url: action.source_url,
            source_name: action.source_name,
            source_kind: "Entered by hand",
            retrieved_at: NOW,
            snapshot_excerpt: action.snapshot_excerpt,
            resolving: true,
          },
        ],
        candidacies: [
          ...state.candidacies,
          {
            id: candidacyId,
            organization_id: state.organization.id,
            person_id: personId,
            role_id: role.id,
            brief_version_id: role.pinned_brief_version_id,
            stage_id: first.id,
            channel_id: "chn_company_sites",
            created_at: NOW,
            auto_close_at: addDays(NOW, AUTO_CLOSE_DAYS),
            closed_at: null,
          },
        ],
        decisionEvents: [
          ...state.decisionEvents,
          {
            id: `evt_new_${seq}`,
            organization_id: state.organization.id,
            candidacy_id: candidacyId,
            type: "candidacy_created",
            actor: RECRUITER,
            at: NOW,
            summary: `Candidacy created by hand for ${action.full_name}, from ${action.source_name}.`,
            stage_id: first.id,
          },
        ],
      };
    }

    // ── The pipeline ──────────────────────────────────────────────────────────

    case "advance_stage": {
      if (refuseAdvance(state, action.candidacy_id)) return state;
      const candidacy = candidacyById(state, action.candidacy_id);
      if (!candidacy) return state;
      const from = stageOf(state, candidacy);
      const to = nextStage(state, candidacy);
      if (!from || !to) return state;

      const seq = state.seq + 1;
      return {
        ...state,
        seq,
        candidacies: state.candidacies.map((item) =>
          item.id === candidacy.id
            ? {
                ...item,
                stage_id: to.id,
                /* refuseAdvance has already required the stage message, so the
                 * candidate was just told something — the one act that may move
                 * the deadline. ADR 0012. */
                auto_close_at: addDays(NOW, AUTO_CLOSE_DAYS),
              }
            : item,
        ),
        decisionEvents: [
          ...state.decisionEvents,
          {
            id: `evt_new_${seq}`,
            organization_id: state.organization.id,
            candidacy_id: candidacy.id,
            type: "stage_changed",
            actor: RECRUITER,
            at: NOW,
            summary: `${from.label} → ${to.label}.`,
            stage_id: to.id,
          },
        ],
      };
    }

    case "extend_auto_close": {
      if (refuseExtension(state, action.candidacy_id, action.message_text)) return state;
      const candidacy = candidacyById(state, action.candidacy_id);
      if (!candidacy) return state;

      const seq = state.seq + 1;
      const extended = addDays(NOW, EXTENSION_DAYS);
      return {
        ...state,
        seq,
        candidacies: state.candidacies.map((item) =>
          item.id === candidacy.id ? { ...item, auto_close_at: extended } : item,
        ),
        /* One text, one audience. The message is the reason; there is no internal
         * version, which is the arrangement in which writing it honestly is easy. */
        candidateMessages: [
          ...state.candidateMessages,
          {
            id: `msg_new_${seq}`,
            organization_id: state.organization.id,
            candidacy_id: candidacy.id,
            kind: "extension",
            stage_id: candidacy.stage_id,
            sent_at: NOW,
            sent_by: RECRUITER,
            body: action.message_text.trim(),
          },
        ],
        decisionEvents: [
          ...state.decisionEvents,
          {
            id: `evt_new_${seq}`,
            organization_id: state.organization.id,
            candidacy_id: candidacy.id,
            type: "deadline_extended",
            actor: RECRUITER,
            at: NOW,
            summary: `Auto-closure moved from ${formatDateShort(candidacy.auto_close_at)} to ${formatDateShort(extended)}. The message was sent to the candidate.`,
            stage_id: candidacy.stage_id,
          },
        ],
      };
    }

    case "record_finding": {
      const candidacy = candidacyById(state, action.candidacy_id);
      if (!candidacy) return state;
      // An evidenced finding carries a passage. There is no evidenced-without-evidence.
      if (action.status === "evidenced" && (!action.passage || !action.quote)) return state;

      const seq = state.seq + 1;
      let review: Review | undefined = reviewAtStage(state, candidacy.id, action.stage_id);
      let reviews = state.reviews;

      if (!review) {
        review = {
          id: `rev_new_${seq}`,
          organization_id: state.organization.id,
          candidacy_id: candidacy.id,
          brief_version_id: candidacy.brief_version_id,
          stage_id: action.stage_id,
          created_at: NOW,
          created_by: RECRUITER,
        };
        reviews = [...state.reviews, review];
      }

      /* Recorded once per scorecard. A second reading at a later stage is a new finding
       * beside the first, not a correction of it — which is how a candidate who gave a
       * thin example on a bad day gets a second hearing without the record losing the
       * first one. */
      const existing = state.findings.find(
        (finding) =>
          finding.review_id === review.id && finding.criterion_id === action.criterion_id,
      );
      if (existing) return state;

      const findingId = `fnd_new_${seq}`;
      const evidence: Evidence[] =
        action.passage && action.quote
          ? [
              ...state.evidence,
              {
                id: `evd_new_${seq}`,
                organization_id: state.organization.id,
                finding_id: findingId,
                quote: action.quote,
                target:
                  action.passage.kind === "document"
                    ? {
                        kind: "document",
                        document_id: action.passage.document_id,
                        char_start: action.passage.char_start,
                        char_end: action.passage.char_end,
                        // Computed from the document, not asserted. A page number nobody
                        // derived is a number that will be wrong the first time it matters.
                        ...placeIn(state, action.passage.document_id, action.passage.char_start),
                      }
                    : {
                        kind: "sighting",
                        sighting_id: action.passage.sighting_id,
                        char_start: action.passage.char_start,
                        char_end: action.passage.char_end,
                      },
                created_at: NOW,
              },
            ]
          : state.evidence;

      const criterion = criteriaFor(state, candidacy.brief_version_id).find(
        (item) => item.id === action.criterion_id,
      );
      const stage = stageById(state, action.stage_id);

      return {
        ...state,
        seq,
        reviews,
        findings: [
          ...state.findings,
          {
            id: findingId,
            review_id: review.id,
            criterion_id: action.criterion_id,
            status: action.status,
            recorded_by: RECRUITER,
            recorded_at: NOW,
          },
        ],
        evidence,
        decisionEvents: [
          ...state.decisionEvents,
          {
            id: `evt_new_${seq}`,
            organization_id: state.organization.id,
            candidacy_id: candidacy.id,
            type: "finding_recorded",
            actor: RECRUITER,
            at: NOW,
            summary: `${criterion ? `Criterion ${criterion.position}` : "Criterion"} recorded as ${
              action.status === "evidenced" ? "evidenced" : "not found"
            } at ${stage?.label ?? "this stage"}.`,
            stage_id: candidacy.stage_id,
          },
        ],
      };
    }

    case "resolve_signal": {
      const signal = state.crosscheckSignals.find((item) => item.id === action.signal_id);
      if (!signal || signal.resolution !== null) return state;
      if (action.note.trim().length === 0) return state;

      const seq = state.seq + 1;
      return {
        ...state,
        seq,
        crosscheckSignals: state.crosscheckSignals.map((item) =>
          item.id === signal.id
            ? {
                ...item,
                resolution: {
                  kind: "resolution",
                  resolved_by: RECRUITER,
                  resolved_at: NOW,
                  note: action.note.trim(),
                },
              }
            : item,
        ),
        decisionEvents: [
          ...state.decisionEvents,
          {
            id: `evt_new_${seq}`,
            organization_id: state.organization.id,
            candidacy_id: signal.candidacy_id,
            type: "signal_resolved",
            actor: RECRUITER,
            at: NOW,
            summary: "Crosscheck signal resolved with a recorded note.",
            stage_id: null,
          },
        ],
      };
    }

    case "override_signal": {
      if (refuseOverride(action.reason_text)) return state;
      const signal = state.crosscheckSignals.find((item) => item.id === action.signal_id);
      if (!signal || signal.resolution !== null) return state;

      const seq = state.seq + 1;
      return {
        ...state,
        seq,
        crosscheckSignals: state.crosscheckSignals.map((item) =>
          item.id === signal.id
            ? {
                ...item,
                resolution: {
                  kind: "override",
                  user_id: RECRUITER,
                  reason_text: action.reason_text.trim(),
                  created_at: NOW,
                },
              }
            : item,
        ),
        decisionEvents: [
          ...state.decisionEvents,
          {
            id: `evt_new_${seq}`,
            organization_id: state.organization.id,
            candidacy_id: signal.candidacy_id,
            type: "signal_overridden",
            actor: RECRUITER,
            at: NOW,
            summary: "Crosscheck signal overridden with a written reason.",
            stage_id: null,
          },
        ],
      };
    }

    case "reject_candidacy": {
      if (refuseRejection(action.reason_code, action.reason_text)) return state;
      const candidacy = candidacyById(state, action.candidacy_id);
      if (!candidacy) return state;

      const seq = state.seq + 1;
      return {
        ...state,
        seq,
        candidacies: state.candidacies.map((item) =>
          item.id === candidacy.id ? { ...item, stage_id: "stg_rejected", closed_at: NOW } : item,
        ),
        decisions: [
          ...state.decisions,
          {
            id: `dec_new_${seq}`,
            organization_id: state.organization.id,
            candidacy_id: candidacy.id,
            type: "reject",
            reason_code: action.reason_code,
            reason_text: action.reason_text.trim(),
            decided_by: RECRUITER,
            decided_at: NOW,
          },
        ],
        /* The written reason is what the candidate reads. There is no second, softer
         * version for them and no internal version for us — one text, one audience,
         * which is the only arrangement in which writing it honestly is the easy path. */
        candidateMessages: [
          ...state.candidateMessages,
          {
            id: `msg_new_${seq}`,
            organization_id: state.organization.id,
            candidacy_id: candidacy.id,
            kind: "rejection",
            stage_id: null,
            sent_at: NOW,
            sent_by: RECRUITER,
            body: action.reason_text.trim(),
          },
        ],
        decisionEvents: [
          ...state.decisionEvents,
          {
            id: `evt_new_${seq}`,
            organization_id: state.organization.id,
            candidacy_id: candidacy.id,
            type: "rejected",
            actor: RECRUITER,
            at: NOW,
            summary: `Rejected · ${REASON_LABEL[action.reason_code]}. The written reason was sent to the candidate.`,
            stage_id: "stg_rejected",
          },
        ],
      };
    }

    case "create_submission": {
      if (refuseSubmission(state, action.candidacy_id)) return state;
      const candidacy = candidacyById(state, action.candidacy_id);
      if (!candidacy) return state;
      if (state.submissionRecords.some((record) => record.candidacy_id === candidacy.id)) {
        return state;
      }
      const person = personById(state, candidacy.person_id);
      const role = roleById(state, candidacy.role_id);
      const client = role ? clientById(state, role.client_id) : undefined;
      const version = state.briefVersions.find((item) => item.id === candidacy.brief_version_id);
      if (!person || !role || !client || !version) return state;

      const seq = state.seq + 1;
      const lines: SubmissionSnapshotLine[] = cellsFor(state, candidacy).map((cell) => ({
        position: cell.criterion.position,
        criterion_text: cell.criterion.text,
        status: cell.state === "evidenced" ? "evidenced" : "not_found",
        quote: cell.evidence ? cell.evidence.quote : null,
        provenance: cell.evidence ? provenanceOfEvidence(cell.evidence) : null,
      }));

      return {
        ...state,
        seq,
        submissionRecords: [
          ...state.submissionRecords,
          {
            id: `sub_new_${seq}`,
            organization_id: state.organization.id,
            candidacy_id: candidacy.id,
            brief_version_id: candidacy.brief_version_id,
            created_at: NOW,
            signed_off_by: RECRUITER,
            signed_off_at: NOW,
            reference: `HF-2026-0${114 + seq}`,
            snapshot: {
              person_name: person.full_name,
              person_headline: person.headline,
              client_name: client.name,
              role_title: role.title,
              brief_version: version.version,
              lines,
              candidate_token: `token${seq}${candidacy.id.slice(-6)}`,
            },
          },
        ],
        decisionEvents: [
          ...state.decisionEvents,
          {
            id: `evt_new_${seq}`,
            organization_id: state.organization.id,
            candidacy_id: candidacy.id,
            type: "submission_created",
            actor: RECRUITER,
            at: NOW,
            summary: `Submission Record HF-2026-0${114 + seq} created and signed off by Ruth Halloway.`,
            stage_id: candidacy.stage_id,
          },
        ],
      };
    }

    // ── Communication ─────────────────────────────────────────────────────────

    case "send_stage_message": {
      const candidacy = candidacyById(state, action.candidacy_id);
      const stage = stageById(state, action.stage_id);
      if (!candidacy || !stage?.candidate_message) return state;
      if (
        state.candidateMessages.some(
          (message) =>
            message.candidacy_id === candidacy.id && message.stage_id === action.stage_id,
        )
      ) {
        return state;
      }

      const seq = state.seq + 1;
      return {
        ...state,
        seq,
        candidateMessages: [
          ...state.candidateMessages,
          {
            id: `msg_new_${seq}`,
            organization_id: state.organization.id,
            candidacy_id: candidacy.id,
            kind: "stage",
            stage_id: action.stage_id,
            sent_at: NOW,
            sent_by: RECRUITER,
            body: stage.candidate_message,
          },
        ],
        decisionEvents: [
          ...state.decisionEvents,
          {
            id: `evt_new_${seq}`,
            organization_id: state.organization.id,
            candidacy_id: candidacy.id,
            type: "message_sent",
            actor: RECRUITER,
            at: NOW,
            summary: `${stage.label} message sent to the candidate.`,
            stage_id: candidacy.stage_id,
          },
        ],
      };
    }

    // ── After the placement ───────────────────────────────────────────────────

    case "record_checkpoint": {
      if (refuseCheckpoint(action.note)) return state;
      const checkpoint = state.placementCheckpoints.find(
        (item) => item.id === action.checkpoint_id,
      );
      if (!checkpoint || checkpoint.recorded_at !== null) return state;
      const placement = state.placements.find((item) => item.id === checkpoint.placement_id);
      if (!placement) return state;

      const seq = state.seq + 1;
      const feedback = action.brief_feedback.trim();

      return {
        ...state,
        seq,
        placementCheckpoints: state.placementCheckpoints.map((item) =>
          item.id === checkpoint.id
            ? {
                ...item,
                recorded_at: NOW,
                recorded_by: RECRUITER,
                note: action.note.trim(),
                brief_feedback: feedback.length > 0 ? feedback : null,
              }
            : item,
        ),
        decisionEvents: [
          ...state.decisionEvents,
          {
            id: `evt_new_${seq}`,
            organization_id: state.organization.id,
            candidacy_id: placement.candidacy_id,
            type: "checkpoint_recorded",
            actor: RECRUITER,
            at: NOW,
            summary:
              feedback.length > 0
                ? `Day ${checkpoint.day} checkpoint recorded, with feedback for the next Brief at this client.`
                : `Day ${checkpoint.day} checkpoint recorded.`,
            stage_id: null,
          },
        ],
      };
    }

    default:
      return state;
  }
}

export const REASON_LABEL: Record<string, string> = {
  below_criteria: "Below criteria",
  salary_expectation: "Salary expectation",
  location: "Location",
  withdrew: "Withdrew",
  counter_offer: "Counter offer accepted",
  client_declined: "Client declined",
};

/** Where a character offset sits in a document, derived from the document itself. */
function placeIn(state: State, documentId: string, charStart: number) {
  const document = state.documents.find((item) => item.id === documentId);
  if (!document) return { page: 1, paragraph: 1 };
  return placeOf({ pages: document.pages, paragraphs: document.paragraphs }, charStart);
}

function addDays(from: string, days: number): string {
  return new Date(Date.parse(from) + days * 86_400_000).toISOString();
}
