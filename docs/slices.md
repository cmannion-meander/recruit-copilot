# Build order

The series promise is that following it gets you an ATS. That is a claim about the
destination, not about what exists in episode three — and the order below reaches it by
starting where an agency's work actually starts.

Each slice ends with tests green and the invariant suite passing.

| # | Slice | The ATS claim it makes | What it forecloses for a DIY viewer |
|---|---|---|---|
| 0 | Skeleton: repo, local Postgres, landing page in production | — | — |
| 1 | Org, user, auth, RLS, invariant suite | Multi-tenant from commit one | Row-level isolation with tests that assert failure |
| 2 | `Client`, `Role`, `Brief` with the ≥3 gate | Every ATS starts with a job. Ours won't open one without criteria. | A prompt can produce a rubric; it cannot refuse |
| 3 | `Person`, `Sighting`, provenance enforcement | Candidates, and where each came from | No resolving source, no record — a database refusal, not a request |
| 4 | **LLM service boundary + BYOK key handling** | Evaluation runs inside the product, on the customer's key | The prompts and refusals are ours, not a skills folder |
| 5 | `Candidacy`, stages | The pipeline. The person-role join. | Nothing accumulates in a prompt folder |
| 6 | `Documents`: upload, parse, char offsets | CVs enter the record | Two-column PDFs, tables, scans, DOCX from 2011 |
| 7 | `Review` → `Finding` → `Evidence` | Evaluation against pinned criteria, every finding cited | Nothing to re-open at review time |
| 8 | `Exclusion` + auto-closure | Ghosting is impossible. "Why not them?" has an answer. | |
| 9 | `Crosscheck` signals, overrides, override rate | Integrity, traceable to artifacts | |
| 10 | `SubmissionRecord`: render, sign-off, snapshot, PDF | The artifact that leaves the building | A chat transcript cannot go to a client |
| 11 | Metering, caps, usage — **then** Stripe | | |

Slices 0 and 1 are unchanged from the previous plan. Slice 2 is new in position: `Client` and
`Role` exist before any person does, so the join is never retrofitted.

---

## Slice 2 — Client, Role, The Brief

**The episode:** every ATS starts with a job. This one won't let you open one without criteria.

- `Client`, `Contact`, `Role` with the `draft → open → closed` state machine
- `Brief`, `BriefVersion`, `Criterion` — ordered, at least three to open
- Transition to `open` raises below three criteria
- Nothing can attach to a role that is not `open` — database trigger, not validation

**The open question to resolve on camera, not silently:** does the Brief hold the sourcing
scope as well as the assessment rubric? See `docs/data-model.md`. Write the ADR either way.

---

## Slice 3 — Person and Sighting

**The episode:** every candidate record has to say where it came from, and the database
enforces it.

- `Person` with dedup within org only
- `Sighting`: source URL, `retrieved_at`, snapshot, extract
- `CHECK` constraint: a `Person` cannot exist without at least one resolving `Sighting`
- Dedup: name plus company plus source, with an explicit merge path

**This is the strongest ninety seconds of demo in the whole build.** A skill can *ask* an agent
not to invent a profile URL. A database can *refuse the write*. Show the refusal.

**Budget for dedup.** It looks trivial and is not, and it is the part that improves with use —
which is most of the answer to why a viewer subscribes rather than rebuilding this.

---

## Slice 4 — LLM service boundary and BYOK

**The episode:** the product runs the evaluation, the customer's key pays for it.

`api/llm/service.py` is the only module that talks to a model provider. Everything goes
through it: no view, task, or management command calls a provider directly.

- **We pin the model.** Customers supply a key, never a model choice — otherwise evaluation
  quality varies invisibly and the prompts rot.
- **Key storage:** Azure Key Vault, one secret per org, referenced by ID from Postgres and
  never stored in it. Write-only field: once saved it never returns to the client; show the
  last four characters only. Never logged, never in an error trace.
- **Test-key action** so failures surface at setup rather than mid-run.
- **Onboarding copy** tells users to create a workspace-scoped key with a monthly spend limit
  in the provider console. Control means a ceiling they set, not just visibility.
- **`UsageEvent` on every call** regardless of whose key paid — tokens, cost, org, candidacy.
  We keep full telemetry, so the $0.12 stop criterion stays measurable in production.
- **Platform key path** for Pre-flight and included usage: hard caps, per-email and per-IP
  limits, a global daily spend ceiling, and a kill switch readable from the database.

### Where inference cost sits

| Tier | Key |
|---|---|
| Pre-flight / Free | Ours. Anonymous and abusable — caps and ceiling before the feature. |
| Paid, default | Ours, within the published band. Frictionless onboarding survives. |
| Paid, BYOK option | Theirs. The alternative to buying overage credits at the cap. |

The margin discipline does not disappear under BYOK; it relocates to the free tier, where
abuse is easiest. Build the ceiling before the feature.

### On MCP

Demoted, not deleted. Once the API exists an MCP server is nearly free and it is real
distribution into a Claude Code audience. But it is a later integration and read-mostly: if
the agent does the evaluating, the prompts and refusals live in someone else's skills folder
and the product is reduced to a schema. The evaluation stays ours.

---

## Slice 5 — Candidacy

**The episode:** the pipeline, and the moment a person becomes a candidate.

- `Candidacy` as `Person` × `Role`, created by sourcing, import, or inbound
- `Stage`, with no advancement while any criterion has no `Finding`
- `auto_close_at` non-null on insert

The state transition from "someone I found" to "someone I am putting forward" is a genuine
modelling decision, not a formality. Make it explicit and record it.

---

## Slices 6–11

Expand when you reach them. Notes carried forward that still apply:

**Slice 6 — documents.** Budget double. Real CVs are two-column PDFs, tables, scans, and DOCX
from 2011. It is the fiddliest work in the build and the deepest part of the moat, because it
is exactly the unglamorous engineering a motivated recruiter with a prompt folder will not do.

**Slice 7 — review.** `Evidence` points at a `Document` or a `Sighting`. Sighting citations
need the snapshot, or they rot.

**Slice 11 — metering.** Run the cost benchmark on real volume before setting tiers. The stop
criterion is cost per candidacy above $0.12 at Firm-tier volume, and it should be learned in
week one while the tiers can still change.

---

## What is deliberately absent from the whole plan

Scheduling and calendar sync. Inbound email parsing. Outreach sequences. Timesheets and
invoicing. Analytics beyond four numbers. Mobile. Integrations until asked five times.

Timesheets and invoicing are why v1 is perm-only. Adding contract placement means building
back-office finance, which is the scope decision that kills a solo build.
