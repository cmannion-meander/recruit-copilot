# Backend PRD — the API the cockpit specified

The cockpit prototype is not just an interface. Its type file is a schema spec, its reducer's
action union is the complete mutation surface, and its refusal guards are the validator spec —
each one already labelled with the invariant it enforces. This document turns that specification
into requirements for the first real backend, and ends with the scoped build plan.

Sources, in order of authority: `docs/invariants.md` · `api/tests/test_invariants.py` ·
`docs/data-model.md` · ADR 0011, ADR 0012 · `docs/prototype-findings.md` ·
`web/app/(prototype)/_fixtures/types.ts` · `web/app/(prototype)/_state/{types,reducer,refusals,selectors}.ts`.
Where this document disagrees with any of those, this document is wrong.

---

## Where the build stands

Shipped: the marketing site (slice 0), the contract tests, and `db/setup-local.sh` with the
`rcp_owner` / `rcp_app` role split already wired for RLS. On the cockpit branch: fourteen
working routes covering the Desk, Roles, Candidacies (list and board), the drawer, the record,
per-stage scorecards, the Submission Record, Placement, sourcing triage, and the candidate
token view — all running on an in-memory reducer with no network and no persistence (ADR 0010).

`api/` contains only `tests/test_invariants.py`. There is no Django project. The tests import
models that do not exist; they are the definition of done, and the build plan below states
which of them go green at each milestone.

---

## Goal

The cockpit runs against Postgres instead of fixtures, with every refusal the screens can
render enforced by the database or a validator behind it — and nothing the screens cannot do
possible through the API either.

**Users.** The recruiter, through the cockpit, authenticated by a Django session. The
candidate, through the token view, authenticated by nothing but an unguessable token and
served only what the record already promised them.

**Success is mechanical:** every test in `tests/test_invariants.py` passes against `rcp_app`,
and the cockpit renders the same screens from seeded Postgres that it renders from fixtures —
same seven flagged records on the Desk, same refusals when pressed.

---

## Principles

1. **The API is commands, not resources.** The UI never edits a Finding, never deletes
   Evidence, never sets `auto_close_at` directly. The absence of those controls is the
   product, and a generic CRUD layer would reintroduce every one of them.
2. **A refusal is a structured answer, not an error string.** Same shape the screens already
   render: requirement, reason, action, named items, invariant number.
3. **Enforcement lands as low as it can.** Database constraint over trigger, trigger over
   application validator, validator over convention — per CLAUDE.md. The reducer checks every
   guard twice today (screen and reducer); the second check becomes Postgres.
4. **One command, one transaction.** The domain write and its `DecisionEvent` commit together
   or not at all. That pairing is how every reducer case already behaves.
5. **Reads are one snapshot, not a query layer.** A 1–10 person agency's working set is small.
   Serve the whole org-scoped state; keep the selectors client-side, unchanged.

## Non-goals, for the whole of this plan

The LLM service boundary and BYOK (slice 4 — nothing in the cockpit calls a model). Robust
document parsing (two-column PDFs, scans, DOCX — slice 6's real budget; this plan ingests
clean text only). Fuzzy person dedup and merge (slice 3's moat; this plan refuses exact
person×role duplicates and stops). Pre-flight, metering, billing, MCP, email ingestion,
scheduling. None of these is cancelled; none of them is needed for the cockpit to run real.

---

## The API surface

### Commands

Fifteen commands, one per reducer action (`reset` is prototype-only and does not ship).
Payloads are the reducer payloads verbatim. Every command writes its `DecisionEvent` in the
same transaction; the Writes and Guard columns are already implemented in
`_state/reducer.ts` and `_state/refusals.ts` and are transcribed, not redesigned.

| Command | Route | Guard (invariant) |
|---|---|---|
| Add a criterion | `POST /api/roles/{id}/criteria` | — |
| Assign a criterion to a stage | `POST /api/criteria/{id}/assign` | — |
| Open a role | `POST /api/roles/{id}/open` | ≥3 criteria, then every criterion staged (1) |
| Create person from sighting | `POST /api/sightings/{id}/person` | sighting resolving, not yet a person (9) |
| Create a candidacy | `POST /api/candidacies` | role open; no duplicate person×role (1) |
| Create person by hand | `POST /api/people` | source URL and snapshot both present (9); then role open (1) |
| Advance a stage | `POST /api/candidacies/{id}/advance` | stage's criteria all carry a finding (3); candidate told they reached this stage (6) |
| Record a finding | `POST /api/candidacies/{id}/findings` | evidenced requires a passage; offsets, never typed text |
| Extend the deadline | `POST /api/candidacies/{id}/extend` | non-empty message; not closed (6, ADR 0012) |
| Send the stage message | `POST /api/candidacies/{id}/messages` | one per candidacy × stage (6) |
| Resolve a signal | `POST /api/signals/{id}/resolve` | non-empty note; signal open (5) |
| Override a signal | `POST /api/signals/{id}/override` | non-empty written reason (5) |
| Reject a candidacy | `POST /api/candidacies/{id}/reject` | reason code **and** text (4) |
| Create the Submission Record | `POST /api/candidacies/{id}/submission` | no open signal; whole rubric carries a finding; one per candidacy (5) |
| Record a checkpoint | `POST /api/checkpoints/{id}/record` | non-empty note |

Fixed increments are constants, not settings: a stage transition resets `auto_close_at` to
+90 days, an extension adds +30, and there is no endpoint that accepts a date (ADR 0012).

### Reads

- **`GET /api/workspace`** — the org's full state, shaped as `PrototypeState`: every
  collection the reducer holds, RLS-scoped, minus `Document.parsed_text`. The cockpit's
  selectors (`needsAttention`, `cellsFor`, `attentionItems`, the funnel read from
  `DecisionEvent`) run client-side against it, unchanged. If a screen ever gets slow, that
  selector moves server-side then — not before.
- **`GET /api/documents/{id}/text`** — `parsed_text` with pages, paragraphs and sentence
  spans, fetched when the recorder opens. The only heavy read in the product.
- **`GET /api/candidate/{token}`** — the candidate view. Separate path, no session, no org
  context. See "Designed, not transcribed" below.

### The error contract

Every guard failure returns the shape the screens already render, with HTTP 422:

```json
{
  "requirement": "This candidate can't advance until the scorecard is complete.",
  "reason": "2 criteria have no entry.",
  "action": "Open the scorecard and record a finding against each.",
  "items": [
    { "label": "Led an ERP migration, not only participated in one", "detail": "Criterion 2 of 5" },
    { "label": "Has managed a team of three or more", "detail": "Criterion 3 of 5" }
  ],
  "invariant": 3
}
```

Validators raise typed exceptions carrying the named items — `IncompleteScorecard` holds
criterion ids, `UnresolvedCrosscheck` holds signal ids — never a bare count
(prototype finding 11). A trigger-level refusal surfaces through the same shape: the service
layer runs the validator first, so the trigger is the backstop a request should never reach,
and if one does it is reported as a 500 and a bug, not translated into a polite refusal.

### Transport

Plain Django JSON views with a serializer per aggregate. No Django REST Framework: the surface
is fifteen commands and three reads, none of it is resource-CRUD, and DRF's conveniences
(routers, generic viewsets, negotiable renderers) are conveniences for exactly the API shape
this product refuses. Session auth with httpOnly cookies on the shared parent domain, CSRF on
every command. Record as an ADR at scaffold time.

---

## Schema

Transcribe `_fixtures/types.ts` — it is the spec, 581 lines, every tenant record already
carrying `organization_id`. The contract tests fix the Django app layout by their imports:

`organizations` · `clients` (Client, Contact) · `roles` (Role, Brief, BriefVersion, Criterion,
BriefStage, SourcingScope) · `channels` · `searches` · `people` · `sightings` · `candidacies`
(Candidacy, Stage, CandidateMessage) · `documents` · `reviews` · `findings` · `evidence` ·
`crosscheck` · `decisions` (Decision, Exclusion, DecisionEvent) · `submissions` · `placements`.

Five deliberate deltas from the TypeScript:

1. **Ids are server-generated.** The prototype's `seq` counter exists only so a reload lands
   on identical screens.
2. **`Evidence.quote` is computed, never accepted.** The API takes offsets; the server runs
   `locate()` (whitespace-insensitive match, exact offsets back, raises on ambiguity) and
   stores the original substring. `locate()`, `spansOf()` and `sentencesOf()` from
   `_fixtures/offsets.ts` are ported to Python and become the one implementation.
3. **`EvidenceTarget` and `CrosscheckArtifact` stay different unions** — JSONB with a `CHECK`
   on `kind`. They are deliberately different types (prototype finding 6), and the decision
   about whether `document_property` and `record` artifacts can ever ship is ADR-owed before
   slice 9, not resolved silently in a migration.
4. **`Finding` and `Evidence` reconcile with the contract test.** The test expects creating
   an evidenced finding with no evidence to raise. Evidence remains its own append-only table
   (the permission revokes apply to it); a constraint trigger enforces evidenced ⇒ an
   evidence row exists in the same transaction.
5. **Column names are constrained by the catalogue scans.** No column anywhere may match
   `score|rank|rating|confidence|percentile|weight`, and nothing key-shaped may exist except
   `*_ref`. This binds innocent names too — `weighting` on a shipping table would fail the
   contract, which is the point.

---

## Enforcement map

Every guard in `_state/refusals.ts`, placed on the ladder. Constraint > trigger > validator.

| Rule | Mechanism | Invariant |
|---|---|---|
| `auto_close_at`, `BriefStage.candidate_message`, `Sighting.source_url` / `retrieved_at` non-null | Column constraints | 6, 9 |
| Rejection requires reason code and non-empty text | `CHECK` | 4 |
| `Finding.status` is exactly two values | Enum + `CHECK` | 2 |
| Evidence points at a Document or a Sighting, exactly one | `CHECK` on the target | 9 |
| Candidacy or Search cannot attach to a role that is not open | Trigger | 1 |
| Person cannot exist without a resolving Sighting | Trigger | 9 |
| Evidenced finding requires an evidence row | Constraint trigger | 9 |
| Submission refused while any signal is unresolved | Trigger | 5 |
| `auto_close_at` moves only with a same-transaction CandidateMessage + DecisionEvent, to exactly +90 or +30 | Trigger | 6, ADR 0012 |
| Evidence, DecisionEvent, SubmissionRecord are append-only | `UPDATE`/`DELETE` revoked from `rcp_app` | 8 |
| Open a role: ≥3 criteria, then every criterion assigned to a stage | Validator, two refusals in sequence, naming the unassigned | 1 |
| Leave a stage: the stage's criteria all carry a finding | Validator, naming the criteria | 3 |
| Leave a stage: the candidate was told they reached it | Validator | 6 |
| Submission: the whole rubric carries a finding | Validator, naming the criteria | 5 |
| No score-shaped column, no key-shaped column | The catalogue scan tests | 2, 10 |
| No switch suppresses the AI-use notice | The column does not exist | 7 |

Tenancy sits beneath all of it: every org table gets RLS **enabled and forced** with the
policy keyed to `current_setting('app.current_org', true)`, applied by a shared migration
operation so a new table cannot forget — and caught by the catalogue test if it somehow does.
Middleware issues `SET LOCAL app.current_org` inside the request transaction. Runtime
connects as `rcp_app`; migrations and the test runner connect as `rcp_owner` (it needs
`CREATEDB`); the isolation tests open their own `rcp_app` connection and prove it on the role
the application actually uses.

---

## Designed, not transcribed

Two pieces have no reducer case to copy and need their own design.

**The candidate token view.** `/candidate/{token}` has no session and no org, so the RLS
policy fails closed for it — correctly. It is served from the immutable
`SubmissionRecord.snapshot` plus the candidacy's `CandidateMessage` rows, through a
`SECURITY DEFINER` function keyed on the token (or a dedicated role with a token-scoped
policy — decide in the ADR). It is the only read that crosses the tenancy boundary, and the
one place `auto_close_at` is a promise rather than a field. ADR owed before the submission
milestone.

**The auto-closer.** A `procrastinate` periodic task — the only writer that is not a user
command. `Organization` is not under RLS (it is the anchor), so the worker enumerates org
ids, then `SET LOCAL app.current_org` per org and closes anything past deadline through the
same service function a command would use: closure reason, `auto_closure` CandidateMessage,
`DecisionEvent`, one transaction. There is no setting to disable it, and there will not be one.

## ADRs owed by this plan

| ADR | Decides | Due |
|---|---|---|
| Transport: commands + workspace snapshot, no DRF | The API shape and why CRUD is refused | M0 |
| SourcingScope is its own object | Both objects, their lifetimes, which one the ≥3 gate counts | M2 (owed since prototype finding 1) |
| Candidate token read path | How one unauthenticated read crosses RLS | M6 |
| Crosscheck artifacts vs evidence targets | Whether `document_property` / `record` can ship | Before slice 9, unchanged |

---

# Build plan

Seven milestones, mapped onto the slice order (1 → 2 → 3 → 5 → 7-subset), with slice 4
deliberately skipped. Each milestone ends with named contract tests green, and no milestone
weakens a test to get there. Sizes are relative: S is days, M is a week-ish, L is the ones to
budget double.

### M0 — Scaffold *(S)*

Django 5 project under `api/` with uv, ruff, pytest wired; settings entirely from environment
variables; two DSNs (`DATABASE_URL` as `rcp_owner` for migrate and the test runner,
`APP_DATABASE_URL` as `rcp_app` for runtime and the isolation tests) with the exact wiring
recorded in `.env.example`; the refusal exception hierarchy and the JSON error handler;
procrastinate installed against Postgres. The transport ADR.

**Done:** `uv run pytest` collects the contract and fails on missing models rather than on
missing infrastructure.

### M1 — Tenancy (slice 1) *(M)*

`Organization`, `User`, sessions, login; the RLS migration operation; org-context middleware.
The subtle work is here: `FORCE ROW LEVEL SECURITY`, `SET LOCAL` scoping, and proving it all
on an `rcp_app` connection.

**Done, contract tests green:** `test_app_role_is_not_privileged`,
`test_every_tenant_table_has_rls_enabled_and_forced`, `test_cross_tenant_read_returns_nothing`,
`test_missing_org_context_returns_nothing`, `test_org_context_does_not_leak_across_transactions`,
`test_no_scoring_column_exists_anywhere`, `test_no_customer_key_material_column_exists`,
`test_ai_use_notice_cannot_be_disabled`.

### M2 — Client, Role, The Brief (slice 2) *(M)*

`Client`, `Contact`, `Role` with `draft → open → closed`; `Brief`, `BriefVersion`,
`Criterion`, `BriefStage`, `SourcingScope`; opening a role pins the version. Commands: add a
criterion, assign a criterion, open a role — with the two-refusals-in-sequence gate. The
SourcingScope ADR.

**Done:** `test_role_cannot_open_with_fewer_than_three_criteria`, plus a new test this
milestone adds for the coverage half of invariant 1 (every criterion staged — tests may be
added, assertions never relaxed).

### M3 — Person, Sighting, Search (slice 3, dedup deferred) *(M)*

`Person`, `Sighting`, `Search` pinning both a BriefVersion and a SourcingScope; provenance
triggers; the role-open trigger extended to Search. Commands: create person from sighting,
create person by hand. Exact person×role duplicates refused; fuzzy dedup and merge stay out,
named in non-goals.

**Done:** `test_person_cannot_exist_without_a_resolving_sighting`,
`test_sighting_requires_a_source_and_a_retrieval_time`, `test_search_cannot_attach_to_unopened_role`,
and the search half of `test_search_and_review_pin_a_brief_version`.

### M4 — The candidacy engine (slice 5) *(L)*

`Candidacy`, terminal stages, `Channel`, `CandidateMessage`, `DecisionEvent` (append-only
from birth); commands: create candidacy, advance, extend, reject, send the stage message. The
ADR 0012 trigger. The auto-closer task. This is the biggest milestone because most of the
product's opinions live on the candidacy: the message gate, the deadline arithmetic, the
event pairing.

**Done:** `test_candidacy_cannot_attach_to_unopened_role`,
`test_every_candidacy_has_an_auto_close_deadline`, `test_rejection_requires_reason_code_and_text`,
plus new tests for the ADR 0012 trigger (a bare `UPDATE` of `auto_close_at` raises; +30 with
message and event commits).

### M5 — The recorder (slice 7 subset, minimal slice 6) *(L)*

`Document` ingested through the Django storage API — clean text with pages, paragraphs and
the ported `locate()` / `sentencesOf()`; `Review` (one per stage, pinned), `Finding`,
`Evidence` (append-only, quote computed from offsets). Command: record a finding, from a
document or from a sighting snapshot — the sighting path is the majority path (prototype
finding 4) and is not the degraded one. Carry-forward reads.

**Done:** `test_cannot_advance_with_incomplete_scorecard`,
`test_evidenced_finding_requires_evidence`, `test_evidence_points_at_a_document_or_a_sighting`,
`test_finding_status_has_exactly_two_values`, the review half of
`test_search_and_review_pin_a_brief_version`.

### M6 — Integrity, output, placement *(M)*

Computed `CrosscheckSignal`s only (timeline arithmetic, contact collision, duplicate
candidacy, document properties — no model calls exist to make); resolve and override
commands; the Submission Record with its frozen snapshot and candidate token; the token read
path and its ADR; `Placement` and checkpoints with the record-checkpoint command and Brief
feedback surfacing.

**Done:** `test_submission_blocked_while_crosscheck_signal_unresolved`,
`test_append_only_tables_reject_update_and_delete` — which closes the contract: every test in
the file is green.

### M7 — Cutover *(M)*

The fixtures become a seed script. `GET /api/workspace` replaces the reducer's initial state;
`dispatch` becomes a command POST and a refetch; guards keep running client-side so refusals
render instantly, with the server as the authority behind them. The prototype route survives
on fixtures until the cockpit runs real, then ADR 0010's disposability clause is exercised.

**Done:** against seeded Postgres, the Desk shows the same seven flagged records the fixtures
show, every refusal in `docs/prototype-findings.md` is reachable by pressing the control that
owns it, and the candidate token view renders from the snapshot with no org session.

---

## Risks worth naming now

- **M4 and M5 are the double-budget milestones.** M4 because the deadline trigger couples
  three tables in one transaction and has to be right before anyone relies on the promise;
  M5 because offset integrity is the whole citation chain, and the port of `locate()` must
  behave identically to the TypeScript or fixture quotes and real quotes drift apart.
- **RLS under connection pooling.** `SET LOCAL` is transaction-scoped and the contract tests
  prove it, but the procrastinate worker and any future pooler need the same discipline; the
  worker's per-org loop is the pattern to hold.
- **The snapshot read will eventually meet a big org.** The decision to keep selectors
  client-side is size-appropriate now and recorded in the transport ADR with its revisit
  condition (a workspace payload that noticeably lags), so it is a decision, not a drift.
