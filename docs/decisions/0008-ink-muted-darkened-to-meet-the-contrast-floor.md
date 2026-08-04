# 8. `--rc-ink-muted` darkened to meet the contrast floor it was already subject to

**Status:** accepted

## Context

`brand/tokens.css` states its own rule: *"Body text never below 16px, never under 4.5:1
contrast."* CLAUDE.md repeats it in the never-write list. The book's muted ink did not
meet it.

Measured against the two surfaces it is actually used on:

| | on `--rc-paper` | on `--rc-paper-sunk` |
|---|---|---|
| `#6C7583` (as published) | 4.27:1 | 3.91:1 |
| `#636B78` | **4.93:1** | **4.51:1** |

The second surface is the one that made it unarguable. `--rc-ink-muted` on
`--rc-paper-sunk` is the footer copyright line and the note in the curriculum panel, and at
3.91:1 both fall short by a wide enough margin that no reading of "body text" rescues them.

The colour is not decorative. It carries section eyebrows, table column heads, field hints
and provenance lines — small text, which is exactly the text that needs the ratio most.
Exempting it as "captions" would have meant the contract bending to the palette.

Discovered while normalising the v0 landing page into `web/`, by measuring every token pair
in the tree rather than assuming the published palette was self-consistent.

## Decision

`--rc-ink-muted` becomes `#636B78`.

Hue and saturation are unchanged; lightness drops about 6%. Side by side the difference is
barely visible, which is the point — the token keeps its job of receding from
`--rc-ink-secondary` while clearing the floor on both paper surfaces.

`brand/tokens.css` is the source of truth and was edited there. `web/app/tokens.css` is a
generated copy and `scripts/tokens.mjs` fails the build if the two disagree, so this change
could not have landed in one and not the other.

## Consequences

The muted/secondary gap narrows. `--rc-ink-secondary` is `#39424F` at 9.32:1, so the two are
still clearly distinct, but a future revision that darkens muted again would collapse the
distinction and should darken the surface or lighten secondary instead.

Anything already rendered against the old value — a PDF, a brand book page, an exported
Submission Record — is now half a step lighter than the product. That is cosmetic and only
matters if the two are shown together.

The wider lesson is that a palette can be internally inconsistent, and that a stated rule in
a token file is not the same as a rule that is checked. Two of the tokens `web/` needed and
the book did not have — a control edge and a hairline on ink — arrived with the same problem
and are recorded in `web/app/tokens-derived.css` with their measured ratios beside them.

**Revisit if** the brand book is reissued. The book should carry `#636B78`, and every pair in
it should be measured before publication rather than after.
