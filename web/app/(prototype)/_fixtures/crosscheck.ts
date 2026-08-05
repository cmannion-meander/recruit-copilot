/* Crosscheck signals.
 *
 * Every one of these is arithmetic or a string comparison over records the organisation
 * already holds. None of them is a model's opinion, and none of them carries a
 * probability, a severity, a colour or a rank. The detail field says what was observed
 * and stops. Whether it means anything is the recruiter's judgement, recorded as either
 * a resolution or an Override with a written reason.
 *
 * The word "fraud" does not appear here, on any screen, or in anything a candidate can
 * read. These are observations about a record, not accusations about a person.
 *
 * Two of the four types cannot be rendered as an Evidence citation — see the OPEN
 * QUESTION on CrosscheckArtifact in types.ts.
 */
import { locate } from "./offsets";
import { ORG_ID, recruiter } from "./organisation";
import { sightings } from "./people";
import type { CrosscheckSignal } from "./types";

function sightingSpan(sightingId: string, quote: string) {
  const sighting = sightings.find((candidate) => candidate.id === sightingId);
  if (!sighting) throw new Error(`crosscheck: no sighting ${sightingId}`);
  const located = locate(sighting.snapshot_excerpt, quote, `${sightingId} snapshot`);
  return {
    kind: "sighting" as const,
    sighting_id: sightingId,
    char_start: located.char_start,
    char_end: located.char_end,
  };
}

export const crosscheckSignals: CrosscheckSignal[] = [
  {
    id: "cks_petrescu_timeline",
    organization_id: ORG_ID,
    candidacy_id: "cnd_petrescu",
    type: "timeline_overlap",
    detail:
      "Two stated roles overlap by seven months. Stelmark Engineering is stated as from August 2019. Marrick Alloys is stated as to March 2020.",
    artifact: sightingSpan(
      "sig_petrescu_2",
      "Ivan Petrescu, Financial Controller, March 2018 to March 2020.",
    ),
    observed_at: "2026-03-14T12:31:00.000Z",
    resolution: null,
  },
  {
    id: "cks_petrescu_phone",
    organization_id: ORG_ID,
    candidacy_id: "cnd_petrescu",
    type: "contact_collision",
    detail:
      "The telephone number recorded for this person, 0113 496 0550, is also recorded for Bethan Lloyd-Price. Both were read from a company page on 14 March 2026.",
    artifact: {
      kind: "record",
      label: "Bethan Lloyd-Price · candidacy on Financial Controller, Bramhall Precision Group",
      detail: "Telephone 0113 496 0550, from cawthornefoods.example, read 14 March 2026.",
      candidacy_id: "cnd_lloyd_price",
    },
    observed_at: "2026-03-14T12:31:00.000Z",
    resolution: null,
  },
  {
    id: "cks_ibbotson_author",
    organization_id: ORG_ID,
    candidacy_id: "cnd_ibbotson",
    type: "document_author",
    detail:
      "The document properties of frances-ibbotson-cv.pdf name the author as M. Ferriby. The candidate is Frances Ibbotson.",
    artifact: {
      kind: "document_property",
      document_id: "doc_ibbotson_cv",
      property: "Author",
      value: "M. Ferriby",
    },
    observed_at: "2026-04-02T19:42:00.000Z",
    resolution: null,
  },
  {
    id: "cks_oyelaran_duplicate",
    organization_id: ORG_ID,
    candidacy_id: "cnd_oyelaran",
    type: "duplicate_candidacy",
    detail:
      "This person holds another candidacy in this organisation: Finance Business Partner, Calder Vale Foods, created 4 November 2025.",
    artifact: {
      kind: "record",
      label: "Daniel Oyelaran · Finance Business Partner, Calder Vale Foods",
      detail: "Created 4 November 2025. Closed 2 February 2026, no response.",
      candidacy_id: "cnd_oyelaran_fbp",
    },
    observed_at: "2026-03-14T13:06:00.000Z",
    resolution: {
      kind: "resolution",
      resolved_by: recruiter.id,
      resolved_at: "2026-03-16T09:40:00.000Z",
      note: "Same person, different role, fourteen months apart. The earlier candidacy closed unanswered and this one was created from a fresh sighting.",
    },
  },
  {
    id: "cks_trelawny_contact",
    organization_id: ORG_ID,
    candidacy_id: "cnd_trelawny",
    type: "contact_collision",
    detail:
      "The email address recorded for this person is also recorded against a candidacy closed in 2025 under a different name.",
    artifact: {
      kind: "record",
      label: "Management Accountant, Calder Vale Foods · closed August 2025",
      detail:
        "Email o.trelawny@example.com recorded against R. Trelawny. That candidacy predates this record set and is held in the organisation's history.",
      // Deliberately null: the record it points at is not one of the twelve, which is
      // itself part of why this artifact cannot be an Evidence citation.
      candidacy_id: null,
    },
    observed_at: "2026-03-14T13:15:00.000Z",
    resolution: {
      kind: "override",
      user_id: recruiter.id,
      reason_text:
        "Shared household. Confirmed by telephone on 22 July that R. Trelawny is his partner and the address was used for both applications. Owen supplied a separate address for this role.",
      created_at: "2026-07-22T14:18:00.000Z",
    },
  },
];
