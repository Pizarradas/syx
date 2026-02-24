# Changelog

All notable changes to SYX Design System will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [3.0.1] — 2026-02-24

### Fixed

- **`@layer` audit — complete layerization** — Two critical cascade inconsistencies resolved:
  1. **Rogue layer declaration removed** — `scss/base/_reset.scss` declared a conflicting `@layer syx.reset, syx.base, syx.components, syx.utilities` stack with a non-existent `syx.components` layer. Removed. The canonical stack is now declared exclusively in entrypoints (`styles-core.scss`, `styles-theme-*.scss`).
  2. **All components now wrapped in `@layer`** — Every atom (×15), molecule (×5), organism (×4), and the layout grid were producing unlayered CSS, floating above the layer system. All now emit CSS inside their respective `@layer` block (`syx.atoms`, `syx.molecules`, `syx.organisms`, `syx.base`).
- **`base/_elements.scss` now in `@layer syx.base`** — Element defaults (`ul`, `table`, `p`, `a`, `blockquote`, `hr`, `code`, `pre`) were the last remaining unlayered block. Now wrapped in `@layer syx.base { }`.
- **All 6 helper mixins confirmed in `@layer syx.utilities`** — `_backgrounds`, `_dimensions`, `_font-sizes`, `_fonts`, `_icons`, `_spacers` all already had the correct wrapper (no change needed, documented for clarity).

### Changed

- **`scss/CONTRIBUTING.md` — component template updated** — New component template now includes `@layer syx.atoms { }` wrapper so any new component follows the correct pattern by default. Checklist item added: "Mixin body wrapped in `@layer syx.{layer} { ... }`".

---

## [3.0.0] — 2026-02-24

### Added

- **Utility system overhaul** — All generic helpers migrated into a unified `scss/utilities/` layer. New utility files: `_backgrounds.scss`, `_borders.scss`, `_display.scss`, `_embed.scss`, `_flex.scss`, `_images.scss`, `_sizing.scss`, `_spacing.scss`, `_text.scss`, `_visibility.scss`. Scoped under `@layer syx.utilities`.
- **`docs-why-syx.html`** — New documentation page: competitive analysis of SYX vs Tailwind CSS, Material UI, Chakra UI, and Ant Design across 7 enterprise sectors.
- **`docs-developer-guide.html` — HTML Setup section** — Documents the required `<body class="syx syx--theme-example-*">` pattern, 5 theme reference table, and `syx--page-*` modifier convention.
- **Full `</head>` + `<body>` structure** — All 6 `docs-*.html` files now have explicit `</head>` and `<body class="syx syx--theme-example-01">` tags.
- **Grid system improvements** — `layout-grid__nested` double-padding fix; new `--no-pad` modifier for nested grids.

### Changed

- **Body class convention standardised** — All project HTML files now use `syx syx--theme-example-XX` on `<body>`. Page-type modifiers migrated from `page-*` to `syx--page-*` prefix (`test-01.html`, `test-02.html`, `text-03.html`).
- **"Codymer" theme renamed to "example-02"** — All references across SCSS files, documentation, and HTML removed. `_header.scss` `@if` guard, token comments, `_theme-config.scss` map, and `ARCHITECTURE.md` examples updated.
- **Deprecated helpers removed** — `scss/base/helpers/` folder cleaned. Generic helpers now covered by the utility layer. Theme-specific helpers (`_syx-layer.scss`, `_backgrounds.scss`) retained and modernised.
- **`scss/GETTING-STARTED.md`** — Quick-start HTML snippet updated to include the required body classes.
- **`scss/ARCHITECTURE.md`** — Updated to reflect the unified utility system, removed Codymer references, updated theme list.
- **`TOKEN-GUIDE.md`** — Mixin example updated: `theme-codymer` → `theme-example-02`.

### Removed

- All `scss/base/helpers/` deprecated partial files (covered by utilities).
- Every remaining reference to the internal name "Codymer" from functional code and documentation.

---

## [2.0.1] — 2026-02-19

### Added

- **`styles-core.scss` / `styles-core.css`** — Minimal production bundle. Excludes all documentation and showroom components (`atom-specimen`, `atom-swatch`, `atom-code`, `mol-demo`, `org-documentation-layout`, `org-content-columns`, `pages/*`). **138 KB** without PurgeCSS, **~110 KB** after.
- **PurgeCSS integration** — `postcss.config.js` + `@fullhuman/postcss-purgecss`. New scripts: `build:prod` (all themes + purge), `build:core` + `purge:core` (minimal bundle). Output to `css/prod/`.
- **`demo-bundle-weight.html`** — Real-weight reference page for the core bundle. Shows live components using `styles-core.css` only.
- **`_template` neutral theme (Sección 3)** — The `_template/_theme.scss` now defines a full set of neutral semantic token overrides specifically for buttons and forms: slate primary, system-ui fonts, standard blue links, 6px border-radius, accessible focus shadow. Ready to use as a production starting point.
- **`scss/themes/_shared/_bundle-core.scss`** — Shared mixin `syx-bundle-core()` that defines the production component set.

### Changed

- **`_template/_theme.scss`** — Now includes a "Sección 3" block overriding `--semantic-color-*`, `--semantic-font-family-*`, `--semantic-border-radius-*`, and `--semantic-shadow-focus` with neutral, brand-agnostic values.
- **`package.json`** — Added `build:core`, `purge:core`, `build:prod`, `purge:*` scripts. Uses `npx postcss` for cross-platform compatibility.

### Fixed

- **Sass deprecation warnings** — Replaced all deprecated `if()` function usage with `@if/@else` in `_directional.scss`, `_font.scss`, `_triangle.scss`, and `_theme-config.scss`.

---

## [2.0.0-beta] — 2026-02-18

### Added

- **`@layer` granular stack** — `syx.reset → syx.base → syx.tokens → syx.atoms → syx.molecules → syx.organisms → syx.utilities`. Utilities always win without `!important`.
- **Dark mode** — Dual activation: `@media (prefers-color-scheme: dark)` + `[data-theme="dark"]`. Persists in `localStorage`. Syncs with OS changes.
- **Accessibility utilities** — `.syx-sr-only`, `.syx-sr-only-focusable`, `.syx-skip-link`, `.syx-motion-safe` added to `_a11y.scss`.
- **`color-mix()` hover tints** — Button hover states now use `color-mix(in srgb, ...)` for dynamic tints without hardcoded values.
- **Card molecule** — `.syx-card` migrated from atoms to molecules layer with full dark-mode support.
- **Fluid display token** — `--primitive-fluid-font-display` and `--primitive-letter-spacing-display` added.
- **Container Queries** — Cards and column layouts use `@container` for truly responsive components.
- **`package.json`** — Build scripts for all 5 themes with Dart Sass.
- **`CHANGELOG.md`** — This file.
- **`LICENSE`** — MIT license.

### Changed

- **`_btn.scss`** — All `[class*="--variant"]` attribute selectors replaced with explicit BEM class selectors (`.atom-btn--primary`, `.atom-btn--filled`, etc.) for predictable specificity.
- **`_card.scss`** — Background, border, and text colors migrated from primitive tokens to semantic tokens (`--semantic-color-bg-primary`, `--semantic-color-border-subtle`, `--semantic-color-text-tertiary`).
- **`_display.scss`** — `.syx-border` migrated to semantic tokens for dark-mode compatibility.
- **`_tables.scss`** — Table hover token corrected from `state-focus` to `state-hover-primary`.
- **Documentation** — All 8 `.md` files and 5 docs HTML files updated to reflect the current `@layer` stack, molecule count, and system state.

### Fixed

- `--component-table-state-hover-bg` was incorrectly pointing to `--semantic-color-state-focus` (focus ring color) instead of `--semantic-color-state-hover-primary`.
- `@layer` stack in docs HTML showed the old `syx.components` monolithic layer instead of the granular 7-layer stack.
- Molecule count in `ARCHITECTURE.md` was 4 (missing card).
- Project score in `README.md` was stale (86/100 → 93/100).

### Removed

- `prepros.config` — Local build tool config, not needed in the repo.
- `metas-html.txt` — Internal working file.
- `sitemap.xml` — Stale file with old domain references.
- `test-*.html` — Development test files.

---

## [1.0.0] — 2024-01-01

### Added

- Initial release of SYX Design System.
- 5 example themes with full token architecture (Primitive → Semantic → Component).
- 19 atoms, 4 molecules, 6 organisms.
- Mixin library: positioning, spacing, sizing, flexbox, typography, media queries, accessibility.
- Fluid typography with `clamp()`.
- Multi-theming via `data-theme` attribute.
- Documentation: `ARCHITECTURE.md`, `GETTING-STARTED.md`, `CONTRIBUTING.md`, `THEMING-RULES.md`, mixin README, token guide.
