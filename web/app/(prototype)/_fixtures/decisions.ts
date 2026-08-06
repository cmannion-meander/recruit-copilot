/* Decisions, exclusions, and the append-only event log.
 *
 * A rejection carries a reason code from a fixed enum AND written text. Neither alone
 * is a rejection — invariant 4, a CHECK constraint in the real schema. The written text
 * is what a recruiter would actually have said, because a reason nobody would say out
 * loud is a reason nobody will write.
 *
 * Every event carries the stage the candidacy was in afterwards, so "how far did this
 * one get" is answerable from the log. That is what makes a per-channel funnel possible
 * without a denormalised column that can disagree with the log it was derived from.
 *
 * DecisionEvent is append-only. Nothing in the reducer removes or rewrites one.
 */
import { ORG_ID, recruiter } from "./organisation";
import type { Decision, DecisionEvent, DecisionEventType, Exclusion } from "./types";

export const decisions: Decision[] = [
  {
    id: "dec_reith",
    organization_id: ORG_ID,
    candidacy_id: "cnd_reith",
    type: "reject",
    reason_code: "below_criteria",
    reason_text:
      "Two of five criteria evidenced. No private-equity reporting, no system implementation, and the finance function is him and a part-time ledger clerk, so no line management either. The brief is explicit on all three. Told him on the call of 19 May and asked whether he wanted to be considered for the Calder Vale role.",
    decided_by: recruiter.id,
    decided_at: "2026-05-19T15:24:00.000Z",
  },
];

export const exclusions: Exclusion[] = [
  {
    id: "exc_shanbhag",
    organization_id: ORG_ID,
    candidacy_id: "cnd_shanbhag",
    reason_text:
      "Not open to a move. She holds shares in the family business and told me on 8 April that she expects to be there until the next generation takes over. Do not re-approach for this client.",
    excluded_by: recruiter.id,
    excluded_at: "2026-04-08T10:02:00.000Z",
  },
];

let sequence = 0;
function event(
  candidacy_id: string,
  type: DecisionEventType,
  at: string,
  stage_id: string | null,
  summary: string,
): DecisionEvent {
  sequence += 1;
  return {
    id: `evt_${sequence}`,
    organization_id: ORG_ID,
    candidacy_id,
    type,
    actor: recruiter.id,
    at,
    summary,
    stage_id,
  };
}

export const decisionEvents: DecisionEvent[] = [
  // Aileen Marchetti — sourced read complete, sitting at the screening call
  event(
    "cnd_marchetti",
    "candidacy_created",
    "2026-04-20T09:30:00.000Z",
    "stg_fc_sourced",
    "Candidacy created from a sighting on denholmcastings.example. Channel: Company sites.",
  ),
  event(
    "cnd_marchetti",
    "review_recorded",
    "2026-04-20T10:05:00.000Z",
    "stg_fc_sourced",
    "Sourced scorecard recorded. Both criteria this stage carries are evidenced.",
  ),
  event(
    "cnd_marchetti",
    "stage_changed",
    "2026-04-28T14:05:00.000Z",
    "stg_fc_contacted",
    "Sourced → Contacted.",
  ),
  event(
    "cnd_marchetti",
    "stage_changed",
    "2026-05-06T10:30:00.000Z",
    "stg_fc_screening",
    "Contacted → Screening call. CV received.",
  ),

  // Priya Nandakumar — approached, nothing recorded
  event(
    "cnd_nandakumar",
    "candidacy_created",
    "2026-03-14T13:02:00.000Z",
    "stg_fc_sourced",
    "Candidacy created from the search of 14 March. Channel: Company sites.",
  ),

  // Daniel Oyelaran
  event(
    "cnd_oyelaran",
    "candidacy_created",
    "2026-03-14T13:06:00.000Z",
    "stg_fc_sourced",
    "Candidacy created from the agency's own record. Channel: Agency network.",
  ),
  event(
    "cnd_oyelaran",
    "review_recorded",
    "2026-03-15T09:20:00.000Z",
    "stg_fc_sourced",
    "Sourced scorecard recorded. One of two evidenced.",
  ),
  event(
    "cnd_oyelaran",
    "signal_resolved",
    "2026-03-16T09:40:00.000Z",
    "stg_fc_sourced",
    "Duplicate candidacy signal resolved with a recorded note.",
  ),
  event(
    "cnd_oyelaran",
    "stage_changed",
    "2026-03-18T11:20:00.000Z",
    "stg_fc_contacted",
    "Sourced → Contacted.",
  ),

  // Frances Ibbotson
  event(
    "cnd_ibbotson",
    "candidacy_created",
    "2026-04-02T19:41:00.000Z",
    "stg_fc_sourced",
    "Candidacy created from an inbound application. Channel: Inbound apply.",
  ),
  event(
    "cnd_ibbotson",
    "review_recorded",
    "2026-04-03T09:15:00.000Z",
    "stg_fc_sourced",
    "Sourced scorecard recorded from the CV.",
  ),
  event(
    "cnd_ibbotson",
    "stage_changed",
    "2026-04-07T08:50:00.000Z",
    "stg_fc_screening",
    "Contacted → Screening call.",
  ),
  event(
    "cnd_ibbotson",
    "review_recorded",
    "2026-04-09T14:30:00.000Z",
    "stg_fc_screening",
    "Screening scorecard recorded. Both criteria evidenced.",
  ),
  event(
    "cnd_ibbotson",
    "stage_changed",
    "2026-04-14T16:15:00.000Z",
    "stg_fc_competency",
    "Screening call → Competency call.",
  ),
  event(
    "cnd_ibbotson",
    "review_recorded",
    "2026-04-16T11:00:00.000Z",
    "stg_fc_competency",
    "Competency scorecard recorded. Criterion 2 not found.",
  ),

  // Callum Reith
  event(
    "cnd_reith",
    "candidacy_created",
    "2026-04-11T08:03:00.000Z",
    "stg_fc_sourced",
    "Candidacy created from an inbound application. Channel: Inbound apply.",
  ),
  event(
    "cnd_reith",
    "review_recorded",
    "2026-04-13T14:40:00.000Z",
    "stg_fc_sourced",
    "Sourced scorecard recorded from the CV.",
  ),
  event(
    "cnd_reith",
    "stage_changed",
    "2026-05-06T10:00:00.000Z",
    "stg_fc_screening",
    "Contacted → Screening call.",
  ),
  event(
    "cnd_reith",
    "review_recorded",
    "2026-05-06T10:15:00.000Z",
    "stg_fc_screening",
    "Screening scorecard recorded. Neither criterion found.",
  ),
  event(
    "cnd_reith",
    "stage_changed",
    "2026-05-14T09:35:00.000Z",
    "stg_fc_competency",
    "Screening call → Competency call.",
  ),
  event(
    "cnd_reith",
    "review_recorded",
    "2026-05-14T09:40:00.000Z",
    "stg_fc_competency",
    "Competency scorecard recorded. Criterion 2 not found.",
  ),
  event(
    "cnd_reith",
    "rejected",
    "2026-05-19T15:24:00.000Z",
    "stg_rejected",
    "Rejected · Below criteria. Two of five evidenced.",
  ),

  // Meera Shanbhag
  event(
    "cnd_shanbhag",
    "candidacy_created",
    "2026-03-14T13:11:00.000Z",
    "stg_fc_sourced",
    "Candidacy created from a trade press article. Channel: Trade press.",
  ),
  event(
    "cnd_shanbhag",
    "review_recorded",
    "2026-03-19T11:12:00.000Z",
    "stg_fc_sourced",
    "Sourced scorecard recorded from the snapshot. No CV held.",
  ),
  event(
    "cnd_shanbhag",
    "stage_changed",
    "2026-04-02T15:10:00.000Z",
    "stg_fc_screening",
    "Contacted → Screening call.",
  ),
  event(
    "cnd_shanbhag",
    "review_recorded",
    "2026-04-02T15:20:00.000Z",
    "stg_fc_screening",
    "Screening scorecard recorded. One of two evidenced.",
  ),
  event(
    "cnd_shanbhag",
    "excluded",
    "2026-04-08T10:02:00.000Z",
    "stg_excluded",
    "Excluded with a written reason. Will not resurface on this client.",
  ),

  // Owen Trelawny
  event(
    "cnd_trelawny",
    "candidacy_created",
    "2026-03-14T13:14:00.000Z",
    "stg_fc_sourced",
    "Candidacy created from the search of 14 March. Channel: Company sites.",
  ),
  event(
    "cnd_trelawny",
    "review_recorded",
    "2026-03-16T10:05:00.000Z",
    "stg_fc_sourced",
    "Sourced scorecard recorded from the snapshot. Qualification not found on the page.",
  ),
  event(
    "cnd_trelawny",
    "stage_changed",
    "2026-04-22T09:50:00.000Z",
    "stg_fc_screening",
    "Contacted → Screening call. CV received.",
  ),
  event(
    "cnd_trelawny",
    "review_recorded",
    "2026-04-25T09:52:00.000Z",
    "stg_fc_screening",
    "Screening scorecard recorded. Criterion 5 reopened from the sourcing read and evidenced from the CV.",
  ),
  event(
    "cnd_trelawny",
    "stage_changed",
    "2026-05-06T09:25:00.000Z",
    "stg_fc_competency",
    "Screening call → Competency call.",
  ),
  event(
    "cnd_trelawny",
    "review_recorded",
    "2026-05-08T13:15:00.000Z",
    "stg_fc_competency",
    "Competency scorecard recorded. Criterion 2 evidenced.",
  ),
  event(
    "cnd_trelawny",
    "signal_overridden",
    "2026-07-22T14:18:00.000Z",
    "stg_fc_competency",
    "Contact collision signal overridden with a written reason.",
  ),
  event(
    "cnd_trelawny",
    "submission_created",
    "2026-07-22T16:05:00.000Z",
    "stg_fc_competency",
    "Submission Record HF-2026-0114 created and signed off by Ruth Halloway.",
  ),
  event(
    "cnd_trelawny",
    "stage_changed",
    "2026-07-22T16:06:00.000Z",
    "stg_fc_submitted",
    "Competency call → Submitted.",
  ),

  // Bethan Lloyd-Price — one message, five months ago
  event(
    "cnd_lloyd_price",
    "candidacy_created",
    "2026-03-14T13:18:00.000Z",
    "stg_fc_sourced",
    "Candidacy created from the search of 14 March. Channel: Company sites.",
  ),

  // Ivan Petrescu
  event(
    "cnd_petrescu",
    "candidacy_created",
    "2026-03-14T13:21:00.000Z",
    "stg_fc_sourced",
    "Candidacy created from the search of 14 March. Channel: Company sites.",
  ),
  event(
    "cnd_petrescu",
    "review_recorded",
    "2026-03-20T16:30:00.000Z",
    "stg_fc_sourced",
    "Sourced scorecard recorded from the snapshot. No CV held.",
  ),
  event(
    "cnd_petrescu",
    "stage_changed",
    "2026-03-24T10:10:00.000Z",
    "stg_fc_contacted",
    "Sourced → Contacted.",
  ),
  event(
    "cnd_petrescu",
    "stage_changed",
    "2026-03-27T11:40:00.000Z",
    "stg_fc_screening",
    "Contacted → Screening call.",
  ),
  event(
    "cnd_petrescu",
    "review_recorded",
    "2026-03-27T11:45:00.000Z",
    "stg_fc_screening",
    "Screening scorecard recorded. Criterion 1 not found.",
  ),

  // Sadia Rahman
  event(
    "cnd_rahman",
    "candidacy_created",
    "2026-03-14T13:25:00.000Z",
    "stg_fc_sourced",
    "Candidacy created from a trade press article. Channel: Trade press.",
  ),

  // The closed role
  event(
    "cnd_oyelaran_fbp",
    "candidacy_created",
    "2025-11-04T14:50:00.000Z",
    "stg_fbp_sourced",
    "Candidacy created from a sighting on vantagefabrications.example. Channel: Company sites.",
  ),
  event(
    "cnd_oyelaran_fbp",
    "stage_changed",
    "2026-02-02T09:00:00.000Z",
    "stg_closed_no_response",
    "Closed at the auto-closure deadline, no response. The candidate was told it had closed.",
  ),
  event(
    "cnd_amankwah_fbp",
    "candidacy_created",
    "2025-09-15T15:04:00.000Z",
    "stg_fbp_sourced",
    "Candidacy created from a referral by a placed candidate. Channel: Referral.",
  ),
  event(
    "cnd_amankwah_fbp",
    "review_recorded",
    "2025-09-16T10:00:00.000Z",
    "stg_fbp_sourced",
    "Sourced scorecard recorded from the snapshot.",
  ),
  event(
    "cnd_amankwah_fbp",
    "review_recorded",
    "2025-09-29T14:00:00.000Z",
    "stg_fbp_screening",
    "Screening scorecard recorded. All three criteria evidenced.",
  ),
  event(
    "cnd_amankwah_fbp",
    "submission_created",
    "2025-10-14T11:20:00.000Z",
    "stg_fbp_submitted",
    "Submission Record HF-2025-0088 created and signed off by Ruth Halloway.",
  ),
  event(
    "cnd_amankwah_fbp",
    "stage_changed",
    "2025-10-14T11:25:00.000Z",
    "stg_fbp_submitted",
    "Screening call → Submitted.",
  ),
  event(
    "cnd_amankwah_fbp",
    "stage_changed",
    "2025-11-20T16:00:00.000Z",
    "stg_fbp_client",
    "Submitted → Client interview.",
  ),
  event(
    "cnd_amankwah_fbp",
    "stage_changed",
    "2026-02-11T16:40:00.000Z",
    "stg_placed",
    "Client interview → Placed. Start date 2 March 2026.",
  ),
  event(
    "cnd_amankwah_fbp",
    "checkpoint_recorded",
    "2026-03-09T16:20:00.000Z",
    "stg_placed",
    "Day 7 checkpoint recorded.",
  ),
  event(
    "cnd_amankwah_fbp",
    "checkpoint_recorded",
    "2026-04-02T10:45:00.000Z",
    "stg_placed",
    "Day 30 checkpoint recorded, with feedback for the next Brief at this client.",
  ),
  event(
    "cnd_amankwah_fbp",
    "checkpoint_recorded",
    "2026-05-06T09:15:00.000Z",
    "stg_placed",
    "Day 60 checkpoint recorded.",
  ),
];
