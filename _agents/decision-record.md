# The Why block

Every mode that chooses something closes its response with a `## Why`. This file
defines the format once. The mode files name **which** decisions they owe a line
for; none of them restates the format.

That split is deliberate. Nine copies of a rationale template would be nine
things to keep in sync, which is the duplication the mode refactor removed when
it settled on one `/syx` command instead of nine.

---

## The shape

One line per decision, three fields, separated by em dashes:

```
<what was decided> — <because> — <what would change it>
```

Example:

```
8/4 instead of 6/6 — the feature carries a headline plus a lead image and the rail
carries titles only; 6/6 gives the rail width it has no content for — a rail with
its own imagery, or more than four items, moves this to 7/5.
```

**The third field is the load-bearing one.** A justification nobody can falsify is
decoration. "What would change it" names the condition under which the decision
flips, and that is what makes it possible to disagree, to reuse it in another
context, and to notice later that the condition arrived.

A rationale whose third field is empty is not finished. If nothing would change
the decision, it was not a decision — it was the only option, and it needs no line.

---

## The threshold — which decisions owe a line

Only the ones where a competent alternative existed:

- **A rule left the choice open.** R01–R08 forbid; they almost never choose. Every
  gap they leave is a decision somebody made.
- **More than one existing thing fits** — two components, two tokens, two patterns.
- **A number came out of a range** — the grid split, the column count, the density
  step, the elevation level, the scale step.
- **Something available was deliberately not used.** The strongest lines in a Why
  block are usually about what was rejected.
- **The character of the thing was chosen** — calm or aggressive, dense or spacious.
  This one is the easiest to make silently and the most expensive to leave unwritten,
  because nothing downstream can inherit a decision that was never stated.

And nothing else. A decision a rule or a contract already made is not yours to
justify: cite it and move on. Five lines is the working ceiling for one response.
Needing more than five means the response is making too many decisions at once and
should have been two turns.

**BRAND is the one exception, and it is argued rather than assumed.** Deciding seven
things at once is not a symptom there, it is the definition of the mode, and splitting
it into two turns is exactly what its interview already does. Its ceiling is one line
per axis the user delegated (`IA`) or left inheriting, plus at most two. An identity the
user configured themselves owes almost no lines; one they handed over entirely owes
seven. The length of the block becomes a readout of how much was decided on their
behalf — which is the right thing for it to measure, and the reason the exception is
worth making rather than working around.

---

## What is not a why

| Not a why | Why not |
|---|---|
| "Because R01 forbids primitives in components" | That is the rule deciding, not you. Cite it, don't dress it up. |
| "Because SYX does it this way" | An appeal to the system is an appeal to whoever wrote it. Name what they knew. |
| "It looks cleaner / more modern / more premium" | Taste is admissible only through an observable property: contrast ratio, element count, whitespace step, repetition. Name the property. |
| A sentence that would equally justify the alternative | If the same words defend 6/6 as well as 8/4, they defend nothing. |

The last row is the check worth running on your own block before sending it: read
each line, substitute the option you rejected, and see whether the sentence still
stands. If it does, delete the line and write the real reason.

---

## What each mode owes

| Mode | Decisions that need a line |
|---|---|
| **SKETCH** | — *exempt, see below* |
| **UX** | Component chosen over the alternative that also fit · hierarchy order · an element used against the obvious one (`<button>` over `<a>` and the reverse) · a state deliberately not handled |
| **CREATIVE** | **The art direction** — which character was chosen and which observable properties carry it (contrast, typographic scale, spacing rhythm, accent strength, simultaneity) · every technique whose cost is not obvious |
| **UI** | Grid split · density step · elevation level · the token picked when several resolved to a usable value · a mixin used where a shorter declaration would have compiled |
| **TOKEN** | Tier placement · a new token where an existing one nearly fit, and how near · the name, when it is not mechanical |
| **THEME** | Scale steps that are not the generated ones · a contrast decision at the AA boundary · a structural override in `$theme-config` |
| **AUDIT** | **Severity and the fix, never the violation.** The rule states the violation. What needs justifying is why this one is an error and that one a warning, and why the recommended fix is the cheapest correct one |
| **MIGRATE** | Queue order · risk classification · a replacement token chosen over the literal equivalent |
| **BRAND** | **Every axis the user delegated (`IA`) and every axis left inheriting** — those two are the whole point: an axis the user chose is their call and owes nothing, an axis you chose for them owes an argument they can reject, and an axis that simply did not move is the cheapest decision to make silently and the one nobody downstream can tell apart from an oversight · the register chosen over the one the brief also allowed · an invariant that costs something elsewhere |

CREATIVE's row is the one that changes behaviour most. That mode already picks a
character on every run — restrained and typographic, or dense and immediate — and
until now picked it silently, which meant the decision could not be inherited,
argued with, or repeated. Writing it down does not constrain the choice. It makes
the choice exist outside the response that made it.

BRAND's row is the same idea one rung up, and it is why the two rows have to be
read together. CREATIVE writes its character down *per page*; BRAND writes it down
*once*, as seven axis positions a later CREATIVE inherits instead of re-deciding.
When a BRAND identity exists, CREATIVE's art-direction line stops being an
invention and becomes a deviation — which is a much cheaper thing to argue with.

---

## Where it goes

Last block of the response, after everything else, headed `## Why`. Last because a
rationale read before the thing it justifies is a preamble, and preambles get
skipped.

Two modes place it differently:

- **AUDIT** attaches the line to each finding, not to the report. A severity
  justified in a footer belongs to no finding in particular.
- **MIGRATE** puts the queue-order lines with the queue, and the per-variable lines
  with each variable.

---

## SKETCH is exempt, on purpose

Tier 1 buys its speed by reading nothing and owing nothing. A sketch exists to be
thrown away; a rationale attached to something disposable is a cost paid for an
artifact that will not survive the turn. The handoff note SKETCH already closes
with carries what the next mode needs.

The exemption is written here rather than left implicit so that it reads as a
decision instead of an oversight — which is the same reason this file exists.
