# The ten invariants

An opinionated product is defined by what it refuses to let you do. Each invariant below names
its **enforcement mechanism**. A conviction enforced only by intention is not enforced.

Ordering principle: database constraint > application validation > convention.

---

## 1. Rubric before pipeline

A role cannot receive candidates until The Brief defines at least three criteria **and every
one of them is assigned to the stage that will evidence it**.

**Enforcement.** `Role.state` is a state machine: `draft → open → closed`. Transition to `open`
raises unless `criteria.count() >= 3`, and raises again unless every criterion appears in some
`BriefStage.criterion_ids` at or before the submitting stage. `Candidacy` and `Search` both have
a database trigger rejecting insert where the parent role is not `open`. The Brief is versioned;
opening a role pins a `BriefVersion`, and both `Search` and `Review` pin the version they ran
against.

The coverage half arrived from the structured hiring process (ADR 0011). A criterion nobody has
agreed to look for is the same failure as a criterion nobody wrote down: it gets asked about by
whoever remembers, or not at all, and the Submission Record has a line for it either way.

---

## 2. No composite score, ever

**Enforcement.** *The column does not exist.* `Finding.status` is a two-value enum —
`evidenced` | `not_found`. There is no confidence float, no weight, no rank, no percentage
anywhere in the schema. A test asserts that no column in the schema matches
`score|rank|rating|confidence|percentile|weight`, so a future session cannot add one quietly.

Scannability is delivered by a fixed-order row of cells plus a count ("4 of 5 evidenced").
The count never renders without the cells.

---

## 3. No advancement without a scorecard

A candidate cannot leave a stage while any criterion **that stage is responsible for** has no
Finding. The whole rubric is required once, at submission — invariant 5.

**Enforcement.** Stage transition validator raises `IncompleteScorecard`, naming the criteria
with no entry. `Review` carries a `stage_id`: one scorecard per stage, not one per candidacy.

**This was corrected, not weakened.** As first written the rule read "any criterion in the
pinned Brief version", which makes the first transition impossible — you contact somebody in
order to learn the things, and nobody can leave Sourced with five findings already recorded. A
rule that cannot be satisfied is not enforced by a trigger, it is worked around by a colleague.
The requirement that every criterion carries a finding before the record leaves the building is
unchanged; it now lives at the point where it is true. See ADR 0011.

---

## 4. No free-text-only rejection

**Enforcement.** `Decision` of type `reject` requires both `reason_code` (enum) and non-empty
`reason_text`. `CHECK` constraint at the database level. Writes a `DecisionEvent`.

---

## 5. Verification before submission

A Submission cannot be created while any `CrosscheckSignal` on the candidacy is unresolved.

**Enforcement.** Database trigger on `submission` insert. A signal is resolved by either a
recorded resolution or an `Override` carrying a user and a written reason.

---

## 6. Ghosting is impossible

Every `Candidacy` carries an auto-closure deadline. On expiry a scheduled task closes it
with a reason and notifies the candidate. **A candidacy cannot leave a stage until the candidate
has been told they reached it.**

**Enforcement.** `Candidacy.auto_close_at` is `NOT NULL`, defaulted on insert. A periodic
task closes anything past deadline. There is no setting to disable it. Every `BriefStage`
carries a non-nullable `candidate_message`, and the stage transition validator raises if no
`CandidateMessage` exists for the stage being left.

The date is permitted to move, but only in the same act that tells the candidate something:
a stage transition resets it (the transition already requires the stage message), and a
manual extension adds a fixed thirty days and sends the candidate a message whose text is
the reason on the record. No date picker, no cap, and nothing quiet — every extension is an
append-only `DecisionEvent` and the count renders on the record. See ADR 0012.

The second sentence is new and is the strongest opinion in the document, because it costs the
recruiter something on every transition. It is here because a deadline alone does not deliver
the promise: somebody who hears nothing for six weeks and then receives an automated closure
has still been ghosted, politely. A stage with nothing to say to the candidate is a stage where
somebody goes quiet.

**What a candidate reads is what was written.** There is no internal version of a message and
no second, softer text for the rejection — `Decision.reason_text` is sent verbatim. One text
and one audience is the only arrangement in which writing it honestly is the easy path.

---

## 7. Candidate-visible reasoning

Candidates are told software is used to assess them, and can see the findings against them.

**Enforcement.** The AI-use notice is rendered from a non-nullable template field. Wording is
editable; visibility is not. No feature flag exists to suppress it.

---

## 8. The Submission Record is a first-class object

Not an export. A durable, immutable object with its own identity, a named human sign-off, and
a permanent rendering.

**Enforcement.** `SubmissionRecord` stores a full snapshot at send time, including the pinned
Brief version and every quoted passage. `UPDATE` and `DELETE` are revoked from `rcp_app` on
`submission_record`, `evidence`, and `decision_event`. Editing a quoted passage is impossible
at the permission level, not the UI level.

---

## 9. Provenance — no person without a source

A `Person` cannot exist without at least one resolving `Sighting` carrying a source and a
`retrieved_at`. Evidence points at a `Document` or a `Sighting`, never at nothing.

**Enforcement.** `CHECK` constraint, plus a trigger rejecting a `Person` insert with no
sighting. A skill can *ask* an agent not to invent a profile URL. The database *refuses the
write*. That difference is the product.

---

## 10. Customer API keys never touch Postgres

Under BYOK we hold provider credentials. Postgres stores a Key Vault secret reference only.

**Enforcement.** A schema scan asserts no column matches `api_key` or `secret_value`. The
settings endpoint never returns a key to the client. A source scan asserts that only
`llm/service.py` instantiates a provider client.

---

## Tenancy — the invariant beneath the invariants

Every tenant-scoped table carries `organization_id`, has RLS enabled and **forced**, and
policies keyed to `current_setting('app.current_org', true)`. Middleware issues
`SET LOCAL app.current_org` inside the request transaction.

Application code connects as `rcp_app`: not a superuser, not the table owner, without
`BYPASSRLS`. All three bypass RLS, so a test written against an owner connection proves
nothing. `tests/test_invariants.py` opens its own `rcp_app` connection explicitly.

This is the claim we cannot be caught wrong on. Everything else is a product opinion; this
one is a promise to people whose candidate data we hold.
