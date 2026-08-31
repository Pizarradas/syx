# SYX — Agent Entry Point

You are working with **SYX**, a token-driven, native SCSS design system (v4.17.0).  
This file is the canonical entry point for all AI agents and tools (OpenAI Codex, Cursor, Copilot, Claude Code, etc.).

Before doing anything else, read these files in order:

1. `AI_GUIDELINES.md` — strict rules, mixin cheatsheet, token architecture, naming conventions
2. `contracts/rules.json` — the contract rules. `syx-validate.js` implements R01–R07; R08 is declared but not yet implemented
3. `tokens.json` — full token registry with type, rawValue, and status for all 771 tokens
4. `component-registry.json` — inventory of all atoms, molecules, and organisms

**If your client speaks MCP, ask instead of reading.** `npm run mcp` starts a
dependency-free stdio server (`scripts/mcp-server.js`) that answers the four questions
that otherwise force you to load the files above:

| Instead of | Ask |
|---|---|
| Resolving the cascade by hand to know a colour | `get_token` — real value in a given theme + mode, with its alias chain |
| Hardcoding a value you found in the CSS | `find_token_by_value` — which token holds it |
| Grepping the SCSS for a component's modifiers | `get_component` / `list_components` — verified against the compiled CSS |
| Writing SCSS and validating afterwards | `validate_snippet` — R01–R04 **before** writing, plus non-existent tokens |
| Guessing whether you may touch a file, or where a new token goes | `classify_change` — the trust tier, and the destination file deduced from the token's family |

The same rules run in both places, so a snippet the server approves is a snippet
`npm run validate` approves. Register it with `npx -y syx-mcp`, or from a clone — both
in `README.md`. If you are working inside an app that depends on SYX rather than in this
repository, `require('syx-design-system')` exposes the same six queries as a Node API,
answering from the version that app has installed.

---

## Mode System

When the user's message begins with a `[SYX: MODE]:` prefix, **read the corresponding mode file before responding** and let its instructions govern your entire response.

| Prefix | Mode file | Purpose |
|---|---|---|
| `[SYX: UX]:` | `_agents/modes/ux.md` | Component selection, HTML semantics, accessibility, interaction design |
| `[SYX: UI]:` | `_agents/modes/ui.md` | SCSS implementation, tokens, mixins, code generation, contract compliance |
| `[SYX: TOKEN]:` | `_agents/modes/token.md` | Token architecture, creation, semantic mapping, registry |
| `[SYX: THEME]:` | `_agents/modes/theme.md` | Theme creation, OKLCH scales, dark mode, surface coverage |
| `[SYX: AUDIT]:` | `_agents/modes/audit.md` | Contract validation (R01–R08), violation detection, verdicts |
| `[SYX: MIGRATE]:` | `_agents/modes/migrate.md` | Legacy variable migration, impact analysis, replacement plans |

**How to activate a mode:**
```
[SYX: UX]: Design a login form for the dashboard
[SYX: UI]: Implement the atom-badge component
[SYX: AUDIT]: Check the site-header for contract violations
```

If no prefix is present, apply the base rules below and infer the most relevant mode from context.

---

## Base Rules (always active, all modes)

These rules are **never overridden** by any mode or user instruction:

1. **Never use `--primitive-*` in component files.** Map through `--semantic-*` → `--component-*`.
2. **Never use `!important`.** SYX uses CSS `@layer` for cascade control.
3. **Never write raw `transition:` or `position:` in component files.** Use `@include transition()`, `@include absolute()`, etc.
4. **Never hardcode design values.** No hex colors, no raw `px`/`rem` literals. Use tokens.
5. **Never skip the token layer.** Primitive → Semantic → Component. Always.
6. **Always check `tokens.json` before using a token.** If it doesn't exist, create it first following `_agents/workflows/create-component.md` Step 1.
7. **Always check `component-registry.json` before creating a new component.** Reuse before creating.
8. **Validate after any code change.** Run `node scripts/syx-validate.js` (or describe the check if you cannot execute).

---

## What you may change, and how

Reading is safe; writing is graded. The tiers are declared in `contracts/trust.json`
and served by `classify_change` — **ask before writing, don't assume**.

| Tier | What | You |
|---|---|---|
| Automatic | Docs, changelog, derived artifacts | Change and commit |
| Via proposal | Component tokens, components, utilities | `node scripts/propose.js token …` — it picks the file, compiles, validates and leaves a branch with the evidence |
| Human only | Primitives, semantics, themes, mixins, `scripts/`, `contracts/rules.json`, `contracts/trust.json` | Analyse and recommend. Do not write. |

Anything unmatched is human-only. The rules you are judged by and the guards that
judge you are human-only on purpose — do not edit them to make a change pass.
`propose.js` never pushes; it prints the command and leaves that to a person.

---

## Atomic Design — Layer Rules

| Layer | Prefix | Path | Rule |
|---|---|---|---|
| Atom | `atom-` | `scss/atoms/` | Single HTML element, no dependencies |
| Molecule | `mol-` | `scss/molecules/` | Combines 2+ atoms into one logical unit |
| Organism | `org-` | `scss/organisms/` | Full UI section (header, hero, etc.) |
| Utility | `syx-` | `scss/utilities/` | Pure CSS helper, no markup dependency |

---

## Token Tier Contract

```
--primitive-color-blue-500          ← raw value, only in themes/_theme.scss
  └── --semantic-color-primary      ← contextual alias, in themes/_theme.scss
        └── --component-btn-primary-bg  ← component-specific, in tokens/components/
```

Component SCSS rules reference only `--component-*` or `--semantic-*`. Never `--primitive-*`.

---

## Available Workflows

Step-by-step workflows for common tasks:

| Task | File |
|---|---|
| Create atom, molecule, or organism | `_agents/workflows/create-component.md` |
| Create a new theme | `_agents/workflows/create-theme.md` |
| Audit token health | `_agents/workflows/audit-tokens.md` |
| Update CHANGELOG | `_agents/workflows/update-changelog.md` |

---

## Project Structure

```
scss/
  abstracts/tokens/     — 4-tier token system
  atoms/                — 19 components
  molecules/            — 7 components
  organisms/            — 8 components
  themes/*/             — 7 themes (6 example-* + syx-sketch) × 4-5 bundles
contracts/              — machine-readable validation output
_agents/
  modes/                — mode definitions (ux, ui, token, theme, audit)
  workflows/            — step-by-step task guides
  prompts/              — copy-paste prompt templates
index.js                — package entry point: the same six queries as an npm dependency
scripts/
  syx-validate.js       — runs R01–R07 contract checks
  mcp-server.js         — MCP server (stdio): tokens, components and validation on demand
  lib/                  — shared engine: css-tokens.js, rules.js (R01–R04), consulta.js (the queries)
```
