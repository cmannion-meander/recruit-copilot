/* The refusals, as pure functions.
 *
 * Every invariant in docs/invariants.md is a refusal, and a refusal is a piece of
 * interface design before it is a database constraint. That is the whole reason this
 * prototype exists: to find out whether "this candidate can't advance until the
 * scorecard is complete" reads as an obstruction, before a trigger enforces it.
 *
 * Each function returns a Refusal or null. Null means the action goes ahead. The
 * screens call these before dispatching and render what comes back as a considered
 * screen state — never a toast, and never a disabled button. A disabled button teaches
 * nothing: the control stays live and answers when it is pressed.
 *
 * Voice, per CLAUDE.md: state the requirement, give the reason in one clause, name the
 * next action. No apology, no "oops", no exclamation mark, never "you must". The system
 * does not claim to know better; it points at the record.
 *
 * DISPOSABLE. In the real build every one of these is a database constraint, a trigger
 * or a validator in api/. Nothing here is lifted into web/components/ — a conviction
 * enforced in two places is enforced in the weaker one.
 */
import type { PrototypeState } from "../_fixtures";
import type { CandidacyId, ReasonCode, RoleId } from "../_fixtures/types";
import {
  candidacyById,
  criteriaAtStage,
  criteriaFor,
  findingsFor,
  latestBriefVersion,
  messageSentAtStage,
  nextStage,
  stageOf,
  stagesFor,
} from "./selectors";

export type RefusalItem = { label: string; detail?: string };

export type Refusal = {
  /** The requirement, stated plainly. */
  requirement: string;
  /** Why it is not met, in one clause. */
  reason: string;
  /** What to do next. */
  action: string;
  /** What the reason points at, named. A count without names is not an explanation. */
  items?: RefusalItem[];
  /** Which invariant this is, so the prototype can be read against the document. */
  invariant: number;
};

const MINIMUM_CRITERIA = 3;

/* ── Invariant 1 · rubric before pipeline ────────────────────────────────────────
 * Two conditions, in order. Three criteria is the count The Brief has always had to
 * meet. Coverage is the second half, and it arrived with the structured process: a
 * criterion assigned to no stage is a criterion nobody has agreed to look for, which
 * is the same failure as not writing it down. See ADR 0011.
 * ─────────────────────────────────────────────────────────────────────────────── */
function refuseOpen(state: PrototypeState, roleId: RoleId): Refusal | null {
  const role = state.roles.find((candidate) => candidate.id === roleId);
  if (!role) return null;

  const version = latestBriefVersion(state, role);
  if (!version) return null;

  const criteria = criteriaFor(state, version.id);
  const short = MINIMUM_CRITERIA - criteria.length;

  if (short > 0) {
    return {
      requirement: "This role can't open until The Brief defines three criteria.",
      reason: criteria.length === 1 ? "The Brief has one." : `The Brief has ${criteria.length}.`,
      action:
        short === 1
          ? "Add the third criterion, then assign each one to the stage that evidences it."
          : `Add ${short} more criteria, then assign each one to the stage that evidences it.`,
      invariant: 1,
    };
  }

  const stages = stagesFor(state, version.id);
  const covered = new Set(stages.flatMap((stage) => stage.criterion_ids));
  const uncovered = criteria.filter((criterion) => !covered.has(criterion.id));

  if (stages.length === 0) {
    return {
      requirement: "This role can't open until The Brief says where each criterion is evidenced.",
      reason: "No stages are defined.",
      action: "Set out the stages this role runs, and assign every criterion to one of them.",
      items: criteria.map((criterion) => ({
        label: criterion.text,
        detail: `Criterion ${criterion.position} · assigned to no stage`,
      })),
      invariant: 1,
    };
  }

  if (uncovered.length > 0) {
    return {
      requirement: "This role can't open until every criterion is evidenced somewhere.",
      reason:
        uncovered.length === 1
          ? "One criterion is assigned to no stage."
          : `${uncovered.length} criteria are assigned to no stage.`,
      action: "Assign each to the stage that will evidence it, or take it off The Brief.",
      items: uncovered.map((criterion) => ({
        label: criterion.text,
        detail: `Criterion ${criterion.position} of ${criteria.length}`,
      })),
      invariant: 1,
    };
  }

  return null;
}

/** Invariant 1 — a Search cannot attach to a role that is not open. */
export function refuseSearch(state: PrototypeState, roleId: RoleId): Refusal | null {
  const role = state.roles.find((candidate) => candidate.id === roleId);
  if (!role || role.state === "open") return null;

  if (role.state === "closed") {
    return {
      requirement: "A search runs against an open role.",
      reason: "This role is closed.",
      action: "Reopen the role, or start a search on a role that is open.",
      invariant: 1,
    };
  }

  const blocked = refuseOpen(state, roleId);
  if (!blocked) return null;
  return { ...blocked, requirement: blocked.requirement.replace("open", "run a search") };
}

/** Invariant 1 — the same trigger sits on Candidacy insert. */
export function refuseCandidacy(state: PrototypeState, roleId: RoleId): Refusal | null {
  const role = state.roles.find((candidate) => candidate.id === roleId);
  if (!role || role.state === "open") return null;

  if (role.state === "closed") {
    return {
      requirement: "A candidacy attaches to an open role.",
      reason: "This role closed on the placement of George Amankwah.",
      action: "Put the candidate forward on a role that is open.",
      invariant: 1,
    };
  }

  const blocked = refuseOpen(state, roleId);
  if (!blocked) return null;
  return {
    ...blocked,
    requirement: blocked.requirement.replace("open", "receive candidates"),
  };
}

/** Invariant 1 — the gate on the transition itself, for the live "Open this role" control. */
export function refuseOpenRole(state: PrototypeState, roleId: RoleId): Refusal | null {
  return refuseOpen(state, roleId);
}

/* ── Invariant 3 · no advancement without a scorecard ────────────────────────────
 * Scoped to the stage being left, not to the whole rubric. The Brief says which
 * criteria each stage is responsible for; a stage that carries none gates nothing,
 * because the work it does — interest, availability, money — is real and is not in
 * the rubric.
 *
 * The whole rubric is still required, at Submitted. See refuseSubmission.
 * ─────────────────────────────────────────────────────────────────────────────── */
export function refuseAdvance(state: PrototypeState, candidacyId: CandidacyId): Refusal | null {
  const candidacy = candidacyById(state, candidacyId);
  if (!candidacy) return null;

  const stage = stageOf(state, candidacy);
  if (stage?.terminal) {
    return {
      requirement: "A closed candidacy does not move.",
      reason: `This one is ${stage.label.toLowerCase()}.`,
      action: "Open a new candidacy if the person is back in play.",
      invariant: 3,
    };
  }
  if (!stage) return null;

  const onward = nextStage(state, candidacy);
  if (!onward) return null;

  const recorded = findingsFor(state, candidacy.id);
  const owed = criteriaAtStage(state, candidacy, stage.id).filter(
    (criterion) => !recorded.some((finding) => finding.criterion_id === criterion.id),
  );

  if (owed.length > 0) {
    const total = criteriaFor(state, candidacy.brief_version_id).length;
    return {
      requirement: `This candidate can't leave ${stage.label} until its scorecard is complete.`,
      reason:
        owed.length === 1
          ? `One criterion this stage carries has no entry.`
          : `${owed.length} criteria this stage carries have no entry.`,
      action: "Open the scorecard and record a finding against each.",
      items: owed.map((criterion) => ({
        label: criterion.text,
        detail: `Criterion ${criterion.position} of ${total} · assigned to ${stage.label}`,
      })),
      invariant: 3,
    };
  }

  /* Invariant 6, at the point it bites. Moving somebody on without telling them is how
   * a deadline becomes the only thing standing between a candidate and silence. */
  if (!messageSentAtStage(state, candidacy.id, stage.id)) {
    return {
      requirement: `This candidate can't leave ${stage.label} without having been told they reached it.`,
      reason: "No message has been sent at this stage.",
      action: "Send the message for this stage, then advance.",
      invariant: 6,
    };
  }

  return null;
}

/** Invariant 4 — a rejection carries a reason code and written text. Both, always. */
export function refuseRejection(reasonCode: ReasonCode | "", reasonText: string): Refusal | null {
  const hasCode = reasonCode !== "";
  const hasText = reasonText.trim().length > 0;

  if (hasCode && hasText) return null;

  if (!hasCode && !hasText) {
    return {
      requirement: "A rejection carries a reason code and written text.",
      reason: "Neither is set.",
      action: "Choose the code that fits, then write what you told them.",
      invariant: 4,
    };
  }

  if (hasCode) {
    return {
      requirement: "A rejection carries a reason code and written text.",
      reason: "The written reason is empty.",
      action: "Write what you told them. It goes in the record and to the candidate.",
      invariant: 4,
    };
  }

  return {
    requirement: "A rejection carries a reason code and written text.",
    reason: "No reason code is selected.",
    action: "Choose the code that fits what you wrote.",
    invariant: 4,
  };
}

/** An Override carries a user and a written reason. An empty reason is refused. */
export function refuseOverride(reasonText: string): Refusal | null {
  if (reasonText.trim().length > 0) return null;
  return {
    requirement: "Overriding a signal takes a written reason.",
    reason: "The reason is empty.",
    action: "Write what you checked and what you found. It stays on the record under your name.",
    invariant: 5,
  };
}

/** Invariant 5 — verification before submission, naming the signals that are open. */
export function refuseSubmission(state: PrototypeState, candidacyId: CandidacyId): Refusal | null {
  const candidacy = candidacyById(state, candidacyId);
  if (!candidacy) return null;

  const open = state.crosscheckSignals.filter(
    (signal) => signal.candidacy_id === candidacyId && signal.resolution === null,
  );

  if (open.length > 0) {
    return {
      requirement: "A Submission Record can't be created while a Crosscheck signal is open.",
      reason:
        open.length === 1 ? "One signal is unresolved." : `${open.length} signals are unresolved.`,
      action: "Record what you found against each, or override it with a written reason.",
      items: open.map((signal) => ({ label: SIGNAL_LABEL[signal.type], detail: signal.detail })),
      invariant: 5,
    };
  }

  /* The whole rubric, here and only here. The agency's assessment ends at submission,
   * so this is the last point at which a criterion with no entry can be caught — and
   * the record that goes to the client has a line for every one of them. */
  const recorded = findingsFor(state, candidacy.id);
  const criteria = criteriaFor(state, candidacy.brief_version_id);
  const owed = criteria.filter(
    (criterion) => !recorded.some((finding) => finding.criterion_id === criterion.id),
  );

  if (owed.length > 0) {
    return {
      requirement: "A Submission Record carries a finding against every criterion.",
      reason:
        owed.length === 1
          ? "One criterion has no entry."
          : `${owed.length} criteria have no entry.`,
      action: "Open the scorecard and record a finding against each, at whichever stage suits.",
      items: owed.map((criterion) => ({
        label: criterion.text,
        detail: `Criterion ${criterion.position} of ${criteria.length}`,
      })),
      invariant: 5,
    };
  }

  return null;
}

/** Invariant 9 — no person without a resolving source. */
export function refusePerson(sourceUrl: string, snapshot: string): Refusal | null {
  const hasUrl = sourceUrl.trim().length > 0;
  const hasSnapshot = snapshot.trim().length > 0;

  if (hasUrl && hasSnapshot) return null;

  if (!hasUrl) {
    return {
      requirement: "A person can't be added without a source that resolves to them.",
      reason: "No source is set.",
      action: "Paste the address of the page you read. The record keeps it, and what it said.",
      invariant: 9,
    };
  }

  return {
    requirement: "A source is kept with what it said on the day it was read.",
    reason: "The snapshot is empty.",
    action: "Paste the sentence that names them. Without it the citation is a link that will rot.",
    invariant: 9,
  };
}

/** A checkpoint records what happened. An empty note records nothing. */
export function refuseCheckpoint(note: string): Refusal | null {
  if (note.trim().length > 0) return null;
  return {
    requirement: "A checkpoint records what happened, in words.",
    reason: "The note is empty.",
    action:
      "Write what the manager said and what the person said. A checkpoint nobody wrote is a checkpoint nobody did.",
    invariant: 6,
  };
}

export const SIGNAL_LABEL: Record<string, string> = {
  timeline_overlap: "Timeline overlap",
  contact_collision: "Contact match in this organisation",
  document_author: "Document properties name another author",
  duplicate_candidacy: "Duplicate against a prior candidacy",
};
