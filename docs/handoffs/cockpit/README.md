# Handoff: Recruit Copilot — application shell, dark-cockpit desk, candidacy drawer

## Overview

An application shell and four working screens for the Recruit Copilot prototype: a persistent
left nav, a top bar carrying client/role context and search, and a redesigned Desk that stays
empty unless something needs the recruiter. The Candidacies screen becomes a dense twelve-row
table with filters, sort and a right-hand detail drawer, replacing the previous full-page
navigation to `/prototype/candidacies/[candidacyId]`.

The organising idea is **dark cockpit**: nothing is illuminated unless it needs action. It is
*not* a dark theme. The paper stays cream, the ink stays near-black, and "illuminated" means
full-contrast ink plus a 3px ink bar plus a written mono label — never a new colour.

## About the design files

`Recruit Copilot.dc.html` in this bundle is a **design reference created in HTML**. It is a
single self-contained file with inline styles and hardcoded fixture data. It is not production
code and should not be copied into the repo.

The task is to recreate it inside the existing Next.js app at `web/`, using that codebase's
established patterns: Tailwind v4 utilities generated from `app/globals.css`, the components
already in `web/components/`, and the prototype state in `app/(prototype)/_state/`. Every value
in this document already exists as a token or a component in that repo — where it does, use the
repo's version rather than the literal.

`Candidacies v1.dc.html` is the earlier, prose-heavier pass. It is included only as a reference
for the About-panel copy and the full evidence legend; build from `Recruit Copilot.dc.html`.

## Fidelity

**High-fidelity.** Colours, type sizes, spacing, row heights, states and copy are final and
should be matched. Every colour is an existing `--rc-*` token; every type size is on the closed
scale in `app/globals.css`. There is no new palette and no new component library.

---

## Two corrections to make while porting

These were found by review of the design against `app/tokens.css` and `app/tokens-derived.css`,
and are worth stating because they are easy to reintroduce:

1. **`--rc-rule-control` (#948D7E) is an edge token, never a text colour.** It is documented as
   "input and select edges — 3.02:1 on paper". Muted text is `--rc-ink-muted` (#636B78, 4.93:1,
   per the ADR 0008 note). An early version of this design put #948D7E on column headers and
   secondary text, which puts body text under the book's 4.5:1 floor. In the final file, all
   muted text is `text-ink-muted` and all control edges are `border-rule-control`.
2. **Quiet comes from size, weight and position — not from lowering contrast.** Where the
   cockpit needs something to recede, use 14px, regular weight, and a secondary column. Do not
   reach for a fainter colour.

---

## Design tokens

All of these already exist. Use the utility, not the hex.

| Role | Token | Utility | Hex |
|---|---|---|---|
| Primary text, illuminated state | `--rc-ink` | `text-ink` | `#12171F` |
| Secondary text | `--rc-ink-secondary` | `text-ink-secondary` | `#39424F` |
| Muted text, column heads, metadata | `--rc-ink-muted` | `text-ink-muted` | `#636B78` |
| Page background | `--rc-paper` | `bg-paper` | `#F6F5F2` |
| Nav rail, row hover, selected row | `--rc-paper-sunk` | `bg-paper-sunk` | `#EDEBE6` |
| Drawer surface | `--rc-paper-raised` | `bg-paper-raised` | `#FFFFFF` |
| Hairlines, row separators | `--rc-rule` | `border-rule` | `#DCD9D2` |
| Input / select / button edges | `--rc-rule-control` | `border-rule-control` | `#948D7E` |
| Evidenced cell, quote rule | `--rc-evidenced` | `bg-evidenced` | `#0E6C89` |
| Looked for, not found (cell edge) | `--rc-open` | `border-open` | `#8B5A11` |
| Radius | `--rc-radius` | `rounded-rc` | `3px` |

Nav hover uses `#E3E0D9` — one step darker than `paper-sunk`, currently not a token. Either add
it as `--rc-paper-sunk-hover` in `tokens-derived.css` (it is the same class of gap the file
already documents) or use `bg-paper-sunk` on hover against the rail and accept less separation.

**Type** — closed scale from `globals.css`, nothing between:
`text-12` `text-14` `text-16` `text-18` `text-22` `text-28` `text-36` `text-48`.
Screen titles `text-22 font-medium tracking-[-.01em]`. Drawer titles `text-22 font-semibold`.
Row primary `text-16`. Row secondary and all metadata `text-14`. Every mono label uses the
existing `.rc-label` class (12px, `.12em` tracking, uppercase, Plex Mono) — do not re-declare it.
Numbers that align in a column carry `.tabular`. Quoted candidate passages use `font-serif`
(Plex Serif), which is the book's only permitted use of it.

**Spacing** — the density brief was "roughly half the previous vertical rhythm". Table rows are
`py-[7px]` compact / `py-3` comfortable. Section gaps are `mt-5`/`mt-6`, not `mt-12`. Prose is
capped at `max-w-[70ch]` everywhere, and `text-wrap: pretty` is on every paragraph.

---

## Components to reuse (do not rebuild)

| Design element | Existing component |
|---|---|
| Evidence squares in a row + "4 of 5" | `components/criteria-row.tsx` → `<CriteriaRow cells subject size="sm" />` |
| The written legend | `components/criteria-row.tsx` → `<CriteriaKey />` |
| Role state mark + word (Open/Draft/Closed) | `components/state-marker.tsx` → `<StateMarker label shape />` |
| Stage counts per role | `components/stage-funnel.tsx` |
| Quoted passage with its citation | `components/evidence-citation.tsx`, `components/passage.tsx` |
| Probation checkpoints | `components/checkpoint-list.tsx` |
| Days-to-auto-closure figure | `components/days-remaining.tsx` |
| Buttons in the drawer and filter row | `components/control.tsx` |

The design file draws the evidence squares and state marks inline because it has no import
mechanism. In the repo they must come from `CriteriaRow` / `StateMarker`, unchanged — the shape
vocabulary (filled / 2px outlined / 1px dotted) and the greyscale-survival rule live there.

`app/(prototype)/screen.tsx` (`Screen` / `ScreenTitle` / `Section`) is superseded by this design
and its `note` prop in particular: every explanatory paragraph moves into a collapsed "About"
disclosure. Either add a `note` → disclosure change inside `Section`, or stop using it on these
screens. `app/(prototype)/prototype-bar.tsx` stays as it is; the nav rail's bottom line
("PROTOTYPE · SYNTHETIC DATA") is a compressed echo of it, not a replacement.

---

## The one piece of new logic: `needsAttention`

Everything illuminated anywhere in the app comes from one predicate. In the design file it is
`flagOf(candidacy)`. In the repo it belongs in `app/(prototype)/_state/selectors.ts` (or beside
`refusals.ts`, which it resembles), signature `needsAttention(state, candidacy): Flag | null`
where `Flag = { flag: string; detail: string }`.

It returns non-null when, in this order:

1. The candidacy has a **placement with an outstanding checkpoint past its `due_on`**.
   Flag: `Checkpoint {n} days past due`. Derived from `placements.ts` + `checkpointsFor()`.
2. Otherwise, if the candidacy is **closed** (`closed_at != null`) → always `null`. A closed
   record cannot need attention.
3. Otherwise, the union of:
   - **`auto_close_at` within 7 days** → `Closes in {n} days`
   - **the current stage's `criterion_ids` are not all covered by a Finding** → `Scorecard incomplete`
   - **unresolved `CrosscheckSignal`s** (`resolution === null`) → `{n} signals unresolved`

   joined with ` · `. This is the same coverage arithmetic `refuseCandidacy` already performs;
   factor it out rather than writing it twice.

Against the current fixtures this yields exactly seven flagged records:
Amankwah (checkpoint), Lloyd-Price (closes + scorecard), Petrescu (2 signals), Ibbotson
(1 signal), Marchetti (scorecard), Nandakumar (scorecard), Rahman (scorecard).
Nav badges are counts of this predicate; a badge is **absent**, not zero, when the count is 0.

---

## Screens

### Shell

Root: `flex h-screen overflow-hidden bg-paper`.

**Left nav** — `w-[206px] shrink-0 flex flex-col bg-paper-sunk border-r border-rule`.
- Wordmark block: `px-4 pt-[13px] pb-3`, `<p class="rc-label text-ink">HALLOWAY & FINCH</p>`.
- Items: `The Desk`, `Roles`, `Candidacies`, `Sourcing runs`, `Settings`.
  Each is a real `<button>` (or `next/link`) laid out `grid grid-cols-[3px_1fr_auto] items-center gap-[9px] py-[5px] pr-2 rounded-rc text-16`.
  - Column 1 is a 16px-tall bar: `bg-ink` when current, transparent otherwise.
  - Column 2 is the label: `text-ink font-medium` when current, `text-ink-secondary` otherwise.
  - Column 3 is the attention count: `rc-label`-ish mono 12px `text-ink .tabular`, **rendered only when > 0**.
  - Current item also takes `bg-paper` (it lifts out of the sunk rail).
  - Hover on non-current: `bg-[#E3E0D9]`.
- Footer, `mt-auto border-t border-rule px-4 py-[11px]`: `<p class="rc-label text-ink-muted">PROTOTYPE · SYNTHETIC DATA</p>`.

**Top bar** — `flex flex-wrap items-center gap-[14px] px-5 py-1.5 min-h-[45px] border-b border-rule`.
- Left: the client/role context `<select>`, `border border-rule-control rounded-rc bg-transparent text-14 px-1.5 py-[3px]`, `min-w-[150px] max-w-[330px] flex-[0_1_auto]`. Options:
  `All clients · all roles`, `Bramhall Precision Group · Financial Controller`,
  `Calder Vale Foods · Finance Business Partner`, `Calder Vale Foods · Management Accountant`.
  Changing it filters the Candidacies table — it is the role filter, which is why the table has none.
- Right group `ml-auto flex items-center gap-[14px] flex-[1_1_200px] justify-end min-w-0`:
  search `<input type="search" placeholder="Search">`, `flex-[1_1_220px] max-w-[240px] min-w-[110px]`,
  same control edge; then `<p class="text-14 text-ink-muted">Ruth Halloway</p>`.
  Both must be allowed to shrink — an earlier version pinned their widths and they were clipped
  under `overflow-hidden` below ~1100px with no scroll path.

**Content** — `flex-1 min-h-0 overflow-auto px-5 pt-4 pb-6`.

---

### 1. The Desk

The default screen. Purpose: see everything that needs you, and nothing else.

- Title row: `<h1 class="text-22 font-medium">The desk</h1>`, then `<p class="text-14 text-ink-muted tabular">` with the current date (`formatDate(NOW)` → "5 August 2026"), then an `About` toggle pushed `ml-auto` (`rc-label text-ink-muted border border-rule-control rounded-rc px-2 py-[3px]`).
- About disclosure, collapsed by default, one paragraph:
  *"This screen stays empty unless something needs you. Nothing on it ranks a person, and no figure here stands in for a role, a client or a candidate."*
- `<p class="rc-label text-ink-muted mt-[22px]">NEEDS YOU · {n}</p>` — or `NOTHING NEEDS YOU TODAY` when the list is empty, in which case render no list at all.
- **Attention list**, `border-t border-ink`. Each item is a full-width `<button>`:
  `grid grid-cols-[3px_148px_minmax(0,1fr)_auto] gap-x-4 items-baseline text-left border-b border-rule py-[11px] pr-2`, hover `bg-paper-sunk`.
  - col 1: `self-stretch bg-ink` — the 3px illumination bar, full row height.
  - col 2: `rc-label text-ink-secondary` — the kind.
  - col 3: subject `text-16 text-ink`, then fact `text-14 text-ink-muted max-w-[70ch] mt-0.5`.
  - col 4: the verb, `rc-label text-ink-muted whitespace-nowrap`.

  The seven items, in this order, with their destinations:

  | Kind | Subject | Fact | Verb | Goes to |
  |---|---|---|---|---|
  | PROBATION | George Amankwah · Calder Vale Foods | Day 90 was due 31 May. Nobody has asked. | RECORD IT | Candidacies, drawer open on `cnd_amankwah_fbp` |
  | AUTO-CLOSURE | Bethan Lloyd-Price | Closes in 3 days. No finding ever recorded. | OPEN | drawer on `cnd_lloyd_price` |
  | SIGNALS | Ivan Petrescu | Timeline overlap, and a shared telephone number. | RESOLVE | drawer on `cnd_petrescu` |
  | SIGNALS | Frances Ibbotson | CV document properties name a different author. | RESOLVE | drawer on `cnd_ibbotson` |
  | SCORECARDS | 4 candidacies cannot advance | Their current stage's criteria carry no finding. | REVIEW | Candidacies, `flaggedOnly` on, open records |
  | ROLE | Management Accountant · Calder Vale Foods | Two criteria. Three are required to open. | OPEN BRIEF | Roles, drawer on that role |
  | SOURCING | 3 sightings read, and not yet anybody | From the June run. | TRIAGE | Sourcing runs |

  All seven strings are derived, not authored — regenerate them from state so they stay true.
- **Roles strip** below, `rc-label text-ink-muted mt-[26px]` heading `ROLES`, then three rows,
  `grid grid-cols-[minmax(0,1fr)_190px_300px_92px] min-w-[880px] gap-x-4 items-center border-b border-rule py-[9px]`:
  role title `text-16 text-ink` over client `text-14 text-ink-muted`; `<StateMarker>`; the funnel
  as `Sourced 3 · Contacted 1 · Screening call 2 …` in `text-14 text-ink-muted tabular`; and the
  attention count, again only when non-zero. Whole row is a button → Roles + that role's drawer.

### 2. Candidacies

- Title row: `<h1>` shows the role title when the context select is scoped, otherwise
  `Candidacies`; then `{n} records` (or `{n} of 12 records` when filtered) `text-14 text-ink-muted tabular`; then the `About` toggle.
- About disclosure holds **all** the prose that used to sit in the flow, plus `<CriteriaKey />`:
  - *"One row is one person on one role, against the criteria of the Brief version pinned when the role opened. Sorting is a filing order: there is no sort by evidence, because a column ordered by assessment reads as a shortlist."*
- Filter row, `mt-3 flex flex-wrap items-center gap-2`. All `<select>`s carry
  `border border-rule-control rounded-rc bg-transparent text-14 text-ink-secondary px-1.5 py-[3px]`:
  - Stage — `Any stage` + the ten stage labels in `STAGE_ORDER`.
  - Channel — `Any channel` + the five names from `channels.ts`.
  - Record state — `Open and closed` / `Open records` / `Closed records`.
  - **Needs attention** toggle button (`aria-pressed`), border goes `border-ink` and text `text-ink` when on.
  - Sort, pushed `ml-auto` with an `rc-label` "SORT": `Family name` (default), `Stage`,
    `Days to auto-closure`, `Date added`. **There is deliberately no sort by evidence count.**
- Table, `border-t border-ink`. Header row and body rows share
  `grid grid-cols-[3px_minmax(210px,1.25fr)_152px_232px_128px_330px] gap-x-4 items-center min-w-[1141px]`.
  Header cells are `rc-label text-ink-muted`: (blank), `CANDIDATE`, `ROLE`,
  `CRITERIA, IN BRIEF ORDER`, `STAGE`, `ATTENTION`.
  - Rows are `py-[7px] border-b border-rule cursor-pointer`, `tabIndex 0`, Enter/Space selects.
  - Hover `bg-paper-sunk`; selected `bg-paper-sunk` **plus** the col-1 bar filled `bg-ink`
    (selection is never colour alone).
  - Candidate cell: name `text-16` — `text-ink` when flagged, `text-ink-secondary` when not —
    then employer `text-14 text-ink-muted truncate`.
  - Criteria cell: `<CriteriaRow size="sm">` squares (13px in the design) + `{n} of {m}` in
    `text-14 text-ink-muted tabular`.
  - Attention cell: when flagged, the flag string in `rc-label text-ink`, allowed to wrap to two
    lines — it must never be truncated, it is the whole point of the screen. When not flagged,
    the auto-closure date (or `Closed {date}`) in `text-14 text-ink-muted tabular`.
  - The Channel column was removed to pay for the width; the filter and the drawer keep it.
- Twelve rows fit without vertical scrolling at 1440×900 in compact density.

### 3. Roles

Same table grammar. `grid grid-cols-[3px_minmax(0,1.2fr)_minmax(0,1fr)_140px_170px_108px_92px] min-w-[940px]`,
headers `ROLE`, `CLIENT`, `STATE`, `THE BRIEF`, `CANDIDACIES`, `ATTENTION`. Brief cell reads
`Version 2 · 5 criteria`. Row click opens the role drawer.

### 4. Sourcing runs

Attention first, runs second — the inversion is the point.
- `READ, AND NOT YET ANYBODY · 3`, then the three unresolved sightings from `SEARCH_JUNE_ID`
  (Rhodri Vaughan, Nia Ashworth, Stefan Bąk), each with the illumination bar,
  `grid grid-cols-[3px_minmax(0,1fr)_300px_132px]`, source in mono 12px `text-ink-muted`, and a
  `Create person` `<Control>` on the right.
- `RUNS · BOTH PINNED TO BRIEF VERSION 2`, then the two searches with date, scope revision and
  the `coverage_note` shortened to one line each.

### 5. Settings

`<h1>Settings</h1>` and one line: *"Nothing is open yet."* There is no source for this section in
the repository; do not invent one.

---

## The drawers

Both: `fixed inset-y-0 right-0 w-[460px] max-w-[46vw] z-40 flex flex-col bg-paper-raised border-l border-ink`,
entering with `translateX(10px) → 0` and `opacity 0 → 1` over 160ms ease-out. No scrim, no shadow
(the book forbids gradients and this needs none — a 1px ink edge is the whole separation).
Escape closes. Clicking the selected row again closes.

**Candidacy drawer**
1. Header, `border-b border-rule px-[18px] py-3`: eyebrow `rc-label text-ink-muted`
   "{client} · {role}", name `text-22 font-semibold`, headline `text-14 text-ink-muted`,
   `Close` control top-right.
2. **Flag block**, only when `needsAttention` is non-null: `grid grid-cols-[3px_1fr] gap-x-3`,
   `border-y border-ink py-[9px]`, bar `bg-ink self-stretch`, flag in `rc-label text-ink`, then the
   long-form detail in `text-14 text-ink-secondary max-w-[70ch]`. This is where the sentence the
   Desk had to shorten gets said in full — e.g. *"Day 90 was due 31 May 2026 and nobody has asked.
   The fee is earned at the end of probation on 2 September 2026, not on the start date."*
3. Stage marker + auto-closure line, `border-b border-rule py-[11px]`.
4. `<dl>` `grid grid-cols-[104px_1fr] gap-x-[14px] gap-y-1`: Employer, Location, Contact, Channel.
   Contact reads *"No email or phone on the record"* where the person has neither — eight of the
   twelve do, and that absence is a fact about sourced people, not an empty field.
5. `THE BRIEF · Version 2 · 2 March 2026`, then the criteria **in Brief order**, each row
   `grid grid-cols-[15px_1fr] gap-x-2.5 border-b border-rule py-2`: the evidence square, the
   numbered criterion text `text-16`, and then either
   - the quoted passage — `border-l-2 border-evidenced pl-2.5`, `font-serif text-14`, curly quotes,
     with the source in mono 12px `text-ink-muted` beneath (`aileen-marchetti-cv.pdf · 20 Apr 2026`,
     `stelmarkengineering.example · read 14 Mar 2026`) — or
   - the state word in `rc-label`: `NOT FOUND` in `text-open`, `NO ENTRY` in `text-ink-muted`.
     Evidenced findings show the quote instead of the word; the quote *is* the word.

   In the repo these come from `cellsFor(state, candidacy)` and should render through
   `evidence-citation.tsx` / `passage.tsx` so the char offsets stay honest.

**Role drawer**
Header (client, title, `The Brief · Version {n} · {date}`), the same flag block for the draft
role (`CANNOT OPEN` + why), then `WHAT MUST BE EVIDENCED, AND WHERE` — numbered criteria each with
`Evidenced at {stage}` in `text-ink-muted`, or `Assigned to no stage` in `text-ink` (illuminated,
because it is a refusal waiting to happen). Then `STAGES` with per-stage counts, and a
`See candidacies` control that closes the drawer and navigates with the role filter applied.

---

## State

```ts
view: "The Desk" | "Roles" | "Candidacies" | "Sourcing runs" | "Settings"
selected: CandidacyId | null        // candidacy drawer
selectedRole: RoleId | null         // role drawer
roleFilter: "all" | RoleId          // driven by the top-bar context select
stageFilter | channelFilter: string // "all" | label
stateFilter: "all" | "open" | "closed"
flaggedOnly: boolean
sort: "family" | "stage" | "closing" | "added"
query: string
aboutOpen: boolean
```

In the repo, `view`/`selected` should be the URL rather than component state — `/prototype`,
`/prototype/roles`, `/prototype/candidacies?role=…&candidacy=…` — so a flagged record is
linkable and the browser Back button closes the drawer. Filters can stay local. Navigating from
a Desk item sets `view`, filters and `selected` in one transition.

Sorting is stable and case-correct on family name (`localeCompare`), ties broken by role title.
`Date added` sorts on `created_at`, not `auto_close_at` — they are not the same ordering.

## Interactions

- Row hover 0ms, no transition (a table that animates on hover feels slow at twelve rows).
- Drawer 160ms ease-out on transform + opacity. About panel 140ms opacity only.
- Escape closes either drawer. Enter/Space on a focused row opens it.
- Focus: keep the repo's existing `focus-visible:outline-ink outline-2 outline-offset-4` pattern.
- Nothing else animates.

## Assets

None. No icons, no images. The only graphical objects are the evidence squares and state marks,
which are `<span>`s with a border or a background, already implemented in `criteria-row.tsx` and
`state-marker.tsx`.

## Files in this bundle

- `Recruit Copilot.dc.html` — the design to build from. Open it in a browser.
- `Candidacies v1.dc.html` — earlier pass; reference only, for the longer About copy.

## Source of the data

Every name, quote, date, stage, channel and signal in the design is read from the existing
fixtures — nothing is invented:
`_fixtures/candidacies.ts`, `people.ts`, `roles.ts`, `reviews.ts`, `crosscheck.ts`,
`placements.ts`, `channels.ts`, `searches.ts`, `organisation.ts`, and `clock.ts` for `NOW`
(2026-08-05, fixed). When you wire the real selectors, the hardcoded arrays in the design file
should disappear entirely.
