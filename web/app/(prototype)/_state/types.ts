import type { PrototypeState } from "../_fixtures";
import type { CriterionId, FindingStatus, ReasonCode, StageId } from "../_fixtures/types";

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

  // ── The Brief ─────────────────────────────────────────────────────────────────
  /** The third criterion the client was coming back with. */
  | { type: "add_criterion"; role_id: string }
  /** Say which stage evidences a criterion. Required before the role can open. */
  | { type: "assign_criterion"; criterion_id: CriterionId; stage_id: StageId }
  | { type: "open_role"; role_id: string }

  // ── Sourcing ──────────────────────────────────────────────────────────────────
  /** A sighting becomes a Person. The sighting is the resolving source — invariant 9. */
  | { type: "create_person_from_sighting"; sighting_id: string }
  /** A Person becomes a Candidacy on a role. */
  | { type: "create_candidacy"; person_id: string; role_id: string; channel_id: string }
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

  // ── The pipeline ──────────────────────────────────────────────────────────────
  | { type: "advance_stage"; candidacy_id: string }
  | {
      type: "record_finding";
      candidacy_id: string;
      /** The scorecard this finding belongs to. One review per stage. */
      stage_id: StageId;
      criterion_id: CriterionId;
      status: FindingStatus;
      passage: PassageSource | null;
      quote: string | null;
    }
  /* Move auto_close_at out by thirty days. The message is not optional and it is
   * not internal: what is written here goes to the candidate verbatim and is the
   * reason on the record — invariant 6, ADR 0012. */
  | { type: "extend_auto_close"; candidacy_id: string; message_text: string }
  | { type: "resolve_signal"; signal_id: string; note: string }
  | { type: "override_signal"; signal_id: string; reason_text: string }
  | {
      type: "reject_candidacy";
      candidacy_id: string;
      reason_code: ReasonCode;
      reason_text: string;
    }
  | { type: "create_submission"; candidacy_id: string }

  // ── Communication ─────────────────────────────────────────────────────────────
  /** Send the message The Brief holds for this stage. */
  | { type: "send_stage_message"; candidacy_id: string; stage_id: StageId }

  // ── After the placement ───────────────────────────────────────────────────────
  | {
      type: "record_checkpoint";
      checkpoint_id: string;
      note: string;
      /** What the next Brief for this client should say differently. Optional. */
      brief_feedback: string;
    };
