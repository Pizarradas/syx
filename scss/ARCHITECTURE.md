# SYX Architecture

> Technical deep-dive into the SYX design system architecture.

---

## Layer Diagram

```
┌─────────────────────────────────────────────────────────────┐
│  THEMES                                                     │
│  themes/example-01/  themes/example-02/  …                 │
│  setup.scss + bundle-app/docs/marketing/blog.scss           │
├─────────────────────────────────────────────────────────────┤
│  PAGES          pages/_landing.scss  pages/_docs.scss       │
├─────────────────────────────────────────────────────────────┤
│  ORGANISMS      header, documentation-layout, …             │
├─────────────────────────────────────────────────────────────┤
│  MOLECULES      form-field, btn-group, label-group, …       │
├─────────────────────────────────────────────────────────────┤
│  ATOMS          btn, form, check, radio, switch, link, …    │
├─────────────────────────────────────────────────────────────┤
│  UTILITIES      display, spacing, text  (@layer syx.utilities)│
├─────────────────────────────────────────────────────────────┤
│  BASE           reset, elements, helpers  (@layer syx.reset) │
├─────────────────────────────────────────────────────────────┤
│  ABSTRACTS      tokens · mixins · functions · maps          │
│  (never compiled directly — always @used by other layers)   │
└─────────────────────────────────────────────────────────────┘
```

---

## CSS @layer Stack

SYX uses native CSS `@layer` to manage specificity without `!important`.

```css
@layer syx.reset, syx.base, syx.tokens, syx.atoms, syx.molecules, syx.organisms, syx.utilities;
```

| Layer           | Content                    | Wins over  |
| --------------- | -------------------------- | ---------- |
| `syx.reset`     | Browser reset              | —          |
| `syx.base`      | Element defaults, helpers  | reset      |
| `syx.tokens`    | CSS custom property tokens | base       |
| `syx.atoms`     | Atomic components          | tokens     |
| `syx.molecules` | Composite components       | atoms      |
| `syx.organisms` | Complex UI sections        | molecules  |
| `syx.utilities` | Utility classes            | everything |

**Result:** Utility classes always override component styles. No `!important` needed anywhere.

---

## Token Architecture (3 Layers)

```
Primitive Tokens          Semantic Tokens           Component Tokens
───────────────          ──────────────            ──────────────
Raw values.               Contextual aliases.       Component-specific.
No meaning.               Reference primitives.     Reference semantics.

--primitive-color-        --semantic-color-         --component-btn-
  blue-500: …               primary: var(            primary-bg:
                               --primitive-color-       var(--semantic-
                               blue-500)                color-primary)
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

15 files in `abstracts/mixins/`. All mixins are **null-safe** — passing `null` skips that property. The library exposes **27 mixins** across those 15 files.

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
├── _theme.scss          # Primitive overrides (colors, spacing, fonts)
├── setup.scss           # Assembles the full theme
├── bundle-app.scss      # App context bundle
├── bundle-docs.scss     # Documentation context bundle
├── bundle-marketing.scss# Marketing/landing context bundle
└── bundle-blog.scss     # Blog/editorial context bundle
```

### Bundle System

Each bundle includes only what that context needs:

```scss
// bundle-app.scss — includes everything
@use "setup";
@use "../../atoms/index";
@use "../../molecules/index";
@use "../../organisms/index";
@use "../../utilities/index";

// bundle-marketing.scss — lighter, no complex forms
@use "setup";
@use "../../atoms/index";
@use "../../pages/landing";
```

### Creating a New Theme

See [themes/\_template/README.md](themes/_template/README.md) for step-by-step instructions.

---

## Single-Partial Multi-Theme Pattern

Every component lives in **one single partial** that handles all themes internally.
There are no per-theme copies of SCSS files.

```
organisms/
  _header.scss        # one file, handles syx + codymer + coral + forest + midnight
  _navbar.scss
  …
```

### The 3 Methods

Inside each mixin, theme variation is handled by three distinct mechanisms depending on the type of difference:

#### Method 1 — CSS Custom Property (`var()`)

For values that **all themes have** but differently (colors, spacing, icons).
The token is used generically in the partial; each `_theme.scss` overrides it.

```scss
// _header.scss
background-color: var(--component-header-bg); // generic
background-image: var(--component-header-logo-icon); // generic

// themes/example-02/_theme.scss
--component-header-logo-icon: var(--icon-logo-codymer); // theme override

// themes/example-03/_theme.scss
--component-header-logo-icon: var(--icon-logo-coral); // theme override
```

#### Method 2 — Sass Map (`theme-cfg()`)

For **structural/layout differences** that need to be resolved at compile time.
Values are stored in `abstracts/_theme-config.scss` and read with `theme-cfg($theme, 'key', $fallback)`.

```scss
// abstracts/_theme-config.scss
$theme-config: (
  "codymer": (
    header-sidenav-side: right,
    header-logo-size: 2.4rem,
  ),
  "coral": (
    header-sidenav-side: left,
    header-logo-size: 2rem,
  ),
);

// _header.scss — reads the map
@if theme-cfg($theme, "header-sidenav-side", left) == right {
  right: 0;
  transform: translateX(100%); // slides in from right
} @else {
  left: 0;
  transform: translateX(-100%); // slides in from left
}
```

#### Method 3 — `@if $theme`

For **one-off rules** that only 1–2 themes need. No token or map entry required.
Direct override inline in the partial.

```scss
// _header.scss
@if $theme == "codymer" {
  border-bottom: 1px solid var(--semantic-color-border-subtle); // codymer only
}
@if $theme == "midnight" {
  backdrop-filter: blur(8px); // midnight glass effect only
}
```

### Decision Rule

| Question                                                            | Method                      |
| ------------------------------------------------------------------- | --------------------------- |
| Do all themes need this, but with different values?                 | **Method 1** — CSS token    |
| Is it layout/structural and reused in multiple places in the mixin? | **Method 2** — Sass Map     |
| Is it specific to only 1–2 themes and not worth tokenizing?         | **Method 3** — `@if $theme` |

### Adding a New Theme Variant

1. Add an entry to `$theme-config` in `abstracts/_theme-config.scss`
2. Define component token overrides in `themes/{name}/_theme.scss`
3. Pass the theme name to existing mixins: `@include org-header('mytheme')`
4. No new SCSS partials needed.

---

## Atomic Design Hierarchy

```
Atoms          — Single-purpose, no dependencies on other components
Molecules      — Compose 2+ atoms
Organisms      — Compose molecules + atoms, represent UI sections
Pages          — Page-specific overrides and layouts
```

### Current Inventory

| Layer     | Count | Examples                                                                                                                                   |
| --------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Atoms     | 19    | btn, form, check, radio, switch, link, breadcrumb, pagination, icon, label, pill, list, table, title, txt, code, specimen, swatch, tooltip |
| Molecules | 5     | card, form-field, btn-group, label-group, form-field-set                                                                                   |
| Organisms | 4     | header (unified), navbar, content-columns, documentation-layout                                                                            |
| Pages     | 2     | landing, docs                                                                                                                              |

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

| Prefix | Meaning                     | Example                      |
| ------ | --------------------------- | ---------------------------- |
| `syx-` | SYX component or utility    | `.atom-btn`, `.syx-d-flex`   |
| `u-`   | Utility (generated)         | `.u-p-sm`, `.u-text-primary` |
| `is-`  | State                       | `.is-open`, `.is-active`     |
| `js-`  | JavaScript hook (no styles) | `.js-toggle`                 |

### File Naming

| Pattern         | Example                                    |
| --------------- | ------------------------------------------ |
| Atom            | `atoms/_btn.scss`                          |
| Molecule        | `molecules/_form-field.scss`               |
| Organism        | `organisms/_header.scss`                   |
| Token primitive | `abstracts/tokens/primitives/_colors.scss` |
| Token semantic  | `abstracts/tokens/semantic/_colors.scss`   |
| Token component | `abstracts/tokens/components/_btn.scss`    |

---

## Compilation Entry Points

```
styles-theme-example-01.scss  →  css/styles-theme-example-01.css
                                  (imports themes/example-01/setup.scss)

styles-core.scss               →  css/styles-core.css
                                  (neutral template theme, no docs components)
                                  css/prod/styles-core.css (+ PurgeCSS)

themes/example-01/bundle-app.scss      →  css/theme-01-bundle-app.css
themes/example-01/bundle-docs.scss     →  css/theme-01-bundle-docs.css
themes/example-01/bundle-marketing.scss→  css/theme-01-bundle-marketing.css
themes/example-01/bundle-blog.scss     →  css/theme-01-bundle-blog.css
```

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
| Single-Partial Multi-Theme           | One file per component, 3-method pattern inside  |
