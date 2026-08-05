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

function criteriaFor(state: PrototypeState, briefVersionId: string) {
  return state.criteria
    .filter((criterion) => criterion.brief_version_id === briefVersionId)
    .sort((left, right) => left.position - right.position);
}

/** Invariant 1 — rubric before pipeline. A Search cannot attach to a role that is not open. */
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

  const version = state.briefVersions.find(
    (candidate) =>
      candidate.brief_id === role.brief_id &&
      candidate.version ===
        Math.max(
          ...state.briefVersions
            .filter((other) => other.brief_id === role.brief_id)
            .map((other) => other.version),
        ),
  );
  const held = version ? criteriaFor(state, version.id).length : 0;

  return {
    requirement: "This role can't run a search until The Brief defines three criteria.",
    reason: held === 1 ? "The Brief has one." : `The Brief has ${held}.`,
    action: `Add ${MINIMUM_CRITERIA - held === 1 ? "a third criterion" : `${MINIMUM_CRITERIA - held} more criteria`} to The Brief, then open the role.`,
    invariant: 1,
  };
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

  const version = state.briefVersions.find((candidate) => candidate.brief_id === role.brief_id);
  const held = version ? criteriaFor(state, version.id).length : 0;

  return {
    requirement: "This role can't receive candidates until The Brief defines three criteria.",
    reason: `The Brief has ${held}.`,
    action: "Add the third criterion, then open the role.",
    invariant: 1,
  };
}

/** Invariant 3 — no advancement without a scorecard, naming the criteria with no entry. */
export function refuseAdvance(state: PrototypeState, candidacyId: CandidacyId): Refusal | null {
  const candidacy = state.candidacies.find((item) => item.id === candidacyId);
  if (!candidacy) return null;

  const stage = state.stages.find((item) => item.id === candidacy.stage_id);
  if (stage?.terminal) {
    return {
      requirement: "A closed candidacy does not move.",
      reason: `This one is ${stage.label.toLowerCase()}.`,
      action: "Open a new candidacy if the person is back in play.",
      invariant: 3,
    };
  }

  const review = state.reviews.find((item) => item.candidacy_id === candidacyId);
  const recorded = review
    ? state.findings.filter((finding) => finding.review_id === review.id)
    : [];

  const missing = criteriaFor(state, candidacy.brief_version_id).filter(
    (criterion) => !recorded.some((finding) => finding.criterion_id === criterion.id),
  );

  if (missing.length === 0) return null;

  return {
    requirement: "This candidate can't advance until the scorecard is complete.",
    reason:
      missing.length === 1
        ? "One criterion has no entry."
        : `${missing.length} criteria have no entry.`,
    action: "Open the scorecard and record a finding against each.",
    items: missing.map((criterion) => ({
      label: criterion.text,
      detail: `Criterion ${criterion.position} of ${criteriaFor(state, candidacy.brief_version_id).length}`,
    })),
    invariant: 3,
  };
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

  const incomplete = refuseAdvance(state, candidacyId);
  if (incomplete)
    return {
      ...incomplete,
      requirement: incomplete.requirement.replace("advance", "be submitted"),
    };

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

export const SIGNAL_LABEL: Record<string, string> = {
  timeline_overlap: "Timeline overlap",
  contact_collision: "Contact match in this organisation",
  document_author: "Document properties name another author",
  duplicate_candidacy: "Duplicate against a prior candidacy",
};
