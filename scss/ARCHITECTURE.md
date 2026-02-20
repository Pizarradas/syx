# SYX Architecture

> Technical deep-dive into the SYX design system architecture.

---

## Layer Diagram

```
âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
â  THEMES                                                     â
â  themes/example-01/  themes/example-02/  â¦                 â
â  setup.scss + bundle-app/docs/marketing/blog.scss           â
âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ¤
â  PAGES          pages/_landing.scss  pages/_docs.scss       â
âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ¤
â  ORGANISMS      header, documentation-layout, â¦             â
âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ¤
â  MOLECULES      form-field, btn-group, label-group, â¦       â
âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ¤
â  ATOMS          btn, form, check, radio, switch, link, â¦    â
âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ¤
â  UTILITIES      display, spacing, text  (@layer syx.utilities)â
âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ¤
â  BASE           reset, elements, helpers  (@layer syx.reset) â
âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ¤
â  ABSTRACTS      tokens Â· mixins Â· functions Â· maps          â
â  (never compiled directly â always @used by other layers)   â
âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
```

---

## CSS @layer Stack

SYX uses native CSS `@layer` to manage specificity without `!important`.

```css
@layer syx.reset, syx.base, syx.tokens, syx.atoms, syx.molecules, syx.organisms, syx.utilities;
```

| Layer           | Content                    | Wins over  |
| --------------- | -------------------------- | ---------- |
| `syx.reset`     | Browser reset              | â          |
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
âââââââââââââââââ         ââââââââââââââââ          ââââââââââââââââ
Raw values.               Contextual aliases.       Component-specific.
No meaning.               Reference primitives.     Reference semantics.

--primitive-color-        --semantic-color-         --component-btn-
  blue-500: â¦               primary: var(            primary-bg:
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
// â Correct â component uses semantic token
.atom-btn--primary {
  background: var(--component-btn-primary-bg);
}

// â Wrong â component skips to primitive
.atom-btn--primary {
  background: var(--primitive-color-blue-500);
}
```

---

## Mixin Library

15 files in `abstracts/mixins/`. All mixins are **null-safe** â passing `null` skips that property. The library exposes **27 mixins** across those 15 files.

```
mixins/
âââ _directional.scss    â Shared DRY functions for margin/padding
âââ _margin.scss         â @include margin(1rem null)
âââ _padding.scss        â @include padding(null 2rem)
âââ _positioning.scss    â @include absolute($top: 0, $right: 0)
âââ _size.scss           â @include size(100%, 48px)
âââ _border.scss         â @include border(all, 1px, solid, â¦)
âââ _background.scss     â @include background-setup(â¦)
âââ _font.scss           â @include font-family(â¦)
âââ _media-queries.scss  â @include breakpoint(tablet)
âââ _helpers.scss        â @include transition(), sr-only(), flex-center()â¦
âââ _hide.scss           â @include hide-visually()
âââ _triangle.scss       â @include triangle(â¦)
âââ _behavior.scss       â @include behavior-in-ancestor(â¦)
âââ _generate-utilities.scss â @include generate-utility(â¦)
```

â Full reference: [abstracts/mixins/README.md](abstracts/mixins/README.md)

---

## Theme System

Each theme lives in `themes/{name}/` and contains:

```
themes/example-01/
âââ _theme.scss          â Primitive overrides (colors, spacing, fonts)
âââ setup.scss           â Assembles the full theme
âââ bundle-app.scss      â App context bundle
âââ bundle-docs.scss     â Documentation context bundle
âââ bundle-marketing.scssâ Marketing/landing context bundle
âââ bundle-blog.scss     â Blog/editorial context bundle
```

### Bundle System

Each bundle includes only what that context needs:

```scss
// bundle-app.scss â includes everything
@use "setup";
@use "../../atoms/index";
@use "../../molecules/index";
@use "../../organisms/index";
@use "../../utilities/index";

// bundle-marketing.scss â lighter, no complex forms
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
  _header.scss        â one file, handles syx + codymer + coral + forest + midnight
  _navbar.scss
  â¦
```

### The 3 Methods

Inside each mixin, theme variation is handled by three distinct mechanisms depending on the type of difference:

#### Method 1 â CSS Custom Property (`var()`)

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

#### Method 2 â Sass Map (`theme-cfg()`)

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

// _header.scss â reads the map
@if theme-cfg($theme, "header-sidenav-side", left) == right {
  right: 0;
  transform: translateX(100%); // slides in from right
} @else {
  left: 0;
  transform: translateX(-100%); // slides in from left
}
```

#### Method 3 â `@if $theme`

For **one-off rules** that only 1â2 themes need. No token or map entry required.
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
| Do all themes need this, but with different values?                 | **Method 1** â CSS token    |
| Is it layout/structural and reused in multiple places in the mixin? | **Method 2** â Sass Map     |
| Is it specific to only 1â2 themes and not worth tokenizing?         | **Method 3** â `@if $theme` |

### Adding a New Theme Variant

1. Add an entry to `$theme-config` in `abstracts/_theme-config.scss`
2. Define component token overrides in `themes/{name}/_theme.scss`
3. Pass the theme name to existing mixins: `@include org-header('mytheme')`
4. No new SCSS partials needed.

---

## Atomic Design Hierarchy

```
Atoms          â Single-purpose, no dependencies on other components
Molecules      â Compose 2+ atoms
Organisms      â Compose molecules + atoms, represent UI sections
Pages          â Page-specific overrides and layouts
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
| `syx-` | SYX component or utility    | `.atom-btn`, `.syx-d-flex`    |
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
styles-theme-example-01.scss  â  css/styles-theme-example-01.css
                                  (imports themes/example-01/setup.scss)

styles-core.scss               â  css/styles-core.css
                                  (neutral template theme, no docs components)
                                  css/prod/styles-core.css (+ PurgeCSS)

themes/example-01/bundle-app.scss      â  css/theme-01-bundle-app.css
themes/example-01/bundle-docs.scss     â  css/theme-01-bundle-docs.css
themes/example-01/bundle-marketing.scssâ  css/theme-01-bundle-marketing.css
themes/example-01/bundle-blog.scss     â  css/theme-01-bundle-blog.css
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
| PurgeCSS on production builds        | Removes unused selectors, ~20â30% size reduction |
| Bourbon philosophy for mixins        | Concise, well-documented, DRY                    |
| Single-Partial Multi-Theme           | One file per component, 3-method pattern inside  |
