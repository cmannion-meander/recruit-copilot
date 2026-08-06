/* What each candidate has actually been told.
 *
 * The stage messages on the Brief are templates; these are the sent copies, frozen
 * with the wording that went out. The candidate reads these same rows — there is no
 * internal version of a message and no note attached to one that the person it is
 * about cannot see.
 *
 * Bethan Lloyd-Price has one message, sent five months ago, and her candidacy closes
 * in three days. That is the shape of the failure invariant 6 exists to stop, sitting
 * in the fixtures on purpose: an auto-closure alone is a polite way of ghosting
 * somebody, and the gap between her first message and her last is what the interface
 * has to make visible.
 */
import { ORG_ID, recruiter } from "./organisation";
import type { CandidateMessage } from "./types";

let sequence = 0;
function message(
  candidacy_id: string,
  kind: CandidateMessage["kind"],
  stage_id: string | null,
  sent_at: string,
  body: string,
): CandidateMessage {
  sequence += 1;
  return {
    id: `msg_${sequence}`,
    organization_id: ORG_ID,
    candidacy_id,
    kind,
    stage_id,
    sent_at,
    sent_by: recruiter.id,
    body,
  };
}

export const candidateMessages: CandidateMessage[] = [
  // Aileen Marchetti
  message(
    "cnd_marchetti",
    "stage",
    "stg_fc_sourced",
    "2026-04-20T09:35:00.000Z",
    "I came across your profile on the Denholm site while working on a Financial Controller role for a PE-backed manufacturer near Rotherham. I have not shared your details with anyone. If you would like to hear about it, reply and I will call you; if not, tell me and I will close the record.",
  ),
  message(
    "cnd_marchetti",
    "stage",
    "stg_fc_contacted",
    "2026-04-28T14:10:00.000Z",
    "Good to speak. The assessment is against five written criteria agreed with the client, attached. The screening call will cover two of them: closing a month-end under a private-equity calendar, and the team you manage. Nothing is asked that is not on that list.",
  ),

  // Priya Nandakumar — approached, no reply yet
  message(
    "cnd_nandakumar",
    "stage",
    "stg_fc_sourced",
    "2026-03-14T13:05:00.000Z",
    "I came across your profile while working on a Financial Controller role for a manufacturing business in South Yorkshire. I have not shared your details with anyone. If you would like to hear about it, reply and I will call you; if not, tell me and I will close the record.",
  ),

  // Daniel Oyelaran
  message(
    "cnd_oyelaran",
    "stage",
    "stg_fc_sourced",
    "2026-03-14T13:08:00.000Z",
    "We spoke in November about a role at Calder Vale that came to nothing. A Financial Controller position has come up at a manufacturer near Rotherham that fits you better. Worth a call?",
  ),
  message(
    "cnd_oyelaran",
    "stage",
    "stg_fc_contacted",
    "2026-03-18T11:25:00.000Z",
    "Thanks for the call. I have the five criteria the client has asked for, attached. Have a look and tell me whether the ERP one is something you can evidence — if not, this is not the role and I will say so now rather than in three weeks.",
  ),

  // Frances Ibbotson — inbound
  message(
    "cnd_ibbotson",
    "stage",
    "stg_fc_sourced",
    "2026-04-02T19:45:00.000Z",
    "Thank you for applying. Your CV has been read against the five criteria the client agreed for this role, and those criteria are attached so you can see what is being asked. I will come back to you within three working days either way.",
  ),
  message(
    "cnd_ibbotson",
    "stage",
    "stg_fc_screening",
    "2026-04-07T09:00:00.000Z",
    "The screening call is thirty minutes on Thursday at 2pm. I will ask about the group close under Slaithwaite's calendar and about your team. Bring an example of each; I will be quoting what you tell me into the record the client sees.",
  ),
  /* Nothing at the competency call. She was assessed there on 16 April and has heard
   * nothing since — which is the gap the stage gate exists to catch, sitting in the
   * fixtures on purpose. */

  // Callum Reith — rejected
  message(
    "cnd_reith",
    "stage",
    "stg_fc_sourced",
    "2026-04-11T08:10:00.000Z",
    "Thank you for applying. Your CV has been read against the five criteria the client agreed for this role, attached. I will come back to you within three working days either way.",
  ),
  message(
    "cnd_reith",
    "rejection",
    null,
    "2026-05-19T15:30:00.000Z",
    "As I said on the phone: two of the five criteria are evidenced in what I hold. The client has asked for private-equity reporting, a system implementation you led, and line management of three or more, and none of those is in your record. That is a statement about this brief, not about your work — Selby is a smaller function and you run all of it. I have kept your details for the Calder Vale role we discussed, with your permission. You can read exactly what was recorded at the link below.",
  ),

  // Meera Shanbhag — excluded
  message(
    "cnd_shanbhag",
    "stage",
    "stg_fc_sourced",
    "2026-03-14T13:15:00.000Z",
    "I came across the Yorkshire Manufacturing Review piece on the Leeds reinvestment. I am working on a Financial Controller role for a PE-backed manufacturer near Rotherham. Worth a conversation?",
  ),
  message(
    "cnd_shanbhag",
    "rejection",
    null,
    "2026-04-08T10:10:00.000Z",
    "Understood, and thank you for being straight with me. I have closed the record with the reason you gave — that you are a shareholder and expect to be at Ravensworth until the next generation takes over — so nobody here approaches you for this client again. If that changes, tell me.",
  ),

  // Owen Trelawny — submitted
  message(
    "cnd_trelawny",
    "stage",
    "stg_fc_sourced",
    "2026-03-14T13:20:00.000Z",
    "I came across your profile on the Hartwell site while working on a Financial Controller role for a PE-backed manufacturer near Rotherham. I have not shared your details with anyone. If you would like to hear about it, reply and I will call you.",
  ),
  message(
    "cnd_trelawny",
    "stage",
    "stg_fc_screening",
    "2026-04-22T10:00:00.000Z",
    "The screening call is thirty minutes on Friday at 11am. I will ask about closing month-end under Ardenne's calendar and about your team. Bring an example of each; I will be quoting what you tell me into the record the client sees.",
  ),
  message(
    "cnd_trelawny",
    "stage",
    "stg_fc_competency",
    "2026-05-06T09:30:00.000Z",
    "The next call is about the Dynamics migration and nothing else. What you owned, what went wrong, what you would do differently.",
  ),
  message(
    "cnd_trelawny",
    "submission",
    "stg_fc_submitted",
    "2026-07-22T16:10:00.000Z",
    "Your record went to Bramhall Precision Group today. You can read exactly what was written and the passages it was drawn from at the link below. Nothing was sent that you cannot see. If a passage has been read wrongly, reply and a correction goes on the record beside it.",
  ),

  // Bethan Lloyd-Price — one message, five months ago, three days from closure
  message(
    "cnd_lloyd_price",
    "stage",
    "stg_fc_sourced",
    "2026-03-14T13:22:00.000Z",
    "I came across your details on the Cawthorne Foods site while working on a Financial Controller role for a manufacturer near Rotherham. If you would like to hear about it, reply and I will call you; if not, tell me and I will close the record.",
  ),

  // Ivan Petrescu
  message(
    "cnd_petrescu",
    "stage",
    "stg_fc_sourced",
    "2026-03-14T13:25:00.000Z",
    "I came across your profile on the Stelmark site while working on a Financial Controller role for a PE-backed manufacturer near Rotherham. Worth a call?",
  ),
  message(
    "cnd_petrescu",
    "stage",
    "stg_fc_screening",
    "2026-03-25T09:15:00.000Z",
    "The screening call is thirty minutes on Friday. I will ask about closing a month-end under a private-equity calendar and about the team you manage. Bring an example of each.",
  ),

  // Sadia Rahman
  message(
    "cnd_rahman",
    "stage",
    "stg_fc_sourced",
    "2026-03-14T13:28:00.000Z",
    "I came across your profile on the Brindley site while working on a Financial Controller role for a manufacturer near Rotherham. Worth a call?",
  ),

  // The closed role
  message(
    "cnd_oyelaran_fbp",
    "stage",
    "stg_fbp_sourced",
    "2025-11-04T14:55:00.000Z",
    "I am working on a Finance Business Partner role for a food manufacturer near Wakefield and your background looks relevant. Reply if you would like to hear more.",
  ),
  message(
    "cnd_oyelaran_fbp",
    "auto_closure",
    null,
    "2026-02-02T09:00:00.000Z",
    "I approached you in November about a Finance Business Partner role and have not heard back, which is entirely reasonable. The record is now closed, so nothing further will come from me on it. If the timing was the problem rather than the role, say so and I will open it again.",
  ),
  message(
    "cnd_amankwah_fbp",
    "stage",
    "stg_fbp_sourced",
    "2025-09-15T15:10:00.000Z",
    "I am working on a Finance Business Partner role at Calder Vale Foods near Wakefield. You were recommended by a candidate I placed at Thornbury last year. Worth a call?",
  ),
  message(
    "cnd_amankwah_fbp",
    "submission",
    "stg_fbp_submitted",
    "2025-10-14T11:30:00.000Z",
    "Your record went to Calder Vale Foods today. You can read all of it at the link below.",
  ),
];
