# SYX — Copilot instructions

You are changing **SYX itself**. Read `AGENTS.md` at the repository root before anything else: it is
the binding contract for every agent, and this file only points at it.

Two rules that are easy to miss without it:

- **Ask before you write.** Look up every token in `tokens.json` and every class in
  `component-registry.json`; never invent one. Run `node scripts/syx-validate.js` after any change.
- **Check before you propose.** Any improvement, roadmap item or "what SYX is missing" follows
  `_agents/modes/roadmap.md`: every idea is checked against `contracts/capabilities.json` first.
  An idea listed there as `done` is not a proposal, and not finding a name you guessed is not proof
  that the feature is missing.
