# SYX — Claude Code Entry Point

You are working with **SYX**, a token-driven, native SCSS design system (v4.1.0).

Before doing anything else, read:
1. `AI_GUIDELINES.md` — strict rules, contracts, token architecture, mixin cheatsheet
2. `contracts/rules.json` — the four machine-enforceable rules (R01–R04)
3. `tokens.json` — full token registry (check before using or creating any token)
4. `component-registry.json` — all existing components (check before creating a new one)

---

## Mode System

When the user's message begins with a `[SYX: MODE]:` prefix, activate the corresponding mode **before responding**. Read the mode file and let it override your default behavior for the entire response.

| Prefix | Mode file | When to use |
|---|---|---|
| `[SYX: UX]:` | `_agents/modes/ux.md` | Component selection, HTML structure, accessibility, interaction design |
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
- **After writing code, run** `node scripts/syx-validate.js` to verify R01–R04 compliance.

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
scss/themes/example-*/    — 6 named themes, each with 4 bundle contexts
contracts/                — machine-readable validation output
_agents/                  — workflows, prompts, and modes
scripts/syx-validate.js   — contract validator (run after any change)
```
