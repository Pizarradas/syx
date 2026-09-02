# SYX — Claude Code Entry Point

You are working with **SYX**, a token-driven, native SCSS design system (v4.28.0).

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

**To check an app against the system**, don't read its CSS looking for smells: `scan_for_drift` (or `npx syx-scan`) reports expired fallbacks, non-existent tokens, hand-written values that are already tokens, and classes that paint nothing — ignoring code examples.

**Cheaper route: the MCP server.** If `syx` is registered as an MCP server (see
`README.md` → *MCP server*), don't load those files to answer a point question. Use
`get_token` for a token's real value in a theme and mode, `find_token_by_value` before
hardcoding anything, `get_component` for a component's verified classes and modifiers,
`get_mixin` before writing a property a rule will reject — R03 and R04 say what you may not write, and `get_mixin` says what to write instead —
and `validate_snippet` to pass R01–R04 over SCSS **before** writing it (it now names the replacement mixin itself). It runs the same
rules as `npm run validate`, from `scripts/lib/rules.js`. In an app that installs SYX
instead of cloning it, `require('syx-design-system')` gives the same six queries.

---

## Two layers: the engine and the cortex

```
_agents/        ENGINE  — what a mode does, in what format, under what permission ceiling.
                          Always loaded. Guarded by `npm run check:modos`. Ships with the package.
mind-system/    CORTEX  — why a decision is right: colour theory, UX laws, WCAG, scale models,
                          prestige, motion, and the ATLAS editorial rules. Loaded on demand.
                          Informs; never executes. Not published to npm.
```

**Precedence, highest first.** When two documents in this repository disagree, the higher rung wins — no exceptions by context:

| # | Authority | Decides | Checked? |
|---|---|---|---|
| 1 | `contracts/trust.json` | Who may write what | ✅ `classify_change` |
| 2 | `contracts/rules.json` | R01–R08 | ✅ `npm run validate` |
| 3 | `_agents/modes/*.md` → `Trust` block | Each mode's ceiling | ✅ `npm run check:modos` |
| 4 | `mind-system/governance/` | How ATLAS and the modes compose | ⚠️ declared only |
| 5 | `mind-system/atlas-rules/` | Editorial decisions (guest domain) | ⚠️ declared only |
| 6 | `mind-system/knowledges/` | The reasoning | ⚠️ declared only |

A knowledge module never authorises anything, never creates a token, and never wins an argument
against a rule: if one recommends what R01 forbids, the module is what needs fixing. When
`[ATLAS]:` wraps a mode, ATLAS decides **what** to build and **why** — editorial level, hierarchy,
density, proportion, zone, advertising — and nothing above rung 5. Entry point:
`mind-system/README.md`; the mode↔knowledge wiring is `mind-system/routing.md`.

---

## Mode System

When the user's message begins with a `[SYX: MODE]:` prefix, activate the corresponding mode **before responding**. Read the mode file and let it override your default behavior for the entire response. Each mode file opens with two blocks: `Trust` (what it may write) and `Knowledge` (which cortex modules it loads, and when), and every mode but SKETCH closes its response with a `## Why` — one line per decision that had an alternative, specified once in `_agents/decision-record.md`.

Two operators compose modes: `→` is a pipeline (each output feeds the next), `+` is evaluative
(both modes work the same artifact). **`+` groups before `→`**, so `[SYX: UX → UI + AUDIT]:` reads
as `UX → (UI + AUDIT)`. The `/syx` slash command (`.claude/commands/syx.md`) takes the same grammar
and resolves to the same files — use it when the user types `/syx`, and honour the prefix when they
type that instead. Neither form picks a mode on its own: choosing the lens picks the tier, and the
tier is what the turn costs.

### Resource Tiers

Modes are calibrated by complexity and AI resource consumption. Choose the right tier for the task to avoid spending context budget unnecessarily.

The **Files loaded** column is the cost *without* the MCP server: what a mode has to read to
answer a point question when it can only open files. With `syx` registered, most of those reads
become a call that returns the one answer, and the column that matters is the last one.

| Tier | Mode | Cost | Files loaded (no MCP) | Ask instead | Typical turns |
|---|---|---|---|---|---|
| 1 | `[SYX: SKETCH]:` | ⚡ Minimal | 0 | — | 1 |
| 2 | `[SYX: UX]:` | 🔵 Light | 1 (`component-registry.json`) | `list_components`, `get_component` | 1–2 |
| 3 | `[SYX: CREATIVE]:` | 🟡 Medium | 0–1 | `get_component`, `find_token_by_value` | 1–2 |
| 4 | `[SYX: TOKEN]:` | 🟠 Medium-High | 2 (`tokens.json`, `rules.json`) | `get_token`, `find_token_by_value`, `classify_change` | 2–3 |
| 5 | `[SYX: THEME]:` | 🟠 Medium-High | 3 (`tokens.json`, theme file, `rules.json`) | `get_token` (per theme + mode) | 2–3 |
| 6 | `[SYX: UI]:` | 🔴 High | 4+ (tokens, registry, rules, component files) | `get_component`, `get_mixin`, `validate_snippet` | 3–4 |
| 7 | `[SYX: AUDIT]:` | 🔴 High | N (component tree being audited) | `validate_snippet`, `scan_for_drift` | 2–4 |
| 8 | `[SYX: MIGRATE]:` | 🔴 Very High | N+ (all files referencing the migrated variable) | `find_token_by_value`, `get_token`, `scan_for_drift` | 4–6 |
| 9 | `[SYX: BRAND]:` | 🔴 Very High | 3 (`tokens.json`, `rules.json`, `component-registry.json`) | `get_token` (per axis), `find_token_by_value`, `list_components` | 3–5 |

> **Tip:** Start with SKETCH or UX to validate the concept. Escalate to TOKEN → UI → AUDIT only when the idea is confirmed.

**The tier measures interrogating the system, not the cortex.** They are two separate axes and
adding them together gives a wrong number. The tier counts what it costs to ask SYX (`tokens.json`,
`component-registry.json`, `contracts/`); the mode's `Knowledge` block counts what it costs to load
the corpus. CREATIVE is tier 3 and still loads the whole `motion/` domain when there is GSAP: cheap
in system reads, expensive in corpus. SKETCH is the one disciplined exception — its tier 1 is bought
by reading nothing, so its `Knowledge` block has no **Always** line at all.

**BRAND is the second exception, in the opposite direction.** It reads three files and still sits at
tier 9, because the tier ranks the work and BRAND's work is the only one that has to come out
internally consistent across seven axes at once. The expensive part is the coherence check, not the
reads. It sits at the end of the table rather than between UI and AUDIT for a duller reason: the
numbers are cited in three indices, and renumbering eight rows to insert one costs more than the
ordering is worth.

### Mode Reference

| Prefix | Mode file | Writes | When to use |
|---|---|---|---|
| `[SYX: SKETCH]:` | `_agents/modes/sketch.md` | nothing | Quick POCs, wireframes, flow diagrams, layout experiments — no token/registry checks |
| `[SYX: UX]:` | `_agents/modes/ux.md` | nothing | Component selection, HTML structure, accessibility, interaction design |
| `[SYX: CREATIVE]:` | `_agents/modes/creative.md` | nothing | Experimental builds, awwwards-style pages, advanced CSS techniques, creative exploration |
| `[SYX: UI]:` | `_agents/modes/ui.md` | `pr` | SCSS implementation, token usage, code generation, contract compliance |
| `[SYX: TOKEN]:` | `_agents/modes/token.md` | `pr` / recommends | Token architecture, creating/migrating tokens, token audits |
| `[SYX: THEME]:` | `_agents/modes/theme.md` | recommends | Creating or modifying themes, OKLCH scales, dark mode |
| `[SYX: AUDIT]:` | `_agents/modes/audit.md` | nothing | Contract validation (R01–R08), violation detection, codebase health |
| `[SYX: MIGRATE]:` | `_agents/modes/migrate.md` | `pr` / recommends | Legacy variable migration, impact analysis, per-variable replacement |
| `[SYX: BRAND]:` | `_agents/modes/brand.md` | recommends | A complete visual identity — the seven axes at once, its invariants, and the theme that carries it |

**A mode does not grant permission.** Each mode file opens with a `Trust` block naming what it
may write (`auto`/`pr`), what it may only recommend (`human`) and what it should ask for instead
of reading. Those lists are checked against `contracts/trust.json` by `npm run check:modos`, so a
mode cannot quietly hand itself a permission the contract doesn't give it. THEME and BRAND never
write; TOKEN and MIGRATE write the lower half of what they touch and hand over the upper half.

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
_agents/                  — THE ENGINE: modes (Trust + Knowledge blocks), workflows, prompts
mind-system/              — THE CORTEX: README (precedence), constitution, routing,
                            governance/ (ATLAS ↔ modes), atlas-rules/ (guest domain),
                            knowledges/ (ux · ui · front · syx · branding · motion · vendors)
scripts/syx-validate.js   — contract validator (run after any change)
index.js                  — package entry point: the same six queries as an npm dependency
scripts/mcp-server.js     — MCP server (stdio) — ask the system instead of reading it
scripts/lib/              — shared engine: css-tokens.js, rules.js (R01–R04), consulta.js
```
