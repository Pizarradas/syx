# SYX Design System

![License: MIT](https://img.shields.io/badge/License-MIT-7c3aed.svg)
![Version](https://img.shields.io/badge/version-2.0.0--beta-blue)
![CSS](<https://img.shields.io/badge/CSS-@layer%20%7C%20color--mix()-informational>)
![Sass](https://img.shields.io/badge/Sass-Dart%20Sass-CC6699?logo=sass)

> A modern, token-driven SCSS design system built on Atomic Design principles.  
> Zero external CSS dependencies. Dart Sass native.  
> Built by **José Luis Pizarro Feo**

---

## What is SYX?

SYX is a **component-first design system** that provides:

- A **3-layer token architecture** (Primitive → Semantic → Component)
- A **native SCSS mixin library** (15 files, Bourbon-philosophy, null-safe)
- An **Atomic Design component hierarchy** (Atoms → Molecules → Organisms)
- A **multi-context bundle system** (docs / app / marketing / blog per theme)
- **CSS `@layer`** for specificity management without `!important`
- **Fluid typography** with `clamp()` on every scale step

---

## Quick Start

### Option A — Zero install (use the compiled CSS)

Download or clone the repo, then link the CSS directly in your HTML:

```html
<!-- Pick the theme that fits your project -->
<link rel="stylesheet" href="css/styles-theme-example-01.css" />

<!-- Use SYX components -->
<button class="atom-btn atom-btn--primary atom-btn--filled atom-btn--size-md">
  Click me
</button>
<span class="atom-pill atom-pill--primary">New</span>
```

Open `index.html` in your browser to see the full live demo.

---

### Option B — Build from SCSS with npm

```bash
npm install
npm run build        # compiles all 5 themes
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
│   ├── atoms/                   # 19 atomic components
│   ├── molecules/               # 4 composite components
│   ├── organisms/               # 6 complex components
│   ├── layout/                  # Grid system
│   ├── utilities/               # Display, spacing, text utilities
│   ├── pages/                   # Page-specific styles
│   │
│   ├── styles-core.scss         # Minimal production bundle entry point
│   └── themes/                  # Theme definitions
│       ├── _shared/             # Shared core + 4 bundle definitions
│       ├── _template/           # Template for new themes
│       ├── example-01/          # Theme 01 (Purple/Blue)
│       ├── example-02/          # Theme 02 (Codymer)
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
├── index.html                   # Live demo / landing page
├── demo-bundle-weight.html      # Core bundle weight reference page
├── docs-foundation.html         # Colors, typography, spacing reference
├── docs-components.html         # All atoms and molecules
├── docs-elements.html           # Base HTML elements
├── docs-utilities.html          # Utility classes reference
├── docs-developer-guide.html    # Mixin and token practical reference
└── docs-why-syx.html            # Competitive analysis (7 sector committees)
```

---

## Documentation

| Document                                                                | Description                           |
| ----------------------------------------------------------------------- | ------------------------------------- |
| [ARCHITECTURE.md](scss/ARCHITECTURE.md)                                 | Technical architecture deep-dive      |
| [GETTING-STARTED.md](scss/GETTING-STARTED.md)                           | Step-by-step guide for new developers |
| [abstracts/mixins/README.md](scss/abstracts/mixins/README.md)           | Complete mixin reference              |
| [abstracts/tokens/TOKEN-GUIDE.md](scss/abstracts/tokens/TOKEN-GUIDE.md) | Token system guide                    |
| [CONTRIBUTING.md](scss/CONTRIBUTING.md)                                 | Contribution guidelines               |
| [themes/\_template/README.md](scss/themes/_template/README.md)          | How to create a new theme             |

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

| Theme       | Primary Color  | Bundles                              |
| ----------- | -------------- | ------------------------------------ |
| example-01  | Purple / Blue  | app, docs, marketing, blog           |
| example-02  | Codymer (Dark) | app, docs, marketing, blog           |
| example-03  | Blue           | app, docs, marketing, blog           |
| example-04  | Green          | app, docs, marketing, blog           |
| example-05  | Yellow         | app, docs, marketing, blog           |
| `_template` | Neutral (core) | `styles-core.css` — production-ready |

---

## Score (Feb 2026)

**93/100** — Architecture, tokens, theming, atomic design, mixin library, dark-mode, accessibility utilities, and `@layer` specificity management all production-ready.  
Roadmap to 100: Organisms expansion + Public documentation site.
