/* One Submission Record, already created, so the immutable state is reachable without
 * going through the flow first.
 *
 * The snapshot is built here from the criteria, findings and evidence as they stood at
 * sign-off, and then it is the only thing the record renders from. That is the point of
 * invariant 8: the record is a durable object, not a view over live rows. If the Brief
 * moves to version 3 tomorrow, this document still says what it said when it was sent,
 * because it is not looking.
 */

import { ORG_ID, recruiter } from "./organisation";
import { provenanceOfEvidence } from "./provenance";
import { evidence, findings } from "./reviews";
import { criteria, OPEN_BRIEF_VERSION_ID } from "./roles";
import type { SubmissionRecord, SubmissionSnapshotLine } from "./types";

const REVIEW_ID = "rev_trelawny";

const lines: SubmissionSnapshotLine[] = criteria
  .filter((criterion) => criterion.brief_version_id === OPEN_BRIEF_VERSION_ID)
  .sort((left, right) => left.position - right.position)
  .map((criterion) => {
    const finding = findings.find(
      (candidate) => candidate.review_id === REVIEW_ID && candidate.criterion_id === criterion.id,
    );
    if (!finding) {
      throw new Error(
        `submissions: ${criterion.id} has no finding on ${REVIEW_ID}. A record cannot be ` +
          "created from an incomplete scorecard.",
      );
    }
    const cited = evidence.find((candidate) => candidate.finding_id === finding.id);
    return {
      position: criterion.position,
      criterion_text: criterion.text,
      status: finding.status,
      quote: cited ? cited.quote : null,
      provenance: cited ? provenanceOfEvidence(cited) : null,
    };
  });

export const CANDIDATE_TOKEN = "9f4c1ab7e206";

export const submissionRecords: SubmissionRecord[] = [
  {
    id: "sub_trelawny",
    organization_id: ORG_ID,
    candidacy_id: "cnd_trelawny",
    brief_version_id: OPEN_BRIEF_VERSION_ID,
    created_at: "2026-07-22T16:05:00.000Z",
    signed_off_by: recruiter.id,
    signed_off_at: "2026-07-22T16:05:00.000Z",
    reference: "HF-2026-0114",
    snapshot: {
      person_name: "Owen Trelawny",
      person_headline: "Financial Controller, Hartwell Precision Components",
      client_name: "Bramhall Precision Group",
      role_title: "Financial Controller",
      brief_version: 2,
      lines,
      candidate_token: CANDIDATE_TOKEN,
    },
  },
];
