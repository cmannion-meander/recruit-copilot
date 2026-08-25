# Recruit Copilot

An applicant tracking system for permanent-placement recruiting agencies of 1–10 people.
The atomic unit is the submission. The product exists to produce one artifact: a
**Submission Record** the agency hands to its client, showing what was found against each
criterion and the exact passage it came from.

There is no score. There is no ranked shortlist. Those are not omissions.

---

## Getting started

Node 24 — the version is pinned in `web/.nvmrc` and matches the deployed runtime, so a
mismatch is worth avoiding.

```bash
cp .env.example .env      # web/ reads this too; see next.config.mjs
nvm use                   # in web/, or install 24 first
cd web && pnpm install
pnpm dev                  # http://localhost:3000 (or :3001 if :3000 is taken)
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

### The API and the cockpit

The backend is a real Django project under `api/`, and the `/prototype` cockpit runs
against it — not fixtures — once both are up.

```bash
./db/setup-local.sh                     # local Postgres, three roles (see docs/decisions/0014)
cd api && uv sync
uv run manage.py migrate                # runs as rcp_owner
uv run manage.py seed_demo              # a demo org with flagged records; prints the login
uv run manage.py runserver 8000

# separately, in web/, with DJANGO_API_ORIGIN=http://localhost:8000 in .env:
pnpm dev
```

Open `http://localhost:3000/prototype` (or whatever port Next chose) and sign in with the
username and password `seed_demo` printed. `next.config.mjs` proxies `/api/*` to Django —
same origin from the browser's point of view, so the session cookie just works; see the
comment beside `apiOrigin` there, and ADR 0017 for the one deliberately unauthenticated
read (the candidate token view).

The contract:

```bash
cd api && uv run pytest tests/test_invariants.py -v   # the ten invariants, plus tenancy
```

Every test in that file passes as of the current build. `docs/backend-prd.md` is the plan
it was built against, milestone by milestone; `docs/decisions/` (gitignored — deployment
and schema decisions specific to this checkout, see `CLAUDE.md`) has the reasoning behind
each non-obvious call.

## Layout

```
CLAUDE.md              working agreement — read first
docs/invariants.md     the ten invariants and how each is enforced
docs/data-model.md     entities and the rules that are painful to retrofit
docs/slices.md         build order, slices 0–11, with 2–5 specified
docs/deployment.md     App Service notes and the gotchas that cost an evening
docs/demo-script.md    the walkthrough this build renders, beat by beat
brand/tokens.css       colour and type — source of truth, also pasted into v0
web/                   the Next 15 app: marketing routes static, /prototype the cockpit
web/app/(prototype)/_state/api.ts   the one file that knows the Django backend exists
web/app/tokens.css     generated copy of brand/tokens.css — scripts/tokens.mjs checks it
web/app/tokens-derived.css   the few values the brand book has no entry for, with ratios
prompts/               kickoff prompts for Claude Code and v0
infra/create-prod.sh   provisions production — local only, see below
docs/decisions/        ADRs — 0001, 0008 and 0009 ship; the rest are local only
docs/backend-prd.md    the API's plan, milestone by milestone
db/setup-local.sh      why local Postgres has three roles, none of them superuser
api/                   the Django project — models, migrations, the contract in tests/
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

## Status, and what is deliberately not here yet

The backend is built: M0 through M7 (`docs/backend-prd.md`) are done, `api/` is a full Django
project, `api/tests/test_invariants.py` passes in full against `rcp_app`, and `/prototype`
reads and writes real Postgres rows through the API — not an in-memory reducer.

Two slices stay out on purpose. Slice 4, the LLM service boundary and bring-your-own-key
handling — a key belongs behind a boundary from its first use, not added after one — and
slice 11, metering and Stripe. See `docs/slices.md`. Nothing in the shipped build calls a
model provider or stores a customer key; both are asserted by the invariant suite
(`test_no_customer_key_material_column_exists`), not left to convention.

No Bicep, no CI beyond lint and test, no Docker. The build runs entirely locally; see
`docs/deployment.md` for what a production checkout would need instead of this one.

---

## Kickoff

See `prompts/claude-code-kickoff.md` for the two session prompts and the order of operations
for the first recording, and `prompts/v0-landing.md` for the frontend brief.
