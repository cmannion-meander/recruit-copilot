/* Reviews, Findings and Evidence.
 *
 * Every offset below is computed by locate() against the exact parsed text or snapshot
 * it points into, and Evidence.quote is the substring that comes back — line breaks
 * included, because that is what a citation into parsed text really is. Change a word
 * in a CV without changing the quote and this module throws at import.
 *
 * Finding.status has two values. There is no confidence, no partial, no maybe, and
 * nothing anywhere that adds five cells together into a figure.
 *
 * Two candidacies are deliberately short of findings, which is how the incomplete
 * scorecard refusal is reachable without setup:
 *   · Aileen Marchetti has three of five, and her CV plainly supports the missing two.
 *     The work has not been done, which is exactly the case worth refusing.
 *   · Priya Nandakumar has no Review at all.
 */
import { documents } from "./documents";
import { locate, placeOf, spansOf } from "./offsets";
import { ORG_ID, recruiter } from "./organisation";
import { sightings } from "./people";
import { OPEN_BRIEF_VERSION_ID } from "./roles";
import type { Evidence, Finding, Review } from "./types";

function citeDocument(documentId: string, quote: string, at: string): Evidence {
  const document = documents.find((candidate) => candidate.id === documentId);
  if (!document) throw new Error(`reviews: no document ${documentId}`);

  const located = locate(document.parsed_text, quote, document.filename);
  const place = placeOf(spansOf(document.parsed_text), located.char_start);

  return {
    id: `evd_${documentId}_${located.char_start}`,
    organization_id: ORG_ID,
    finding_id: "",
    quote: located.quote,
    target: {
      kind: "document",
      document_id: documentId,
      char_start: located.char_start,
      char_end: located.char_end,
      page: place.page,
      paragraph: place.paragraph,
    },
    created_at: at,
  };
}

function citeSighting(sightingId: string, quote: string, at: string): Evidence {
  const sighting = sightings.find((candidate) => candidate.id === sightingId);
  if (!sighting) throw new Error(`reviews: no sighting ${sightingId}`);

  const located = locate(sighting.snapshot_excerpt, quote, `${sightingId} snapshot`);

  return {
    id: `evd_${sightingId}_${located.char_start}`,
    organization_id: ORG_ID,
    finding_id: "",
    quote: located.quote,
    target: {
      kind: "sighting",
      sighting_id: sightingId,
      char_start: located.char_start,
      char_end: located.char_end,
    },
    created_at: at,
  };
}

type Entry = {
  criterion_id: string;
  evidence?: Evidence;
};

/** An evidenced finding always carries evidence; a not_found one never does. */
function evidenced(criterion_id: string, evidence: Evidence): Entry {
  return { criterion_id, evidence };
}
function notFound(criterion_id: string): Entry {
  return { criterion_id };
}

const findings: Finding[] = [];
const evidence: Evidence[] = [];

function record(reviewId: string, at: string, entries: Entry[]) {
  for (const entry of entries) {
    const findingId = `fnd_${reviewId}_${entry.criterion_id}`;
    findings.push({
      id: findingId,
      review_id: reviewId,
      criterion_id: entry.criterion_id,
      status: entry.evidence ? "evidenced" : "not_found",
      recorded_by: recruiter.id,
      recorded_at: at,
    });
    if (entry.evidence) evidence.push({ ...entry.evidence, finding_id: findingId });
  }
}

export const reviews: Review[] = [
  {
    id: "rev_marchetti",
    organization_id: ORG_ID,
    candidacy_id: "cnd_marchetti",
    brief_version_id: OPEN_BRIEF_VERSION_ID,
    created_at: "2026-05-06T11:04:00.000Z",
    created_by: recruiter.id,
  },
  {
    id: "rev_ibbotson",
    organization_id: ORG_ID,
    candidacy_id: "cnd_ibbotson",
    brief_version_id: OPEN_BRIEF_VERSION_ID,
    created_at: "2026-04-03T09:15:00.000Z",
    created_by: recruiter.id,
  },
  {
    id: "rev_reith",
    organization_id: ORG_ID,
    candidacy_id: "cnd_reith",
    brief_version_id: OPEN_BRIEF_VERSION_ID,
    created_at: "2026-04-13T14:40:00.000Z",
    created_by: recruiter.id,
  },
  {
    id: "rev_trelawny",
    organization_id: ORG_ID,
    candidacy_id: "cnd_trelawny",
    brief_version_id: OPEN_BRIEF_VERSION_ID,
    created_at: "2026-04-25T09:52:00.000Z",
    created_by: recruiter.id,
  },
  {
    id: "rev_petrescu",
    organization_id: ORG_ID,
    candidacy_id: "cnd_petrescu",
    brief_version_id: OPEN_BRIEF_VERSION_ID,
    created_at: "2026-03-20T16:30:00.000Z",
    created_by: recruiter.id,
  },
  {
    id: "rev_shanbhag",
    organization_id: ORG_ID,
    candidacy_id: "cnd_shanbhag",
    brief_version_id: OPEN_BRIEF_VERSION_ID,
    created_at: "2026-03-19T11:12:00.000Z",
    created_by: recruiter.id,
  },
];

/* Aileen Marchetti — three of five. Criteria 2 and 3 have no entry, and the CV
 * supports both. Nothing about this candidacy is ambiguous except whether anyone
 * has done the work, which is the only thing the refusal is about. */
record("rev_marchetti", "2026-05-06T11:04:00.000Z", [
  evidenced(
    "crt_fc_1",
    citeDocument(
      "doc_marchetti_cv",
      "The business was acquired by Threshfield Industrial Partners in March 2021 and I have closed every month-end since under their reporting calendar",
      "2026-05-06T11:06:00.000Z",
    ),
  ),
  evidenced(
    "crt_fc_4",
    citeDocument(
      "doc_marchetti_cv",
      "Denholm is an aluminium and zinc die-casting business supplying the automotive and domestic appliance markets from a single site in Rotherham.",
      "2026-05-06T11:09:00.000Z",
    ),
  ),
  evidenced(
    "crt_fc_5",
    citeDocument("doc_marchetti_cv", "CIMA, qualified 2019.", "2026-05-06T11:10:00.000Z"),
  ),
]);

/* Frances Ibbotson — four of five. Criterion 2 is not_found, and the CV addresses it
 * directly: she sits on the steering group and says so. The status enum has two values
 * and neither of them is "the document answers this, and the answer is no". See
 * docs/prototype-findings.md. */
record("rev_ibbotson", "2026-04-03T09:15:00.000Z", [
  evidenced(
    "crt_fc_1",
    citeDocument(
      "doc_ibbotson_cv",
      "turnover £62m, majority owned by Slaithwaite Equity Partners since the 2018 buy-out. I run the group close on a five-day timetable and present the consolidated result to the investor board each month.",
      "2026-04-03T09:18:00.000Z",
    ),
  ),
  notFound("crt_fc_2"),
  evidenced(
    "crt_fc_3",
    citeDocument(
      "doc_ibbotson_cv",
      "My team is five: a financial accountant, two management accountants and two transactional staff.",
      "2026-04-03T09:21:00.000Z",
    ),
  ),
  evidenced(
    "crt_fc_4",
    citeDocument(
      "doc_ibbotson_cv",
      "Northgate is an injection moulding group of three sites in Yorkshire and the East Midlands",
      "2026-04-03T09:23:00.000Z",
    ),
  ),
  evidenced(
    "crt_fc_5",
    citeDocument("doc_ibbotson_cv", "CIMA, qualified 2017.", "2026-04-03T09:24:00.000Z"),
  ),
]);

/* Callum Reith — two of five, then rejected. */
record("rev_reith", "2026-04-13T14:40:00.000Z", [
  notFound("crt_fc_1"),
  notFound("crt_fc_2"),
  notFound("crt_fc_3"),
  evidenced(
    "crt_fc_4",
    citeDocument(
      "doc_reith_cv",
      "Selby Aggregates is a family-owned quarrying and ready-mix concrete business",
      "2026-04-13T14:44:00.000Z",
    ),
  ),
  evidenced(
    "crt_fc_5",
    citeDocument("doc_reith_cv", "ACCA, qualified 2021.", "2026-04-13T14:45:00.000Z"),
  ),
]);

/* Owen Trelawny — five of five, and the one that becomes a Submission Record. */
record("rev_trelawny", "2026-04-25T09:52:00.000Z", [
  evidenced(
    "crt_fc_1",
    citeDocument(
      "doc_trelawny_cv",
      "I have closed every month-end since the acquisition to the reporting timetable Ardenne set",
      "2026-04-25T09:55:00.000Z",
    ),
  ),
  evidenced(
    "crt_fc_2",
    citeDocument(
      "doc_trelawny_cv",
      "I led the migration from Sage 200 to Microsoft Dynamics 365 Business Central across two sites",
      "2026-04-25T09:57:00.000Z",
    ),
  ),
  evidenced(
    "crt_fc_3",
    citeDocument(
      "doc_trelawny_cv",
      "I manage a team of four: two management accountants, an assistant accountant and a purchase ledger clerk.",
      "2026-04-25T09:59:00.000Z",
    ),
  ),
  evidenced(
    "crt_fc_4",
    citeDocument(
      "doc_trelawny_cv",
      "Hartwell is a £41m precision machining business acquired by Ardenne Capital in 2020.",
      "2026-04-25T10:01:00.000Z",
    ),
  ),
  evidenced(
    "crt_fc_5",
    citeDocument(
      "doc_trelawny_cv",
      "ACA, qualified 2016, Institute of Chartered Accountants in England and Wales.",
      "2026-04-25T10:02:00.000Z",
    ),
  ),
]);

/* Ivan Petrescu — no CV, so every citation points at a Sighting snapshot instead of a
 * Document. This is the branch of the evidence union that a CV-only prototype never
 * exercises, and eight of these twelve people would only ever produce it. */
record("rev_petrescu", "2026-03-20T16:30:00.000Z", [
  notFound("crt_fc_1"),
  notFound("crt_fc_2"),
  evidenced(
    "crt_fc_3",
    citeSighting(
      "sig_petrescu_1",
      "manages a team of three in the finance office",
      "2026-03-20T16:33:00.000Z",
    ),
  ),
  evidenced(
    "crt_fc_4",
    citeSighting(
      "sig_petrescu_1",
      "Stelmark is a subcontract engineering business supplying the rail and off-highway sectors from a single site in Chesterfield.",
      "2026-03-20T16:35:00.000Z",
    ),
  ),
  notFound("crt_fc_5"),
]);

/* Meera Shanbhag — three of five from a trade press snapshot, then excluded for a
 * reason that has nothing to do with the criteria. "Why not them?" has an answer. */
record("rev_shanbhag", "2026-03-19T11:12:00.000Z", [
  notFound("crt_fc_1"),
  notFound("crt_fc_2"),
  evidenced(
    "crt_fc_3",
    citeSighting(
      "sig_shanbhag_1",
      "leads a finance and IT team of six",
      "2026-03-19T11:15:00.000Z",
    ),
  ),
  evidenced(
    "crt_fc_4",
    citeSighting(
      "sig_shanbhag_1",
      "Ravensworth Tooling has completed a £4m reinvestment in its Leeds cutting-tool plant.",
      "2026-03-19T11:17:00.000Z",
    ),
  ),
  evidenced(
    "crt_fc_5",
    citeSighting(
      "sig_shanbhag_1",
      "Ms Shanbhag, who qualified with ACCA",
      "2026-03-19T11:18:00.000Z",
    ),
  ),
]);

export { evidence, findings };
