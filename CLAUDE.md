# SYX — Claude Code Entry Point

You are working with **SYX**, a token-driven, native SCSS design system (v4.17.0).

Before doing anything else, read:
1. `AI_GUIDELINES.md` — strict rules, contracts, token architecture, mixin cheatsheet
2. `contracts/rules.json` — the contract rules. `syx-validate.js` implements R01–R07; R08 is declared but not yet implemented
3. `tokens.json` — full token registry (check before using or creating any token)
4. `component-registry.json` — all existing components (check before creating a new one)

**Before writing anything, know the tier.** `contracts/trust.json` grades changes:
docs and derived artifacts are automatic; component tokens, components and utilities
go through `node scripts/propose.js` (it deduces the destination file, compiles,
validates and leaves a branch plus evidence); primitives, semantics, themes, mixins,
`scripts/` and the contracts themselves are human-only — analyse and recommend, never
write. Unmatched paths are human-only. Ask `classify_change` rather than guessing, and
never edit a rule or a guard to make your own change pass.

**Cheaper route: the MCP server.** If `syx` is registered as an MCP server (see
`README.md` → *MCP server*), don't load those files to answer a point question. Use
`get_token` for a token's real value in a theme and mode, `find_token_by_value` before
hardcoding anything, `get_component` for a component's verified classes and modifiers,
and `validate_snippet` to pass R01–R04 over SCSS **before** writing it. It runs the same
rules as `npm run validate`, from `scripts/lib/rules.js`. In an app that installs SYX
instead of cloning it, `require('syx-design-system')` gives the same six queries.

---

## Mode System

When the user's message begins with a `[SYX: MODE]:` prefix, activate the corresponding mode **before responding**. Read the mode file and let it override your default behavior for the entire response.

### Resource Tiers

Modes are calibrated by complexity and AI resource consumption. Choose the right tier for the task to avoid spending context budget unnecessarily.

| Tier | Mode | Cost | Files loaded | Output artifacts | Typical turns |
|---|---|---|---|---|---|
| 1 | `[SYX: SKETCH]:` | ⚡ Minimal | 0 | 1 HTML file (inline styles) | 1 |
| 2 | `[SYX: UX]:` | 🔵 Light | 1 (`component-registry.json`) | HTML structure + states | 1–2 |
| 3 | `[SYX: CREATIVE]:` | 🟡 Medium | 0–1 | HTML + CSS (self-contained) | 1–2 |
| 4 | `[SYX: TOKEN]:` | 🟠 Medium-High | 2 (`tokens.json`, `rules.json`) | Token SCSS files | 2–3 |
| 5 | `[SYX: THEME]:` | 🟠 Medium-High | 3 (`tokens.json`, theme file, `rules.json`) | Theme SCSS bundle | 2–3 |
| 6 | `[SYX: UI]:` | 🔴 High | 4+ (tokens, registry, rules, component files) | SCSS + token file + registry entry | 3–4 |
| 7 | `[SYX: AUDIT]:` | 🔴 High | N (component tree being audited) | Violation report | 2–4 |
| 8 | `[SYX: MIGRATE]:` | 🔴 Very High | N+ (all files referencing the migrated variable) | Migration plan + diffs | 4–6 |

> **Tip:** Start with SKETCH or UX to validate the concept. Escalate to TOKEN → UI → AUDIT only when the idea is confirmed.

### Mode Reference

| Prefix | Mode file | When to use |
|---|---|---|
| `[SYX: SKETCH]:` | `_agents/modes/sketch.md` | Quick POCs, wireframes, flow diagrams, layout experiments — no token/registry checks |
| `[SYX: UX]:` | `_agents/modes/ux.md` | Component selection, HTML structure, accessibility, interaction design |
| `[SYX: CREATIVE]:` | `_agents/modes/creative.md` | Experimental builds, awwwards-style pages, advanced CSS techniques, creative exploration |
| `[SYX: UI]:` | `_agents/modes/ui.md` | SCSS implementation, token usage, code generation, contract compliance |
| `[SYX: TOKEN]:` | `_agents/modes/token.md` | Token architecture, creating/migrating tokens, token audits |
| `[SYX: THEME]:` | `_agents/modes/theme.md` | Creating or modifying themes, OKLCH scales, dark mode |
| `[SYX: AUDIT]:` | `_agents/modes/audit.md` | Contract validation (R01–R08), violation detection, codebase health |
| `[SYX: MIGRATE]:` | `_agents/modes/migrate.md` | Legacy variable migration, impact analysis, per-variable replacement |

If no prefix is present, use the base rules below and apply common sense about which mode is most relevant.

---

## Base Rules (always active, all modes)

These rules are never overridden by any mode:

- **Never use `--primitive-*` tokens in component files.** Always map through `--semantic-*`.
- **Never use `!important`.** SYX uses `@layer` for cascade management.
- **Never write raw `transition:` or `position:` in component files.** Use mixins.
- **Never hardcode design values** (hex colors, raw px/rem literals). Use tokens.
- **Check `tokens.json` before using a token.** If it doesn't exist, create it first.
- **Check `component-registry.json` before creating a component.** Reuse before creating.
- **After writing code, run** `node scripts/syx-validate.js` to verify R01–R07 compliance. R01–R04 are errors; R05–R07 are warnings (undocumented tokens, phantom entries, unprefixed legacy vars).

---

## Available Workflows

Pre-built step-by-step workflows live in `_agents/workflows/`:

| Workflow | File | What it does |
|---|---|---|
| Create component | `_agents/workflows/create-component.md` | New atom, molecule, or organism |
| Create theme | `_agents/workflows/create-theme.md` | Clone template, configure new theme |
| Audit tokens | `_agents/workflows/audit-tokens.md` | Full token health check |
| Update changelog | `_agents/workflows/update-changelog.md` | Conventional Commits changelog |

---

## Project Structure (quick reference)

```
scss/abstracts/tokens/    — 4-tier token system (primitives → semantic → component)
scss/atoms/               — 19 single-purpose components
scss/molecules/           — 7 composite components
scss/organisms/           — 8 complex sections
scss/themes/*/            — 7 themes (6 example-* + syx-sketch), 4-5 bundle contexts
contracts/                — machine-readable validation output
_agents/                  — workflows, prompts, and modes
scripts/syx-validate.js   — contract validator (run after any change)
index.js                  — package entry point: the same six queries as an npm dependency
scripts/mcp-server.js     — MCP server (stdio) — ask the system instead of reading it
scripts/lib/              — shared engine: css-tokens.js, rules.js (R01–R04), consulta.js
```
