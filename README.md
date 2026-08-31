# SYX Design System

![License: MIT](https://img.shields.io/badge/License-MIT-7c3aed.svg)
![Version](https://img.shields.io/badge/version-4.26.0-7c3aed)
![CSS](<https://img.shields.io/badge/CSS-@layer%20%7C%20color--mix()-informational>)
![Sass](https://img.shields.io/badge/Sass-Dart%20Sass-CC6699?logo=sass)

> A modern, token-driven SCSS design system built on Atomic Design principles.  
> Zero external CSS dependencies. Dart Sass native.  
> Built by **José Luis Pizarro**

---

## What is SYX?

SYX is a **component-first design system** that provides:

- A **4-layer token architecture** (Primitive → Theme / Architecture → Semantic Tones → Component Aliases)
- A **native SCSS mixin library** (15 files, Bourbon-philosophy, null-safe)
- An **Atomic Design component hierarchy** (Atoms → Molecules → Organisms)
- A **multi-context bundle system** (docs / app / marketing / blog per theme)
- **CSS `@layer`** for specificity management without `!important`
- **Fluid typography** with `clamp()` on every scale step
- **AI First contracts layer** — machine-readable token registry, component inventory, automated validation (`syx-validate.js`) and agent-native workflows

---

## Quick Start

### Option A — Zero install (use the compiled CSS)

Download or clone the repo, then link the CSS directly in your HTML:

```html
<!-- Pick the theme that fits your project -->
<link rel="stylesheet" href="css/styles-theme-example-01.css" />

<!-- REQUIRED: two classes on <body> -->
<body class="syx syx--theme-example-01">
  <!-- Use SYX components -->
  <button class="atom-btn atom-btn--primary atom-btn--filled atom-btn--size-md">
    Click me
  </button>
  <span class="atom-pill atom-pill--primary">New</span>
</body>
```

Open `index.html` in your browser to see the full live demo.

---

### Option B — Install the package

```bash
npm install syx-design-system
```

```js
// One theme, one line — the compiled CSS ships with the package
import 'syx-design-system/themes/syx-sketch.css';
```

```js
// …and the design system is queryable from your own code
const syx = require('syx-design-system');

syx.getToken({ token: '--component-button-primary-filled-bg', mode: 'dark' }).value;
// → 'oklch(0.740 0.133 267)'

syx.findTokenByValue({ value: 'oklch(0.498 0.282 266.24)' }).exactos;
syx.getComponent({ name: 'btn' }).modifiers;
syx.validateSnippet({ code: '.card { color: var(--semantic-color-primary); }' }).conforme;
```

The **contracts travel with the package**, so your app validates against the exact
version it has installed — not against whatever is on `main` today.

| Subpath | What it is |
| ------- | ---------- |
| `syx-design-system` | Node API (the six queries above) + `paths` to every artifact |
| `syx-design-system/themes/<theme>.css` | Compiled CSS for one theme |
| `syx-design-system/scss/...` | SCSS source, to compile your own build |
| `syx-design-system/contracts/resolved-tokens.json` | Every token resolved, 7 themes × light/dark |
| `syx-design-system/tokens.json`, `/component-registry.json` | Registries |
| `npx syx-mcp` | The MCP server, from the installed package |

### Option C — Build from SCSS with npm

```bash
npm install
npm run build        # compiles all 7 themes
npm run build:tokens # regenerates contracts/resolved-tokens.json
npm run export:tokens # exports the tokens in W3C DTCG format (contracts/dtcg/, not versioned)
npm run build:prod   # compiles + runs PurgeCSS on all themes
npm run watch        # watches theme-01 for changes
npm run watch:all    # watches all themes
```

### Option D — Dart Sass CLI directly

```bash
sass scss/styles-theme-example-01.scss css/styles-theme-example-01.css --style=compressed --no-source-map
```

---

## MCP server (for AI agents)

SYX ships an MCP server so an agent can **ask** the design system instead of reading it.
Until now an agent had to open `tokens.json`, `component-registry.json` and the theme
files, and resolve the cascade in its head — which is where wrong token names come from.
The server answers with the value the browser would paint.

```bash
npm run mcp        # starts the server on stdio
npm run check:mcp  # smoke test: talks to it like a client would
```

Register it in any MCP client (Claude Desktop, Claude Code, Cursor…):

```json
{
  "mcpServers": {
    "syx": { "command": "npx", "args": ["-y", "syx-mcp"] }
  }
}
```

From a clone instead of the installed package:

```json
{
  "mcpServers": {
    "syx": {
      "command": "node",
      "args": ["scripts/mcp-server.js"],
      "cwd": "/absolute/path/to/syx"
    }
  }
}
```

| Tool | Answers |
| ---- | ------- |
| `list_themes` | Which themes and modes exist |
| `get_token` | The real value of a token in a theme + mode, with its alias chain |
| `find_token_by_value` | Which token holds this colour/measure (use before hardcoding one) |
| `list_components` | The component inventory, layer and base classes |
| `get_component` | Classes, modifiers, elements, states and tokens of one component |
| `validate_snippet` | Runs R01–R04 over SCSS **before** it is written, flags non-existent tokens, and names the mixin to use instead |
| `classify_change` | The trust tier of a change, and where a new token belongs |
| `scan_for_drift` | Where a consuming app has drifted from the system |
| `list_mixins` / `get_mixin` | The 44 mixins: signature, defaults, what they emit, how often each is used |

No dependencies: plain JSON-RPC over stdio. It reads `contracts/resolved-tokens.json`
and `component-registry.json`, both generated from source and arbitrated against the
compiled CSS — so everything it returns exists. The server and the Node API in Option B
answer from the same layer (`scripts/lib/consulta.js`), so an agent and an application
get the same answer to the same question.

---

## The proposal path (how an agent writes)

Reading is safe; writing is not. SYX grades what an agent may change by how far
the change travels — the boundary follows the direction of the cascade the system
already declares. The three tiers live in `contracts/trust.json`, so they can be
read without running anything, and `classify_change` serves them over MCP.

| Tier | What | Why |
| ---- | ---- | --- |
| **Automatic** | Docs, changelog, derived artifacts | A mistake is visible in the diff and reaches nothing compiled |
| **Via proposal** | Component tokens, components, utilities | Scoped to one component — reviewable at a glance, but it ships |
| **Human only** | Primitives, semantics, themes, mixins, the guards, the rules themselves | One change lands in all 7 themes at once, or changes the criteria everything else is judged by |

Anything that matches no pattern falls to **human only**. `contracts/rules.json`,
`contracts/trust.json` and `scripts/` are human-only on purpose: an agent that
could rewrite the rules it is judged by, or the guard that judges it, would not
have permissions — it would have a suggestion.

```bash
# Where does this change sit?
npm run propose classify scss/atoms/_btn.scss CHANGELOG.md

# Propose a component token — nobody says which file it goes in
npm run propose token -- --name --component-feature-card-glow \
  --value "var(--semantic-shadow-md)" --why "Optional lift for the featured card"
```

The destination is deduced from the token's family (which file already declares
`--component-feature-card-*`), never from a lookup table that would go stale. Then
the tool writes it, recompiles the CSS, runs the validator **over the result**, and
only if that is green does it create a branch, a commit and an evidence file in
`contracts/propuestas/`. If it is not green, there is no branch. Review starts with
the proof in front of you instead of a claim that it works.

It refuses, with the reason and whose call it is: a primitive or semantic token, a
literal colour (naming the semantic token that already holds it), a value that skips
the semantic layer, a token that already exists, an invented family, and a dirty
working tree. **It never pushes on its own** — it prints the exact command. `--pr`
publishes and opens the PR, and has to be asked for.

`npm run check:propuesta` exercises all of it in a throwaway copy of the tree.

---

## Drift scanner (for apps that consume SYX)

A design system only stays a system if what ships still matches it. `syx-scan`
reads an app's HTML and CSS and reports where it has drifted — comparing against
**the version of SYX that app has installed**, which is the only comparison that
means anything.

```bash
npx syx-scan "src/**/*.html" src/app.css          # from a consuming app
npm run scan -- docs.html --todo                  # from this repo
npx syx-scan app/ --json > drift.json             # for CI
```

| What it finds | Why it matters |
| ------------- | -------------- |
| `var(--token, #6d28d9)` where the token is now blue | The fallback is a copy of a value that expired. Nobody notices, because the browser only uses it the day the token is missing |
| `var(--token-that-never-existed, …)` | The app paints the fallback **always**, believing it's an exception |
| A colour written by hand that already is a token | Names the semantic token that holds it |
| `.atom-icon--lc-users` when the icon is `--lc-user` | The modifier paints nothing at all |
| A `syx-`/`atom-` class the compiled CSS never declares | Same |
| `!important` and raw `position` in consumer CSS | SYX governs the cascade with `@layer`; an `!important` outside voids it |

It ignores everything inside `<pre>`, `<code>`, `<script>` and `<textarea>` — a
documentation page teaches exactly what would otherwise be an error, and a scanner
that shouts at every example is a scanner people turn off. It also tells a dead
class apart from a JavaScript hook, and says nothing about colours that are the
app's own.

**It fixes nothing, on purpose.** What it finds goes through `scripts/propose.js`
or through someone's hands. By default it exits 0; `--fallar-si-alta` makes it
fail a build.

---

## What runs, and when

Eight guards, and none of them used to run unless somebody remembered to type
`npm run check`. `.github/workflows/ci.yml` splits them by what they cost:

| Job | When | What |
| --- | ---- | ---- |
| **Contratos** | every push · Node 18, 20, 22 | `check-limpio` (the committed CSS is the compiled one), then the whole `npm run check` chain |
| **Entrega** | pull requests | `check:consumible` (packs and installs for real) and `check:propuesta` |
| **Desviación** | every run, never fails | The drift report, written into the run summary |

The heavy jobs are on PRs on purpose: paying a 10 MB pack on every `git push` is
the surest way to get the whole thing switched off.

`check-limpio` runs **first**, on the freshly cloned tree — `npm run check` ends
by building, and after that there is no telling what was already there from what
was just generated. `css/` is versioned deliberately (Option A above), and half
the system measures itself against it: the registry uses it as arbiter, the
scanner decides from it which class exists, the token snapshot comes out of it. A
committed CSS that doesn't match the SCSS doesn't break the build — it makes every
guard measure against a world that no longer exists.

The drift job never fails the run. The scanner is a report, not a rule: today's
drift predates the tool that measures it, and failing every push over it would only
teach people to ignore red. When it reaches zero, `--fallar-si-alta` turns it into a
real guard — and that will be a decision, not an oversight.

---

## Project Structure

```
syx/
│
├── scss/                        # All source SCSS
│   ├── abstracts/               # Tokens, mixins, functions, maps
│   │   ├── tokens/
│   │   │   ├── primitives/      # Raw values (colors, spacing, fonts)
│   │   │   ├── semantic/        # Contextual aliases (color-primary, etc.)
│   │   │   └── components/      # Per-component tokens (btn, form, header…)
│   │   ├── mixins/              # 15 SYX native mixins
│   │   ├── functions/
│   │   └── maps/
│   │
│   ├── base/                    # Reset, elements, helpers
│   ├── atoms/                   # 21 atomic components
│   ├── molecules/               # 6 composite components
│   ├── organisms/               # 4 complex components
│   ├── layout/                  # Grid system
│   ├── utilities/               # Display, spacing, text utilities
│   ├── pages/                   # Page-specific styles
│   │
│   ├── styles-theme-*.scss      # One entry point per theme
│   └── themes/                  # Theme definitions
│       ├── _shared/             # Shared core + 4 bundle definitions
│       ├── _template/           # Template for new themes
│       ├── example-01/          # Theme 01 (Indigo/Amber)
│       ├── example-02/          # Theme 02 (Purple/Pink)
│       ├── example-03/          # Theme 03 (Coral/Orange)
│       ├── example-04/          # Theme 04 (Forest/Earth)
│       ├── example-05/          # Theme 05 (Midnight/Gold)
│       └── example-06/          # Theme 06 (Cyber/OKLCH)
│
├── css/                         # Compiled output (committed for zero-install use)
│   └── prod/                    # PurgeCSS-optimized output
│
├── fonts/                       # Self-hosted webfonts
├── img/                         # Images and icons
│
├── index.js                     # Package entry point — the Node API
├── index.html                   # Redirect wrapper
├── home.html                    # Landing page (AI First, features, tokens, themes)
├── docs.html                    # Complete unified documentation (Foundations, Components, Guidelines)
├── why-syx.html                 # Competitive analysis (7 sector committees)
├── theme-builder.html           # Interactive theme builder (OKLCH, live preview)
├── CLAUDE.md                    # Claude Code entry point — mode system, base rules
├── AGENTS.md                    # Agnostic AI entry point (Codex, Cursor, Copilot…)
└── AI_GUIDELINES.md             # AI First field guide — contracts, tokens, mixins
```

---

## Documentation

| Document                                                                | Description                                         |
| ----------------------------------------------------------------------- | --------------------------------------------------- |
| [ARCHITECTURE.md](scss/ARCHITECTURE.md)                                 | Technical architecture deep-dive                    |
| [GETTING-STARTED.md](scss/GETTING-STARTED.md)                           | Step-by-step guide for new developers               |
| [AGENTS.md](AGENTS.md)                                                  | Agnostic AI entry point (Codex, Cursor, Copilot…) — mode system, base rules, workflows |
| [CLAUDE.md](CLAUDE.md)                                                  | Claude Code entry point — mode routing, base rules, workflow references |
| [AI_GUIDELINES.md](AI_GUIDELINES.md)                                    | AI First field guide — contracts, tokens, mixins, naming conventions |
| [_agents/modes/README.md](_agents/modes/README.md)                      | Mode system — 6 specialist lenses activated by `[SYX: MODE]:` prefix |
| [THEMING-RULES.md](THEMING-RULES.md)                                    | Token substitution contract                         |
| [abstracts/mixins/README.md](scss/abstracts/mixins/README.md)           | Complete mixin reference                            |
| [abstracts/tokens/TOKEN-GUIDE.md](scss/abstracts/tokens/TOKEN-GUIDE.md) | Token system guide                                  |
| [CONTRIBUTING.md](scss/CONTRIBUTING.md)                                 | Contribution guidelines                             |
| [themes/\_template/README.md](scss/themes/_template/README.md)          | How to create a new theme                           |
| [contracts/validation-report.md](contracts/validation-report.md)        | Last automated validation report                    |

---

## Key Concepts

### Token Layers

```
Primitive  →  Semantic  →  Component
#3B82F6       color-primary  btn-primary-bg
```

Never use primitive tokens directly in components. Always go through semantic → component.

### Mixin Usage

```scss
// Always use SYX mixins instead of raw CSS
@include transition(color 0.2s ease); // not: transition: color 0.2s ease;
@include absolute(
  $top: 0,
  $right: 0
); // not: position: absolute; top: 0; right: 0;
@include padding(1rem null); // not: padding-top: 1rem; padding-bottom: 1rem;
```

### CSS @layer Stack

```
syx.reset → syx.base → syx.tokens → syx.atoms → syx.molecules → syx.organisms → syx.utilities
```

Utilities always win over components. No `!important` needed.

---

## Themes

| Theme       | Primary Color   | Bundles                              |
| ----------- | --------------- | ------------------------------------ |
| example-01  | Indigo / Amber  | app, docs, marketing, blog           |
| example-02  | Purple / Pink   | app, docs, marketing, blog           |
| example-03  | Coral / Orange  | app, docs, marketing, blog           |
| example-04  | Forest / Earth  | app, docs, marketing, blog           |
| example-05  | Midnight / Gold | app, docs, marketing, blog           |
| example-06  | Cyber (OKLCH)   | app, docs, marketing, blog           |
| `_template` | Neutral (core)  | base for new themes, not shipped     |

---

## Status (March 2026)

- **Architecture, tokens, theming, atomic design, mixin library, dark-mode, accessibility, `@layer`**: all production-ready.
- **AI First** (`contracts/`, `syx-validate.js`, `component-registry.json`, `AI_GUIDELINES.md`, `AGENTS.md`, `CLAUDE.md`, `_agents/`): ⚠️ **PASSED WITH WARNINGS** — R01–R08 contract layer active. Mode system (6 modes) fully operational. 1 phantom token closes on `npm run build`.
- Public documentation: `home.html`, `docs.html`, `why-syx.html` fully built with AI First section.
