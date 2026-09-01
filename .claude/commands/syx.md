---
description: Activate one SYX mode, or a composition of them, over a task
argument-hint: <MODE[ → MODE][ + MODE]> <task>   e.g. UI implement atom-badge · UX → TOKEN → UI + AUDIT a search field
---

Activate the SYX mode system for this request: **$ARGUMENTS**

## What to do

1. **Read the grammar off the argument.** Everything up to the first word that is not a mode name
   or an operator is the invocation; the rest is the task.

   - Modes: `SKETCH` `UX` `CREATIVE` `TOKEN` `THEME` `UI` `AUDIT` `MIGRATE` (case-insensitive).
   - `→` (or `->`) is a **pipeline**: each mode's output is the next one's input.
   - `+` is **evaluative**: both modes work the same artifact, both outputs come back together.
   - **`+` groups before `→`.** `UX → UI + AUDIT` is `UX → (UI + AUDIT)`.
   - A leading `ATLAS` (or `[ATLAS]:`) wraps the whole thing in editorial context.

2. **Read the mode file for every mode named, before answering** — `_agents/modes/{mode}.md`,
   lowercase. Do not work from memory of what a mode does: the file carries its `Trust` ceiling and
   its `Knowledge` routing, and both change. In a pipeline, read each mode's file when its step
   begins, not all of them up front.

3. **Obey the two blocks at the top of each file.** `Trust` says what that mode may write and what
   it may only recommend — it is graded by `contracts/trust.json`, so it is not advice. `Knowledge`
   says which modules of `mind-system/knowledges/` to load and when; load only the ones whose
   trigger the task actually pulls.

4. **If `ATLAS` is present**, read `mind-system/governance/01-invocation.md` first and resolve the
   editorial context package — level, zone, density, proportion — before the first mode runs.
   ATLAS decides *what* to build; the modes execute. Its authority stops at editorial decisions:
   it never overrides R01–R08 or `contracts/trust.json`.

5. **Announce the composition in one line before you start**, so the user can see it was parsed the
   way they meant it. For example: `UX → (UI + AUDIT)` — three steps, AUDIT verifies UI's output.

## Guardrails

- **Invalid compositions**: `SKETCH + AUDIT` and `CREATIVE + AUDIT` (both modes are exempt from the
  very contracts AUDIT enforces), `UI → TOKEN` and `THEME → UI` (dependency backwards),
  `MIGRATE + AUDIT` (only `AUDIT → MIGRATE` makes sense). Say so and propose the correct form
  instead of running it anyway. The full table is in `mind-system/routing.md`.
- **A pipeline step with no work does not stop the pipeline.** Hand off explicitly — "these tokens
  already exist, use them" — and continue. Aborting is the user's call.
- **No mode commits to a shared branch.** What a mode may write, it writes through
  `node scripts/propose.js`.
- **If no mode is named**, do not guess one. List the eight with their tiers and ask which lens the
  task wants — picking a tier for the user is picking how much their turn costs.
