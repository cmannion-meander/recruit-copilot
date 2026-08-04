# Recruit Copilot

An applicant tracking system for permanent-placement recruiting agencies of 1–10 people.
The atomic unit is the submission. The product exists to produce one artifact: a
**Submission Record** the agency hands to its client, showing what was found against each
criterion and the exact passage it came from.

There is no score. There is no ranked shortlist. Those are not omissions.

---

## Getting started

The marketing site is the only part that runs today. Node 24 — the version is pinned in
`web/.nvmrc` and matches the deployed runtime, so a mismatch is worth avoiding.

```bash
cp .env.example .env      # web/ reads this too; see next.config.mjs
nvm use                   # in web/, or install 24 first
cd web && pnpm install
pnpm dev                  # http://localhost:3000
```

Everything else in `web/`:

```bash
pnpm build && pnpm start  # production build; honours PORT
pnpm lint                 # token drift check, then Biome
pnpm typecheck
pnpm tokens               # regenerate web/app/tokens.css from brand/tokens.css
pnpm icons                # regenerate the icon set (needs Pillow)
```

The two capture forms post to `/api/capture`, which subscribes to a Mailjet contact list.
Without credentials it refuses with a 503 that tells the visitor to write in — deliberately,
rather than confirming a sign-up it did not record. `.env.example` lists what it needs.

The database and the API are not wired up yet:

```bash
./db/setup-local.sh                          # local Postgres, two roles
uv run pytest api/tests/test_invariants.py -v   # expect failures — that is the point
```

There is no Django project to migrate. `api/` holds the invariant tests and nothing else
until slice 0 of the API, and those tests are expected to fail until the slices that satisfy
them land.

## Layout

```
CLAUDE.md              working agreement — read first
docs/invariants.md     the ten invariants and how each is enforced
docs/data-model.md     entities and the rules that are painful to retrofit
docs/slices.md         build order, slices 0–11, with 2–5 specified
docs/deployment.md     App Service notes and the gotchas that cost an evening
brand/tokens.css       colour and type — source of truth, also pasted into v0
web/                   the Next 15 app: marketing routes static, app shell, capture endpoint
web/app/tokens.css     generated copy of brand/tokens.css — scripts/tokens.mjs checks it
web/app/tokens-derived.css   the few values the brand book has no entry for, with ratios
prompts/               kickoff prompts for Claude Code and v0
infra/create-prod.sh   provisions production — local only, see below
docs/decisions/        ADRs — 0001, 0008 and 0009 ship; 0002–0007 are local only
db/setup-local.sh      why local Postgres has two roles, neither superuser
api/tests/             the contract
```

Two paths are marked local only. `infra/create-prod.sh` and ADRs 0002–0007 record how *our*
deployment was built — one Azure subscription's per-region VM quota, a domain whose DNS is a
web form, an inbound IP, an npm setting that only bites on one build service. Following them
would mean inheriting our resource names and our region. They are kept out of this repo
because they would misinform, not because they are secret. Nothing here depends on them:
everything above runs locally.

The exceptions are the ADRs that record reasoning rather than infrastructure. 0008 darkens a
brand colour that failed the contrast floor the brand book itself sets. 0009 explains why the
capture endpoint speaks one email provider's API rather than a generic transport, and what
that trades away. Both are cited from files that ship, so both ship.

Code comments cite ADRs by number. A citation you cannot follow — 0002 through 0007 — is
telling you the decision was deliberate and specific to our deployment, not that a file is
missing.

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
