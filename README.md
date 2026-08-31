# SYX Design System

![License: MIT](https://img.shields.io/badge/License-MIT-7c3aed.svg)
![Version](https://img.shields.io/badge/version-4.16.0-7c3aed)
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
| `validate_snippet` | Runs R01–R04 over SCSS **before** it is written, and flags non-existent tokens |

No dependencies: plain JSON-RPC over stdio. It reads `contracts/resolved-tokens.json`
and `component-registry.json`, both generated from source and arbitrated against the
compiled CSS — so everything it returns exists. The server and the Node API in Option B
answer from the same layer (`scripts/lib/consulta.js`), so an agent and an application
get the same answer to the same question.

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
