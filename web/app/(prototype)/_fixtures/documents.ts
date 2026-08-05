/* Four CVs, written so that specific sentences support specific criteria and others
 * plainly do not. They are the reason the citation component can be trusted here: the
 * offsets in reviews.ts are computed against these exact strings, and a quote that no
 * longer appears in one of them fails at build.
 *
 * Parsed text carries a form feed at each page break, which is what a text extractor
 * emits. Pages and paragraphs are derived from the string by spansOf(), so they cannot
 * drift from it.
 *
 * sha256 below is a placeholder digest, not a computed one. It is the only field in
 * these fixtures that does no work, and it is here because the entity has it.
 */
import { spansOf } from "./offsets";
import { ORG_ID } from "./organisation";
import type { Document } from "./types";

const trelawnyCv = `OWEN TRELAWNY
Financial Controller · Sheffield

PROFILE

Qualified accountant, eleven years in manufacturing finance, seven of them in
private-equity-backed businesses. Used to a lean function where the controller also
does the work.

EXPERIENCE

Hartwell Precision Components Ltd — Financial Controller
March 2021 to present

Hartwell is a £41m precision machining business acquired by Ardenne Capital in 2020.
It supplies flight-critical components to two tier-one aerospace primes from sites in
Sheffield and Rochdale.

I own the month-end close, which I brought from fourteen working days to five within
my first two quarters, and I have closed every month-end since the acquisition to the
reporting timetable Ardenne set. The board pack and the quarterly investment committee
return are both mine.

I led the migration from Sage 200 to Microsoft Dynamics 365 Business Central across
two sites, from selection through parallel running to cutover in September 2023. The
finance workstream was mine end to end: chart of accounts redesign, stock valuation
logic, and the reconciliation of eleven years of legacy transactions.

I manage a team of four: two management accountants, an assistant accountant and a
purchase ledger clerk. I recruited three of the four.
\fGrendale Castings Group — Senior Management Accountant
July 2016 to February 2021

Iron and steel castings for the rail and energy sectors. Four foundries, 380 staff.
Responsible for standard costing across the foundry estate and for the annual
recalculation of labour and burden rates. Prepared the statutory accounts and ran the
audit relationship.

Pennine Audit Services — Audit Senior
September 2013 to June 2016

Audit and accounts for owner-managed businesses in engineering and food production.

QUALIFICATIONS

ACA, qualified 2016, Institute of Chartered Accountants in England and Wales.
BSc Mathematics, University of Leeds, 2013.

SYSTEMS

Microsoft Dynamics 365 Business Central. Sage 200. Excel to an advanced standard.
Power BI for board reporting.`;

const ibbotsonCv = `FRANCES IBBOTSON
Group Financial Controller · Harrogate

Northgate Plastics Holdings Ltd — Group Financial Controller
January 2019 to present

Northgate is an injection moulding group of three sites in Yorkshire and the East
Midlands, turnover £62m, majority owned by Slaithwaite Equity Partners since the 2018
buy-out. I run the group close on a five-day timetable and present the consolidated
result to the investor board each month.

My team is five: a financial accountant, two management accountants and two
transactional staff.

Recent work includes the renegotiation of the group's invoice discounting facility, a
standard costing model rolled out across the three sites, and the first consolidated
statutory accounts prepared under FRS 102 following the buy-out.

Northgate Plastics Ltd — Management Accountant
April 2015 to December 2018

Site accounting for the Wetherby moulding plant. Weekly labour and scrap reporting,
monthly stock counts, and the standard cost roll.

Kelding Timber Products — Assistant Accountant
August 2012 to March 2015

QUALIFICATIONS

CIMA, qualified 2017.
AAT Level 4, 2012.

SYSTEMS

Sage 200 throughout, and Excel. I have not run a system implementation myself. The
Dynamics project at Northgate is led by the group IT director and I sit on the
steering group as the finance representative.`;

const reithCv = `CALLUM REITH
Financial Controller · Doncaster

Selby Aggregates Ltd — Financial Controller
June 2022 to present

Selby Aggregates is a family-owned quarrying and ready-mix concrete business, turnover
£18m, 90 staff, third generation and no outside investors. I am the whole finance
function apart from a part-time purchase ledger clerk. Month-end takes eight working
days and I close it on my own.

Responsible for VAT, PAYE, the annual accounts file, the insurance renewal and the
relationship with our accountants. I also run the weighbridge reporting, which nobody
else wanted.

Kirkgate Motor Group — Management Accountant
2018 to 2022

Dealership accounting across four franchises. Composite reporting to the manufacturer
timetable, used-vehicle stock provisioning, and the monthly departmental packs.

Barrow & Slack Chartered Accountants — Semi-Senior
2015 to 2018

Accounts preparation and personal tax for owner-managed businesses.

QUALIFICATIONS

ACCA, qualified 2021.
AAT Level 4, 2015.

SYSTEMS

Sage 50, Kerridge, Excel.

OTHER

Full clean driving licence. Governor at a local primary school.`;

const marchettiCv = `AILEEN MARCHETTI
Financial Controller · Rotherham

Denholm Castings Ltd — Financial Controller
2020 to present

Denholm is an aluminium and zinc die-casting business supplying the automotive and
domestic appliance markets from a single site in Rotherham. Turnover £27m, 145 staff.

The business was acquired by Threshfield Industrial Partners in March 2021 and I have
closed every month-end since under their reporting calendar, which moved us from a
ten-day to a six-day close. I prepare the monthly investor pack and attend the
quarterly board.

I manage three: a management accountant, a credit controller and a purchase ledger
assistant.

Across 2022 and 2023 I ran the replacement of our legacy MRP system with Epicor
Kinetic, working alongside the operations director. Finance data migration, opening
balances and the new costing structure were mine.

Denholm Castings Ltd — Management Accountant
2017 to 2020

Standard costing, scrap and yield reporting, and the annual stock take across three
cells.

Wharncliffe Metals — Assistant Management Accountant
2014 to 2017

QUALIFICATIONS

CIMA, qualified 2019.

SYSTEMS

Epicor Kinetic, Sage 200, Excel.`;

function build(
  id: string,
  person_id: string,
  filename: string,
  sha256: string,
  uploaded_at: string,
  parsed_text: string,
  properties: Document["properties"],
): Document {
  const spans = spansOf(parsed_text);
  return {
    id,
    organization_id: ORG_ID,
    person_id,
    kind: "cv",
    filename,
    sha256,
    uploaded_at,
    parsed_text,
    pages: spans.pages,
    paragraphs: spans.paragraphs,
    properties,
  };
}

export const documents: Document[] = [
  build(
    "doc_trelawny_cv",
    "per_trelawny",
    "owen-trelawny-cv.pdf",
    "9f2c41a0b7d3e58c16aa4b90de77c2f1a5b8043e6c19d7f2ab3c5e8017d64a9b",
    "2026-04-24T16:12:00.000Z",
    trelawnyCv,
    {
      author: "Owen Trelawny",
      producer: "Microsoft Word for Microsoft 365",
      created: "2026-04-21T20:14:00.000Z",
    },
  ),
  build(
    "doc_ibbotson_cv",
    "per_ibbotson",
    "frances-ibbotson-cv.pdf",
    "3a7e15c2904bd6f8e21c73aa50d9b4176ecf28306a5d1b9c74e0f3a682cd5170",
    "2026-04-02T19:41:00.000Z",
    ibbotsonCv,
    {
      /* Observed, not interpreted. The Crosscheck signal quotes this field and says
       * what it says; it does not say what it means. */
      author: "M. Ferriby",
      producer: "LibreOffice 7.4",
      created: "2026-03-29T11:02:00.000Z",
    },
  ),
  build(
    "doc_reith_cv",
    "per_reith",
    "callum-reith-cv.pdf",
    "c418d0a739e5b26f8130ca47d92be605173fa8c2409de6b71538ac02fe94b3d6",
    "2026-04-11T08:03:00.000Z",
    reithCv,
    {
      author: "Callum Reith",
      producer: "Google Docs Renderer",
      created: "2026-04-10T21:36:00.000Z",
    },
  ),
  build(
    "doc_marchetti_cv",
    "per_marchetti",
    "aileen-marchetti-cv.pdf",
    "58b09e1c7d426af3095b2ce84170d6ba32f7e5901ac48d63b7205fe9184c30ad",
    "2026-05-06T10:27:00.000Z",
    marchettiCv,
    {
      author: "Aileen Marchetti",
      producer: "Microsoft Word for Microsoft 365",
      created: "2026-05-05T18:50:00.000Z",
    },
  ),
];
