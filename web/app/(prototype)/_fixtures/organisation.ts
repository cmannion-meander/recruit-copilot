/* One organisation, one recruiter. Everything in this folder is invented — there is no
 * real person, no real company and no real candidate anywhere in these fixtures, and
 * there never will be. See docs/decisions/0010. */
import type { Client, Contact, Organization, User } from "./types";

export const ORG_ID = "org_halloway_finch";

export const organization: Organization = {
  id: ORG_ID,
  name: "Halloway & Finch",
  wordmark: "HALLOWAY & FINCH",
  place: "Leeds",
};

/** One recruiter. A four-person agency where the person who sources also submits. */
export const recruiter: User = {
  id: "usr_ruth_halloway",
  organization_id: ORG_ID,
  name: "Ruth Halloway",
  title: "Director",
};

export const users: User[] = [recruiter];

export const clients: Client[] = [
  {
    id: "cli_bramhall",
    organization_id: ORG_ID,
    name: "Bramhall Precision Group",
    description:
      "Precision machining and sub-assembly for the aerospace and energy supply chains. Two sites, 310 staff, £48m turnover. Bought out by Calderstone Partners in 2024.",
  },
  {
    id: "cli_calder_vale",
    organization_id: ORG_ID,
    name: "Calder Vale Foods",
    description:
      "Family-owned chilled ready meals manufacturer supplying two of the four largest UK grocers. One site near Wakefield, 220 staff.",
  },
];

export const contacts: Contact[] = [
  {
    id: "con_bramhall_cfo",
    organization_id: ORG_ID,
    client_id: "cli_bramhall",
    name: "Elin Whitcombe",
    title: "Chief Financial Officer",
    email: "e.whitcombe@bramhallprecision.example",
  },
  {
    id: "con_calder_hr",
    organization_id: ORG_ID,
    client_id: "cli_calder_vale",
    name: "Joseph Aldridge",
    title: "Head of People",
    email: "j.aldridge@caldervalefoods.example",
  },
];
