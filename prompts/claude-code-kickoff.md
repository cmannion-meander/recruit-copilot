# Claude Code kickoff prompts

Two sessions. The first ends with the landing page live. The second is slice 0 proper.

---

## Session 1 — repo, v0 output wired in, landing page in production

Run this after v0 has produced the site and you've downloaded or `npx v0 add`-ed it.

> Read `CLAUDE.md`, `brand/tokens.css`, and `docs/deployment.md`.
>
> This repo has documentation and a test contract but no application code yet. I've generated
> a Next.js marketing site with v0 and it's sitting in `web/` (or at the path I'll point you
> at). Your job this session is to make it a real repo and get it deployed to Azure App
> Service. No Django yet.
>
> 1. Normalise the v0 output into `web/`: Next.js 15 App Router, TypeScript, Tailwind. Make
>    `brand/tokens.css` the single source of truth for colour and type — if v0 inlined hex
>    values or invented tokens, replace them with references to ours. Load IBM Plex Sans, Mono
>    and Serif properly.
> 2. Audit the generated markup against the hard constraints in `CLAUDE.md` and tell me what
>    you found before fixing it. I expect at least one violation — gradients, a rounded pill
>    button, or a banned word are the usual ones.
> 3. Confirm `npm run build` and `npm start` work locally and that the app respects `PORT`.
> 4. Add `.vscode/settings.json` with `appService.deploySubpath` set to `web` so the Azure
>    extension stops asking.
> 5. Write ADR `0002-az-cli-for-provisioning.md` recording why we're using `infra/create-prod.sh`
>    rather than Bicep or portal clicks, and what we'd trade to change later.
>
> Do not create the Django project. Do not touch `api/tests/test_invariants.py`.
>
> Before writing anything, show me the file tree you intend to end with.

---

## Session 2 — slice 0, the API skeleton

> Read `CLAUDE.md`, `docs/invariants.md`, `docs/data-model.md` and `docs/slices.md`.
>
> Build slice 0 only. A Django 5 project in `api/` managed with uv, settings split into
> `base` / `dev` / `prod`, every value read from the environment per `.env.example`. Two
> database configurations: migrations connect as `rcp_owner`, the application connects as
> `rcp_app`. Add a CI workflow running ruff, pytest, biome and tsc.
>
> Confirm `./db/setup-local.sh` runs clean and that `psql -U rcp_app` reports `f` for both
> `rolsuper` and `rolbypassrls`.
>
> Do not create any domain models. Do not touch `api/tests/test_invariants.py` — those tests
> are the contract for slices 1 through 9 and are expected to fail until then. If you find
> yourself wanting to modify, skip, or xfail anything in that file, stop and tell me instead.
>
> Before writing anything, tell me the file tree and what goes in each settings module.

---

## Order of operations for video one

Do the first two the day before. Neither is watchable and both can stall.

1. Budget alert in the portal — Cost Management → Budgets
2. DNS records at the registrar — see the notes at the bottom of `infra/create-prod.sh`
3. **On camera:** paste `prompts/v0-landing.md` into v0, iterate to something you like
4. **On camera:** Claude Code session 1
5. **On camera:** `./infra/create-prod.sh`
6. **On camera:** right-click `web/` in VS Code → Deploy to Web App
7. Hit `https://www.recruitcopilot.com`

Step 3 is the one that will run long. v0's first draft will be competent and off-brand, and
the correction loop is the interesting footage — it's where the do-not list stops being a
document and starts being a constraint you can watch bite.
