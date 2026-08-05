/* Twelve people, and every one of them carries at least one resolving Sighting with a
 * source, a retrieved_at and a snapshot of what that source said — invariant 9. There
 * is no person here who arrived from nowhere, because in the real thing there cannot be.
 *
 * Eight have no email address. That is not an oversight in the fixture; it is what a
 * sourced person is. Nobody has spoken to them, so there is nothing to contact them by
 * except the source they were found on, and the interface has to say so rather than
 * render an empty field where an email would go.
 *
 * Every name, employer, URL and snapshot below is invented.
 */
import { ORG_ID } from "./organisation";
import type { Person, Sighting } from "./types";

export const people: Person[] = [
  {
    id: "per_marchetti",
    organization_id: ORG_ID,
    full_name: "Aileen Marchetti",
    headline: "Financial Controller, Denholm Castings",
    current_employer: "Denholm Castings Ltd",
    location: "Rotherham",
    // Replied to the approach, so we have both. She was still sourced, not inbound.
    email: "a.marchetti@example.com",
    phone: "07700 900118",
  },
  {
    id: "per_nandakumar",
    organization_id: ORG_ID,
    full_name: "Priya Nandakumar",
    headline: "Head of Finance, Kestrel Industrial Group",
    current_employer: "Kestrel Industrial Group",
    location: "Sheffield",
    email: null,
    phone: null,
  },
  {
    id: "per_oyelaran",
    organization_id: ORG_ID,
    full_name: "Daniel Oyelaran",
    headline: "Finance Manager, Vantage Fabrications",
    current_employer: "Vantage Fabrications Ltd",
    location: "Barnsley",
    email: null,
    phone: "0114 496 0182",
  },
  {
    id: "per_ibbotson",
    organization_id: ORG_ID,
    full_name: "Frances Ibbotson",
    headline: "Group Financial Controller, Northgate Plastics",
    current_employer: "Northgate Plastics Holdings Ltd",
    location: "Harrogate",
    email: "f.ibbotson@example.com",
    phone: "07700 900431",
  },
  {
    id: "per_reith",
    organization_id: ORG_ID,
    full_name: "Callum Reith",
    headline: "Financial Controller, Selby Aggregates",
    current_employer: "Selby Aggregates Ltd",
    location: "Doncaster",
    email: "c.reith@example.com",
    phone: "07700 900276",
  },
  {
    id: "per_shanbhag",
    organization_id: ORG_ID,
    full_name: "Meera Shanbhag",
    headline: "Finance Director, Ravensworth Tooling",
    current_employer: "Ravensworth Tooling Ltd",
    location: "Leeds",
    email: null,
    phone: null,
  },
  {
    id: "per_trelawny",
    organization_id: ORG_ID,
    full_name: "Owen Trelawny",
    headline: "Financial Controller, Hartwell Precision Components",
    current_employer: "Hartwell Precision Components Ltd",
    location: "Sheffield",
    email: "o.trelawny@example.com",
    phone: "07700 900604",
  },
  {
    id: "per_lloyd_price",
    organization_id: ORG_ID,
    full_name: "Bethan Lloyd-Price",
    headline: "Management Accountant, Cawthorne Foods",
    current_employer: "Cawthorne Foods Ltd",
    location: "Wakefield",
    email: null,
    // The same switchboard number as Ivan Petrescu below. Both were taken from a
    // company page, and neither is a personal line — which is the point of the signal.
    phone: "0113 496 0550",
  },
  {
    id: "per_petrescu",
    organization_id: ORG_ID,
    full_name: "Ivan Petrescu",
    headline: "Finance Manager, Stelmark Engineering",
    current_employer: "Stelmark Engineering Ltd",
    location: "Chesterfield",
    email: null,
    phone: "0113 496 0550",
  },
  {
    id: "per_rahman",
    organization_id: ORG_ID,
    full_name: "Sadia Rahman",
    headline: "Financial Controller, Brindley Composites",
    current_employer: "Brindley Composites Ltd",
    location: "Huddersfield",
    email: null,
    phone: null,
  },
  {
    id: "per_amankwah",
    organization_id: ORG_ID,
    full_name: "George Amankwah",
    headline: "Finance Business Partner, Calder Vale Foods",
    current_employer: "Calder Vale Foods Ltd",
    location: "Wakefield",
    email: null,
    phone: null,
  },
  {
    id: "per_ferreira_osei",
    organization_id: ORG_ID,
    full_name: "Lucia Ferreira-Osei",
    headline: "Financial Controller, Aldwick Instruments",
    current_employer: "Aldwick Instruments Ltd",
    location: "Bradford",
    email: null,
    phone: null,
  },
];

export const SEARCH_MARCH_ID = "sea_fc_march";
export const SEARCH_JUNE_ID = "sea_fc_june";

/* retrieved_at is the day the source was read, not the day the page was written. What
 * the record can honestly say later is how old the reading is — never whether the page
 * still says this, which would need another fetch. */
export const sightings: Sighting[] = [
  {
    id: "sig_marchetti_1",
    organization_id: ORG_ID,
    person_id: "per_marchetti",
    search_id: SEARCH_MARCH_ID,
    source_url: "https://www.denholmcastings.example/about/our-leadership",
    source_name: "denholmcastings.example",
    source_kind: "Company leadership page",
    retrieved_at: "2026-03-14T11:22:00.000Z",
    snapshot_excerpt:
      "Aileen Marchetti — Financial Controller. Aileen joined Denholm in 2017 as Management Accountant and was appointed Financial Controller in 2020. She is CIMA qualified and leads the finance team at our Rotherham foundry.",
    resolving: true,
  },
  {
    id: "sig_nandakumar_1",
    organization_id: ORG_ID,
    person_id: "per_nandakumar",
    search_id: SEARCH_MARCH_ID,
    source_url: "https://www.kestrelindustrial.example/company/management",
    source_name: "kestrelindustrial.example",
    source_kind: "Company management page",
    retrieved_at: "2026-03-14T11:31:00.000Z",
    snapshot_excerpt:
      "Priya Nandakumar, Head of Finance. Priya oversees financial reporting for the group's four operating companies and joined Kestrel in 2021 from a Big Four background.",
    resolving: true,
  },
  {
    id: "sig_nandakumar_2",
    organization_id: ORG_ID,
    person_id: "per_nandakumar",
    search_id: null,
    source_url: "https://www.manufacturingfinanceforum.example/2025/speakers",
    source_name: "manufacturingfinanceforum.example",
    source_kind: "Conference speaker listing",
    // Read seventeen months ago. The list is for an event that has already happened.
    retrieved_at: "2025-02-19T15:08:00.000Z",
    snapshot_excerpt:
      "Speakers · Manufacturing Finance Forum 2025. Priya Nandakumar, Group Financial Controller, Kestrel Industrial Group. Priya will speak on consolidating four ledgers onto a single instance.",
    resolving: false,
  },
  {
    id: "sig_oyelaran_1",
    organization_id: ORG_ID,
    person_id: "per_oyelaran",
    search_id: null,
    source_url: "https://www.vantagefabrications.example/team",
    source_name: "vantagefabrications.example",
    source_kind: "Company team page",
    retrieved_at: "2025-09-30T09:12:00.000Z",
    snapshot_excerpt:
      "Daniel Oyelaran, Finance Manager. Daniel is responsible for management accounts, costing and the annual audit file at our Barnsley works.",
    resolving: true,
  },
  {
    id: "sig_oyelaran_2",
    organization_id: ORG_ID,
    person_id: "per_oyelaran",
    search_id: SEARCH_MARCH_ID,
    source_url: "https://www.vantagefabrications.example/news/finance-team-expands",
    source_name: "vantagefabrications.example",
    source_kind: "Company news item",
    retrieved_at: "2026-03-14T11:40:00.000Z",
    snapshot_excerpt:
      "Our finance team expands. Finance Manager Daniel Oyelaran welcomes two new assistant accountants to the Barnsley office, taking the department to five.",
    resolving: false,
  },
  {
    id: "sig_ibbotson_1",
    organization_id: ORG_ID,
    person_id: "per_ibbotson",
    search_id: null,
    source_url: "https://apply.hallowayfinch.example/roles/bramhall-fc/a41f",
    source_name: "apply.hallowayfinch.example",
    source_kind: "Inbound application",
    retrieved_at: "2026-04-02T19:41:00.000Z",
    snapshot_excerpt:
      "Applied for Financial Controller, Bramhall Precision Group. Frances Ibbotson, Group Financial Controller at Northgate Plastics Holdings. CV attached. Notice period three months.",
    resolving: true,
  },
  {
    id: "sig_reith_1",
    organization_id: ORG_ID,
    person_id: "per_reith",
    search_id: null,
    source_url: "https://apply.hallowayfinch.example/roles/bramhall-fc/b7c2",
    source_name: "apply.hallowayfinch.example",
    source_kind: "Inbound application",
    retrieved_at: "2026-04-11T08:03:00.000Z",
    snapshot_excerpt:
      "Applied for Financial Controller, Bramhall Precision Group. Callum Reith, Financial Controller at Selby Aggregates. CV attached. Available at one month.",
    resolving: true,
  },
  {
    id: "sig_shanbhag_1",
    organization_id: ORG_ID,
    person_id: "per_shanbhag",
    search_id: SEARCH_MARCH_ID,
    source_url: "https://www.yorkshiremanufacturingreview.example/2025/11/ravensworth-tooling",
    source_name: "yorkshiremanufacturingreview.example",
    source_kind: "Trade press article",
    retrieved_at: "2026-03-14T12:04:00.000Z",
    snapshot_excerpt:
      "Ravensworth Tooling has completed a £4m reinvestment in its Leeds cutting-tool plant. Finance Director Meera Shanbhag said the capital programme was funded from retained profit and a term loan, with no external equity involved. Ms Shanbhag, who qualified with ACCA, joined the family-owned business in 2016 and leads a finance and IT team of six.",
    resolving: true,
  },
  {
    id: "sig_trelawny_1",
    organization_id: ORG_ID,
    person_id: "per_trelawny",
    search_id: SEARCH_MARCH_ID,
    source_url: "https://www.hartwellprecision.example/about/leadership",
    source_name: "hartwellprecision.example",
    source_kind: "Company leadership page",
    retrieved_at: "2026-03-14T11:52:00.000Z",
    snapshot_excerpt:
      "Owen Trelawny, Financial Controller. Owen joined Hartwell in 2021 following the acquisition by Ardenne Capital and is responsible for reporting, costing and the finance team.",
    resolving: true,
  },
  {
    id: "sig_lloyd_price_1",
    organization_id: ORG_ID,
    person_id: "per_lloyd_price",
    search_id: SEARCH_MARCH_ID,
    source_url: "https://www.cawthornefoods.example/contact/finance",
    source_name: "cawthornefoods.example",
    source_kind: "Company contact page",
    retrieved_at: "2026-03-14T12:15:00.000Z",
    snapshot_excerpt:
      "Finance enquiries: Bethan Lloyd-Price, Management Accountant. Telephone 0113 496 0550. Cawthorne Foods Ltd, Wakefield.",
    resolving: true,
  },
  {
    id: "sig_petrescu_1",
    organization_id: ORG_ID,
    person_id: "per_petrescu",
    search_id: SEARCH_MARCH_ID,
    source_url: "https://www.stelmarkengineering.example/our-people",
    source_name: "stelmarkengineering.example",
    source_kind: "Company people page",
    retrieved_at: "2026-03-14T12:26:00.000Z",
    snapshot_excerpt:
      "Ivan Petrescu, Finance Manager. Ivan has been with Stelmark since August 2019. He prepares the monthly management accounts, owns the standard costing model across both machine shops, and manages a team of three in the finance office. Stelmark is a subcontract engineering business supplying the rail and off-highway sectors from a single site in Chesterfield. Telephone 0113 496 0550.",
    resolving: true,
  },
  {
    id: "sig_petrescu_2",
    organization_id: ORG_ID,
    person_id: "per_petrescu",
    search_id: SEARCH_MARCH_ID,
    source_url: "https://www.marrickalloys.example/about/team-archive",
    source_name: "marrickalloys.example",
    source_kind: "Company team page, archived section",
    retrieved_at: "2026-03-14T12:29:00.000Z",
    snapshot_excerpt:
      "Previous team members. Ivan Petrescu, Financial Controller, March 2018 to March 2020. Ivan led the finance function at our Rotherham melting shop.",
    resolving: false,
  },
  {
    id: "sig_rahman_1",
    organization_id: ORG_ID,
    person_id: "per_rahman",
    search_id: SEARCH_MARCH_ID,
    source_url: "https://www.brindleycomposites.example/about",
    source_name: "brindleycomposites.example",
    source_kind: "Company about page",
    retrieved_at: "2026-03-14T12:38:00.000Z",
    snapshot_excerpt:
      "Sadia Rahman, Financial Controller. Sadia joined Brindley in 2022 and is responsible for reporting, treasury and the group's grant claims.",
    resolving: true,
  },
  {
    id: "sig_amankwah_1",
    organization_id: ORG_ID,
    person_id: "per_amankwah",
    search_id: null,
    source_url: "https://www.thornburymills.example/team/finance",
    source_name: "thornburymills.example",
    source_kind: "Company team page",
    retrieved_at: "2025-09-15T14:20:00.000Z",
    snapshot_excerpt:
      "George Amankwah, Senior Management Accountant. George business-partners the milling and packing operations and builds the weekly rolling forecast.",
    resolving: true,
  },
  {
    id: "sig_ferreira_osei_1",
    organization_id: ORG_ID,
    person_id: "per_ferreira_osei",
    search_id: SEARCH_JUNE_ID,
    source_url: "https://www.aldwickinstruments.example/company/people",
    source_name: "aldwickinstruments.example",
    source_kind: "Company people page",
    retrieved_at: "2026-06-02T10:11:00.000Z",
    snapshot_excerpt:
      "Lucia Ferreira-Osei, Financial Controller. Lucia joined Aldwick in 2023 from a plastics background and is ACA qualified. She reports to the Managing Director and manages a team of four.",
    resolving: true,
  },

  /* Three sightings that are not yet anybody. This is the state the search screen is
   * really about: a source has been read, and no Person exists until someone decides
   * one should. */
  {
    id: "sig_open_vaughan",
    organization_id: ORG_ID,
    person_id: null,
    search_id: SEARCH_JUNE_ID,
    source_url: "https://www.halsteadvale.example/meet-the-team",
    source_name: "halsteadvale.example",
    source_kind: "Company team page",
    retrieved_at: "2026-06-02T10:18:00.000Z",
    snapshot_excerpt:
      "Rhodri Vaughan, Head of Finance. Rhodri has led the finance function at Halstead Vale Engineering since 2020 and took the business through its ERP replacement in 2024. He is ACCA qualified.",
    resolving: true,
  },
  {
    id: "sig_open_ashworth",
    organization_id: ORG_ID,
    person_id: null,
    search_id: SEARCH_JUNE_ID,
    source_url: "https://www.pilkingtonrowe.example/news/senior-appointments-2026",
    source_name: "pilkingtonrowe.example",
    source_kind: "Company news item",
    retrieved_at: "2026-06-02T10:24:00.000Z",
    snapshot_excerpt:
      "Pilkington Rowe Composites has appointed Nia Ashworth as Financial Controller. Nia joins from a tier-one automotive supplier where she managed a team of five and closed month-end to a private equity reporting calendar.",
    resolving: true,
  },
  {
    id: "sig_open_bak",
    organization_id: ORG_ID,
    person_id: null,
    search_id: SEARCH_JUNE_ID,
    source_url: "https://www.cranmorepackaging.example/leadership",
    source_name: "cranmorepackaging.example",
    source_kind: "Company leadership page",
    retrieved_at: "2026-06-02T10:29:00.000Z",
    snapshot_excerpt:
      "Stefan Bąk, Financial Controller. Stefan is responsible for the management accounts, the annual audit and the costing model at our Dewsbury converting plant.",
    resolving: true,
  },
];
