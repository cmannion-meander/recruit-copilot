# Claude Code kickoff — the clickable prototype

Three sessions. Frontend only, synthetic data, no backend of any kind. The output is a
workflow you can click end to end and a list of things the interface forced us to decide.

This runs **before** slice 1. The reason is that every invariant in `docs/invariants.md` is a
refusal, and a refusal is a piece of interface design before it is a database constraint. We
would rather find out that "this candidate cannot advance until the scorecard is complete"
reads as an obstruction than discover it after a trigger enforces it.

---

## What this is, and what it is not

**It is** a disposable artifact whose product is decisions. It lives at `/prototype`, reachable
by direct URL only, and it gets deleted when the real workspace lands.

**It is not** the first version of the application. Nothing under `app/(prototype)/` migrates.
The presentational components do — that is the whole reason for the split described in session
one — but the fixtures and the state machine are scaffolding and they come down.

**On access:** no login gating, no link from the marketing site, no entry in `/app`, `noindex`
on every route. That is obscurity, not access control, and the prompt says so out loud because
the temptation to treat it as privacy is what puts real candidate data in a mock. **No real
candidate data goes in this, ever.** Every person in the fixtures is invented.

---

## Session 1 — shell, fixtures, and the front door

> Read `CLAUDE.md`, `docs/invariants.md`, `docs/data-model.md` and `docs/slices.md`. Then read
> `web/app/(app)/app/layout.tsx`, `web/components/evidence-citation.tsx`,
> `web/app/globals.css` and `web/next.config.mjs` so you match the conventions already in the
> tree rather than inventing new ones.
>
> We are building a clickable prototype of the candidate workflow, in `web/`, frontend only.
> No Django, no Postgres, no API calls, no network requests of any kind. Synthetic data held
> in memory. The point is to test the interface and the workflow before we build the systems
> underneath, so the refusals in `docs/invariants.md` have to be *visible and clickable*, not
> merely prevented.
>
> ### Placement
>
> A new route group `web/app/(prototype)/prototype/`, alongside `(marketing)` and `(app)`.
> Do not touch either of those. Do not add a link to the prototype from anywhere.
>
> Two private folders, `_fixtures/` and `_state/`, underscore-prefixed so Next does not route
> them.
>
> ### The line that matters
>
> Anything presentational goes in `web/components/` and survives this prototype. Anything that
> knows the shape of a fixture or the reducer stays under `app/(prototype)/`.
>
> **Nothing in `web/components/` may import from `app/(prototype)/`.** Components take props.
> Add a check to `pnpm lint` that fails if that import ever appears — a convention this load-
> bearing should be mechanical, per `CLAUDE.md`.
>
> Reuse `components/evidence-citation.tsx` as it stands. If it needs a prop it does not have,
> tell me before changing it — it is on the landing page in production.
>
> ### Rendering and access
>
> Every prototype route sets `export const dynamic = "force-static"`. Dynamic segments get
> `generateStaticParams` from the fixtures, which also proves the fixture set is closed. The
> group layout sets `robots: { index: false, follow: false }`, and add a `Disallow: /prototype`
> to a `robots.txt` route.
>
> The group layout also carries a persistent bar, present on every screen: the words
> `PROTOTYPE · SYNTHETIC DATA · NOT A PRODUCT`, and a "Reset" control.
>
> ### State
>
> React context plus `useReducer`, in memory only. **No persistence, no localStorage, no
> sessionStorage.** A reload returns to the identical starting state, because these screens get
> filmed and every take has to start the same way. "Reset" dispatches back to the initial
> fixture state.
>
> ### The fixtures
>
> Write these as typed modules under `_fixtures/`. Types mirror `docs/data-model.md` exactly —
> same entity names, same field names. Where the data model has an open question, encode the
> ambiguity rather than resolving it silently, and leave a comment saying which open question
> it is.
>
> One organisation, one recruiter user, two Clients, three Roles:
>
> - **`draft`, two criteria.** Exists so invariant 1 is reachable: this role must refuse both
>   a Search and a Candidacy, and say why.
> - **`open`, five criteria.** The main role, and where nearly all the filming happens.
> - **`closed`.** One line in a list. It exists so the list is not uniform.
>
> The open role: a four-person agency placing a **Financial Controller** at a PE-backed
> manufacturing business. Five criteria, in fixed order, each genuinely evidenceable from a CV:
> closed a month-end in a PE-backed environment · led an ERP migration · managed a team of
> three or more · manufacturing or industrial sector · qualified ACA, ACCA or CIMA. Change the
> role if it does not ring true to you, but keep criteria that a real document could support or
> fail to support — criteria that cannot be evidenced make the whole prototype lie.
>
> Twelve People. **Every one carries at least one Sighting** with a source URL, a
> `retrieved_at`, and a snapshot excerpt of what that source said — invariant 9. Most are
> sourced and therefore **have no email address**, which is an open question in
> `docs/data-model.md` and one of the things this prototype exists to answer. Two or three came
> in through an inbound apply and have both an email and a CV.
>
> Three or four Documents with real parsed CV text, three to six hundred words each, written so
> that specific sentences support specific criteria and others plainly do not. Evidence carries
> true character offsets into that text, plus page and paragraph. Do not fake the offsets —
> compute them, so the citation component is being fed what it will really be fed.
>
> Twelve Candidacies across stages, arranged so that every refusal is reachable without setup:
> two with an incomplete scorecard, two with an unresolved Crosscheck signal, one already
> rejected with a reason code and written reason, one excluded, one submitted and immutable,
> one within days of `auto_close_at`.
>
> ### Screens for this session
>
> 1. **`/prototype`** — the desk. Open roles, and for each, counts of candidacies by stage.
>    No composite anything.
> 2. **`/prototype/roles/[roleId]`** — the role, its Brief with the criteria in fixed order,
>    and the candidacies on it. The `draft` role shows the refusal in place of the pipeline.
> 3. **`/prototype/roles/[roleId]/search`** — one sourcing run against a pinned Brief version.
>    Scope, date, who ran it, and the Sightings it returned. Turning a Sighting into a Person
>    and a Candidacy happens here. Attempting to add a Person without a resolving source must
>    refuse.
> 4. **`/prototype/people/[personId]`** — the person, their Sightings with `retrieved_at` and
>    snapshot, and every Candidacy they hold across roles.
>
> ### Refusal voice
>
> Every refusal follows `CLAUDE.md`: state the requirement, give the reason in one clause, name
> the next action. A disabled button teaches nothing and is not acceptable — the control stays
> live and answers when pressed.
>
> ### Do not
>
> Do not create the Django project. Do not touch `api/tests/test_invariants.py`. Do not modify
> `(marketing)` or `(app)`. Do not add a dependency without asking. Do not write a score, a
> rank, a rating, a percentage, a confidence value, or a sort by candidate quality anywhere —
> invariant 2, and the schema scan that enforces it does not cover TypeScript, so here it is a
> thing you have to mean.
>
> Invariant 10 has no surface here and must not acquire one: there is no settings screen, no
> key field, and nothing in this prototype talks to a model provider. If a screen seems to want
> one, that is slice 4 and it is not this.
>
> ### Before writing anything
>
> Show me the file tree you intend to end with, the fixture types, and which parts of that tree
> you consider disposable. I want to disagree with the disposable line before you build against
> it.

---

## Session 2 — evaluation, and the refusals that bite

> Continue the prototype. Read back what you built in session one before changing it.
>
> ### Screens
>
> 5. **`/prototype/candidacies/[candidacyId]`** — the candidacy. The pinned Brief version, the
>    criteria as a fixed-order row of cells (filled evidenced, hollow not found) with the count
>    beside it, the stage, and `auto_close_at` as a plain number of days remaining. The count
>    never renders without the cells — invariant 2.
>
>    `auto_close_at` is visible on every candidacy and there is no control to extend or disable
>    it — invariant 6. A deadline you can quietly turn off is not a promise to a candidate.
>
>    The stage control is live on every candidacy. On one with an incomplete scorecard it
>    refuses and **names the criteria with no entry** — invariant 3. That refusal is the single
>    most important interaction in this prototype. Design it as a considered screen state, not
>    an error toast.
>
> 6. **`/prototype/candidacies/[candidacyId]/review`** — the evaluation. Each criterion in
>    fixed order with its Finding, `evidenced` or `not_found`, rendered through
>    `components/evidence-citation.tsx`, every evidenced finding beside the quoted passage that
>    produced it and its provenance line. Clicking a citation reveals the passage in the parsed
>    document with the quoted range marked — this is what the character offsets are for.
>
>    Recording a Finding by hand is part of the flow. There is no confidence control, no
>    partial state, no "maybe". Two values.
>
> 7. **Crosscheck**, on the candidacy. Signals are observations, never judgements: a timeline
>    overlap of seven months between two stated roles, a phone number matching another person
>    in this organisation's own history, CV metadata naming a different author, a duplicate
>    against a prior candidacy. Each renders as a citation pointing at the artifact it came
>    from. No probability, no severity, no traffic light, no red.
>
>    Resolving a signal takes either a recorded resolution or an Override carrying a user and a
>    written reason. An empty reason is refused.
>
> 8. **Rejection.** A reason code from a fixed enum **and** non-empty written text, both
>    required — invariant 4. Refuse the submit with either missing, and say which. Show the
>    resulting DecisionEvent in an append-only activity list on the candidacy.
>
> ### What I want to see fail
>
> Before you tell me this session is done, walk me through pressing, in a real browser:
> advance with an incomplete scorecard · reject with a code and no text · reject with text and
> no code · override a Crosscheck signal with an empty reason · edit a quoted passage.
>
> The last one should have no control at all — invariant 8 revokes UPDATE on evidence at the
> permission level, so an interface that offers an edit and then refuses it is teaching the
> wrong thing.

---

## Session 3 — the artifact, the candidate, and the write-up

> Continue the prototype.
>
> ### Screens
>
> 9. **`/prototype/candidacies/[candidacyId]/submission`** — the Submission Record. The
>    artifact the whole product exists to produce, and the one screen where the register has to
>    be a document rather than an application: the agency's logo, the client and role, the
>    pinned Brief version, every criterion with its finding and quoted passage, the named human
>    sign-off with a timestamp.
>
>    Creation refuses while any Crosscheck signal on the candidacy is unresolved, naming the
>    signals — invariant 5. Once created it is immutable: no edit control anywhere on it, and
>    the fixture set already contains one created record so the immutable state is reachable
>    without going through the flow.
>
>    No "Powered by Recruit Copilot" anywhere on it. Read the one-line test in `CLAUDE.md`
>    again before you build this screen.
>
> 10. **`/prototype/candidate/[token]`** — the candidate-facing view, invariant 7. A different
>     audience and a different voice: the person reading this is being assessed and did not ask
>     to be. It states plainly that software was used in the assessment, shows the findings
>     against them with the quoted passages, and names what happens next. Read-only.
>
>     No exclamation marks. No encouragement. No apology. Nothing that reads as a rejection
>     letter written by a system that is pleased with itself. If a line would embarrass us
>     printed in a newspaper beside the candidate's name, it is wrong.
>
> ### Then stop building and write two things
>
> **`docs/decisions/0010-*.md`** — the prototype's placement and disposability. Why
> `/prototype` and not `/app`, why in-memory state with no persistence, where the line between
> kept components and disposable wiring sits, and what has to be true before it is deleted.
>
> **`docs/prototype-findings.md`** — what the interface forced. Not a summary of what you
> built; a list of decisions that could not be deferred once something had to render. I expect
> these among them:
>
> - Does one Brief hold the sourcing scope as well as the assessment rubric? The search screen
>   cannot be drawn without an answer. `docs/data-model.md` says decide explicitly and write
>   the ADR — this is where it gets forced.
> - What does a sourced person with no email look like, and what is the contact affordance when
>   there is nothing to contact?
> - How does a Sighting snapshot render once the live source has moved on?
> - Does the fixed-order cell row survive twelve candidacies on one screen, or does it stop
>   being scannable and start needing the thing we refuse to build?
> - Where did you want a score, and what did you draw instead?
>
> That last question is the honest one. Answer it even if the answer is nowhere.
>
> ### Do not
>
> Do not resolve any of the open questions in `docs/data-model.md` by writing code that quietly
> assumes an answer. Surface them. An open question that reaches slice 5 unnoticed is exactly
> the retrofit the data model was written to prevent.

---

## Order of operations for the episodes

1. Session 1 on camera. The fixture design is more interesting footage than it sounds —
   deciding that every Person needs a Sighting *before* any database exists is the argument
   the series is making.
2. Session 2 on camera. The walk-through of failures at the end is the episode. Film the
   incomplete-scorecard refusal properly; it is the ninety seconds that explains the product.
3. Session 3 on camera, then read `docs/prototype-findings.md` aloud as the close. The
   findings are the reason the prototype existed, and saying so on camera is what keeps the
   series honest about UX-first meaning something.

Between sessions two and three, click the whole flow yourself with the audio off. A prototype
reviewed only in the session that built it is reviewed by the person least able to see it.
