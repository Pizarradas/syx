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
```

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
| **AUDIT** | `audit.md` | QA reviewer | nothing | R01–R08 violations, structure/naming checks, verdicts |
| **MIGRATE** | `migrate.md` | Migration specialist | `pr` / recommends | Legacy var resolution, impact analysis, per-variable replacement plans |

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

## Mode Boundaries

Modes are intentionally siloed:

- **SKETCH mode** produces no production code. It is a visual thinking tool only.
- **UX mode** never writes SCSS. It describes intent, not implementation.
- **CREATIVE mode** is exempt from contract enforcement. Creative builds are proofs of concept, not production components.
- **UI mode** never makes UX decisions. It implements what UX mode specified.
- **TOKEN mode** never touches component SCSS. It only manages the token layer.
- **AUDIT mode** never modifies code. It reports and recommends.
- **THEME mode** never writes. Everything a theme touches reaches all seven bundles at once, so
  the mode designs the theme in full and a person puts it in.
- **No mode commits to a shared branch.** What a mode may write, it writes through
  `node scripts/propose.js`: branch, commit and evidence, for a person to merge.

This boundary is deliberate. A UX pass and a UI pass on the same problem produce better results than a combined response that tries to do both at once.

## Typical Workflows

### Standard component workflow
```
1. [SYX: UX]: Design the search input with autocomplete dropdown
   → Defines HTML, components, states, a11y requirements

2. [SYX: TOKEN]: What tokens does a search autocomplete need?
   → Defines token names and semantic mappings

3. [SYX: UI]: Implement the mol-search-autocomplete component
   → Writes SCSS, proposes the token file (`node scripts/propose.js token`), validates R01–R04

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
4. Define: role, priorities, output format, constraints, response template, example
5. Add a row to the table in `AGENTS.md`, `CLAUDE.md` **and** this file — all three are checked
6. Add the mode's column to the matrix and its modules to the reverse index in
   `mind-system/routing.md`. A knowledge module that no mode loads is a module nobody will open
7. Run `npm run check:modos`. It fails if the three tables disagree, if the block is missing, or
   if a mode hands itself a permission the contract doesn't give it
