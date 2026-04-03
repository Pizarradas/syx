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

## Available Modes

| Mode | File | Role | Output |
|---|---|---|---|
| **UX** | `ux.md` | UX consultant | HTML structure, component selection, accessibility, interaction states |
| **UI** | `ui.md` | Senior SCSS developer | Token files, component SCSS, registration, contract validation |
| **TOKEN** | `token.md` | Token architect | Token creation, semantic mapping, registry management |
| **THEME** | `theme.md` | Theme designer | OKLCH scales, `_theme.scss`, surface token coverage, dark mode |
| **AUDIT** | `audit.md` | QA reviewer | R01–R08 violations, structure/naming checks, verdicts |
| **MIGRATE** | `migrate.md` | Migration specialist | Legacy var resolution, impact analysis, per-variable replacement plans |

## Mode Boundaries

Modes are intentionally siloed:

- **UX mode** never writes SCSS. It describes intent, not implementation.
- **UI mode** never makes UX decisions. It implements what UX mode specified.
- **TOKEN mode** never touches component SCSS. It only manages the token layer.
- **AUDIT mode** never modifies code. It reports and recommends.

This boundary is deliberate. A UX pass and a UI pass on the same problem produce better results than a combined response that tries to do both at once.

## Typical Workflow

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

## Adding a New Mode

1. Create `_agents/modes/{mode-name}.md`
2. Define: role, priorities, output format, constraints, response template, example
3. Add a row to the table in `AGENTS.md` and `CLAUDE.md`
