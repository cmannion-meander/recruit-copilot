/* Decisions, exclusions, and the append-only event log.
 *
 * A rejection carries a reason code from a fixed enum AND written text. Neither alone
 * is a rejection — invariant 4, a CHECK constraint in the real schema. The written text
 * below is what a recruiter would actually have said, because a reason nobody would say
 * out loud is a reason nobody will write.
 *
 * DecisionEvent is append-only. Nothing in the reducer removes or rewrites one.
 */
import { ORG_ID, recruiter } from "./organisation";
import type { Decision, DecisionEvent, Exclusion } from "./types";

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

export const decisionEvents: DecisionEvent[] = [
  // Aileen Marchetti
  {
    id: "evt_marchetti_1",
    organization_id: ORG_ID,
    candidacy_id: "cnd_marchetti",
    type: "candidacy_created",
    actor: recruiter.id,
    at: "2026-04-20T09:30:00.000Z",
    summary: "Candidacy created from a sighting on denholmcastings.example.",
  },
  {
    id: "evt_marchetti_2",
    organization_id: ORG_ID,
    candidacy_id: "cnd_marchetti",
    type: "stage_changed",
    actor: recruiter.id,
    at: "2026-04-28T14:05:00.000Z",
    summary: "Sourced → Contacted.",
  },
  {
    id: "evt_marchetti_3",
    organization_id: ORG_ID,
    candidacy_id: "cnd_marchetti",
    type: "stage_changed",
    actor: recruiter.id,
    at: "2026-05-06T10:30:00.000Z",
    summary: "Contacted → Screening. CV received.",
  },
  {
    id: "evt_marchetti_4",
    organization_id: ORG_ID,
    candidacy_id: "cnd_marchetti",
    type: "review_recorded",
    actor: recruiter.id,
    at: "2026-05-06T11:04:00.000Z",
    summary: "Review opened against Brief version 2.",
  },

  // Priya Nandakumar
  {
    id: "evt_nandakumar_1",
    organization_id: ORG_ID,
    candidacy_id: "cnd_nandakumar",
    type: "candidacy_created",
    actor: recruiter.id,
    at: "2026-03-14T13:02:00.000Z",
    summary: "Candidacy created from the search of 14 March.",
  },

  // Daniel Oyelaran
  {
    id: "evt_oyelaran_1",
    organization_id: ORG_ID,
    candidacy_id: "cnd_oyelaran",
    type: "candidacy_created",
    actor: recruiter.id,
    at: "2026-03-14T13:06:00.000Z",
    summary: "Candidacy created from the search of 14 March.",
  },
  {
    id: "evt_oyelaran_2",
    organization_id: ORG_ID,
    candidacy_id: "cnd_oyelaran",
    type: "signal_resolved",
    actor: recruiter.id,
    at: "2026-03-16T09:40:00.000Z",
    summary: "Duplicate candidacy signal resolved with a recorded note.",
  },
  {
    id: "evt_oyelaran_3",
    organization_id: ORG_ID,
    candidacy_id: "cnd_oyelaran",
    type: "stage_changed",
    actor: recruiter.id,
    at: "2026-03-18T11:20:00.000Z",
    summary: "Sourced → Contacted.",
  },

  // Frances Ibbotson
  {
    id: "evt_ibbotson_1",
    organization_id: ORG_ID,
    candidacy_id: "cnd_ibbotson",
    type: "candidacy_created",
    actor: recruiter.id,
    at: "2026-04-02T19:41:00.000Z",
    summary: "Candidacy created from an inbound application.",
  },
  {
    id: "evt_ibbotson_2",
    organization_id: ORG_ID,
    candidacy_id: "cnd_ibbotson",
    type: "stage_changed",
    actor: recruiter.id,
    at: "2026-04-03T09:02:00.000Z",
    summary: "Sourced → Screening.",
  },
  {
    id: "evt_ibbotson_3",
    organization_id: ORG_ID,
    candidacy_id: "cnd_ibbotson",
    type: "review_recorded",
    actor: recruiter.id,
    at: "2026-04-03T09:15:00.000Z",
    summary: "Review recorded against Brief version 2. Four of five criteria evidenced.",
  },

  // Callum Reith
  {
    id: "evt_reith_1",
    organization_id: ORG_ID,
    candidacy_id: "cnd_reith",
    type: "candidacy_created",
    actor: recruiter.id,
    at: "2026-04-11T08:03:00.000Z",
    summary: "Candidacy created from an inbound application.",
  },
  {
    id: "evt_reith_2",
    organization_id: ORG_ID,
    candidacy_id: "cnd_reith",
    type: "review_recorded",
    actor: recruiter.id,
    at: "2026-04-13T14:40:00.000Z",
    summary: "Review recorded against Brief version 2. Two of five criteria evidenced.",
  },
  {
    id: "evt_reith_3",
    organization_id: ORG_ID,
    candidacy_id: "cnd_reith",
    type: "rejected",
    actor: recruiter.id,
    at: "2026-05-19T15:24:00.000Z",
    summary: "Rejected · Below criteria.",
  },

  // Meera Shanbhag
  {
    id: "evt_shanbhag_1",
    organization_id: ORG_ID,
    candidacy_id: "cnd_shanbhag",
    type: "candidacy_created",
    actor: recruiter.id,
    at: "2026-03-14T13:11:00.000Z",
    summary: "Candidacy created from the search of 14 March.",
  },
  {
    id: "evt_shanbhag_2",
    organization_id: ORG_ID,
    candidacy_id: "cnd_shanbhag",
    type: "review_recorded",
    actor: recruiter.id,
    at: "2026-03-19T11:12:00.000Z",
    summary: "Review recorded from the trade press snapshot. No CV held.",
  },
  {
    id: "evt_shanbhag_3",
    organization_id: ORG_ID,
    candidacy_id: "cnd_shanbhag",
    type: "excluded",
    actor: recruiter.id,
    at: "2026-04-08T10:02:00.000Z",
    summary: "Excluded with a written reason. Will not resurface on this client.",
  },

  // Owen Trelawny
  {
    id: "evt_trelawny_1",
    organization_id: ORG_ID,
    candidacy_id: "cnd_trelawny",
    type: "candidacy_created",
    actor: recruiter.id,
    at: "2026-03-14T13:14:00.000Z",
    summary: "Candidacy created from the search of 14 March.",
  },
  {
    id: "evt_trelawny_2",
    organization_id: ORG_ID,
    candidacy_id: "cnd_trelawny",
    type: "stage_changed",
    actor: recruiter.id,
    at: "2026-04-24T16:12:00.000Z",
    summary: "Contacted → Screening. CV received.",
  },
  {
    id: "evt_trelawny_3",
    organization_id: ORG_ID,
    candidacy_id: "cnd_trelawny",
    type: "review_recorded",
    actor: recruiter.id,
    at: "2026-04-25T09:52:00.000Z",
    summary: "Review recorded against Brief version 2. Five of five criteria evidenced.",
  },
  {
    id: "evt_trelawny_4",
    organization_id: ORG_ID,
    candidacy_id: "cnd_trelawny",
    type: "signal_overridden",
    actor: recruiter.id,
    at: "2026-07-22T14:18:00.000Z",
    summary: "Contact collision signal overridden with a written reason.",
  },
  {
    id: "evt_trelawny_5",
    organization_id: ORG_ID,
    candidacy_id: "cnd_trelawny",
    type: "submission_created",
    actor: recruiter.id,
    at: "2026-07-22T16:05:00.000Z",
    summary: "Submission Record HF-2026-0114 created and signed off by Ruth Halloway.",
  },
  {
    id: "evt_trelawny_6",
    organization_id: ORG_ID,
    candidacy_id: "cnd_trelawny",
    type: "stage_changed",
    actor: recruiter.id,
    at: "2026-07-22T16:06:00.000Z",
    summary: "Screening → Submitted.",
  },

  // Bethan Lloyd-Price
  {
    id: "evt_lloyd_price_1",
    organization_id: ORG_ID,
    candidacy_id: "cnd_lloyd_price",
    type: "candidacy_created",
    actor: recruiter.id,
    at: "2026-03-14T13:18:00.000Z",
    summary: "Candidacy created from the search of 14 March.",
  },

  // Ivan Petrescu
  {
    id: "evt_petrescu_1",
    organization_id: ORG_ID,
    candidacy_id: "cnd_petrescu",
    type: "candidacy_created",
    actor: recruiter.id,
    at: "2026-03-14T13:21:00.000Z",
    summary: "Candidacy created from the search of 14 March.",
  },
  {
    id: "evt_petrescu_2",
    organization_id: ORG_ID,
    candidacy_id: "cnd_petrescu",
    type: "review_recorded",
    actor: recruiter.id,
    at: "2026-03-20T16:30:00.000Z",
    summary: "Review recorded from sighting snapshots. No CV held.",
  },
  {
    id: "evt_petrescu_3",
    organization_id: ORG_ID,
    candidacy_id: "cnd_petrescu",
    type: "stage_changed",
    actor: recruiter.id,
    at: "2026-03-24T10:10:00.000Z",
    summary: "Sourced → Contacted.",
  },

  // Sadia Rahman
  {
    id: "evt_rahman_1",
    organization_id: ORG_ID,
    candidacy_id: "cnd_rahman",
    type: "candidacy_created",
    actor: recruiter.id,
    at: "2026-03-14T13:25:00.000Z",
    summary: "Candidacy created from the search of 14 March.",
  },

  // The closed role
  {
    id: "evt_oyelaran_fbp_1",
    organization_id: ORG_ID,
    candidacy_id: "cnd_oyelaran_fbp",
    type: "candidacy_created",
    actor: recruiter.id,
    at: "2025-11-04T14:50:00.000Z",
    summary: "Candidacy created from a sighting on vantagefabrications.example.",
  },
  {
    id: "evt_oyelaran_fbp_2",
    organization_id: ORG_ID,
    candidacy_id: "cnd_oyelaran_fbp",
    type: "stage_changed",
    actor: recruiter.id,
    at: "2026-02-02T09:00:00.000Z",
    summary: "Closed at the auto-closure deadline, no response. The candidate was notified.",
  },
  {
    id: "evt_amankwah_fbp_1",
    organization_id: ORG_ID,
    candidacy_id: "cnd_amankwah_fbp",
    type: "candidacy_created",
    actor: recruiter.id,
    at: "2025-09-15T15:04:00.000Z",
    summary: "Candidacy created from a sighting on thornburymills.example.",
  },
  {
    id: "evt_amankwah_fbp_2",
    organization_id: ORG_ID,
    candidacy_id: "cnd_amankwah_fbp",
    type: "stage_changed",
    actor: recruiter.id,
    at: "2026-02-11T16:40:00.000Z",
    summary: "Client interview → Placed. Start date 2 March 2026.",
  },
];
