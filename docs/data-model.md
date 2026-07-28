# Data model

We are building an applicant tracking system for permanent-placement recruiting agencies of
1–10 people. We start at sourcing, because **sourcing is the front door of an agency ATS** —
the recruiter creates the person-role link by going and finding someone, not by waiting for
an application. Inbound apply is the in-house front door, and here it is optional.

The consequence: `Client` and `Role` exist from slice 2, thin but real. Everything hangs off
them. Retrofitting that join is the standard way this build goes wrong.

Every table except `Organization` carries `organization_id` and is under RLS.

---

## Entities

### The spine — present early, filled in over time

| Entity | Purpose | Notes |
|---|---|---|
| `Organization` | Tenant root | RLS anchor. Holds a Key Vault secret *reference* for BYOK — never the key itself. |
| `User` | Belongs to one org | Sessions, not JWT |
| `Client` | The hiring company | |
| `Contact` | A person at a client | |
| `Role` | A job the agency is working | `draft → open → closed` |
| `Brief` / `BriefVersion` | The criteria set, versioned | Pinned onto every Search and Review |
| `Criterion` | One requirement | Ordered; order fixed per role, drives the cell row |

### Sourcing — where candidates come from

| Entity | Purpose | Notes |
|---|---|---|
| `Search` | One sourcing run against one pinned `BriefVersion` | Scope, date, coverage, who ran it |
| `Person` | A candidate | Accumulates across searches. Dedup is the hard part and the moat. |
| `Sighting` | Where a person was found | Source URL, `retrieved_at`, snapshot, what it said. **Mandatory** — no resolving source, no person record. |

### Consideration and evaluation

| Entity | Purpose | Notes |
|---|---|---|
| `Candidacy` | `Person` × `Role` | The central join. **The billable unit.** Created by sourcing, import, or inbound. Carries `auto_close_at`. |
| `Stage` | Where a candidacy sits | |
| `Document` | CV or attachment | Blob ref, SHA-256, parsed text with char offsets |
| `Review` | One evaluation of a candidacy | Pins a `BriefVersion` |
| `Finding` | `Review` × `Criterion` | `evidenced` \| `not_found`. No score. |
| `Evidence` | The quoted passage | Points at a `Document` **or** a `Sighting`. Append-only. |
| `Exclusion` | Failed the bar, with a written reason | Stops resurfacing next quarter; answers "why not them?" |

### Integrity, output, audit

| Entity | Purpose | Notes |
|---|---|---|
| `CrosscheckSignal` | An integrity observation | Type, detail, artifact reference. Never a probability. |
| `Override` | Dismissal of a signal | User, written reason, timestamp |
| `Submission` / `SubmissionRecord` | The artifact sent to the client | Immutable snapshot, named sign-off, PDF |
| `DecisionEvent` | Append-only audit log | Everything consequential writes here |
| `UsageEvent` | Tokens, cost, org, candidacy | Written on every call, whoever's key paid |

---

## Naming change

`Application` is now `Candidacy`. In an agency ATS most candidates never applied — the
recruiter found them. Calling the record an application describes the minority path and
mis-frames the product.

The published pricing unit is unchanged in substance: one candidate read against one Brief.
But reconsider the word "applications" on the price page. "Candidate reviews" is more honest
for a sourcing-led workflow, and honesty on the price page is part of the positioning.

---

## Open questions the build will force

Real and unresolved. Do not paper over these in code — surface them.

**Does one Brief hold both the sourcing scope and the assessment rubric?** They are different
things. The sourcing scope is where to look — companies, ecosystems, adjacent markets — and it
gets renegotiated mid-search when the pool comes back thin. The assessment rubric is what must
be evidenced in a person. Every ATS conflates them into a job description and gets away with
it because nothing enforces either. We enforce both, so we probably cannot.

Likely answer: one `Brief`, two sections, versioned together, where only the rubric section
gates advancement. Decide explicitly, write the ADR.

**Sourced people have no email.** Most ATS schemas assume an identity anchor a sourced person
does not have — you have a name, a company, and a URL. Dedup, merge and contactability all
have to work without it.

**Sighting evidence decays.** A CV is fixed. A company bio or conference listing changes under
you. `Sighting` stores `retrieved_at` and a snapshot of what was read, or the citation rots
into a dead link — the same failure as an invented profile URL, just slower.

**Lawful basis for people who never applied.** Storing sourced individuals is routine agency
practice and still needs a designed answer: basis, notification, retention, deletion on
request. Design it into the schema rather than adding it later.

**What is the metered axis once inference is BYOK?** Under bring-your-own-key the customer
pays the provider directly, so "we charge on volume because volume costs us money" stops
being the argument. Meter candidacies anyway — it is still the axis that grows with the value
delivered, and it is still the axis the incumbents get wrong by charging on headcount. But the
justification changes from cost recovery to value alignment, and the price page copy has to
change with it. Resolve before writing billing code.

---

## Rules that are painful to retrofit

**Pin the Brief version onto both `Search` and `Review`.** A brief that changed mid-search is
the normal case, not the exception. Every record must render as it was when made.

**Evidence stores character offsets** into parsed text, plus page and paragraph for documents,
plus the snapshot for sightings.

**Crosscheck signals are observations, not judgements.** Type, detail, artifact pointer. No
probability, no severity, no authorship estimate. If a signal cannot render as an evidence
citation, it does not ship.

**Prefer computed signals to model calls.** Timeline arithmetic, duplicates across the org's
own history, contact collisions, document metadata. Deterministic, cheap, and defensible to a
client in a way a model's opinion is not.

**Person deduplication never crosses an organization.** Two agencies holding the same candidate
hold two unrelated records. No shared identity, no shared blacklist. Phase 0 writes no
cross-tenant data at all.
