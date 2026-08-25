# Demo script

For a recording session against the real backend (M7 cutover, `docs/backend-prd.md`).
Everything below was run and screenshotted during verification — this is not aspirational.

## Setup (once, before recording)

```bash
./db/setup-local.sh --reset          # clean database
cd api && uv sync && uv run manage.py migrate
uv run manage.py seed_demo           # prints: username ruth / password recruit-copilot-demo
uv run manage.py runserver 8000

# separate terminal, in web/
cp ../.env.example ../.env           # if you haven't already; fill in the __GENERATE_ME__ values
# add to .env: DJANGO_API_ORIGIN=http://localhost:8000 and CSRF_TRUSTED_ORIGINS matching your port
pnpm install
pnpm dev                             # usually :3000; check the terminal — it falls back if taken
```

Open `http://localhost:3000/prototype`. If port 3000 is taken by something else on your
machine, Next says so in its own output and picks the next free port — add that port to
`CSRF_TRUSTED_ORIGINS` too, or the login POST gets refused by Django's CSRF check with a
403 that has nothing to do with the password.

## The beats

### 1. Cold open — The Desk

Sign in as `ruth` / `recruit-copilot-demo`. The Desk loads.

Say: *this screen stays empty unless something needs you.* Point at the five items —
they are not fixture data, they are five real rows in Postgres, computed by the same
`needsAttention` predicate the prototype always had, now running against a real read.

- **PROBATION** — George Amankwah, day 7 overdue, nobody has asked.
- **SIGNALS** — Stefan Bak, one unresolved crosscheck signal.
- **SCORECARDS** — 3 candidacies cannot advance.
- **ROLE** — Management Accountant, two criteria, three required.
- **SOURCING** — 2 sightings read, not yet anybody.

### 2. A refusal, live

Click **SCORECARDS**. Open Ivan Petrescu's drawer. Click **ADVANCE**.

The refusal renders instantly, in the product's own voice, naming the criterion:

> This candidate can't leave Screening call until its scorecard is complete.
> One criterion this stage carries has no entry.
> Has managed a team of three or more — Criterion 2 of 3 · assigned to Screening call
> Open the scorecard and record a finding against each.

Say: *that check ran twice — once here, instantly, and once again on the server, which
is the one that actually matters.* This is `reviews/services.py::require_stage_complete`,
the same function `Review.advance()` calls, checked from two call sites so the rule is
never stated twice.

### 3. Fix it, live

Click **RECORD A FINDING** on the open criterion. Record it against the sighting text
shown. Click **ADVANCE** again — it goes through this time. The drawer now shows
Screening call → Competency call.

This is the moment to cut to a terminal and run:

```bash
psql -d recruitcopilot -c "select status, recorded_at from finding order by recorded_at desc limit 1;"
```

The row is there. That request went through Django, through `record_finding`, through
the real `Evidence` and `Finding` tables, under the same RLS policy every other query in
this product runs under.

### 4. A signal, resolved

Back to the Desk, or the Candidacies list. Open Stefan Bak. His scorecard is complete —
the crosscheck signal is the only thing in the way. Click **RESOLVE**, write a note,
submit. The flag clears. Optionally: show **OVERRIDE** as the other path invariant 5
allows, on a fresh signal — both require a written reason; neither accepts silence.

### 5. A role that refuses to open

Open Roles. Click into Management Accountant. It has two criteria. Every control that
could open it stays live and answers when pressed — there is no greyed-out button here,
per `components/control.tsx`'s own rule. The refusal names what's missing: one more
criterion, and every one assigned to a stage, before this can open.

### 6. Sourcing, inverted

Open Sourcing runs. The unresolved sightings sit above the completed runs — attention
first, history second, which is the screen's whole point. Two sightings, read and not
yet anybody.

### 7. The submission, and what's real about it

George Amankwah already has a Submission Record (seeded, so you don't have to sit
through recording three findings on camera). Open his drawer, find the reference
(`H&F-2026-0001`-shaped). This is where the honesty matters:

**The candidate-facing page at `/prototype/candidate/[token]` is not wired to the real
backend yet** — it still reads from the shared cockpit state, which means it's nested
inside the recruiter's authenticated shell and never sees an unauthenticated request the
way ADR 0017 designed it to. Don't demo that route as-is; it will either 404 or ask you
to log in, which defeats the entire point.

What **is** real and demoable: the backend's own read path.

```bash
curl -s http://localhost:8000/api/candidate/<the-token-from-the-drawer> | python3 -m json.tool
```

That call has no session, no cookie, nothing but the token — and it returns the frozen
snapshot, the candidate's own message history, and the org's AI-use notice text, crossing
RLS through the one `SECURITY DEFINER` function built for exactly this (ADR 0017). Say:
*this is the same guarantee a recruiter's login gives, delivered a different way, because
a candidate never has a session to give.* The screen that renders it prettily is next.

### 8. Close on the database, not the screen

The throughline of this whole build: a skill can ask an agent not to invent a person; the
database refuses the write. Show it directly:

```bash
psql -d recruitcopilot -c "insert into person (id, organization_id, full_name) values (gen_random_uuid(), (select id from organization limit 1), 'Nobody Invented');"
```

It fails — `person_provenance` refuses a `Person` with no resolving `Sighting`, at the
constraint level, not the UI level. That's the sentence to end on.

## What this demo does not claim

- The candidate-facing screen (§7) needs its route pulled out from under the recruiter
  layout and its data fetch pointed at `/api/candidate/<token>` directly, plus
  `dynamic = "force-dynamic"` in place of the fixture-era `generateStaticParams()`. Real
  work, not a config flag — next up.
- Only two of the four crosscheck signal types have real detectors
  (`crosscheck/services.py`): `duplicate_candidacy` and `document_author`. The seed data
  uses the former; `timeline_overlap` and `contact_collision` are schema-ready, undetected.
- A handful of screens (Roles' full detail, Placement checkpoints beyond the Desk item,
  document upload) are backend-complete but weren't driven through the UI during this
  verification pass — the contract tests and the seed script both exercise them directly,
  just not by clicking.
- One cosmetic React key warning appears in the browser console during this flow — most
  likely a StrictMode double-render artifact from the extra re-hydration this cutover
  adds, not a data bug (nothing rendered incorrectly). Worth a look, not a blocker.
