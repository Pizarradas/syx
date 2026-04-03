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

| Tier | Mode | Cost | Typical turns |
|---|---|---|---|
| 1 | **SKETCH** | ⚡ Minimal | 1 |
| 2 | **UX** | 🔵 Light | 1–2 |
| 3 | **CREATIVE** | 🟡 Medium | 1–2 |
| 4 | **TOKEN** | 🟠 Medium-High | 2–3 |
| 5 | **THEME** | 🟠 Medium-High | 2–3 |
| 6 | **UI** | 🔴 High | 3–4 |
| 7 | **AUDIT** | 🔴 High | 2–4 |
| 8 | **MIGRATE** | 🔴 Very High | 4–6 |

## Available Modes

| Mode | File | Role | Output |
|---|---|---|---|
| **SKETCH** | `sketch.md` | Rapid prototyper | Self-contained HTML + inline styles, Mermaid diagrams, layout sketches |
| **UX** | `ux.md` | UX consultant | HTML structure, component selection, accessibility, interaction states |
| **CREATIVE** | `creative.md` | Creative director | Experimental HTML + CSS, advanced techniques, awwwards-quality builds |
| **UI** | `ui.md` | Senior SCSS developer | Token files, component SCSS, registration, contract validation |
| **TOKEN** | `token.md` | Token architect | Token creation, semantic mapping, registry management |
| **THEME** | `theme.md` | Theme designer | OKLCH scales, `_theme.scss`, surface token coverage, dark mode |
| **AUDIT** | `audit.md` | QA reviewer | R01–R08 violations, structure/naming checks, verdicts |
| **MIGRATE** | `migrate.md` | Migration specialist | Legacy var resolution, impact analysis, per-variable replacement plans |

## Mode Boundaries

Modes are intentionally siloed:

- **SKETCH mode** produces no production code. It is a visual thinking tool only.
- **UX mode** never writes SCSS. It describes intent, not implementation.
- **CREATIVE mode** is exempt from contract enforcement. Creative builds are proofs of concept, not production components.
- **UI mode** never makes UX decisions. It implements what UX mode specified.
- **TOKEN mode** never touches component SCSS. It only manages the token layer.
- **AUDIT mode** never modifies code. It reports and recommends.

This boundary is deliberate. A UX pass and a UI pass on the same problem produce better results than a combined response that tries to do both at once.

## Typical Workflows

### Standard component workflow
```
1. [SYX: UX]: Design the search input with autocomplete dropdown
   → Defines HTML, components, states, a11y requirements

2. [SYX: TOKEN]: What tokens does a search autocomplete need?
   → Defines token names and semantic mappings

3. [SYX: UI]: Implement the mol-search-autocomplete component
   → Writes SCSS, creates token file, validates R01–R04

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
2. Define: role, priorities, output format, constraints, response template, example
3. Add a row to the table in `AGENTS.md` and `CLAUDE.md`
