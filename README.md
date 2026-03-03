# SYX Design System

![License: MIT](https://img.shields.io/badge/License-MIT-7c3aed.svg)
![Version](https://img.shields.io/badge/version-4.0.0-7c3aed)
![CSS](<https://img.shields.io/badge/CSS-@layer%20%7C%20color--mix()-informational>)
![Sass](https://img.shields.io/badge/Sass-Dart%20Sass-CC6699?logo=sass)

> A modern, token-driven SCSS design system built on Atomic Design principles.  
> Zero external CSS dependencies. Dart Sass native.  
> Built by **José Luis Pizarro Feo**

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

### Option B — Build from SCSS with npm

```bash
npm install
npm run build        # compiles all 6 themes
npm run build:core   # compiles minimal production bundle (styles-core.css)
npm run build:prod   # compiles + runs PurgeCSS on all themes
npm run watch        # watches theme-01 for changes
npm run watch:all    # watches all themes
```

### Option C — Dart Sass CLI directly

```bash
sass scss/styles-theme-example-01.scss css/styles-theme-example-01.css --style=compressed --no-source-map
```

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
│   ├── styles-core.scss         # Minimal production bundle entry point
│   └── themes/                  # Theme definitions
│       ├── _shared/             # Shared core + 4 bundle definitions
│       ├── _template/           # Template for new themes
│       ├── example-01/          # Theme 01 (Purple/Blue)
│       ├── example-02/          # Theme 02 (Dark)
│       ├── example-03/          # Theme 03 (Blue)
│       ├── example-04/          # Theme 04 (Green)
│       └── example-05/          # Theme 05 (Yellow)
│
├── css/                         # Compiled output (committed for zero-install use)
│   └── prod/                    # PurgeCSS-optimized output
│
├── fonts/                       # Self-hosted webfonts
├── img/                         # Images and icons
│
├── index.html                   # Redirect wrapper
├── home.html                    # Live demo / landing page
├── docs.html                    # Complete unified documentation (Foundations, Components, Guidelines)
├── docs-elements.html           # (Legacy) Base HTML elements
├── docs-utilities.html          # (Legacy) Utility classes reference
├── docs-developer-guide.html    # (Legacy) Mixin and token practical reference
└── why-syx.html                 # Competitive analysis (7 sector committees)
```

---

## Documentation

| Document                                                                | Description                                         |
| ----------------------------------------------------------------------- | --------------------------------------------------- |
| [ARCHITECTURE.md](scss/ARCHITECTURE.md)                                 | Technical architecture deep-dive                    |
| [GETTING-STARTED.md](scss/GETTING-STARTED.md)                           | Step-by-step guide for new developers               |
| [AI_GUIDELINES.md](AI_GUIDELINES.md)                                    | AI First field guide — contracts, tokens, workflows |
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
| `_template` | Neutral (core)  | `styles-core.css` — production-ready |

---

## Status (March 2026)

- **Architecture, tokens, theming, atomic design, mixin library, dark-mode, accessibility, `@layer`**: all production-ready.
- **AI First** (`contracts/`, `syx-validate.js`, `component-registry.json`, `AI_GUIDELINES.md`, `_agents/`): ⚠️ **PASSED WITH WARNINGS** — R01/R02/R03/R04 all clean. 1 phantom token closes on `npm run build`.
- Public documentation: `home.html`, `docs.html`, `why-syx.html` fully built with AI First section.
