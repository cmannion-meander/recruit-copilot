/* The reducer. In memory, pure, and deterministic.
 *
 * Every refusal in refusals.ts is checked here as well as on the screen that raises it.
 * The screen's job is to say why; the reducer's job is to make sure that a path that
 * skips the screen still cannot write. In the real build the second of those is a
 * database trigger, which is the only version that is actually true — see
 * docs/invariants.md on why a conviction enforced by intention is not enforced.
 *
 * Nothing here removes or rewrites a DecisionEvent, an Evidence row or a
 * SubmissionRecord. Invariant 8 revokes UPDATE and DELETE on all three at the
 * permission level; here it is simply that no action exists.
 */

import { initialState } from "../_fixtures";
import { NOW } from "../_fixtures/clock";
import { placeOf } from "../_fixtures/offsets";
import { provenanceOfEvidence } from "../_fixtures/provenance";
import type { Evidence, SubmissionSnapshotLine } from "../_fixtures/types";
import {
  refuseAdvance,
  refuseCandidacy,
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
  nextStage,
  personById,
  reviewFor,
  roleById,
  sightingById,
  stageById,
} from "./selectors";
import type { Action, State } from "./types";

export const initialPrototypeState: State = { ...initialState, seq: 0 };

const RECRUITER = "usr_ruth_halloway";

export function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "reset":
      return initialPrototypeState;

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
            stage_id: "stg_sourced",
            origin: "search",
            created_at: NOW,
            // Set on insert. Ninety days, and nothing in this prototype can move it.
            auto_close_at: addDays(NOW, 90),
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
          },
        ],
      };
    }

    case "create_person_by_hand": {
      if (refusePerson(action.source_url, action.snapshot_excerpt)) return state;
      if (refuseCandidacy(state, action.role_id)) return state;
      const role = roleById(state, action.role_id);
      if (!role?.pinned_brief_version_id) return state;

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
            stage_id: "stg_sourced",
            origin: "import",
            created_at: NOW,
            auto_close_at: addDays(NOW, 90),
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
          },
        ],
      };
    }

    case "advance_stage": {
      if (refuseAdvance(state, action.candidacy_id)) return state;
      const candidacy = candidacyById(state, action.candidacy_id);
      if (!candidacy) return state;
      const from = stageById(state, candidacy.stage_id);
      const to = nextStage(state, candidacy.stage_id);
      if (!from || !to) return state;

      const seq = state.seq + 1;
      return {
        ...state,
        seq,
        candidacies: state.candidacies.map((item) =>
          item.id === candidacy.id
            ? { ...item, stage_id: to.id, closed_at: to.terminal ? NOW : item.closed_at }
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
      let review = reviewFor(state, candidacy.id);
      let reviews = state.reviews;

      if (!review) {
        review = {
          id: `rev_new_${seq}`,
          organization_id: state.organization.id,
          candidacy_id: candidacy.id,
          brief_version_id: candidacy.brief_version_id,
          created_at: NOW,
          created_by: RECRUITER,
        };
        reviews = [...state.reviews, review];
      }

      const existing = state.findings.find(
        (finding) =>
          finding.review_id === review.id && finding.criterion_id === action.criterion_id,
      );
      // Findings are recorded once. Re-recording is not an edit path in this prototype.
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
            }.`,
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
        decisionEvents: [
          ...state.decisionEvents,
          {
            id: `evt_new_${seq}`,
            organization_id: state.organization.id,
            candidacy_id: candidacy.id,
            type: "rejected",
            actor: RECRUITER,
            at: NOW,
            summary: `Rejected · ${REASON_LABEL[action.reason_code]}.`,
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
        candidacies: state.candidacies.map((item) =>
          item.id === candidacy.id ? { ...item, stage_id: "stg_submitted" } : item,
        ),
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

function addDays(from: string, days: number): string {
  return new Date(Date.parse(from) + days * 86_400_000).toISOString();
}

/** Where a character offset sits in a document, derived from the document itself. */
function placeIn(state: State, documentId: string, charStart: number) {
  const document = state.documents.find((item) => item.id === documentId);
  if (!document) return { page: 1, paragraph: 1 };
  return placeOf({ pages: document.pages, paragraphs: document.paragraphs }, charStart);
}
