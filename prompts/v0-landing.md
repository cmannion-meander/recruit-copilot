# v0.app prompt — landing page and frontend skeleton

Paste everything below the line into v0. Attach `brand/tokens.css`, and if you have them,
upload pages 7 (palette), 8 (type), 9 (evidence citation) and 13 (do-not list) of the brand
book as images — v0 reads them and it markedly improves the first draft.

After the first generation, iterate with short corrections rather than long re-prompts. v0
responds better to "remove the gradient on the hero, flat `--rc-paper` only" than to a
restated brief.

Generate this as route groups inside one Next application — `(marketing)` and `(app)` — per
ADR 0007. v0 will return its own scaffold; port the routes and components into `web/` rather
than adopting its `package.json`, which will not carry Biome, Tailwind v4, or `tokens.css`.

---

Build the marketing site for **Recruit Copilot**, an applicant tracking system for permanent-
placement recruiting agencies of one to ten people.

Stack: Next.js 15 App Router, TypeScript, Tailwind, shadcn/ui. Marketing routes are static.

## What the product is

A small recruiting agency sends candidates to its clients. Recruit Copilot produces the
document that goes with them — a **Submission Record** showing, criterion by criterion, what
was found in a candidate's application and the exact passage it came from, under the agency's
own logo.

The product is being built in public, as a recorded series. Someone following the series can
build their own; someone who would rather not can buy this one. The page has to serve both
without becoming two pages, because they are largely the same person.

Tagline to use in the hero: **Proof you can hand a client.**

## Routes

**`/`** — landing page, in this order:

1. **Hero.** Tagline, one sentence of support, two actions: "Follow the build" (primary,
   anchors to the capture section) and "See pricing" (secondary). To the right or below, the
   hero visual: a static rendering of the evidence citation component described below. The
   component *is* the hero image — do not add an abstract illustration, a dashboard mockup,
   or a screenshot frame.

2. **How it works** — four steps, plain and horizontal: **The Brief** (write the criteria the
   client actually asked for, before applications arrive) → **Review** (each application read
   against those criteria, every finding beside the sentence that produced it) →
   **Crosscheck** (identity and consistency signals: contact details, timeline arithmetic,
   document metadata, duplicates across your own history) → **Submission Record** (all of it
   in one document carrying your logo).

3. **"There is no score."** A full-width section on dark ink background. This is the strongest
   thing on the page — give it room. Copy: there is no match score, no percentage, no star
   rating, no ranked shortlist. Instead show a comparison row: three candidates, each a row of
   five small square cells in fixed order, filled cells meaning evidenced and hollow cells
   meaning not found, with "4 of 5 evidenced" beside it in tabular figures. Make it obvious
   that the *shape of the row* is what you compare at a glance.

4. **The build, in public.** The series section. Set as a document, not a course sales page —
   no countdown, no testimonial carousel, no instructor headshot, no "what you'll learn"
   checklist with green ticks.

   A short paragraph: the product is being built on camera, slice by slice, from an empty
   repository. Nothing is skipped and nothing is pre-baked.

   Below it, a build order table — two columns, hairline rules, no icons: the slice name and
   the claim it makes. Use these rows exactly:

   | Skeleton | Repository, local Postgres, this page in production |
   | Org, user, auth | Multi-tenant from the first commit, with tests that assert failure |
   | The Brief | Every ATS starts with a job. This one will not open one without criteria. |
   | Person and Sighting | No resolving source, no record — a database refusal, not a request |
   | The model boundary | Evaluation runs inside the product, on the customer's key |
   | Candidacy | The pipeline, and the moment a person becomes a candidate |
   | Documents | Two-column PDFs, tables, scans, and DOCX from 2011 |
   | Review | Every finding cited against pinned criteria |
   | Crosscheck | Integrity signals, traceable to artifacts |
   | Submission Record | The artifact that leaves the building |

   One line under the table, plain: episodes publish as each slice lands.

5. **Pricing.** Four tiers, published, no "contact us" anywhere:
   - **Free** — $0 · 100 applications/month · Pre-flight · watermarked Submission Record
   - **Solo** — $79/mo · 500 applications/month · 1 seat · evidence-linked Review
   - **Firm** — $299/mo · 2,500 applications/month · 5 seats · unbranded Submission Records
   - **Agency** — $699/mo · 10,000 applications/month · unlimited seats · compliance audit pack

   Note below: annual billing costs ten months rather than twelve. Identity verification
   checks sold separately as credit packs, never bundled.

6. **Two captures.** Side by side on desktop, stacked on mobile, equal visual weight, divided
   by a hairline rule. Two separate forms — not one form with a toggle, and not a single field
   with checkboxes. Which one a person fills in is the signal the page exists to collect, and
   a checkbox is too cheap to read as intent.

   No modal. No exit-intent popup. No incentive offer.

   **Left — the course.** Heading: "Build your own." One line: the series is free; a longer
   course on running an AI-forward recruiting process follows it. Fields: email. Button:
   "Notify me when the course opens."

   **Right — the software.** Heading: "Buy this one instead." One line: design partner seats
   open before the build is finished, at the published prices. Fields: email; agency size as
   a select (1, 2–5, 6–10, more than 10); current ATS as a free text input, optional, with
   placeholder text `Loxo, Bullhorn, spreadsheets…`. Button: "Register interest."

   The second form asks more because it is meant to. Do not shorten it to match the first.

   Both forms POST to `/api/capture` with a `list` field of `course` or `software`. Include a
   hidden honeypot input named `company_website`, wrapped in a container that is off-screen
   rather than `display: none`, with `tabindex="-1"` and `autocomplete="off"`.

   Success state replaces the form in place with a single confirming line in the same
   position — no toast, no confetti, no redirect. The failure state uses identical layout and
   says what to do next.

7. **Footer.** Minimal. Link to `/not`.

**`/not`** — a plain list page: what the product deliberately does not do. It does not rank
candidates. It does not decide who to advance. It does not verify a claim an application never
made. It does not read video, analyse faces or score voices. Set as a quiet, confident
document, not a feature grid.

**`/app`** — an empty authenticated shell: sidebar, top bar, content slot. No content yet.

## The evidence citation component

This is the signature element of the whole product. Build it as a presentational component,
used on the landing page and reusable later.

Two states.

**Evidenced** — a small label reading `EVIDENCED` in IBM Plex Mono, uppercase, letterspaced,
in `--rc-evidenced`. Below it, the candidate's quoted sentence in IBM Plex **Serif**, normal
weight, generous line height, in quotation marks. Below that, a provenance line in IBM Plex
Mono at 12px, muted: `CV · page 1, paragraph 3 · uploaded 12 Jun 2026`.

**Not found** — label reads `NOT FOUND` in `--rc-open`. No quote. A single muted line:
`Nothing to cite · ask at interview`.

Left border 2px in the semantic colour, flat tint background (`--rc-evidenced-tint` or
`--rc-open-tint`), square corners.

## Form fields

Build these as their own components. They are used twice on the landing page and will be used
throughout the application, so they carry the design system rather than shadcn's defaults.

Square corners at 3px. 1px border in a hairline rule colour, not a shadow. Label above the
field in IBM Plex Sans at 14px, never a placeholder standing in for a label. Focus state is a
2px border in `--rc-evidenced` plus a visible outline — never colour alone, and never a ring
that disappears in high contrast mode. Error state is a border in `--rc-open` plus a text line
beneath the field naming the problem and the fix. Body text in fields never below 16px.

## Design system

Use the attached `brand/tokens.css` exactly. Load IBM Plex Sans, Mono and Serif from Google
Fonts. Serif is used *only* for quoted candidate passages — never for headings.

Type scale in px: 12 · 14 · 16 · 18 · 22 · 28 · 36 · 48. Nothing between. Body never below
16px.

Any number that appears in a column or is compared across rows uses
`font-variant-numeric: tabular-nums`.

Layout: generous whitespace, hairline rules rather than heavy card shadows, near-square
corners (3px). The reference register is a well-set document — closer to a legal or financial
report than to a SaaS dashboard.

## Hard constraints — these are disqualifying, not preferences

Do not use:

- Gradients of any kind. Flat fills only.
- Sparkle, star, or four-point AI glyphs. Any of them.
- Violet or blue-purple. The palette is teal, amber, ink and warm paper.
- Neural network graphics, node graphs, glowing orbs, particle fields, mesh backgrounds.
- Shields, padlocks, fingerprints, radar sweeps, red alert iconography.
- Robots, faces, mascots, illustrated people, or anything with eyes.
- Pastel blobs, hand-drawn arrows, illustrated diverse crowds.
- Gauges, dials, speedometers, ring charts, progress bars, percentage circles.
- Star ratings, letter grades, out-of-ten, leaderboards, "top match", "best fit".
- Any single figure standing in for a person.
- Rounded pill buttons or large border radii.
- Exclamation marks anywhere.
- Emoji.
- Countdown timers, seat-remaining counters, scarcity banners, "join 2,000 others" counts.
- Testimonial carousels, logo walls, instructor portraits, video thumbnails with play badges.

Never write these words: seamless, effortless, powerful, unleash, supercharge, revolutionise,
game-changing, 10x, magic, or "smart" as a modifier. Never write a sentence in which the
software thinks, believes, feels, or recommends.

Copy voice: state the requirement, give the reason in one clause, name the next action. Calm,
declarative, unhurried. No apology and no salesmanship. Every claim on the page should be
something a four-person agency owner would be comfortable putting his own logo on and sending
to his best client. If a line would make him hesitate, it is too loud.
