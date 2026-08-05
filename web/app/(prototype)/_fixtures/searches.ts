/* Two sourcing runs on the open role, both pinned to BriefVersion 2 and each pinned to
 * a different SourcingScope. That pair is the whole of the open question about whether
 * one Brief holds both — see types.ts. The rubric did not move between March and June;
 * the scope did, twice widening the market list, because the March run returned nine
 * people and three of them were already known to the client.
 *
 * There is no Search on the draft role, and there cannot be one: invariant 1 puts a
 * database trigger on Search insert where the parent role is not open.
 */
import { ORG_ID, recruiter } from "./organisation";
import { SEARCH_JUNE_ID, SEARCH_MARCH_ID } from "./people";
import { OPEN_BRIEF_VERSION_ID, OPEN_ROLE_ID } from "./roles";
import type { Search } from "./types";

export const searches: Search[] = [
  {
    id: SEARCH_MARCH_ID,
    organization_id: ORG_ID,
    role_id: OPEN_ROLE_ID,
    brief_version_id: OPEN_BRIEF_VERSION_ID,
    sourcing_scope_id: "scp_fc_r1",
    ran_by: recruiter.id,
    ran_at: "2026-03-14T11:15:00.000Z",
    coverage_note:
      "Company sites, trade press and one archived team page across the machining and castings list. Nine sightings across eight people, each read on the page it names them on.",
  },
  {
    id: SEARCH_JUNE_ID,
    organization_id: ORG_ID,
    role_id: OPEN_ROLE_ID,
    brief_version_id: OPEN_BRIEF_VERSION_ID,
    sourcing_scope_id: "scp_fc_r2",
    ran_by: recruiter.id,
    ran_at: "2026-06-02T10:05:00.000Z",
    coverage_note:
      "Widened scope: plastics, composites and process manufacturing across Yorkshire, the East Midlands and Greater Manchester. Four sightings.",
  },
];
