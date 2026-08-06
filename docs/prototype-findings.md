# What the interface forced

Not a summary of what was built. A list of decisions that could not be deferred once something
had to render, and the open questions the prototype either answered or sharpened.

The prototype is at `/prototype`; see `docs/decisions/0010`. Every person and document in it is
invented.

---

> **Second pass, mapped against a five-step structured hiring framework** — ideal candidate
> profile, staged interview process with a scorecard per stage, channel measurement, candidate
> communication, and post-hire feedback. Findings 15
> to 19 are new and come from that mapping; ADR 0011 records what changed. Finding 2 and finding
> 8 below were both sharpened by it, and finding 8's answer got worse before it got better.

---

## 1 · The Brief does not hold the sourcing scope. Two objects.

**The question** (`docs/data-model.md`): does one Brief hold both the sourcing scope and the
assessment rubric? The likely answer written there was "one Brief, two sections, versioned
together, where only the rubric section gates advancement."

**What the search screen did to it.** The screen cannot be drawn without a scope on it — a
sourcing run with no statement of where it looked is a list of names. So the scope had to exist
by the time screen 3 rendered, and the shape it needed was decided by what happens to a real
search: the March run returned eight people, three of whom the client already knew, and the scope
was widened in June to plastics, composites and food manufacturing.

The rubric did not move. Nothing anybody is assessed against changed.

Under "one object, versioned together" that June widening produces **BriefVersion 3**, and every
Review pinned to version 2 now renders as one version behind — which is a lie about the
assessment, told by a change to the sourcing. Worse, the gate in invariant 1 counts criteria on
the pinned version, so a scope edit walks through the code path that guards the rubric.

**Decision: two objects.** `SourcingScope` has its own id and its own `revision`, and points at a
`BriefVersion`. `Search` pins both. `Review` pins only the BriefVersion. The open role in the
fixtures has one BriefVersion and two scopes, and the search screen draws them as two panels
with two revision numbers, side by side, because that is what the record holds.

**What it costs.** Two things to keep in sync in the UI, and a recruiter has to understand that
"the brief changed" can mean either. The mitigation is on the screen: the scope panel says
"where to look", the rubric panel says "what has to be evidenced in a person", in those words.

**Needs its own ADR in slice 2.** Both objects, their lifetimes, and which one the `>= 3` gate
counts.

---

## 2 · The cell row needs a third state that `Finding.status` does not have

This is the first thing the interface forced, and the one with schema consequences.

`Finding.status` is `evidenced | not_found`, and that is right: a finding either has a passage
behind it or it does not. But a criterion with **no finding at all** is not a third value of a
finding — it is the absence of one, and the cell row has to show it or a half-done scorecard
reads as a finished one. Aileen Marchetti has three of five recorded, and drawing her two blanks
as `not_found` would say "we looked and found nothing" about work nobody has done.

So the row has three marks: solid (evidenced), thick outline (not found), thin dotted (no entry).
Each is a shape before it is a colour, and the count beside it reads "3 of 5 evidenced · 2 with
no entry".

**No schema change.** The third state is derived — criterion in the pinned BriefVersion with no
row in `finding`. But it means the count in invariant 2 has two numbers in it, not one, and the
UI contract "the count never renders without the cells" now covers a pair. `components/criteria-row.tsx`
renders cells and count in one component with no export that emits a bare number, which is the
mechanical form of that rule.

---

## 3 · A sourced person has no email, and the contact affordance is the source

Eight of the twelve people have no email address and no telephone number. Not missing data — the
correct state for someone nobody has spoken to.

**What it looks like.** The person screen prints a written clause where a blank would go: "No
email address. This person was sourced, not applied — the route to them is the source below."
A dash or an empty cell reads as a bug or as data we lost; a sentence reads as the truth about
the record.

**The contact affordance is the sighting.** The only honest route to Priya Nandakumar is the
Kestrel management page she was read on, so that is what the screen offers — the URL, under a
line saying so. There is no "Email" button that opens a compose window addressed to nothing,
and no enrichment prompt, because the product does not have one and offering the shape of a
feature is how a shape becomes a commitment.

**Consequence for dedup, which is the harder half.** Every identity operation in slice 3 has to
work with name + employer + source URL and no anchor. The prototype does not solve that; it
proves the interface cannot quietly assume otherwise, because there is no screen on which an
email appears often enough to lean on.

---

## 4 · Evidence pointing at a `Sighting` is the majority path, not the exception

Four of twelve people have a CV. The other eight can only be evidenced from a sighting snapshot.

Ivan Petrescu's whole review — two evidenced, three not found — is cited into the Stelmark people
page as it read on 14 March. `components/evidence-citation.tsx` and the passage viewer are fed
snapshot text with real offsets exactly as they are fed parsed CV text, and neither knows the
difference.

**Two things follow.** Snapshot text has to be stored with the same care as parsed document text,
because it is quoted into a client-facing document. And the recorder for a sourced person offers
sentences from sightings, so "record a finding" has to work with no document present — which it
does, and it is what screen 6 looks like for Priya Nandakumar.

A CV-only prototype would never have exercised that branch, and slice 7 would have been written
assuming documents.

---

## 5 · A Sighting snapshot renders with its age and nothing else

**The question:** how does a snapshot render once the live source has moved on?

**The answer the record forces: it cannot know that it has.** Whether a page still says what it
said would take another fetch, and until there is one, the only honest thing on the screen is how
long ago it was read. So the card prints "Read 14 March 2026 · 5 months ago" and stops.

The temptation was a `stale` flag, or a diff, or a badge. Every version of that is the interface
claiming knowledge the system does not have — the same failure as an invented profile URL, in the
opposite direction. Priya Nandakumar's conference listing was read seventeen months ago and says
"Group Financial Controller" while the current page says "Head of Finance"; both are on her
screen, each with its date, and the reader draws the conclusion. That is the correct division of
labour.

**Later, if re-fetch exists**, the honest addition is a second sighting with a new `retrieved_at`,
not a mutation of the first. Sightings accumulate; they do not update.

---

## 6 · Two of four Crosscheck signal types cannot render as an evidence citation

`docs/data-model.md`: "If a signal cannot render as an evidence citation, it does not ship."

Written as a rule for the model's opinions. Applied to the four deterministic signals, it bites
the wrong ones:

| Signal | Artifact | Can it be an `Evidence` citation? |
|---|---|---|
| Timeline overlap | Two sighting snapshots | Yes — offsets into the snapshot |
| Document author | PDF properties | **No** — not in the parsed text, so no offsets exist |
| Contact collision | The org's own records | **No** — not a Document and not a Sighting |
| Duplicate candidacy | Another candidacy | **No** — same |

Three of the four are exactly the cheap, deterministic, defensible checks the same document says
to prefer over model calls. Enforcing the rule as written deletes them.

**What the prototype does, which is not a decision:** `CrosscheckArtifact` is a wider union than
`EvidenceTarget`, and the two are deliberately different types. Document properties render as a
key–value block in mono with the line "not in the parsed text, so it has no character range to
cite"; an internal record renders as a labelled reference with a link to the other candidacy.
Both are visibly a different shape from a quoted passage, rather than dressed up as one.

**The real decision, for slice 9.** Either `Evidence` widens to admit an internal record — which
weakens invariant 9's "points at a Document or a Sighting, never at nothing" — or the rule is
restated as "a signal must point at a named artifact a client could be shown", which is what the
prototype actually implements. The second reading is better and it is not what the document says.
**Write the ADR before slice 9, not during it.**

---

## 7 · There is no way to say "the document addresses this, and the answer is no"

Frances Ibbotson's CV says, in her own words: *"I have not run a system implementation myself. The
Dynamics project at Northgate is led by the group IT director and I sit on the steering group as
the finance representative."*

Criterion 2 is "Led an ERP migration". The recorded finding is `not_found`, and the citation
renders "Nothing to cite · ask at interview".

That is wrong in a small way that will matter. There *is* something to cite, it is unusually
clear, and it makes the interview question redundant — the candidate has already answered it,
straightforwardly, to her own cost. The two-value enum flattens "we found nothing" and "we found
a plain statement that it is not the case" into the same cell, and the second is more useful to
the client and fairer to the candidate.

**Not fixed here, and no third status.** A third value re-opens invariant 2 and is the exact hole
a confidence score climbs through. The shape worth testing in slice 7 is `not_found` **with**
optional evidence — a citation attached to an absence, rather than a new state. That keeps the
enum at two values and the cell row at three marks, and it gives the Submission Record something
better to print than the current paragraph of hedging.

---

## 8 · The fixed-order cell row survives ten rows. What it does not survive is the eye.

The open role has ten candidacies on one screen. The row itself holds up: five equal marks, same
order every time, readable in greyscale, each with a written label for a screen reader.

Three things the screen made obvious that the argument had not:

**Position is the only carrier of criterion identity.** There is no per-column header — there
cannot be, without five words above five 20px squares. Cell 2 is "led an ERP migration" only if
you remember it. Ten rows in, you do. Two minutes after arriving, you do not, and the criteria
list sits above the table where you have to look up and back down. `title` and `aria-label` carry
it per cell, which serves a screen reader better than it serves a sighted skim.

**Four of the ten rows are entirely dotted.** The dominant visual fact on the role screen is not
who is strong; it is how much work has not been done. That is arguably the right thing for a
recruiter's desk to say. It also means the row is doing double duty — comparing candidates and
reporting progress — and those two jobs want different screens.

**The pull toward a sort is physical.** Looking at ten rows of five cells, the hand reaches for a
column header to sort by "most filled". That control is a composite score with the arithmetic left
to the reader, and it is not built. Rows sort by family name and nothing else. This is the
invariant that will be argued about first with a design partner, and the answer is that a sort by
fill count is a ranking with plausible deniability.

**If a role reaches forty candidacies**, the row is no longer the answer and filtering is —
*"show me the ones where criterion 2 is evidenced"* is a legitimate question that does not rank
anybody. Filter, never sort. Untested here; the fixtures top out at ten on one screen.

---

## 9 · Recording a finding cannot accept typing

The recorder shows the sources held and asks which sentence supports the criterion. Clicking one
records the finding and takes the offsets from the text.

The first design had a quotation field. It is indefensible: a typed quotation is a claim that a
passage exists, with no relationship to whether it does, and every downstream promise — the
citation, the passage reveal, the Submission Record, the candidate view — rests on the offsets
being real. Given a text box, a tired recruiter at 4pm will paraphrase, and the paraphrase will
be printed under the agency's logo inside quotation marks.

So the passage picker is not a convenience. It is the mechanism, and it is why
`_fixtures/offsets.ts` throws at build when a fixture quote drifts from its document rather than
rendering a plausible-looking lie.

**Consequence for slice 6.** Sentence segmentation over parsed text has to be good enough to pick
from, on two-column PDFs and DOCX from 2011. That is a parsing requirement generated by an
interface decision, and it belongs in the slice 6 budget.

---

## 10 · Whitespace-insensitive matching, exact offsets

Parsed text wraps mid-sentence. A quotation written by a human does not. "I led the migration
from Sage 200 to Microsoft Dynamics 365 Business Central across two sites" contains a newline in
the document and none in the quote.

`locate()` normalises whitespace for matching and returns offsets into the original string, and
`Evidence.quote` stores the original substring, line breaks and all. The citation component
collapses whitespace when it renders. The real pipeline needs the same tolerance for the same
reason, and getting it wrong produces citations that are correct on screen and unfindable in the
document.

---

## 11 · A refusal has to name things, not count them

Every refusal follows the pattern in CLAUDE.md — state the requirement, give the reason in one
clause, name the next action. Drawing them showed that the pattern needs a fourth part whenever
the reason is a number.

"Two criteria have no entry" is a riddle. The panel lists them:

> **This candidate can't advance until the scorecard is complete.**
> 2 criteria have no entry.
> — Led an ERP migration, not only participated in one · Criterion 2 of 5
> — Has managed a team of three or more · Criterion 3 of 5
> **Open the scorecard and record a finding against each.**

Same for invariant 5, which names the open signals rather than counting them. `Refusal` takes an
`items` prop for exactly this, and the validators in `api/` have to raise with the list, not the
count — `IncompleteScorecard` carrying criterion ids, not a number.

---

## 12 · No control is ever disabled

`components/control.tsx` has no disabled variant, and the omission is deliberate enough to be
written in the file.

A greyed-out button declines silently and leaves the reader to guess which of five things is
wrong. Every control that can refuse stays live and answers when pressed. On the draft role both
"Add a candidate" and "Run a search" are pressable and each returns its own wording of invariant 1.

The cost is a screen state for every refusal instead of an attribute, which is more work and is
the work. `disabled` survives for one honest use: a form mid-submit, where the control is not
refusing but busy.

---

## 13 · The candidate view is a different product

Screen 10 shares the citation component with the recruiter's scorecard and nothing else. Writing
it took longer than any other screen, and every draft that read as *reassuring* was wrong.

What the drafts kept doing: apologising, encouraging, thanking someone for an application they
never made, or explaining the process in a tone pleased with its own fairness. The test that
killed all of it — would this line embarrass us printed in a newspaper beside this person's name.

What survived is flat. "Software was used to assess you." "You were not scored. No number was
produced about you, and you are not ranked against anyone else — the system holds no such figure,
so there is none to show you or to withhold." "If nothing has been decided by 15 October 2026,
this closes on its own and you will be told that it has closed. It does not go quiet."

That last sentence is invariant 6 written for the person it protects, and it is the only place in
the product where `auto_close_at` is a promise rather than a field.

---

## 14 · Where I wanted a score, and what I drew instead

The honest one.

**On the desk.** Every role wants a single number — a health figure, a "pipeline strength", a
count of "strong candidates". What is drawn is counts by stage: five integers that each mean one
thing. It is less glanceable and it is not a compromise position; there is no figure that could
sit there and be true.

**On the role screen, four times.** Sorting the ten rows. Every arrangement other than
alphabetical is a ranking: by fill count, by stage, by recency, by "most recently progressed".
Family name, and the note under the heading says why.

**In the criteria row.** The count wanted to be a fraction, then a bar, then a ring. "4 of 5
evidenced" is three words where a shape would do — and that is the entire argument, because the
shape is glanced at and the words are read.

**On auto-closure, hardest of all.** Days remaining wants a bar, and colour, and a ramp to red as
it runs down. It is drawn as an integer and a date. Three days gets an underline — a shape, not a
hue — and the four-day row and the seventy-one-day row look otherwise identical, which is
uncomfortable and correct: this is a promise to a person, not a burndown.

**On the Crosscheck panel.** Four signals with no severity between them is genuinely harder to
triage than four signals with severities, and every instinct says the document-author one matters
more than the duplicate. It might. The system does not know that, and a severity would be that
guess rendered as a fact, so all four are the same size in the same order they were observed.

**Once, where I could not avoid it.** The Submission Record reads "5 of 5 criteria are evidenced
by a passage quoted below." That is a fraction, above the findings, on a client-facing document.
Defensible because the five findings are directly beneath it and the number is an index into
them rather than a substitute — but it is the closest thing to a score anywhere in the product,
and if a client ever asks for "just the number at the top", that line is where they learned to.

**The answer to "where did you want a score" is: everywhere there was more than one person on the
screen.** That is not a design weakness to be trained out. It is what the whole invariant is
resisting, and the resistance has to be renewed on every screen, by hand, forever. Anything that
makes it automatic is the thing to be suspicious of.

---

## 15 · Invariant 3 could not be obeyed, and the framework is what showed it

"A candidate cannot move to a later stage while any criterion in the pinned Brief version has no
Finding." The prototype enforced that faithfully, and the result was a screen that refused every
first transition: Priya Nandakumar cannot leave Sourced, because five findings cannot exist
before anybody has spoken to her.

Nine screens were built against that rule without noticing, because every candidacy in the
fixtures that mattered was already deep in the pipeline. It took a document describing what a
*stage* is for to make the hole visible.

The fix is the framework's own structure — each stage responsible for a named subset of the
rubric — and it is now invariant 3, with the whole rubric required once at submission. ADR 0011
says plainly that this is a change to the contract rather than a clarification.

**The lesson is about fixtures, not about the rule.** Everything in the fixture set was arranged
to make refusals reachable. Nothing in it was arranged to make the *ordinary path* reachable,
and the ordinary path is where the unimplementable rule was hiding.

---

## 16 · Two stages carry no criteria, and that is the honest answer

Contacted tests interest, availability, notice period and money. Client interview belongs to the
client. Neither evidences anything on the rubric, so neither gates anything.

The temptation was to give every stage a criterion so the process looks rigorous. That is how a
structured process turns into ceremony: a stage invents an assessment to justify existing, and
the assessment is the one nobody can cite. Empty is a legitimate value and the screen says so in
words — *"Contacted carries no criteria. It tests interest, availability and money, and none of
those is on the rubric — so it gates nothing."*

---

## 17 · A deadline is not a promise unless somebody is told

Invariant 6 said ghosting is impossible and delivered an auto-closure. Building the message
history showed what that actually buys: Bethan Lloyd-Price has one message, sent five months
ago, and closes in three days. She will receive an automated closure and nothing else. That is
ghosting with a receipt.

So a candidacy cannot leave a stage until the candidate has been told they reached it, and
`BriefStage.candidate_message` is non-nullable. Frances Ibbotson sits in the fixtures assessed at
the competency call and never told, so the refusal is reachable from a cold start.

**This is the most arguable thing in the second pass** and it is deliberately cheap to remove:
eight lines in `_state/refusals.ts`. It costs the recruiter something on every transition, and
whether that cost is worth it is a question for a design partner rather than for me.

A smaller decision inside it: the rejection text the recruiter writes is sent verbatim. There is
no internal version and no softer second text. One text and one audience is the only arrangement
in which writing it honestly is the easy path.

---

## 18 · Process figures are allowed; the same figure about a person is not

The framework wants pass-through rates, cost per hire, time to hire and quality of hire. Three
of those four are fine and one is invariant 2 in a hat.

The line that holds: **a figure that judges the desk is allowed; a figure that judges a person
is not.** How many reached the screening call, by channel, is a question about the agency's own
effort. Quality of hire is a score attached to a named individual, applied retrospectively, and
if it existed it would be sorted on within a month.

Two consequences fell out of drawing it:

**No percentages, anywhere.** The funnel reads "6 of 10 reached" rather than "60%". A rate on
n=10 is false precision, a four-person agency never has a larger n, and a percentage is the
shape a judgement arrives in — it is on the do-not list for candidate figures and it does not
become a different shape when the subject changes.

**The one thing I am least sure of** is the bar beside each funnel count. It is drawn from the
count, not from an evaluation of anybody, so it does not breach the rule as written. It is still
a shape that invites glancing instead of reading, and this product's whole discipline is that
you read the words. Kept, and flagged here rather than buried.

---

## 19 · The loop closes on the Brief, or it closes nowhere

The transcript's fifth step is the one it says everybody forgets. Building it showed why: a
post-placement review has nowhere to go. Feedback recorded against a person is a performance
note the agency has no business keeping. Feedback recorded against the placement is a file
nobody opens again.

The only version that changes anything is feedback recorded against **the Brief that produced
the hire**, surfaced on the Brief of the next role at the same client.

George Amankwah's day-30 checkpoint reads: criterion 2 said "Built a rolling forecast from
site-level data" and he evidenced it honestly — the sighting said he builds the weekly forecast,
and he does. What Calder Vale actually needed was somebody who owns the model. The criterion was
not wrong; the wording was. That sentence now sits at the top of the Brief for the next Calder
Vale role, above the criteria, while they are still being written.

**It also gave the checkpoints somewhere to be seen.** For a perm agency the fee is earned at
the end of probation, not on the start date, so an unrecorded day-90 checkpoint is money at
risk. It is on the desk, and it says "66 days ago, and nobody has asked".

---

## Carried into the slices

| # | Finding | Where it lands |
|---|---|---|
| 1 | Brief and SourcingScope are two objects | ADR + schema, slice 2 |
| 2 | Cell row has three states; count is a pair | UI contract, invariant 2 |
| 3 | No email is the normal case | Dedup and contactability, slice 3 |
| 4 | Sighting-backed evidence is the majority path | Slice 7 |
| 6 | Crosscheck artifacts are wider than evidence targets | ADR before slice 9 |
| 7 | `not_found` with optional evidence | Test in slice 7 |
| 9 | Sentence segmentation is a parsing requirement | Slice 6 budget |
| 11 | Validators raise with names, not counts | Slice 5 and 9 validators |
| 15 | Invariant 3 is per-stage; the whole rubric at submission | ADR 0011 · slice 2 and slice 5 |
| 16 | A stage may carry no criteria | Slice 2 schema |
| 17 | A stage cannot be left until the candidate was told | Reversible; decide with a design partner |
| 18 | Counts, never rates. No quality of hire. | Slice 11 metering, and the do-not list |
| 19 | Placement feedback attaches to the BriefVersion | Slice 2 schema, so it is never retrofitted |
