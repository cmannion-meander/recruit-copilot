# Recruit Copilot

An applicant tracking system for permanent-placement recruiting agencies of 1–10 people.
The atomic unit is the submission. The product exists to produce one artifact: a
**Submission Record** the agency hands to its client, showing what was found against each
criterion and the exact passage it came from.

There is no score. There is no ranked shortlist. Those are not omissions.

---

## Getting started

```bash
cp .env.example .env
./db/setup-local.sh                          # local Postgres, two roles
cd api && uv sync && uv run manage.py migrate
uv run pytest tests/test_invariants.py -v   # expect failures — that is the point
```

## Layout

```
CLAUDE.md              working agreement — read first
docs/invariants.md     the ten invariants and how each is enforced
docs/data-model.md     entities and the rules that are painful to retrofit
docs/slices.md         build order, slices 0–11, with 2–5 specified
docs/deployment.md     App Service notes and the gotchas that cost an evening
brand/tokens.css       colour and type — source of truth, also pasted into v0
prompts/               kickoff prompts for Claude Code and v0
infra/create-prod.sh   provisions production — local only, see below
docs/decisions/        ADRs — 0001 only, the rest are local only
db/setup-local.sh      why local Postgres has two roles, neither superuser
api/tests/             the contract
```

Two paths are marked local only. `infra/create-prod.sh` and ADRs 0003 onward record how *our*
deployment was built — one Azure subscription's per-region VM quota, a domain whose DNS is a
web form, an inbound IP. Following them would mean inheriting our resource names and our
provider. They are kept out of this repo because they would misinform, not because they are
secret. Nothing here depends on them: everything below runs locally.

## What is deliberately not here yet

No Bicep, no CI beyond lint and test. The landing page goes to production in slice 0 and
nothing else does — the build runs locally until slice 4, where the LLM service boundary and
bring-your-own-key handling land together, because a key belongs behind a boundary from its
first use rather than after one.

The Django project, the models, the RLS middleware and the frontend are all absent on
purpose — those are the build, and they get written on camera.

---

## Kickoff

See `prompts/claude-code-kickoff.md` for the two session prompts and the order of operations
for the first recording, and `prompts/v0-landing.md` for the frontend brief.
