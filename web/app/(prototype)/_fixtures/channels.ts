/* Sourcing channels, named by the agency rather than enumerated by us.
 *
 * The structured process asks what each channel is producing. That is answerable here
 * as counts — how many were added, how many reached the screening call, how many were
 * submitted — and those numbers judge the channel, not a person, which is the whole of
 * the distinction invariant 2 turns on.
 *
 * What is deliberately absent: cost per hire, and quality of hire. Cost because the
 * fixtures have no spend to divide and an invented one would be the only number in
 * this prototype that means nothing. Quality of hire because it is a score attached to
 * a named individual, applied after the fact, and it is the same object this product
 * refuses at the front of the process wearing a hat.
 */
import { ORG_ID } from "./organisation";
import type { Channel } from "./types";

export const channels: Channel[] = [
  {
    id: "chn_company_sites",
    organization_id: ORG_ID,
    name: "Company sites",
    kind: "outbound",
    note: "Leadership, team and contact pages read directly. Slow, and every record it produces has a resolving source by construction.",
  },
  {
    id: "chn_trade_press",
    organization_id: ORG_ID,
    name: "Trade press",
    kind: "outbound",
    note: "Sector titles and awards listings. Fewer people, and the ones it finds tend to be quotable on the sector criterion.",
  },
  {
    id: "chn_inbound",
    organization_id: ORG_ID,
    name: "Inbound apply",
    kind: "inbound",
    note: "The agency's own advert. Arrives with an email and a CV, which is the exception in this pipeline rather than the rule.",
  },
  {
    id: "chn_referral",
    organization_id: ORG_ID,
    name: "Referral",
    kind: "referral",
    note: "Named introduction from a placed candidate or a client contact.",
  },
  {
    id: "chn_network",
    organization_id: ORG_ID,
    name: "Agency network",
    kind: "network",
    note: "People already on the agency's own record from a previous role.",
  },
];
