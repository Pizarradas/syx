# SYX Mode System

Modes let you activate a specific lens when working with SYX. Instead of a general-purpose AI response, you get behavior tuned for a particular discipline.

## How to Use

Prefix your message with `[SYX: MODE]:` to activate a mode:

```
[SYX: UX]: Design a notification banner with dismiss action
[SYX: UI]: Implement the atom-tag component with --primary and --neutral variants
[SYX: TOKEN]: I need tokens for a data table with striped rows
[SYX: THEME]: Create a dark mode variant for example-04
[SYX: AUDIT]: Review scss/organisms/_site-header.scss for contract violations
[SYX: ROADMAP]: What should SYX modernise in its CSS next?
```

The prefix is the **portable** form: it is plain text, so it works in Claude Code, Codex, Cursor or
anything else that ingests `AGENTS.md`. It is a convention, though — nothing forces a client to
honour it.

In Claude Code there is a second door to the same room, `.claude/commands/syx.md`:

```
/syx UI implement the atom-tag component with --primary and --neutral variants
/syx UX → TOKEN → UI + AUDIT a search field with autocomplete
/syx ATLAS UX → UI a section front for markets
```

It takes the same grammar and resolves to the same ten files — it is a pointer, not a copy, so
there is nothing to keep in sync. What it adds is that the harness runs it: autocomplete on `/syx`,
and the mode file gets read because the command says to, instead of because an agent remembered a
convention. There is deliberately **one** command rather than ten: ten would be ten
near-identical files restating what each mode is, which is the duplication this system just spent a
refactor removing.

Neither form auto-selects a mode. Choosing the lens — and therefore the tier, and therefore what
the turn costs — stays with the person asking.

## Resource Tiers

Modes are calibrated by AI context consumption and output complexity. Pick the lowest tier that serves your need — escalate only when the concept is confirmed.

| Tier | Mode | Cost | Typical turns | Ask instead of reading |
|---|---|---|---|---|
| 1 | **SKETCH** | ⚡ Minimal | 1 | — |
| 2 | **UX** | 🔵 Light | 1–2 | `list_components`, `get_component` |
| 3 | **CREATIVE** | 🟡 Medium | 1–2 | `get_component`, `find_token_by_value` |
| 4 | **TOKEN** | 🟠 Medium-High | 2–3 | `get_token`, `classify_change` |
| 5 | **THEME** | 🟠 Medium-High | 2–3 | `get_token` (per theme + mode) |
| 6 | **UI** | 🔴 High | 3–4 | `get_component`, `get_mixin`, `validate_snippet` |
| 7 | **AUDIT** | 🔴 High | 2–4 | `validate_snippet`, `scan_for_drift` |
| 8 | **MIGRATE** | 🔴 Very High | 4–6 | `find_token_by_value`, `scan_for_drift` |
| 9 | **BRAND** | 🔴 Very High | 3–5 | `get_token` (per axis), `find_token_by_value`, `list_components` |
| 10 | **ROADMAP** | 🟠 Medium-High | 1–2 | `find_capability` (every idea), `get_component`, `get_token`, `classify_change` |

The cost of a mode used to be measured in files loaded. With the MCP server registered
(`npm run mcp`, or `npx -y syx-mcp`) most of those reads become one call that returns one
answer — the last column says which. The tier still ranks the *work*, not the reading.

## Available Modes

| Mode | File | Role | Writes | Output |
|---|---|---|---|---|
| **SKETCH** | `sketch.md` | Rapid prototyper | nothing | Self-contained HTML + inline styles, Mermaid diagrams, layout sketches |
| **UX** | `ux.md` | UX consultant | nothing | HTML structure, component selection, accessibility, interaction states |
| **CREATIVE** | `creative.md` | Creative director | nothing | Experimental HTML + CSS, advanced techniques, awwwards-quality builds |
| **UI** | `ui.md` | Senior SCSS developer | `pr` | Token files, component SCSS, registration, contract validation |
| **TOKEN** | `token.md` | Token architect | `pr` / recommends | Token creation, semantic mapping, registry management |
| **THEME** | `theme.md` | Theme designer | recommends | OKLCH scales, `_theme.scss`, surface token coverage, dark mode |
| **AUDIT** | `audit.md` | QA reviewer | nothing | R01–R11 violations, structure/naming checks, verdicts |
| **MIGRATE** | `migrate.md` | Migration specialist | `pr` / recommends | Legacy var resolution, impact analysis, per-variable replacement plans |
| **BRAND** | `brand.md` | Brand identity architect | recommends | A two-round interview, then the seven identity axes with their provenance, the identity contract, and the specification THEME builds from. Never the theme file itself |
| **ROADMAP** | `roadmap.md` | Systems strategist | recommends | A capability check of every idea, what is already covered (with evidence), proposals that prove their absence, and ledger entries for `contracts/capabilities.json` |

The **Writes** column is not advice, it is `contracts/trust.json` read through
`scripts/lib/confianza.js`. Each mode file opens with a `Trust` block listing the paths it may
write, the paths it may only recommend, and the tools it should ask instead of reading files;
`npm run check:modos` fails if any of those lists disagrees with the contract. A mode never
grants a permission — it inherits one.

Below `Trust`, every mode also opens with a `Knowledge` block: which modules of the cortex under
`mind-system/knowledges/` it loads, and when — **Always**, **When relevant**, **On request**, and
for CREATIVE **With GSAP**. Knowledge is the other half of a mode: `Trust` says what it may write,
`Knowledge` says what it reasons with. The two are not symmetric in force. A permission is a
ceiling and a module is an argument, so knowledge never authorises anything and never wins against
a rule — if a module recommends what R01 forbids, the module is what needs fixing. The wiring seen
from both sides, including the reverse index that reveals modules no mode loads, is
`mind-system/routing.md`.

Where `Trust` and `Knowledge` open a mode, the **`## Why` block closes its response**: one line
per decision that had a competent alternative, in the form *what was decided — because — what
would change it*. The third field is the one that matters; a justification nobody can falsify is
decoration. The format, the threshold for owing a line, and what each mode specifically owes live
once in `_agents/decision-record.md` — no mode file restates them, for the same reason there is one
`/syx` command instead of ten. SKETCH is exempt, and the exemption is argued there rather than
assumed; AUDIT and MIGRATE attach the line to each finding or variable instead of closing with a
block, and that placement is argued there too.

## Composing Modes

Two operators combine modes in a single invocation:

| Operator | Syntax | Meaning |
|---|---|---|
| `→` | `[SYX: UX → UI]:` | **Pipeline.** Each mode's output is the next one's input. One step at a time. |
| `+` | `[SYX: UI + AUDIT]:` | **Evaluative.** Both modes work on the same artifact; both outputs come back together. |

**`+` groups before `→`.** The `+` binds the modes that share an artifact; the `→` chains those
groups. So `[SYX: UX → UI + AUDIT]:` reads as `UX → (UI + AUDIT)`: UX first, then UI implements
while AUDIT verifies that same output. For any other grouping, split into turns.

If a middle step turns out to have no work — TOKEN finds every token it needed already exists —
**the pipeline does not stop.** It continues with what exists and hands off explicitly. Aborting is
the user's call, not the mode's.

Not every pair composes. `SKETCH + AUDIT` and `CREATIVE + AUDIT` are contradictions (both modes are
exempt from the contracts AUDIT enforces); `UI → TOKEN` and `THEME → UI` run the dependency
backwards, and so do `UI → BRAND` and `THEME → BRAND` — an identity is decided before the palette
that carries it, not after. `BRAND + AUDIT` **is** valid, unlike the other two recommendation-only
pairs: BRAND's output already names real tokens, so AUDIT has something to check.
The full table of valid and invalid combinations is in `mind-system/routing.md`, and the
combinations that carry editorial context (`[ATLAS]: … utilizando [SYX: …]`) are in
`mind-system/governance/01-invocation.md`.

## Mode Boundaries

Modes are intentionally siloed:

- **SKETCH mode** produces no production code. It is a visual thinking tool only.
- **UX mode** never writes SCSS. It describes intent, not implementation.
- **CREATIVE mode** is exempt from contract enforcement. Creative builds are proofs of concept, not production components.
- **UI mode** never makes UX decisions. It implements what UX mode specified.
- **TOKEN mode** never touches component SCSS. It only manages the token layer.
- **AUDIT mode** never modifies code. It reports and recommends.
- **THEME mode** never writes. Everything a theme touches reaches all seven themes at once, so
  the mode designs the theme in full and a person puts it in.
- **BRAND mode** never writes either, and never designs a page. It decides what every page
  inherits — the seven identity axes — and hands them to THEME to be scaled and contrast-checked.
  **BRAND never emits `_theme.scss` and THEME never decides an axis.** That line is what keeps the
  two from being one mode: THEME's whole reading list sits inside BRAND's, so the only thing
  separating them is that one decides intent and the other implements it — the same split as UX and
  UI, one rung up. Merging them would route *change the accent in example-04* through a seven-axis
  interview, which is the cheap-job-made-expensive failure the tier table exists to prevent.
- **No mode commits to a shared branch.** What a mode may write, it writes through
  `node scripts/propose.js` (`token` for a new component token, `files <paths…> --why "…"` for
  the rest): branch, commit and evidence, for a person to merge.

This boundary is deliberate. A UX pass and a UI pass on the same problem produce better results than a combined response that tries to do both at once.

## Typical Workflows

### Standard component workflow
```
1. [SYX: UX]: Design the search input with autocomplete dropdown
   → Defines HTML, components, states, a11y requirements

2. [SYX: TOKEN]: What tokens does a search autocomplete need?
   → Defines token names and semantic mappings

3. [SYX: UI]: Implement the mol-search-autocomplete component
   → Writes SCSS, proposes new tokens (`node scripts/propose.js token`) and the component (`node scripts/propose.js files`), validates R01–R04, R09–R11

4. [SYX: AUDIT]: Review the new mol-search-autocomplete
   → Confirms compliance, flags anything missed
```

### Idea validation workflow (low cost)
```
1. [SYX: SKETCH]: Quick layout of a card grid with filter bar
   → Instant HTML + inline styles, no file reads, single turn

2. (If idea is good) [SYX: UX]: Formalize the card grid pattern
   → Accessibility, states, SYX component decisions

3. (If going to production) [SYX: UI]: Implement mol-card-grid
   → Full SCSS, token files, contract compliance
```

### New identity workflow (the most expensive, and the one that pays for itself)
```
1. [SYX: BRAND]: A complete identity for {the brief}
   → Two-round interview, then seven axes decided together with their provenance,
     the identity contract, and the spec for step 2. No theme file: that is THEME's.

2. [SYX: THEME]: Build the scale for the identity BRAND just handed over
   → Ten OKLCH steps, the 12 surface tokens, AA contrast checked, _theme.scss written out.
     It builds the direction it was given; it does not pick a different one.

3. (Only if an axis needed a name that does not exist) [SYX: TOKEN]: …
   → Tier placement for the new family, via propose.js

4. (Only if an axis needed a component that does not exist) [SYX: UX → UI]: …
   → The component the identity asked for, built to contract

5. npm run build && npm run validate
   → Every bundle compiles, R01–R07 clean. This is where an identity stops being a document.

6. [SYX: AUDIT]: Check the pages against the identity contract
   → Contract violations as R-findings; identity invariants as advisory; scan_for_drift
     over the pages — a hand-written value is the identity leaking out of the system
```
The order is the point. Running THEME first produces a palette with no identity to answer to —
which is how six of the seven themes in this repository became recolours.

**Steps 3 and 4 are conditional, and most identities skip both.** That is the system working, not
the pipeline falling short: R01 already forces every component to read `--semantic-*` instead of
values, so moving the theme layer repaints the whole tree without touching component SCSS. An
identity that *cannot* skip them is telling you something — it needs vocabulary or components SYX
does not have yet, and BRAND has to say which, not improvise around it.

### Creative exploration workflow
```
1. [SYX: CREATIVE]: Experimental hero section — scroll-driven parallax type
   → Self-contained HTML + CSS, advanced techniques, technique log

2. (If promoting to SYX) [SYX: TOKEN]: Tokenize values from the creative build
   → Defines semantic tokens for the new design values

3. [SYX: UI]: Implement org-hero as a production component
   → Contract-compliant SCSS
```

## Adding a New Mode

1. Create `_agents/modes/{mode-name}.md`
2. Open it with the `Trust` block — Writes / Recommends only / Reads / Ask, don't read — before
   anything else. Copy the shape from an existing mode; the paths must agree with
   `contracts/trust.json`, and a `human` path can never appear under **Writes**
3. Follow it with the `Knowledge` block — Always / When relevant / On request / Tags. Both blocks
   live **above** the first `## ` heading. Declare `mind-system/knowledges/` in **Reads** so any
   cortex path the body mentions stays covered by the guardian
4. Define: role, priorities, output format, constraints, response template, example. The
   response template ends with `## Why` (or places the lines per finding, as AUDIT and
   MIGRATE do), and the mode gets a row in the table of
   `_agents/decision-record.md` naming which decisions it owes lines for — an empty row is an
   exemption, and an exemption needs an argument
5. Add a row to the table in `AGENTS.md`, `CLAUDE.md` **and** this file — all three are checked
6. Add the mode's column to the matrix and its modules to the reverse index in
   `mind-system/routing.md`. A knowledge module that no mode loads is a module nobody will open
7. Run `npm run check:modos`. It fails if the three tables disagree, if the block is missing, or
   if a mode hands itself a permission the contract doesn't give it
8. Add at least two reference tasks to `_agents/evals/tareas.json`, each with a passing
   reference answer and a one-change mutant. `npm run check:evals` fails for a mode without them

## Measuring a Mode

`_agents/evals/` holds two reference tasks per mode and a shared rubric: contract, real tokens,
trust boundary and deliverable shape are measured automatically; domain judgement is scored by an
optional LLM judge (when `ANTHROPIC_API_KEY` or the `claude` CLI is available) or by a person.

The deliverable shape is read **from this directory**: each task names the sections of its mode's
Response Format it requires, and the `## Why` obligation comes from `../decision-record.md`. Rename a
section here and `npm run check:evals` names the tasks that still ask for the old one. Headings are
accepted in English or in their declared Spanish equivalents.

Two ways to use it:

- `npm run eval:modo -- <id> answer.md` grades one pasted answer.
- `npm run eval:runner -- --modo ui` runs a headless agent (`claude -p`, or any command in
  `SYX_AGENT_CMD`) against the tasks in a throwaway copy of the repo, with the mode activated by the
  task's own `[SYX: UI]:` prefix, and writes transcripts plus a `RESUMEN.md` table to
  `_agents/evals/runs/`. The manual workflow *Evaluación de los modos* does the same in CI.

Run it before and after changing a mode: a mode edit that drops a task below 8/8 has changed
behaviour, whatever it meant to change. `npm run check` keeps the bench honest without network:
every reference passes, every mutant and every harmful answer in `anti/` fails, every alternative
correct answer in `buenas/` passes, and the runner works end to end with a simulated agent.
