# SYX Architecture

> Technical deep-dive into the SYX design system architecture.

---

## Layer Diagram

```
┌─────────────────────────────────────────────────────────────┐
│  THEMES                                                     │
│  themes/example-01/  themes/example-02/  …                 │
│  _setup.scss + bundle-app/docs/marketing/blog.scss          │
├─────────────────────────────────────────────────────────────┤
│  SITE           site/ — SYX's own pages only (home-*,       │
│                 evidence, score, ranking, compare-card,     │
│                 theme-swatch-card). Removable wholesale.    │
├─────────────────────────────────────────────────────────────┤
│  PAGES          pages/_theme-builder.scss                   │
├─────────────────────────────────────────────────────────────┤
│  ORGANISMS      site-header                                 │
├─────────────────────────────────────────────────────────────┤
│  MOLECULES      form-field, btn-group, label-group, …       │
├─────────────────────────────────────────────────────────────┤
│  ATOMS          btn, form, check, radio, switch, link, …    │
├─────────────────────────────────────────────────────────────┤
│  UTILITIES      display, spacing, text, media, a11y        │
│                 └─ all public utility classes (.syx-*)      │
│                 └─ @layer syx.utilities (always wins)       │
├─────────────────────────────────────────────────────────────┤
│  BASE           reset, elements, theme-helpers              │
│                 └─ helper-* mixins: theme-aware, generate   │
│                    .syx-* classes in @layer syx.utilities   │
├─────────────────────────────────────────────────────────────┤
│  ABSTRACTS      tokens · mixins · maps · paths              │
│  (never compiled directly — always @used by other layers)   │
└─────────────────────────────────────────────────────────────┘
```

---

## CSS @layer Stack

SYX uses native CSS `@layer` to manage specificity without `!important`.

```css
@layer syx.reset, syx.base, syx.tokens, syx.atoms, syx.molecules, syx.organisms, syx.utilities;
```

| Layer           | Content                               | Wins over  |
| --------------- | ------------------------------------- | ---------- |
| `syx.reset`     | Browser reset                         | —          |
| `syx.base`      | Element defaults, theme-aware helpers | reset      |
| `syx.tokens`    | **Reserved — empty on purpose**       | base       |
| `syx.atoms`     | Atomic components                     | tokens     |
| `syx.molecules` | Composite components                  | atoms      |
| `syx.organisms` | Complex UI sections (+ site layer)    | molecules  |
| `syx.utilities` | All public utility classes (`.syx-*`) | everything |

**Result:** Utility classes always override component styles. No `!important` needed anywhere.

> **Why `syx.tokens` is empty:** the `:root` blocks that declare tokens are
> deliberately emitted **outside** any `@layer` — unlayered styles beat every
> layer, so token values can never be accidentally overridden by a layered
> rule. The layer name stays in the declaration to keep the slot reserved.

### What is emitted, and in what order

Every `styles-theme-*.css` deliverable is produced by the same sequence
(driven by `themes/{name}/_setup.scss` plus the entry point):

1. **Default tokens** — `abstracts/` token partials, unlayered `:root`.
2. **`@layer` order declaration** — emitted once by `universal-values()`
   (never write it by hand; see `themes/_template/README.md`).
3. **Theme `:root`** — `theme-{name}()` primitive/semantic overrides.
4. **`@font-face`** — `theme-{name}-fonts()`, declared once per theme in
   `_theme.scss` and reused by the setup and every bundle.
5. **Reset + base elements + helpers + grid** — `syx-core({name})`.
6. **All system components** — `syx-bundle-full({name})`.
7. **Site layer** — `syx-bundle-site({name})`, only in the SYX site builds.
8. **Utilities** — `@use 'utilities/index'` from the **root entry point
   only**, never from a bundle. That is why `.syx-*` utilities exist in the
   eight root deliverables but not inside `css/themes/*/bundle-*.css`.

> **Note on `helpers/`:** The `base/helpers/` folder contains _theme-aware mixins_ (`helper-fonts`, `helper-icons`, `helper-backgrounds`, etc.) that receive a `$theme` parameter and are called once from `themes/_shared/_core.scss` (`syx-core($theme)`), which every `_setup.scss` and `bundle-*.scss` includes. They **do** generate public `.syx-*` classes (e.g. `.syx-font-color-primary`, `.syx-bg-color-primary`, `.syx-icon--facebook-primary`) wrapped in `@layer syx.utilities` — so they win over all component layers without `!important`. Public utilities that are **not** theme-dependent (display, spacing, text, media, a11y) live exclusively in `utilities/`.

---

## Token Architecture (4 Layers)

```
Primitives             Theme / Architecture     Semantic Tones           Component Aliases
──────────             ────────────────────    ──────────────           ─────────────────
Raw values.            Structural config.       Contextual feedback.     Strict Overrides.
No meaning.            General UI feel.         Meaningful state.        Component-specific.

--primitive-color-     --theme-focus-ring-      --semantic-tone-         --component-btn-
  blue-500: …            width: 0.2rem            info-bg: var(            primary-bg:
                                                    --primitive-color-       var(--semantic-
                                                    blue-500)                tone-info-bg)
```

### Naming Convention

```
--primitive-{category}-{variant}-{modifier}
--semantic-{purpose}-{variant}-{state}
--component-{name}-{property}-{variant}-{state}
```

### Rule: Never skip layers

```scss
// ✅ Correct — component uses semantic token
.atom-btn--primary {
  background: var(--component-btn-primary-bg);
}

// ❌ Wrong — component skips to primitive
.atom-btn--primary {
  background: var(--primitive-color-blue-500);
}
```

---

## Mixin Library

15 files in `abstracts/mixins/`. All mixins are **null-safe** — passing `null` skips that property. The library exposes **44 mixins** across those files.

```
mixins/
├── _directional.scss    # Shared DRY functions for margin/padding
├── _margin.scss         # @include margin(1rem null)
├── _padding.scss        # @include padding(null 2rem)
├── _positioning.scss    # @include absolute($top: 0, $right: 0)
├── _size.scss           # @include size(100%, 48px)
├── _border.scss         # @include border(all, 1px, solid, …)
├── _background.scss     # @include background-setup(…)
├── _font.scss           # @include font-family(…)
├── _media-queries.scss  # @include breakpoint(tablet)
├── _helpers.scss        # @include transition(), sr-only(), flex-center()…
├── _hide.scss           # @include hide-visually()
├── _triangle.scss       # @include triangle(…)
├── _behavior.scss       # @include behavior-in-ancestor(…)
└── _generate-utilities.scss # @include generate-utility(…)
```

→ Full reference: [abstracts/mixins/README.md](abstracts/mixins/README.md)

---

## Theme System

Each theme lives in `themes/{name}/` and contains:

```
themes/example-01/
├── _theme.scss          # Primitive overrides + theme-x-fonts() (single font list)
├── _setup.scss          # ~15 lines: tokens, fonts, syx-core, syx-bundle-full, site layer
├── bundle-app.scss      # App context bundle
├── bundle-docs.scss     # Documentation context bundle
├── bundle-marketing.scss# Marketing/landing context bundle
└── bundle-blog.scss     # Blog/editorial context bundle
```

The component list lives **once** in `themes/_shared/_bundle-full.scss` and
the font list **once** in each theme's `_theme.scss` — neither is repeated
per theme file. Adding a component to the system touches `_bundle-full.scss`
only; adding a font touches one `_theme.scss` only.

### Bundle System

Each bundle includes only what that context needs:

```scss
// bundle-app.scss — the real pattern
@use '../_base/universal' as *;
@use '../_shared/core' as *;
@use '../_shared/bundle-app' as *;
@use 'theme' as *;

@include universal-values();
@include theme-example-01();
@include theme-example-01-fonts();  // font list lives in _theme.scss
@include syx-core(example-01);
@include syx-bundle-app(example-01);
```

Which components each context includes is defined once in
`themes/_shared/_bundle-{app,blog,core,full,marketing}.scss`.
Bundles never include `.syx-*` utilities — those enter only from the root
entry points (see *What is emitted, and in what order*).

### Creating a New Theme

See [themes/\_template/README.md](themes/_template/README.md) for step-by-step instructions.

---

## Single-Partial Multi-Theme Pattern

Every component lives in **one single partial** that handles all themes internally.
There are no per-theme copies of SCSS files.

```
organisms/
  _site-header.scss   # one file, handles all seven themes internally
```

### The 2 Methods

Inside each mixin, theme variation is handled by two mechanisms depending on the type of difference:

#### Method 1 — CSS Custom Property (`var()`)

For values that **all themes have** but differently (colors, spacing, icons).
The token is used generically in the partial; each `_theme.scss` overrides it.

```scss
// _header.scss
background-color: var(--component-header-bg); // generic
background-image: var(--component-header-logo-icon); // generic

// themes/example-02/_theme.scss
--component-header-logo-icon: var(--icon-logo-example-02); // theme override

// themes/example-03/_theme.scss
--component-header-logo-icon: var(--icon-logo-coral); // theme override
```

> **Retired mechanism (2026-09-12):** there used to be a Method 2 — a Sass
> map in `abstracts/_theme-config.scss` read with `theme-cfg()`. No component
> ever called it and its keys had drifted out of sync with the real theme
> names, so a structural difference would have fallen back silently. It was
> removed; a structural difference is either a token (Method 1) or an
> `@if $theme` block (Method 2 below).

#### Method 2 — `@if $theme`

For **one-off rules** that only 1–2 themes need. No token or map entry required.
Direct override inline in the partial.

```scss
// _header.scss
@if $theme == "example-02" {
  border-bottom: 1px
    solid
    var(--semantic-color-border-subtle); // example-02 only
}
@if $theme == "midnight" {
  backdrop-filter: blur(8px); // midnight glass effect only
}
```

### Decision Rule

| Question                                                            | Method                      |
| ------------------------------------------------------------------- | --------------------------- |
| Do all themes need this, but with different values?                 | **Method 1** — CSS token    |
| Is it specific to only 1–2 themes and not worth tokenizing?         | **Method 2** — `@if $theme` |

### Adding a New Theme Variant

1. Define component token overrides in `themes/{name}/_theme.scss`
2. Pass the theme name to existing mixins: `@include org-site-header('mytheme')`
3. No new SCSS partials needed.

---

## Atomic Design Hierarchy

```
Atoms          — Single-purpose, no dependencies on other components
Molecules      — Compose 2+ atoms
Organisms      — Compose molecules + atoms, represent UI sections
Pages          — Page-specific overrides and layouts
```

### Current Inventory

| Layer       | Count | Contents                                                                                                                                                 |
| ----------- | ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Atoms       | 19    | breadcrumb, btn, check, code, feature-icon, form, icon, icon-lucide, label, link, list, pagination, pill, radio, stat-counter, switch, table, title, txt |
| Molecules   | 6     | btn-group, code-snippet, feature-card, form-field, form-field-set, label-group                                                                           |
| Organisms   | 1     | site-header                                                                                                                                              |
| Site layer  | 12    | `scss/site/` — SYX's own pages only, outside the registry: home-cta, home-features, home-footer, home-hero, home-layers, home-themes, home-tokens, evidence, score, ranking, compare-card, theme-swatch-card |
| Pages       | 1     | theme-builder                                                                                                                                            |

---

## Naming Conventions

### BEM

```scss
.syx-block {
}
.syx-block__element {
}
.syx-block--modifier {
}
.syx-block__element--modifier {
}
```

### Prefixes

| Prefix | Meaning                     | Example                    |
| ------ | --------------------------- | -------------------------- |
| `syx-` | SYX utility or component    | `.atom-btn`, `.syx-d-flex` |
| `is-`  | State                       | `.is-open`, `.is-active`   |
| `js-`  | JavaScript hook (no styles) | `.js-toggle`               |

> **Removed:** The `u-` prefix (`.u-p-sm`, `.u-text-primary`, etc.) has been deprecated and unified under `syx-`. All public utility classes use `.syx-{property}-{value}` exclusively.

### File Naming

| Pattern         | Example                                    |
| --------------- | ------------------------------------------ |
| Atom            | `atoms/_btn.scss`                          |
| Molecule        | `molecules/_form-field.scss`               |
| Organism        | `organisms/_site-header.scss`              |
| Token primitive | `abstracts/tokens/primitives/_colors.scss` |
| Token semantic  | `abstracts/tokens/semantic/_colors.scss`   |
| Token component | `abstracts/tokens/components/_btn.scss`    |

---

## Compilation Entry Points

```
scss/styles-theme-{name}.scss  →  css/styles-theme-{name}.css   (×7 themes)
                                  (imports themes/{name}/_setup.scss
                                   + utilities/index — utilities enter HERE)
scss/setup-builder.scss        →  css/setup-builder.css          (theme-builder.html)

themes/{name}/bundle-*.scss    →  css/themes/{name}/bundle-*.css (byproducts)
```

**Only the eight root files of `css/` are deliverables** (the seven
`styles-theme-*.css` plus `setup-builder.css`); `package.json` publishes
`css/*.css` and nothing deeper. Everything else under `css/` (per-folder
`index.css`, `css/themes/**`, `css/site/**`) is a compilation byproduct —
`.gitignore` documents this and keeps it out of version control.

---

## Key Design Decisions

| Decision                             | Rationale                                        |
| ------------------------------------ | ------------------------------------------------ |
| Dart Sass `@use` / `@forward`        | Explicit imports, no global namespace pollution  |
| CSS Custom Properties for tokens     | Runtime theming, DevTools visibility             |
| CSS `@layer` instead of `!important` | Predictable cascade, no specificity wars         |
| Null-safe mixins                     | Shorthand without emitting empty properties      |
| Bundle-per-context                   | Smaller CSS per page type, no unused styles      |
| PurgeCSS on production builds        | Removes unused selectors, ~20–30% size reduction |
| Bourbon philosophy for mixins        | Concise, well-documented, DRY                    |
| Single-Partial Multi-Theme           | One file per component, 2-method pattern inside  |
