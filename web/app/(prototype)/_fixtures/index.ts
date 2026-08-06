/* The whole fixture set, assembled once.
 *
 * This object is the prototype's initial state and its Reset target. It is frozen at
 * module scope and the reducer never mutates it — every action returns a new object —
 * so a reload and a Reset land on byte-identical screens. That matters because these
 * screens get filmed and every take has to start the same way.
 *
 * There is no persistence anywhere in this prototype: no localStorage, no
 * sessionStorage, no cookie, no fetch. See docs/decisions/0010.
 */
import { candidacies, terminalStages } from "./candidacies";
import { channels } from "./channels";
import { crosscheckSignals } from "./crosscheck";
import { decisionEvents, decisions, exclusions } from "./decisions";
import { documents } from "./documents";
import { candidateMessages } from "./messages";
import { clients, contacts, organization, users } from "./organisation";
import { people, sightings } from "./people";
import { placementCheckpoints, placements } from "./placements";
import { evidence, findings, reviews } from "./reviews";
import { briefStages, briefs, briefVersions, criteria, roles, sourcingScopes } from "./roles";
import { searches } from "./searches";
import { submissionRecords } from "./submissions";
import type {
  Brief,
  BriefStage,
  BriefVersion,
  Candidacy,
  CandidateMessage,
  Channel,
  Client,
  Contact,
  Criterion,
  CrosscheckSignal,
  Decision,
  DecisionEvent,
  Document,
  Evidence,
  Exclusion,
  Finding,
  Organization,
  Person,
  Placement,
  PlacementCheckpoint,
  Review,
  Role,
  Search,
  Sighting,
  SourcingScope,
  Stage,
  SubmissionRecord,
  User,
} from "./types";

export type PrototypeState = {
  organization: Organization;
  users: User[];
  clients: Client[];
  contacts: Contact[];
  roles: Role[];
  briefs: Brief[];
  briefVersions: BriefVersion[];
  criteria: Criterion[];
  /** The Brief also says where each criterion is evidenced. Versioned with it. */
  briefStages: BriefStage[];
  sourcingScopes: SourcingScope[];
  channels: Channel[];
  searches: Search[];
  people: Person[];
  sightings: Sighting[];
  /** Terminal outcomes only. Pipeline stages live on the BriefVersion. */
  terminalStages: Stage[];
  candidacies: Candidacy[];
  candidateMessages: CandidateMessage[];
  placements: Placement[];
  placementCheckpoints: PlacementCheckpoint[];
  documents: Document[];
  reviews: Review[];
  findings: Finding[];
  evidence: Evidence[];
  crosscheckSignals: CrosscheckSignal[];
  decisions: Decision[];
  exclusions: Exclusion[];
  decisionEvents: DecisionEvent[];
  submissionRecords: SubmissionRecord[];
};

export const initialState: PrototypeState = {
  organization,
  users,
  clients,
  contacts,
  roles,
  briefs,
  briefVersions,
  criteria,
  briefStages,
  sourcingScopes,
  channels,
  searches,
  people,
  sightings,
  terminalStages,
  candidacies,
  candidateMessages,
  placements,
  placementCheckpoints,
  documents,
  reviews,
  findings,
  evidence,
  crosscheckSignals,
  decisions,
  exclusions,
  decisionEvents,
  submissionRecords,
};

export * from "./clock";
export * from "./provenance";
export * from "./types";
