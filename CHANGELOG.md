# Changelog

All notable changes to SYX Design System will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [2.0.1] â 2026-02-19

### Added

- **`styles-core.scss` / `styles-core.css`** â Minimal production bundle. Excludes all documentation and showroom components (`atom-specimen`, `atom-swatch`, `atom-code`, `mol-demo`, `org-documentation-layout`, `org-content-columns`, `pages/*`). **138 KB** without PurgeCSS, **~110 KB** after.
- **PurgeCSS integration** â `postcss.config.js` + `@fullhuman/postcss-purgecss`. New scripts: `build:prod` (all themes + purge), `build:core` + `purge:core` (minimal bundle). Output to `css/prod/`.
- **`demo-bundle-weight.html`** â Real-weight reference page for the core bundle. Shows live components using `styles-core.css` only.
- **`_template` neutral theme (SecciÃ³n 3)** â The `_template/_theme.scss` now defines a full set of neutral semantic token overrides specifically for buttons and forms: slate primary, system-ui fonts, standard blue links, 6px border-radius, accessible focus shadow. Ready to use as a production starting point.
- **`scss/themes/_shared/_bundle-core.scss`** â Shared mixin `syx-bundle-core()` that defines the production component set.

### Changed

- **`_template/_theme.scss`** â Now includes a "SecciÃ³n 3" block overriding `--semantic-color-*`, `--semantic-font-family-*`, `--semantic-border-radius-*`, and `--semantic-shadow-focus` with neutral, brand-agnostic values.
- **`package.json`** â Added `build:core`, `purge:core`, `build:prod`, `purge:*` scripts. Uses `npx postcss` for cross-platform compatibility.

### Fixed

- **Sass deprecation warnings** â Replaced all deprecated `if()` function usage with `@if/@else` in `_directional.scss`, `_font.scss`, `_triangle.scss`, and `_theme-config.scss`.

---

## [2.0.0-beta] â 2026-02-18

### Added

- **`@layer` granular stack** â `syx.reset â syx.base â syx.tokens â syx.atoms â syx.molecules â syx.organisms â syx.utilities`. Utilities always win without `!important`.
- **Dark mode** â Dual activation: `@media (prefers-color-scheme: dark)` + `[data-theme="dark"]`. Persists in `localStorage`. Syncs with OS changes.
- **Accessibility utilities** â `.syx-sr-only`, `.syx-sr-only-focusable`, `.syx-skip-link`, `.syx-motion-safe` added to `_a11y.scss`.
- **`color-mix()` hover tints** â Button hover states now use `color-mix(in srgb, ...)` for dynamic tints without hardcoded values.
- **Card molecule** â `.syx-card` migrated from atoms to molecules layer with full dark-mode support.
- **Fluid display token** â `--primitive-fluid-font-display` and `--primitive-letter-spacing-display` added.
- **Container Queries** â Cards and column layouts use `@container` for truly responsive components.
- **`package.json`** â Build scripts for all 5 themes with Dart Sass.
- **`CHANGELOG.md`** â This file.
- **`LICENSE`** â MIT license.

### Changed

- **`_btn.scss`** â All `[class*="--variant"]` attribute selectors replaced with explicit BEM class selectors (`.atom-btn--primary`, `.atom-btn--filled`, etc.) for predictable specificity.
- **`_card.scss`** â Background, border, and text colors migrated from primitive tokens to semantic tokens (`--semantic-color-bg-primary`, `--semantic-color-border-subtle`, `--semantic-color-text-tertiary`).
- **`_display.scss`** â `.syx-border` migrated to semantic tokens for dark-mode compatibility.
- **`_tables.scss`** â Table hover token corrected from `state-focus` to `state-hover-primary`.
- **Documentation** â All 8 `.md` files and 5 docs HTML files updated to reflect the current `@layer` stack, molecule count, and system state.

### Fixed

- `--component-table-state-hover-bg` was incorrectly pointing to `--semantic-color-state-focus` (focus ring color) instead of `--semantic-color-state-hover-primary`.
- `@layer` stack in docs HTML showed the old `syx.components` monolithic layer instead of the granular 7-layer stack.
- Molecule count in `ARCHITECTURE.md` was 4 (missing card).
- Project score in `README.md` was stale (86/100 â 93/100).

### Removed

- `prepros.config` â Local build tool config, not needed in the repo.
- `metas-html.txt` â Internal working file.
- `sitemap.xml` â Stale file with old domain references.
- `test-*.html` â Development test files.

---

## [1.0.0] â 2024-01-01

### Added

- Initial release of SYX Design System.
- 5 example themes with full token architecture (Primitive â Semantic â Component).
- 19 atoms, 4 molecules, 6 organisms.
- Mixin library: positioning, spacing, sizing, flexbox, typography, media queries, accessibility.
- Fluid typography with `clamp()`.
- Multi-theming via `data-theme` attribute.
- Documentation: `ARCHITECTURE.md`, `GETTING-STARTED.md`, `CONTRIBUTING.md`, `THEMING-RULES.md`, mixin README, token guide.
