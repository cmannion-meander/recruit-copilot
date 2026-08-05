/* Twelve candidacies, arranged so that every refusal is reachable from a cold start:
 *
 *   cnd_marchetti  · incomplete scorecard — three of five criteria have a finding
 *   cnd_nandakumar · incomplete scorecard — no review at all, five with no entry
 *   cnd_ibbotson   · unresolved Crosscheck signal, complete scorecard
 *   cnd_petrescu   · unresolved Crosscheck signals, evidence drawn from sightings
 *   cnd_reith      · rejected, with a reason code and written text
 *   cnd_shanbhag   · excluded, with a written reason
 *   cnd_trelawny   · submitted, with a created and immutable Submission Record
 *   cnd_lloyd_price· three days from auto_close_at
 *   cnd_oyelaran   · a resolved duplicate signal, pointing at cnd_oyelaran_fbp
 *
 * auto_close_at is set on every one of them and there is no control anywhere in this
 * prototype to move it — invariant 6.
 */
import { ORG_ID } from "./organisation";
import {
  CLOSED_BRIEF_VERSION_ID,
  CLOSED_ROLE_ID,
  OPEN_BRIEF_VERSION_ID,
  OPEN_ROLE_ID,
} from "./roles";
import type { Candidacy, Stage } from "./types";

export const stages: Stage[] = [
  { id: "stg_sourced", position: 1, label: "Sourced", terminal: false },
  { id: "stg_contacted", position: 2, label: "Contacted", terminal: false },
  { id: "stg_screening", position: 3, label: "Screening", terminal: false },
  { id: "stg_submitted", position: 4, label: "Submitted", terminal: false },
  { id: "stg_client_interview", position: 5, label: "Client interview", terminal: false },
  { id: "stg_placed", position: 6, label: "Placed", terminal: true },
  { id: "stg_rejected", position: null, label: "Rejected", terminal: true },
  { id: "stg_excluded", position: null, label: "Excluded", terminal: true },
  { id: "stg_closed_no_response", position: null, label: "Closed, no response", terminal: true },
];

export const candidacies: Candidacy[] = [
  {
    id: "cnd_marchetti",
    organization_id: ORG_ID,
    person_id: "per_marchetti",
    role_id: OPEN_ROLE_ID,
    brief_version_id: OPEN_BRIEF_VERSION_ID,
    stage_id: "stg_screening",
    origin: "search",
    created_at: "2026-04-20T09:30:00.000Z",
    auto_close_at: "2026-09-18T09:00:00.000Z",
    closed_at: null,
  },
  {
    id: "cnd_nandakumar",
    organization_id: ORG_ID,
    person_id: "per_nandakumar",
    role_id: OPEN_ROLE_ID,
    brief_version_id: OPEN_BRIEF_VERSION_ID,
    stage_id: "stg_sourced",
    origin: "search",
    created_at: "2026-03-14T13:02:00.000Z",
    auto_close_at: "2026-08-27T09:00:00.000Z",
    closed_at: null,
  },
  {
    id: "cnd_oyelaran",
    organization_id: ORG_ID,
    person_id: "per_oyelaran",
    role_id: OPEN_ROLE_ID,
    brief_version_id: OPEN_BRIEF_VERSION_ID,
    stage_id: "stg_contacted",
    origin: "search",
    created_at: "2026-03-14T13:06:00.000Z",
    auto_close_at: "2026-09-04T09:00:00.000Z",
    closed_at: null,
  },
  {
    id: "cnd_ibbotson",
    organization_id: ORG_ID,
    person_id: "per_ibbotson",
    role_id: OPEN_ROLE_ID,
    brief_version_id: OPEN_BRIEF_VERSION_ID,
    stage_id: "stg_screening",
    origin: "inbound",
    created_at: "2026-04-02T19:41:00.000Z",
    auto_close_at: "2026-09-25T09:00:00.000Z",
    closed_at: null,
  },
  {
    id: "cnd_reith",
    organization_id: ORG_ID,
    person_id: "per_reith",
    role_id: OPEN_ROLE_ID,
    brief_version_id: OPEN_BRIEF_VERSION_ID,
    stage_id: "stg_rejected",
    origin: "inbound",
    created_at: "2026-04-11T08:03:00.000Z",
    auto_close_at: "2026-07-10T09:00:00.000Z",
    closed_at: "2026-05-19T15:24:00.000Z",
  },
  {
    id: "cnd_shanbhag",
    organization_id: ORG_ID,
    person_id: "per_shanbhag",
    role_id: OPEN_ROLE_ID,
    brief_version_id: OPEN_BRIEF_VERSION_ID,
    stage_id: "stg_excluded",
    origin: "search",
    created_at: "2026-03-14T13:11:00.000Z",
    auto_close_at: "2026-06-12T09:00:00.000Z",
    closed_at: "2026-04-08T10:02:00.000Z",
  },
  {
    id: "cnd_trelawny",
    organization_id: ORG_ID,
    person_id: "per_trelawny",
    role_id: OPEN_ROLE_ID,
    brief_version_id: OPEN_BRIEF_VERSION_ID,
    stage_id: "stg_submitted",
    origin: "search",
    created_at: "2026-03-14T13:14:00.000Z",
    auto_close_at: "2026-10-15T09:00:00.000Z",
    closed_at: null,
  },
  {
    id: "cnd_lloyd_price",
    organization_id: ORG_ID,
    person_id: "per_lloyd_price",
    role_id: OPEN_ROLE_ID,
    brief_version_id: OPEN_BRIEF_VERSION_ID,
    stage_id: "stg_sourced",
    origin: "search",
    created_at: "2026-03-14T13:18:00.000Z",
    // Three days. Nothing in the interface can move this.
    auto_close_at: "2026-08-08T09:00:00.000Z",
    closed_at: null,
  },
  {
    id: "cnd_petrescu",
    organization_id: ORG_ID,
    person_id: "per_petrescu",
    role_id: OPEN_ROLE_ID,
    brief_version_id: OPEN_BRIEF_VERSION_ID,
    stage_id: "stg_contacted",
    origin: "search",
    created_at: "2026-03-14T13:21:00.000Z",
    auto_close_at: "2026-09-11T09:00:00.000Z",
    closed_at: null,
  },
  {
    id: "cnd_rahman",
    organization_id: ORG_ID,
    person_id: "per_rahman",
    role_id: OPEN_ROLE_ID,
    brief_version_id: OPEN_BRIEF_VERSION_ID,
    stage_id: "stg_sourced",
    origin: "search",
    created_at: "2026-03-14T13:25:00.000Z",
    auto_close_at: "2026-09-30T09:00:00.000Z",
    closed_at: null,
  },

  // The closed role. Daniel Oyelaran holds a candidacy on both, which is what the
  // duplicate signal on cnd_oyelaran is pointing at.
  {
    id: "cnd_oyelaran_fbp",
    organization_id: ORG_ID,
    person_id: "per_oyelaran",
    role_id: CLOSED_ROLE_ID,
    brief_version_id: CLOSED_BRIEF_VERSION_ID,
    stage_id: "stg_closed_no_response",
    origin: "search",
    created_at: "2025-11-04T14:50:00.000Z",
    auto_close_at: "2026-02-02T09:00:00.000Z",
    closed_at: "2026-02-02T09:00:00.000Z",
  },
  {
    id: "cnd_amankwah_fbp",
    organization_id: ORG_ID,
    person_id: "per_amankwah",
    role_id: CLOSED_ROLE_ID,
    brief_version_id: CLOSED_BRIEF_VERSION_ID,
    stage_id: "stg_placed",
    origin: "search",
    created_at: "2025-09-15T15:04:00.000Z",
    auto_close_at: "2026-01-14T09:00:00.000Z",
    closed_at: "2026-02-11T16:40:00.000Z",
  },
];
