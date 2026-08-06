/* After the offer is signed — the step everyone forgets.
 *
 * For a permanent-placement agency this is not a courtesy. The fee is not earned on
 * the start date, it is earned on the person still being there at the end of probation,
 * so the checkpoints are the agency's own exposure written down. The plan exists before
 * the offer, which is the only time it can be agreed with anybody.
 *
 * There is no quality-of-hire figure and there will not be one. It is a score attached
 * to a named individual, applied after the fact, and it is the same object invariant 2
 * refuses at the front of the process wearing a different hat. A checkpoint records what
 * happened, in words, on a date — the same register as a Finding.
 *
 * `brief_feedback` is the loop. An outcome at day 30 becomes wording on the next Brief
 * for the same client, so the process learns rather than repeating. It surfaces on the
 * Brief screen of every later role for that client, which is where it can still change
 * something.
 */
import { ORG_ID, recruiter } from "./organisation";
import { CLOSED_BRIEF_VERSION_ID } from "./roles";
import type { Placement, PlacementCheckpoint } from "./types";

export const placements: Placement[] = [
  {
    id: "plc_amankwah",
    organization_id: ORG_ID,
    candidacy_id: "cnd_amankwah_fbp",
    brief_version_id: CLOSED_BRIEF_VERSION_ID,
    started_on: "2026-03-02T09:00:00.000Z",
    probation_ends_on: "2026-09-02T09:00:00.000Z",
  },
];

export const placementCheckpoints: PlacementCheckpoint[] = [
  {
    id: "chk_amankwah_7",
    placement_id: "plc_amankwah",
    day: 7,
    due_on: "2026-03-09T09:00:00.000Z",
    recorded_at: "2026-03-09T16:20:00.000Z",
    recorded_by: recruiter.id,
    note: "Started on time. Laptop and ledger access were both a week late, which he raised himself rather than waiting. Joseph says he has picked up the packing lines quickly.",
    brief_feedback: null,
  },
  {
    id: "chk_amankwah_30",
    placement_id: "plc_amankwah",
    day: 30,
    due_on: "2026-04-01T09:00:00.000Z",
    recorded_at: "2026-04-02T10:45:00.000Z",
    recorded_by: recruiter.id,
    note: "Doing the job. One gap: the forecast at Calder Vale is rebuilt from scratch each month and he had only ever contributed to one someone else owned. He is learning it, and it cost him three weeks.",
    /* This is the whole point of the loop. The criterion was evidenced — the sighting
     * said "builds the weekly rolling forecast" and that is exactly what he did. The
     * Brief's wording was what let the gap through. */
    brief_feedback:
      "Criterion 2 read “Built a rolling forecast from site-level data” and he evidenced it honestly. What this client actually needs is someone who owns the model, not someone who feeds it. On the next Brief for Calder Vale write “owns and rebuilds a rolling forecast model” and ask for the model itself at the competency call.",
  },
  {
    id: "chk_amankwah_60",
    placement_id: "plc_amankwah",
    day: 60,
    due_on: "2026-05-01T09:00:00.000Z",
    recorded_at: "2026-05-06T09:15:00.000Z",
    recorded_by: recruiter.id,
    note: "Forecast now his. Joseph asked whether we had anyone similar for a Management Accountant vacancy, which is where the draft role came from.",
    brief_feedback: null,
  },
  {
    id: "chk_amankwah_90",
    placement_id: "plc_amankwah",
    day: 90,
    due_on: "2026-05-31T09:00:00.000Z",
    recorded_at: null,
    recorded_by: null,
    note: null,
    brief_feedback: null,
  },
];
