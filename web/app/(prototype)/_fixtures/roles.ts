/* Three roles. Their shape is chosen so that every refusal in docs/invariants.md is
 * reachable from a cold start, without setup:
 *
 *   draft  · two criteria  → invariant 1 refuses both a Search and a Candidacy
 *   open   · five criteria → where nearly everything happens
 *   closed · one line in a list, so the list is not uniform
 */
import { ORG_ID, recruiter } from "./organisation";
import type { Brief, BriefStage, BriefVersion, Criterion, Role, SourcingScope } from "./types";

export const OPEN_ROLE_ID = "rol_financial_controller";
export const DRAFT_ROLE_ID = "rol_management_accountant";
export const CLOSED_ROLE_ID = "rol_finance_business_partner";

export const OPEN_BRIEF_VERSION_ID = "bvr_fc_v2";
export const DRAFT_BRIEF_VERSION_ID = "bvr_ma_v1";
export const CLOSED_BRIEF_VERSION_ID = "bvr_fbp_v1";

export const roles: Role[] = [
  {
    id: OPEN_ROLE_ID,
    organization_id: ORG_ID,
    client_id: "cli_bramhall",
    title: "Financial Controller",
    state: "open",
    brief_id: "brf_fc",
    pinned_brief_version_id: OPEN_BRIEF_VERSION_ID,
    opened_at: "2026-03-02T10:15:00.000Z",
    closed_at: null,
    closed_reason: null,
  },
  {
    id: DRAFT_ROLE_ID,
    organization_id: ORG_ID,
    client_id: "cli_calder_vale",
    title: "Management Accountant",
    state: "draft",
    brief_id: "brf_ma",
    /* No pinned version: a version is pinned when the role opens, and this one has not
     * opened, because it has two criteria and needs three. */
    pinned_brief_version_id: null,
    opened_at: null,
    closed_at: null,
    closed_reason: null,
  },
  {
    id: CLOSED_ROLE_ID,
    organization_id: ORG_ID,
    client_id: "cli_calder_vale",
    title: "Finance Business Partner",
    state: "closed",
    brief_id: "brf_fbp",
    pinned_brief_version_id: CLOSED_BRIEF_VERSION_ID,
    opened_at: "2025-10-06T09:00:00.000Z",
    closed_at: "2026-02-11T16:40:00.000Z",
    closed_reason: "Placed. George Amankwah started 2 March 2026.",
  },
];

export const briefs: Brief[] = [
  { id: "brf_fc", organization_id: ORG_ID, role_id: OPEN_ROLE_ID },
  { id: "brf_ma", organization_id: ORG_ID, role_id: DRAFT_ROLE_ID },
  { id: "brf_fbp", organization_id: ORG_ID, role_id: CLOSED_ROLE_ID },
];

/* Five criteria in a fixed order, each one genuinely evidenceable from a CV — a
 * criterion a real document can neither support nor fail to support makes the whole
 * prototype lie, because every cell in its column would be a coin toss dressed as a
 * finding. Each of these can be quoted or plainly cannot. */
export const criteria: Criterion[] = [
  {
    id: "crt_fc_1",
    brief_version_id: OPEN_BRIEF_VERSION_ID,
    position: 1,
    text: "Has closed a month-end in a private-equity-backed business",
    cell_label: "PE month-end",
  },
  {
    id: "crt_fc_2",
    brief_version_id: OPEN_BRIEF_VERSION_ID,
    position: 2,
    text: "Led an ERP migration, not only participated in one",
    cell_label: "Led an ERP migration",
  },
  {
    id: "crt_fc_3",
    brief_version_id: OPEN_BRIEF_VERSION_ID,
    position: 3,
    text: "Has managed a team of three or more",
    cell_label: "Team of three or more",
  },
  {
    id: "crt_fc_4",
    brief_version_id: OPEN_BRIEF_VERSION_ID,
    position: 4,
    text: "Manufacturing or industrial sector experience",
    cell_label: "Manufacturing or industrial",
  },
  {
    id: "crt_fc_5",
    brief_version_id: OPEN_BRIEF_VERSION_ID,
    position: 5,
    text: "Qualified ACA, ACCA or CIMA",
    cell_label: "Qualified accountant",
  },

  /* Two. One short of the three that invariant 1 requires to open the role — and
   * neither is assigned to a stage, so once the third arrives the coverage refusal
   * fires behind it. Two refusals in sequence, both reachable from a cold start. */
  {
    id: "crt_ma_1",
    brief_version_id: DRAFT_BRIEF_VERSION_ID,
    position: 1,
    text: "Has prepared a set of statutory accounts to audit",
    cell_label: "Statutory accounts",
  },
  {
    id: "crt_ma_2",
    brief_version_id: DRAFT_BRIEF_VERSION_ID,
    position: 2,
    text: "Food, drink or FMCG manufacturing experience",
    cell_label: "Food or FMCG",
  },

  {
    id: "crt_fbp_1",
    brief_version_id: CLOSED_BRIEF_VERSION_ID,
    position: 1,
    text: "Has business-partnered a commercial or operations director",
    cell_label: "Business partnering",
  },
  {
    id: "crt_fbp_2",
    brief_version_id: CLOSED_BRIEF_VERSION_ID,
    position: 2,
    text: "Built a rolling forecast from site-level data",
    cell_label: "Rolling forecast",
  },
  {
    id: "crt_fbp_3",
    brief_version_id: CLOSED_BRIEF_VERSION_ID,
    position: 3,
    text: "Qualified or finalist ACA, ACCA or CIMA",
    cell_label: "Qualified or finalist",
  },
];

export const briefVersions: BriefVersion[] = [
  {
    id: "bvr_fc_v1",
    brief_id: "brf_fc",
    version: 1,
    created_at: "2026-02-24T14:05:00.000Z",
    created_by: recruiter.id,
    note: "First draft from the CFO's notes. Four criteria; the ERP requirement was added after the site visit.",
    criterion_ids: [],
  },
  {
    id: OPEN_BRIEF_VERSION_ID,
    brief_id: "brf_fc",
    version: 2,
    created_at: "2026-03-02T10:12:00.000Z",
    created_by: recruiter.id,
    note: "Agreed with Elin Whitcombe on 2 March. This is the version the role opened against, and the version every search and every review below is pinned to.",
    criterion_ids: ["crt_fc_1", "crt_fc_2", "crt_fc_3", "crt_fc_4", "crt_fc_5"],
  },
  {
    id: DRAFT_BRIEF_VERSION_ID,
    brief_id: "brf_ma",
    version: 1,
    created_at: "2026-07-28T11:30:00.000Z",
    created_by: recruiter.id,
    note: "Taken down over the phone. Joseph is coming back with the third requirement.",
    criterion_ids: ["crt_ma_1", "crt_ma_2"],
  },
  {
    id: CLOSED_BRIEF_VERSION_ID,
    brief_id: "brf_fbp",
    version: 1,
    created_at: "2025-10-06T08:50:00.000Z",
    created_by: recruiter.id,
    note: "Agreed on the call of 6 October 2025.",
    criterion_ids: ["crt_fbp_1", "crt_fbp_2", "crt_fbp_3"],
  },
];

/* Two scopes, one rubric — see the OPEN QUESTION comment on SourcingScope in types.ts.
 * The scope was widened in June because the pool came back thin. Nothing anyone is
 * assessed against changed, and every Review below is still pinned to version 2. */
export const sourcingScopes: SourcingScope[] = [
  {
    id: "scp_fc_r1",
    brief_version_id: OPEN_BRIEF_VERSION_ID,
    revision: 1,
    created_at: "2026-03-02T10:20:00.000Z",
    created_by: recruiter.id,
    note: "Agreed scope at kick-off. Direct competitors and the machining supply chain.",
    markets: [
      "Precision machining and sub-assembly",
      "Castings and forgings",
      "Aerospace and energy supply chain",
    ],
    employers: [
      "Denholm Castings",
      "Hartwell Precision",
      "Kestrel Industrial Group",
      "Stelmark Engineering",
      "Vantage Fabrications",
    ],
    geography: "South and West Yorkshire, North Derbyshire. Within 45 minutes of Rotherham.",
    exclusions: [
      "Bramhall Precision Group and its subsidiaries",
      "Calderstone Partners portfolio companies (client instruction, 2 March)",
    ],
  },
  {
    id: "scp_fc_r2",
    brief_version_id: OPEN_BRIEF_VERSION_ID,
    revision: 2,
    created_at: "2026-06-02T09:40:00.000Z",
    created_by: recruiter.id,
    note: "Widened after the March run returned eight people and three were already known to the client. Adjacent process manufacturing added; the rubric is unchanged.",
    markets: [
      "Precision machining and sub-assembly",
      "Castings and forgings",
      "Aerospace and energy supply chain",
      "Plastics, composites and process manufacturing",
      "Food and drink manufacturing",
    ],
    employers: [
      "Northgate Plastics",
      "Brindley Composites",
      "Ravensworth Tooling",
      "Aldwick Instruments",
      "Thornbury Mills",
    ],
    geography: "Yorkshire, the East Midlands and Greater Manchester.",
    exclusions: [
      "Bramhall Precision Group and its subsidiaries",
      "Calderstone Partners portfolio companies (client instruction, 2 March)",
    ],
  },
];

/* The third criterion Joseph is coming back with. Not in `criteria` above, because it
 * does not exist on the Brief yet — the draft role's screen has a live control that
 * adds it, which is how the count refusal and the coverage refusal are reachable one
 * after the other without editing a fixture. */
export const PENDING_DRAFT_CRITERION: Criterion = {
  id: "crt_ma_3",
  brief_version_id: DRAFT_BRIEF_VERSION_ID,
  position: 3,
  text: "Has run a stock count and reconciled the variance",
  cell_label: "Stock count",
};

/* ── The Brief also says where each criterion is evidenced ───────────────────────
 *
 * Defined before anybody is sourced, which is the whole point: a stage that acquires
 * its purpose retrospectively is a conversation, not an assessment. Each stage names
 * the criteria it is responsible for, and the union of those has to cover the rubric
 * before the role can open.
 *
 * Two stages carry no criteria and that is deliberate. Contacted tests whether the
 * person is interested, available and in range on money — real work, none of it in
 * the rubric. Client interview belongs to the client, and the agency does not record
 * findings on someone else's conversation.
 *
 * The agency's assessment therefore ends at Submitted, which is why every criterion
 * has to be assigned at or before it. That is the same requirement invariant 5 already
 * imposes on the Submission Record, arrived at from the other end.
 * ─────────────────────────────────────────────────────────────────────────────── */
export const briefStages: BriefStage[] = [
  {
    id: "stg_fc_sourced",
    brief_version_id: OPEN_BRIEF_VERSION_ID,
    position: 1,
    label: "Sourced",
    purpose:
      "What the public record already shows. Sector and qualification, before anyone is contacted.",
    owner: "recruiter",
    criterion_ids: ["crt_fc_4", "crt_fc_5"],
    candidate_message:
      "I came across your profile while working on a Financial Controller role for a manufacturing business in South Yorkshire. I have not shared your details with anyone. If you would like to hear about it, reply and I will call you; if not, tell me and I will close the record.",
  },
  {
    id: "stg_fc_contacted",
    brief_version_id: OPEN_BRIEF_VERSION_ID,
    position: 2,
    label: "Contacted",
    purpose:
      "Interest, availability, notice period and salary. None of it is in the rubric, and all of it decides whether the rest is worth anyone's time.",
    owner: "recruiter",
    criterion_ids: [],
    candidate_message:
      "Thanks for coming back to me. Before we go further: the role is Financial Controller at a PE-backed manufacturer near Rotherham, and the assessment is against five written criteria agreed with the client. I will send those to you before the screening call so you know what I am asking about.",
  },
  {
    id: "stg_fc_screening",
    brief_version_id: OPEN_BRIEF_VERSION_ID,
    position: 3,
    label: "Screening call",
    purpose: "Thirty minutes. The two things a CV implies and only a conversation confirms.",
    owner: "recruiter",
    criterion_ids: ["crt_fc_1", "crt_fc_3"],
    candidate_message:
      "The screening call is thirty minutes. I will ask you about closing a month-end under a private-equity reporting calendar, and about the team you manage. Bring an example of each; I will be quoting what you tell me into the record the client sees.",
  },
  {
    id: "stg_fc_competency",
    brief_version_id: OPEN_BRIEF_VERSION_ID,
    position: 4,
    label: "Competency call",
    purpose:
      "One criterion, properly. Led an ERP migration is the one every CV claims and few can evidence.",
    owner: "recruiter",
    criterion_ids: ["crt_fc_2"],
    candidate_message:
      "This call is about one thing: a system implementation you led. I will ask what you owned, what went wrong, and what you would do differently. If you sat on a steering group rather than running it, say so — it is recorded either way, and the client is told which.",
  },
  {
    id: "stg_fc_submitted",
    brief_version_id: OPEN_BRIEF_VERSION_ID,
    position: 5,
    label: "Submitted",
    purpose:
      "The record goes to the client. Every criterion carries a finding by here, or it does not go.",
    owner: "recruiter",
    criterion_ids: [],
    candidate_message:
      "Your record has gone to the client today. You can read exactly what was written and the passages it was drawn from at the link below. Nothing was sent that you cannot see.",
  },
  {
    id: "stg_fc_client",
    brief_version_id: OPEN_BRIEF_VERSION_ID,
    position: 6,
    label: "Client interview",
    purpose: "The client's conversation. The agency records no findings on it.",
    owner: "client",
    criterion_ids: [],
    candidate_message:
      "The client would like to meet you. I will send times and the names of who you are seeing. I do not sit in on these and I do not score them.",
  },

  /* The draft role. Its stages are set out — that work was done on the call with
   * Joseph — but the third criterion has not arrived yet, and when it does it will
   * belong to no stage until somebody says where it is evidenced. Two refusals in
   * sequence, both reachable from a cold start. */
  {
    id: "stg_ma_sourced",
    brief_version_id: DRAFT_BRIEF_VERSION_ID,
    position: 1,
    label: "Sourced",
    purpose: "Sector, from the public record.",
    owner: "recruiter",
    criterion_ids: ["crt_ma_2"],
    candidate_message:
      "I am working on a Management Accountant role for a food manufacturer near Wakefield and your background looks relevant. Reply if you would like to hear more.",
  },
  {
    id: "stg_ma_screening",
    brief_version_id: DRAFT_BRIEF_VERSION_ID,
    position: 2,
    label: "Screening call",
    purpose: "Thirty minutes on the statutory accounts and the month-end.",
    owner: "recruiter",
    criterion_ids: ["crt_ma_1"],
    candidate_message:
      "Thirty minutes. I will ask you about a set of statutory accounts you prepared and took to audit. Bring the detail; I will be quoting what you tell me into the record the client sees.",
  },
  {
    id: "stg_ma_submitted",
    brief_version_id: DRAFT_BRIEF_VERSION_ID,
    position: 3,
    label: "Submitted",
    purpose: "The record goes to the client.",
    owner: "recruiter",
    criterion_ids: [],
    candidate_message:
      "Your record has gone to the client today. You can read all of it at the link below.",
  },

  {
    id: "stg_fbp_sourced",
    brief_version_id: CLOSED_BRIEF_VERSION_ID,
    position: 1,
    label: "Sourced",
    purpose: "Sector and qualification from the public record.",
    owner: "recruiter",
    criterion_ids: ["crt_fbp_3"],
    candidate_message:
      "I am working on a Finance Business Partner role for a food manufacturer near Wakefield and your background looks relevant. Reply if you would like to hear more.",
  },
  {
    id: "stg_fbp_screening",
    brief_version_id: CLOSED_BRIEF_VERSION_ID,
    position: 2,
    label: "Screening call",
    purpose: "Business partnering and the forecast, with worked examples.",
    owner: "recruiter",
    criterion_ids: ["crt_fbp_1", "crt_fbp_2"],
    candidate_message:
      "Thirty minutes. I will ask you about a director you partnered and a forecast you built, and I will quote what you tell me into the record the client sees.",
  },
  {
    id: "stg_fbp_submitted",
    brief_version_id: CLOSED_BRIEF_VERSION_ID,
    position: 3,
    label: "Submitted",
    purpose: "The record goes to the client.",
    owner: "recruiter",
    criterion_ids: [],
    candidate_message:
      "Your record has gone to the client today. You can read all of it at the link below.",
  },
  {
    id: "stg_fbp_client",
    brief_version_id: CLOSED_BRIEF_VERSION_ID,
    position: 4,
    label: "Client interview",
    purpose: "The client's conversation.",
    owner: "client",
    criterion_ids: [],
    candidate_message: "The client would like to meet you. Times to follow.",
  },
];
