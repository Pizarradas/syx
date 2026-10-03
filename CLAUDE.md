# SYX — Claude Code Entry Point

You are working with **SYX**, a token-driven, native SCSS design system (v5.0.0).

> **Building a website or an app that *uses* SYX, rather than changing SYX?** Read
> `CONSUMING.md` instead, and run `npx syx-init` in the app.

Before doing anything else, read:
1. `AI_GUIDELINES.md` — strict rules, contracts, token architecture, mixin cheatsheet. Its rule
   table (R01–R11) is the readable form of `contracts/rules.json`; ask `validate_snippet`
   instead of reading the JSON.

**Then ask, don't load.** `tokens.json` (≈ 280 KB) and `component-registry.json` (≈ 45 KB) are the
sources of truth; reading them whole costs some 80 000 tokens. With the `syx` MCP server, ask:
`get_token` (real value in a theme and mode, with its alias chain), `find_token_by_value` (before
hardcoding anything), `get_component` (verified classes, modifiers, a11y), `get_mixin` (what to write
where R03/R04 forbid raw CSS), `validate_snippet` (R01–R04, R09–R11 **before** writing),
`get_figma_spec` (numbers for a Figma node — never convert `oklch()` or `rem` by hand),
`classify_change` and `scan_for_drift`. Without the server, grep the one entry you need
(`grep '"--semantic-color-' tokens.json`). In an app that installs SYX, `require('syx-design-system')`
answers the same queries. The full tool table is in `README.md` → *MCP server*.

**Before writing anything, know the tier.** `contracts/trust.json` grades changes: docs and derived
artifacts are automatic; component tokens, components and utilities go through
`node scripts/propose.js` (`token` for a new component token, `files <paths…> --why "…"` for what you
already wrote). Primitives, semantics, themes, mixins, `scripts/`, the contracts and every document
that instructs or grades an agent (this file, `AGENTS.md`, `AI_GUIDELINES.md`, `.claude/`,
`_agents/modes/`, `_agents/evals/`) are human-only: analyse and recommend, never write. The hook in
`.claude/settings.json` blocks the edit and CI fails the PR without a person's approval. Unmatched
paths are human-only. Ask `classify_change` rather than guessing, and never edit a rule or a guard
to make your own change pass.

---

## Two layers: the engine and the cortex

```
_agents/        ENGINE  — what a mode does, in what format, under what permission ceiling. Always loaded.
mind-system/    CORTEX  — why a decision is right (colour, UX laws, WCAG, scales, motion, ATLAS). On demand.
```

**Precedence, highest first** — when two documents disagree, the higher rung wins:

| # | Authority | Decides | Checked? |
|---|---|---|---|
| 1 | `contracts/trust.json` | Who may write what | ✅ `classify_change` |
| 2 | `contracts/rules.json` | R01–R11 | ✅ `npm run validate` |
| 3 | `_agents/modes/*.md` → `Trust` block | Each mode's ceiling | ✅ `npm run check:modos` |
| 4 | `mind-system/governance/` | How ATLAS and the modes compose | ⚠️ declared only |
| 5 | `mind-system/atlas-rules/` | Editorial decisions (guest domain) | ⚠️ declared only |
| 6 | `mind-system/knowledges/` | The reasoning | ⚠️ declared only |

A knowledge module never authorises anything and never wins against a rule. When `[ATLAS]:` wraps a
mode, ATLAS decides **what** to build and **why**, and nothing above rung 5. Entry point:
`mind-system/README.md`; the mode↔knowledge wiring is `mind-system/routing.md`.

---

## Mode System

When the message begins with `[SYX: MODE]:` (or `/syx MODE …`), read the mode file **before
responding** and let it govern the whole response. `→` is a pipeline, `+` is evaluative, and `+`
groups first: `[SYX: UX → UI + AUDIT]:` is `UX → (UI + AUDIT)`. Each mode opens with a `Trust` block
(what it may write — it inherits permission, never grants it) and a `Knowledge` block (which cortex
modules it loads, and when). Tiers, costs and when to escalate: `_agents/modes/README.md`.

| Prefix | Mode file | Writes | When to use |
|---|---|---|---|
| `[SYX: SKETCH]:` | `_agents/modes/sketch.md` | nothing | Quick POCs, wireframes, flow diagrams — no token/registry checks |
| `[SYX: UX]:` | `_agents/modes/ux.md` | nothing | Component selection, HTML structure, accessibility, interaction |
| `[SYX: CREATIVE]:` | `_agents/modes/creative.md` | nothing | Experimental builds, advanced CSS, creative exploration |
| `[SYX: UI]:` | `_agents/modes/ui.md` | `auto` + `pr` | SCSS implementation, token usage, contract compliance |
| `[SYX: TOKEN]:` | `_agents/modes/token.md` | `pr` / recommends | Token architecture, creating/migrating tokens |
| `[SYX: THEME]:` | `_agents/modes/theme.md` | recommends | Themes, OKLCH scales, dark mode |
| `[SYX: AUDIT]:` | `_agents/modes/audit.md` | nothing | R01–R11 conformance, violations, codebase health |
| `[SYX: MIGRATE]:` | `_agents/modes/migrate.md` | `pr` / recommends | Legacy variable migration, per-variable replacement |
| `[SYX: BRAND]:` | `_agents/modes/brand.md` | recommends | A complete visual identity: the seven axes and the spec THEME builds from |

Without a prefix, apply the base rules below and use the mode that fits.

---

## Base Rules (always active, all modes)

- **Never use `--primitive-*` in component files.** Map through `--semantic-*`.
- **Never use `!important`.** SYX uses `@layer` for cascade management.
- **Never write raw `transition`/`transition-*` or `position: absolute|fixed|sticky` outside the mixins.**
  A justified exception goes on the line above, `// syx-allow R03: <why>`, and excuses that one declaration.
- **Never hardcode design values** (hex colours, raw px/rem). Use tokens.
- **Ask before using a token** (`get_token`). Missing: a component token is proposed with
  `node scripts/propose.js token`; a semantic or primitive one is recommended to a person.
- **Check the registry before creating a component.** Reuse before creating.
- **After writing code, run** `node scripts/syx-validate.js`. R01–R04, R09 and R10 are errors;
  R05, R06 and R08 warnings; R07 info (`contracts/rules.json`).

Step-by-step workflows (create a component or theme, audit tokens, changelog, export to Figma) live in
`_agents/workflows/`. The ecosystem as a graph: `_agents/architecture.md`.

---

## Project Structure (quick reference)

```
scss/abstracts/tokens/    — 4 kinds of token (primitive, theme, semantic, component); colour path primitive → semantic → component
scss/atoms/               — 23 atoms · scss/molecules/ — 15 molecules · scss/organisms/ — 2 (app-shell, site-header)
scss/site/                — SITE LAYER: pieces used only by SYX's own pages; outside the registry; removable
scss/themes/*/            — 7 themes (6 example-* + syx-sketch), 6 bundle contexts
contracts/                — machine-readable contracts and validation output
_agents/                  — THE ENGINE: modes, workflows, prompts, evals
mind-system/              — THE CORTEX: precedence, routing, governance, atlas-rules, knowledges
scripts/                  — validator, MCP server (mcp-server.js), scanner, propose.js; lib/ = shared engine
```
