import type { PrototypeState } from "../_fixtures";
import type { CriterionId, FindingStatus, ReasonCode } from "../_fixtures/types";

/* seq is the prototype's whole source of new identity. No uuid, no Math.random, no
 * Date.now — a reload has to land on the same screen, and an id that differs between
 * two takes of the same click is a diff nobody can explain on camera. */
export type State = PrototypeState & { seq: number };

/** Where a recorded finding's quoted passage comes from. Document or Sighting, never nothing. */
export type PassageSource =
  | { kind: "document"; document_id: string; char_start: number; char_end: number }
  | { kind: "sighting"; sighting_id: string; char_start: number; char_end: number };

export type Action =
  /** Back to the fixture state, exactly. */
  | { type: "reset" }
  /** A sighting becomes a Person. The sighting is the resolving source — invariant 9. */
  | { type: "create_person_from_sighting"; sighting_id: string }
  /** A Person becomes a Candidacy on a role. */
  | { type: "create_candidacy"; person_id: string; role_id: string }
  /** A person entered by hand, with the source that resolves to them. */
  | {
      type: "create_person_by_hand";
      full_name: string;
      headline: string;
      current_employer: string;
      location: string;
      source_url: string;
      source_name: string;
      snapshot_excerpt: string;
      role_id: string;
    }
  | { type: "advance_stage"; candidacy_id: string }
  | {
      type: "record_finding";
      candidacy_id: string;
      criterion_id: CriterionId;
      status: FindingStatus;
      passage: PassageSource | null;
      quote: string | null;
    }
  | { type: "resolve_signal"; signal_id: string; note: string }
  | { type: "override_signal"; signal_id: string; reason_text: string }
  | {
      type: "reject_candidacy";
      candidacy_id: string;
      reason_code: ReasonCode;
      reason_text: string;
    }
  | { type: "create_submission"; candidacy_id: string };
