/* Reviews, Findings and Evidence — one scorecard per stage.
 *
 * A candidacy accumulates several reviews as it moves: the sourcing read, the
 * screening call, the competency call. Each is responsible only for the criteria its
 * stage carries, which is what makes invariant 3 enforceable rather than aspirational
 * — under one review per candidacy, "no advancement without a scorecard" means nobody
 * can leave Sourced, and you contact people in order to learn the things.
 *
 * Every offset below is computed by locate() against the exact parsed text or snapshot
 * it points into, and Evidence.quote is the substring that comes back — line breaks
 * included. Change a word in a CV without changing the quote and this module throws.
 *
 * Finding.status has two values. There is no confidence, no partial, no maybe, and
 * nothing anywhere that adds cells together into a figure.
 */
import { documents } from "./documents";
import { locate, placeOf, spansOf } from "./offsets";
import { ORG_ID, recruiter } from "./organisation";
import { sightings } from "./people";
import { CLOSED_BRIEF_VERSION_ID, OPEN_BRIEF_VERSION_ID } from "./roles";
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

type Entry = { criterion_id: string; evidence?: Evidence };

/** An evidenced finding always carries evidence; a not_found one never does. */
function evidenced(criterion_id: string, evidence: Evidence): Entry {
  return { criterion_id, evidence };
}
function notFound(criterion_id: string): Entry {
  return { criterion_id };
}

const reviews: Review[] = [];
const findings: Finding[] = [];
const evidence: Evidence[] = [];

/** One scorecard: a stage, a date, and the findings recorded at it. */
function scorecard(
  id: string,
  candidacy_id: string,
  stage_id: string,
  brief_version_id: string,
  at: string,
  entries: Entry[],
) {
  reviews.push({
    id,
    organization_id: ORG_ID,
    candidacy_id,
    brief_version_id,
    stage_id,
    created_at: at,
    created_by: recruiter.id,
  });
  for (const entry of entries) {
    const findingId = `fnd_${id}_${entry.criterion_id}`;
    findings.push({
      id: findingId,
      review_id: id,
      criterion_id: entry.criterion_id,
      status: entry.evidence ? "evidenced" : "not_found",
      recorded_by: recruiter.id,
      recorded_at: at,
    });
    if (entry.evidence) evidence.push({ ...entry.evidence, finding_id: findingId });
  }
}

const FC = OPEN_BRIEF_VERSION_ID;

/* ── Aileen Marchetti · at the screening call ────────────────────────────────────
 * Sourced is complete: sector and qualification, both from her CV. The screening
 * call carries criteria 1 and 3 and neither is recorded, which is the refusal. Her
 * CV plainly supports both — nothing about this candidacy is ambiguous except whether
 * anyone has done the work, which is the only thing the refusal is about. */
scorecard(
  "rev_marchetti_sourced",
  "cnd_marchetti",
  "stg_fc_sourced",
  FC,
  "2026-04-20T10:05:00.000Z",
  [
    evidenced(
      "crt_fc_4",
      citeDocument(
        "doc_marchetti_cv",
        "Denholm is an aluminium and zinc die-casting business supplying the automotive and domestic appliance markets from a single site in Rotherham.",
        "2026-04-20T10:07:00.000Z",
      ),
    ),
    evidenced(
      "crt_fc_5",
      citeDocument("doc_marchetti_cv", "CIMA, qualified 2019.", "2026-04-20T10:08:00.000Z"),
    ),
  ],
);

/* Priya Nandakumar has no review at all. Sourced carries two criteria and neither is
 * recorded, so she cannot leave the stage she is in. */

/* ── Daniel Oyelaran · contacted ─────────────────────────────────────────────────
 * Sourced is complete. Contacted carries no criteria at all, so advancing from here
 * refuses nothing — the stage tests interest and money, which are not in the rubric. */
scorecard(
  "rev_oyelaran_sourced",
  "cnd_oyelaran",
  "stg_fc_sourced",
  FC,
  "2026-03-15T09:20:00.000Z",
  [
    evidenced(
      "crt_fc_4",
      citeSighting(
        "sig_oyelaran_1",
        "costing and the annual audit file at our Barnsley works",
        "2026-03-15T09:22:00.000Z",
      ),
    ),
    notFound("crt_fc_5"),
  ],
);

/* ── Frances Ibbotson · through the competency call ──────────────────────────────
 * Four of five. Criterion 2 is not_found and her CV addresses it directly: she sits
 * on the steering group and says so. The status enum has two values and neither of
 * them is "the document answers this, and the answer is no". */
scorecard(
  "rev_ibbotson_sourced",
  "cnd_ibbotson",
  "stg_fc_sourced",
  FC,
  "2026-04-03T09:15:00.000Z",
  [
    evidenced(
      "crt_fc_4",
      citeDocument(
        "doc_ibbotson_cv",
        "Northgate is an injection moulding group of three sites in Yorkshire and the East Midlands",
        "2026-04-03T09:17:00.000Z",
      ),
    ),
    evidenced(
      "crt_fc_5",
      citeDocument("doc_ibbotson_cv", "CIMA, qualified 2017.", "2026-04-03T09:18:00.000Z"),
    ),
  ],
);
scorecard(
  "rev_ibbotson_screening",
  "cnd_ibbotson",
  "stg_fc_screening",
  FC,
  "2026-04-09T14:30:00.000Z",
  [
    evidenced(
      "crt_fc_1",
      citeDocument(
        "doc_ibbotson_cv",
        "turnover £62m, majority owned by Slaithwaite Equity Partners since the 2018 buy-out. I run the group close on a five-day timetable and present the consolidated result to the investor board each month.",
        "2026-04-09T14:34:00.000Z",
      ),
    ),
    evidenced(
      "crt_fc_3",
      citeDocument(
        "doc_ibbotson_cv",
        "My team is five: a financial accountant, two management accountants and two transactional staff.",
        "2026-04-09T14:37:00.000Z",
      ),
    ),
  ],
);
scorecard(
  "rev_ibbotson_competency",
  "cnd_ibbotson",
  "stg_fc_competency",
  FC,
  "2026-04-16T11:00:00.000Z",
  [notFound("crt_fc_2")],
);

/* ── Callum Reith · two of five, then rejected ───────────────────────────────────── */
scorecard("rev_reith_sourced", "cnd_reith", "stg_fc_sourced", FC, "2026-04-13T14:40:00.000Z", [
  evidenced(
    "crt_fc_4",
    citeDocument(
      "doc_reith_cv",
      "Selby Aggregates is a family-owned quarrying and ready-mix concrete business",
      "2026-04-13T14:42:00.000Z",
    ),
  ),
  evidenced(
    "crt_fc_5",
    citeDocument("doc_reith_cv", "ACCA, qualified 2021.", "2026-04-13T14:43:00.000Z"),
  ),
]);
scorecard("rev_reith_screening", "cnd_reith", "stg_fc_screening", FC, "2026-05-06T10:15:00.000Z", [
  notFound("crt_fc_1"),
  notFound("crt_fc_3"),
]);
scorecard(
  "rev_reith_competency",
  "cnd_reith",
  "stg_fc_competency",
  FC,
  "2026-05-14T09:40:00.000Z",
  [notFound("crt_fc_2")],
);

/* ── Meera Shanbhag · three of five from a trade press snapshot, then excluded ──── */
scorecard(
  "rev_shanbhag_sourced",
  "cnd_shanbhag",
  "stg_fc_sourced",
  FC,
  "2026-03-19T11:12:00.000Z",
  [
    evidenced(
      "crt_fc_4",
      citeSighting(
        "sig_shanbhag_1",
        "Ravensworth Tooling has completed a £4m reinvestment in its Leeds cutting-tool plant.",
        "2026-03-19T11:14:00.000Z",
      ),
    ),
    evidenced(
      "crt_fc_5",
      citeSighting(
        "sig_shanbhag_1",
        "Ms Shanbhag, who qualified with ACCA",
        "2026-03-19T11:15:00.000Z",
      ),
    ),
  ],
);
scorecard(
  "rev_shanbhag_screening",
  "cnd_shanbhag",
  "stg_fc_screening",
  FC,
  "2026-04-02T15:20:00.000Z",
  [
    notFound("crt_fc_1"),
    evidenced(
      "crt_fc_3",
      citeSighting(
        "sig_shanbhag_1",
        "leads a finance and IT team of six",
        "2026-04-02T15:23:00.000Z",
      ),
    ),
  ],
);

/* ── Owen Trelawny · five of five across three stages, then submitted ───────────── */
scorecard(
  "rev_trelawny_sourced",
  "cnd_trelawny",
  "stg_fc_sourced",
  FC,
  "2026-03-16T10:05:00.000Z",
  [
    evidenced(
      "crt_fc_4",
      citeSighting(
        "sig_trelawny_1",
        "Owen joined Hartwell in 2021 following the acquisition by Ardenne Capital",
        "2026-03-16T10:07:00.000Z",
      ),
    ),
    notFound("crt_fc_5"),
  ],
);
scorecard(
  "rev_trelawny_screening",
  "cnd_trelawny",
  "stg_fc_screening",
  FC,
  "2026-04-25T09:52:00.000Z",
  [
    evidenced(
      "crt_fc_1",
      citeDocument(
        "doc_trelawny_cv",
        "I have closed every month-end since the acquisition to the reporting timetable Ardenne set",
        "2026-04-25T09:55:00.000Z",
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
    /* Criterion 5 was not_found at the sourcing read — the leadership page does not say
     * what he is qualified as. Reopened here once the CV arrived, and both readings stay
     * on the record with their dates. This is the handoff a structured process asks for. */
    evidenced(
      "crt_fc_5",
      citeDocument(
        "doc_trelawny_cv",
        "ACA, qualified 2016, Institute of Chartered Accountants in England and Wales.",
        "2026-04-25T10:02:00.000Z",
      ),
    ),
  ],
);
scorecard(
  "rev_trelawny_competency",
  "cnd_trelawny",
  "stg_fc_competency",
  FC,
  "2026-05-08T13:15:00.000Z",
  [
    evidenced(
      "crt_fc_2",
      citeDocument(
        "doc_trelawny_cv",
        "I led the migration from Sage 200 to Microsoft Dynamics 365 Business Central across two sites",
        "2026-05-08T13:19:00.000Z",
      ),
    ),
  ],
);

/* ── Ivan Petrescu · no CV, so every citation points at a Sighting snapshot ──────
 * Complete for the screening call, so he can advance. Criterion 1 is not_found and
 * will be offered for a second look at the competency call. */
scorecard(
  "rev_petrescu_sourced",
  "cnd_petrescu",
  "stg_fc_sourced",
  FC,
  "2026-03-20T16:30:00.000Z",
  [
    evidenced(
      "crt_fc_4",
      citeSighting(
        "sig_petrescu_1",
        "Stelmark is a subcontract engineering business supplying the rail and off-highway sectors from a single site in Chesterfield.",
        "2026-03-20T16:33:00.000Z",
      ),
    ),
    notFound("crt_fc_5"),
  ],
);
scorecard(
  "rev_petrescu_screening",
  "cnd_petrescu",
  "stg_fc_screening",
  FC,
  "2026-03-27T11:45:00.000Z",
  [
    notFound("crt_fc_1"),
    evidenced(
      "crt_fc_3",
      citeSighting(
        "sig_petrescu_1",
        "manages a team of three in the finance office",
        "2026-03-27T11:48:00.000Z",
      ),
    ),
  ],
);

/* ── George Amankwah · the closed role, and the placement that fed back ─────────── */
scorecard(
  "rev_amankwah_sourced",
  "cnd_amankwah_fbp",
  "stg_fbp_sourced",
  CLOSED_BRIEF_VERSION_ID,
  "2025-09-16T10:00:00.000Z",
  [
    evidenced(
      "crt_fbp_3",
      citeSighting("sig_amankwah_1", "He is a CIMA finalist.", "2025-09-16T10:02:00.000Z"),
    ),
  ],
);
scorecard(
  "rev_amankwah_screening",
  "cnd_amankwah_fbp",
  "stg_fbp_screening",
  CLOSED_BRIEF_VERSION_ID,
  "2025-09-29T14:00:00.000Z",
  [
    evidenced(
      "crt_fbp_1",
      citeSighting(
        "sig_amankwah_1",
        "George business-partners the milling and packing operations",
        "2025-09-29T14:04:00.000Z",
      ),
    ),
    /* Evidenced, and the Brief's wording is what let it through. "Builds" is not
     * "owns", and the day-30 checkpoint on his placement says so. See placements.ts. */
    evidenced(
      "crt_fbp_2",
      citeSighting(
        "sig_amankwah_1",
        "builds the weekly rolling forecast",
        "2025-09-29T14:07:00.000Z",
      ),
    ),
  ],
);

export { evidence, findings, reviews };
