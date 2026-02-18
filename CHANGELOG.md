# Changelog

All notable changes to SYX Design System will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [2.0.0-beta] — 2026-02-18

### Added

- **`@layer` granular stack** — `syx.reset → syx.base → syx.tokens → syx.atoms → syx.molecules → syx.organisms → syx.utilities`. Utilities always win without `!important`.
- **Dark mode** — Dual activation: `@media (prefers-color-scheme: dark)` + `[data-theme="dark"]`. Persists in `localStorage`. Syncs with OS changes.
- **Accessibility utilities** — `.syx-sr-only`, `.syx-sr-only-focusable`, `.syx-skip-link`, `.syx-motion-safe` added to `_a11y.scss`.
- **`color-mix()` hover tints** — Button hover states now use `color-mix(in srgb, ...)` for dynamic tints without hardcoded values.
- **Card molecule** — `.mol-card` migrated from atoms to molecules layer with full dark-mode support.
- **Fluid display token** — `--primitive-fluid-font-display` and `--primitive-letter-spacing-display` added.
- **Container Queries** — Cards and column layouts use `@container` for truly responsive components.
- **`package.json`** — Build scripts for all 5 themes with Dart Sass.
- **`CHANGELOG.md`** — This file.
- **`LICENSE`** — MIT license.

### Changed

- **`_btn.scss`** — All `[class*="--variant"]` attribute selectors replaced with explicit BEM class selectors (`.syx-btn--primary`, `.syx-btn--filled`, etc.) for predictable specificity.
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
