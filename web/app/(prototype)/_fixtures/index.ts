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
import { candidacies, stages } from "./candidacies";
import { crosscheckSignals } from "./crosscheck";
import { decisionEvents, decisions, exclusions } from "./decisions";
import { documents } from "./documents";
import { clients, contacts, organization, users } from "./organisation";
import { people, sightings } from "./people";
import { evidence, findings, reviews } from "./reviews";
import { briefs, briefVersions, criteria, roles, sourcingScopes } from "./roles";
import { searches } from "./searches";
import { submissionRecords } from "./submissions";
import type {
  Brief,
  BriefVersion,
  Candidacy,
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
  sourcingScopes: SourcingScope[];
  searches: Search[];
  people: Person[];
  sightings: Sighting[];
  stages: Stage[];
  candidacies: Candidacy[];
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
  sourcingScopes,
  searches,
  people,
  sightings,
  stages,
  candidacies,
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
