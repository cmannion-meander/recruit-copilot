# Recruit Copilot — working agreement

An applicant tracking system for permanent-placement recruiting agencies of 1–10 people.
The atomic unit is **the submission**, not the application. The product exists to produce a
document the agency hands to its client: the Submission Record.

We start the build at sourcing, because sourcing is the front door of an agency ATS — the
recruiter creates the person-role link by going and finding someone. `Client` and `Role`
exist from slice 2 so the join is never retrofitted. The person-role record is a
**Candidacy**, not an Application: most candidates never applied.

This file is the contract. Read `docs/invariants.md` and `docs/data-model.md` before writing
model code. Read `docs/slices.md` for the current build target.

---

## The one-line test for any decision

> Would a four-person agency owner put his own logo on this and send it to his best client?

If he would hesitate, it is wrong.

---

## Object names — use these exactly

| Concept | Name | Never call it |
|---|---|---|
| The criteria set | **The Brief** | Criteria Profile, Ideal Candidate, Job DNA, Scorecard |
| The person–role link | **Candidacy** | Application, Applicant, Candidate Record |
| One sourcing run | **Search** | Sourcing Job, Hunt, Campaign |
| Where a person was found | **Sighting** | Source, Hit, Result |
| One evaluation | **Review** | Assessment, Analysis, Screening |
| Integrity signal layer | **Crosscheck** | Identity Verification, Fraud Check, Trust Score |
| Free scan (acquisition surface) | **Pre-flight** | Free Scan, Instant Insights, Quick Look, Demo |
| Client-facing output | **Submission Record** | Candidate Report, Match Summary, Profile |
| Where each criterion is evidenced | **The Brief**, in its stages | Interview Plan, Stage Config, Scorecard Template |
| One scorecard, at one stage | **Review** | Interview Feedback, Assessment, Stage Score |
| Where a candidacy came from | **Channel** | Source, Origin, Lead Source |
| What the candidate was told | **Message** | Notification, Comms, Touchpoint |
| After the start date | **Placement**, with **Checkpoints** | Onboarding, 30/60/90, Aftercare |

These names appear in code identifiers, table names, API routes, and UI strings. Do not
introduce synonyms. Never say "fraud check" to or about a candidate.

**The Brief says two things**: what must be evidenced, and where each one is evidenced. Both are
versioned together and repinned together, because moving a criterion to a later stage changes
what the assessment is. The sourcing scope is *not* in The Brief — widening where you look
changes nothing about what anyone is assessed against. See ADR 0011.

---

## Banned vocabulary — never ships in any user-visible string

seamless · effortless · powerful · unleash · supercharge · revolutionise · game-changing ·
10x · magic · "smart" as a modifier · any sentence where the system thinks, believes, feels,
or recommends.

Rewrite, always:

- "Our AI thinks this is a strong candidate" → "Four of five criteria are evidenced."
- "Top match" → nothing. There is no such concept.

---

## The do-not list

**Never draw:** the four-point AI sparkle (or any sparkle). Violet or blue-purple gradients.
Neural nets, node graphs, glowing orbs, particle fields. Shields, padlocks, fingerprints,
radar sweeps, red alerts. Illustrated diverse crowds, pastel blobs, hand-drawn arrows.
Robots, faces, mascots, anything with eyes.

**Never show a number that judges:** gauges, dials, speedometers, ring charts. Percentages,
letter grades, stars, out-of-ten. Traffic lights or red/amber/green rows. "Top match",
"best fit", ranked leaderboards. Any single figure standing in for a person. Progress bars
filled by an evaluation. **Stack rankings** of candidates at a stage. **Quality of hire** —
it is a score attached to a named individual, applied retrospectively, and it is the same
object this list refuses at the front of the process wearing a different hat.

Process figures are a different thing and are allowed: how many reached a stage, how long a
role took to fill, which channel produced them. They judge the desk, never the person. Render
them as counts and count pairs — "6 of 10 reached the screening call" — never as a rate.

**Never write:** a sentence where the system thinks, believes, or recommends. A finding
without a quoted passage beside it. An exclamation mark on a candidate-facing screen.
"Powered by Recruit Copilot" on a client document. Colour as the only signal for a state.
Body text below 16px or under 4.5:1 contrast.

---

## Voice

Pattern: **state the requirement · give the reason in one clause · name the next action.**
No apology, no "oops", no exclamation mark, never "you must". The system never claims to
know better; it points at the record.

> "This candidate can't advance until the scorecard is complete. Two criteria have no entry.
> Open the scorecard."

---

## Visual system

- Type: IBM Plex Sans / Mono / Serif. Serif is for quoted candidate passages only.
- **Tabular figures required** wherever numbers align: `font-variant-numeric: tabular-nums`.
- Scale (px): 12 · 14 · 16 · 18 · 22 · 28 · 36 · 48
- Ink `#12171F` · secondary `#39424F` · muted `#6C7583` · paper `#F6F5F2` / `#EDEBE6`
- Evidenced `#0E6C89`, tint `#CFE4EB`
- Not found / open `#8B5A11`, tint `#F1E2C2`

State is **never** communicated by colour alone. Every state has a shape and a label.
Must survive greyscale and colourblind rendering — this is permanent, not a nice-to-have.

---

## Stack

| | |
|---|---|
| `api/` | Django 5 · Python 3.12 · uv · ruff · pytest |
| `web/` | Next.js 15 · TypeScript · Tailwind · Biome. Marketing routes static, app routes dynamic. |
| Database | PostgreSQL 16. Row-level security. Local install, see `db/setup-local.sh`. |
| Queue | Postgres-backed (`procrastinate`). **No Redis, no Celery.** |
| Storage | Django storage API only. Local disk in dev, Azure Blob in prod. |
| Auth | Django sessions, httpOnly cookies on a shared parent domain. **No JWT.** |

### Rules that are not negotiable

1. **Never `open()` a file path in the document pipeline.** Django storage API, always.
2. **Never call a model provider from a view, task, or management command.** Everything goes
   through `api/llm/service.py`, which records tokens, cost, org, and application on every call.
3. **Never connect to Postgres as a superuser or as the table owner from application code.**
   RLS is bypassed by both. The app role is `rcp_app`.
4. **All configuration comes from environment variables.** No hardcoded hosts, keys, or paths.
5. **No score column. Anywhere.** See invariants.

---

## Commands

```bash
./db/setup-local.sh                  # Postgres roles + database
cd api && uv sync                    # install
uv run manage.py migrate             # runs as rcp_owner (see .env)
uv run pytest                        # all tests
uv run pytest tests/test_invariants.py -v   # the contract
uv run ruff check . && uv run ruff format .

cd web && pnpm install && pnpm dev
pnpm biome check .
```

---

## Working style

- `tests/test_invariants.py` is the contract. It must never be weakened, skipped, or marked
  xfail to make a feature land. If a feature conflicts with an invariant, the feature is wrong.
- Record every non-obvious infrastructure or schema decision as a numbered ADR in
  `docs/decisions/`. Short: what, why, what breaks without it.
- Prefer a database constraint over application validation, and application validation over
  a code review convention. The convictions in this product must be mechanical or they will
  erode over a few hundred commits.
