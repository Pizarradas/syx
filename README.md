# SYX Design System

![License: MIT](https://img.shields.io/badge/License-MIT-7c3aed.svg)
![Version](https://img.shields.io/badge/version-2.0.0--beta-blue)
![CSS](<https://img.shields.io/badge/CSS-@layer%20%7C%20color--mix()-informational>)
![Sass](https://img.shields.io/badge/Sass-Dart%20Sass-CC6699?logo=sass)

> A modern, token-driven SCSS design system built on Atomic Design principles.  
> Zero external CSS dependencies. Dart Sass native.  
> Built by **JosÃ© Luis Pizarro Feo**

---

## What is SYX?

SYX is a **component-first design system** that provides:

- A **3-layer token architecture** (Primitive â Semantic â Component)
- A **native SCSS mixin library** (15 files, Bourbon-philosophy, null-safe)
- An **Atomic Design component hierarchy** (Atoms â Molecules â Organisms)
- A **multi-context bundle system** (docs / app / marketing / blog per theme)
- **CSS `@layer`** for specificity management without `!important`
- **Fluid typography** with `clamp()` on every scale step

---

## Quick Start

### Option A â Zero install (use the compiled CSS)

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

### Option B â Build from SCSS with npm

```bash
npm install
npm run build        # compiles all 5 themes
npm run build:core   # compiles minimal production bundle (styles-core.css)
npm run build:prod   # compiles + runs PurgeCSS on all themes
npm run watch        # watches theme-01 for changes
npm run watch:all    # watches all themes
```

### Option C â Dart Sass CLI directly

```bash
sass scss/styles-theme-example-01.scss css/styles-theme-example-01.css --style=compressed --no-source-map
```

---

## Project Structure

```
syx/
â
âââ scss/                        â All source SCSS
â   âââ abstracts/               â Tokens, mixins, functions, maps
â   â   âââ tokens/
â   â   â   âââ primitives/      â Raw values (colors, spacing, fonts)
â   â   â   âââ semantic/        â Contextual aliases (color-primary, etc.)
â   â   â   âââ components/      â Per-component tokens (btn, form, headerâ¦)
â   â   âââ mixins/              â 15 SYX native mixins
â   â   âââ functions/
â   â   âââ maps/
â   â
â   âââ base/                    â Reset, elements, helpers
â   âââ atoms/                   â 19 atomic components
â   âââ molecules/               â 4 composite components
â   âââ organisms/               â 6 complex components
â   âââ layout/                  â Grid system
â   âââ utilities/               â Display, spacing, text utilities
â   âââ pages/                   â Page-specific styles
â   â
â   âââ styles-core.scss         â Minimal production bundle entry point
â   âââ themes/                  â Theme definitions
â       âââ _shared/             â Shared core + 4 bundle definitions
â       âââ _template/           â Template for new themes
â       âââ example-01/          â Theme 01 (Purple/Blue)
â       âââ example-02/          â Theme 02 (Codymer)
â       âââ example-03/          â Theme 03 (Blue)
â       âââ example-04/          â Theme 04 (Green)
â       âââ example-05/          â Theme 05 (Yellow)
â
âââ css/                         â Compiled output (committed for zero-install use)
â   âââ prod/                    â PurgeCSS-optimized output
â
âââ fonts/                       â Self-hosted webfonts
âââ img/                         â Images and icons
â
âââ index.html                   â Live demo / landing page
âââ demo-bundle-weight.html      â Core bundle weight reference page
âââ docs-foundation.html         â Colors, typography, spacing reference
âââ docs-components.html         â All atoms and molecules
âââ docs-elements.html           â Base HTML elements
âââ docs-utilities.html          â Utility classes reference
âââ docs-developer-guide.html    â Mixin and token practical reference
âââ docs-why-syx.html            â Competitive analysis (7 sector committees)
```

---

## Documentation

| Document                                                                | Description                           |
| ----------------------------------------------------------------------- | ------------------------------------- |
| [ARCHITECTURE.md](scss/ARCHITECTURE.md)                                 | Technical architecture deep-dive      |
| [GETTING-STARTED.md](scss/GETTING-STARTED.md)                           | Step-by-step guide for new developers |
| [abstracts/mixins/README.md](scss/abstracts/mixins/README.md)           | Complete mixin reference              |
| [abstracts/tokens/GUIA_DE_USO.md](scss/abstracts/tokens/GUIA_DE_USO.md) | Token system guide                    |
| [CONTRIBUTING.md](scss/CONTRIBUTING.md)                                 | Contribution guidelines               |
| [themes/\_template/README.md](scss/themes/_template/README.md)          | How to create a new theme             |

---

## Key Concepts

### Token Layers

```
Primitive  â  Semantic  â  Component
#3B82F6       color-primary  btn-primary-bg
```

Never use primitive tokens directly in components. Always go through semantic â component.

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
syx.reset â syx.base â syx.tokens â syx.atoms â syx.molecules â syx.organisms â syx.utilities
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
| `_template` | Neutral (core) | `styles-core.css` â production-ready |

---

## Score (Feb 2026)

**93/100** â Architecture, tokens, theming, atomic design, mixin library, dark-mode, accessibility utilities, and `@layer` specificity management all production-ready.
Roadmap to 100: Organisms expansion + Public documentation site.
