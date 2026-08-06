/* Submission Records, already created, so the immutable state is reachable without
 * going through the flow first.
 *
 * The snapshot is built here from the findings as they stood at sign-off — across every
 * stage's scorecard, most recent reading per criterion — and then it is the only thing
 * the record renders from. That is the point of invariant 8: the record is a durable
 * object, not a view over live rows. If The Brief moves to version 3 tomorrow, this
 * document still says what it said when it was sent.
 *
 * The build fails here if a criterion has no finding anywhere. That is the same rule
 * refuseSubmission enforces on screen, arriving at module load, which is where a
 * fixture that has drifted should be caught.
 */
import { ORG_ID, recruiter } from "./organisation";
import { provenanceOfEvidence } from "./provenance";
import { evidence, findings, reviews } from "./reviews";
import { CLOSED_BRIEF_VERSION_ID, criteria, OPEN_BRIEF_VERSION_ID } from "./roles";
import type { SubmissionRecord, SubmissionSnapshotLine } from "./types";

/* The reading that stands is the most recent one. Earlier readings are not overwritten
 * — they stay on the candidacy with their dates and their stage — but the record that
 * goes to a client carries what is true now, not what was true in March. */
function snapshotOf(candidacyId: string, briefVersionId: string): SubmissionSnapshotLine[] {
  const mine = new Set(
    reviews.filter((review) => review.candidacy_id === candidacyId).map((review) => review.id),
  );
  const recorded = findings
    .filter((finding) => mine.has(finding.review_id))
    .sort((left, right) => Date.parse(left.recorded_at) - Date.parse(right.recorded_at));

  return criteria
    .filter((criterion) => criterion.brief_version_id === briefVersionId)
    .sort((left, right) => left.position - right.position)
    .map((criterion) => {
      const all = recorded.filter((finding) => finding.criterion_id === criterion.id);
      const finding = all[all.length - 1];
      if (!finding) {
        throw new Error(
          `submissions: ${criterion.id} has no finding on ${candidacyId}. A record cannot be ` +
            "created from an incomplete scorecard.",
        );
      }
      const cited = evidence.find((item) => item.finding_id === finding.id);
      return {
        position: criterion.position,
        criterion_text: criterion.text,
        status: finding.status,
        quote: cited ? cited.quote : null,
        provenance: cited ? provenanceOfEvidence(cited) : null,
      };
    });
}

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
      lines: snapshotOf("cnd_trelawny", OPEN_BRIEF_VERSION_ID),
      candidate_token: CANDIDATE_TOKEN,
    },
  },
  {
    id: "sub_amankwah",
    organization_id: ORG_ID,
    candidacy_id: "cnd_amankwah_fbp",
    brief_version_id: CLOSED_BRIEF_VERSION_ID,
    created_at: "2025-10-14T11:20:00.000Z",
    signed_off_by: recruiter.id,
    signed_off_at: "2025-10-14T11:20:00.000Z",
    reference: "HF-2025-0088",
    snapshot: {
      person_name: "George Amankwah",
      person_headline: "Senior Management Accountant, Thornbury Mills",
      client_name: "Calder Vale Foods",
      role_title: "Finance Business Partner",
      brief_version: 1,
      lines: snapshotOf("cnd_amankwah_fbp", CLOSED_BRIEF_VERSION_ID),
      candidate_token: "3b7e21f0c95d",
    },
  },
];
