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
─────────────────         ────────────────          ────────────────
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
.syx-btn--primary {
  background: var(--component-btn-primary-bg);
}

// ❌ Wrong — component skips to primitive
.syx-btn--primary {
  background: var(--primitive-color-blue-500);
}
```

---

## Mixin Library

15 files in `abstracts/mixins/`. All mixins are **null-safe** — passing `null` skips that property.

```
mixins/
├── _directional.scss    ← Shared DRY functions for margin/padding
├── _margin.scss         ← @include margin(1rem null)
├── _padding.scss        ← @include padding(null 2rem)
├── _positioning.scss    ← @include absolute($top: 0, $right: 0)
├── _size.scss           ← @include size(100%, 48px)
├── _border.scss         ← @include border(all, 1px, solid, …)
├── _background.scss     ← @include background-setup(…)
├── _font.scss           ← @include font-family(…)
├── _media-queries.scss  ← @include breakpoint(tablet)
├── _helpers.scss        ← @include transition(), sr-only(), flex-center()…
├── _hide.scss           ← @include hide-visually()
├── _triangle.scss       ← @include triangle(…)
├── _behavior.scss       ← @include behavior-in-ancestor(…)
└── _generate-utilities.scss ← @include generate-utility(…)
```

→ Full reference: [abstracts/mixins/README.md](abstracts/mixins/README.md)

---

## Theme System

Each theme lives in `themes/{name}/` and contains:

```
themes/example-01/
├── _theme.scss          ← Primitive overrides (colors, spacing, fonts)
├── setup.scss           ← Assembles the full theme
├── bundle-app.scss      ← App context bundle
├── bundle-docs.scss     ← Documentation context bundle
├── bundle-marketing.scss← Marketing/landing context bundle
└── bundle-blog.scss     ← Blog/editorial context bundle
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

## Atomic Design Hierarchy

```
Atoms          → Single-purpose, no dependencies on other components
Molecules      → Compose 2+ atoms
Organisms      → Compose molecules + atoms, represent UI sections
Pages          → Page-specific overrides and layouts
```

### Current Inventory

| Layer     | Count | Examples                                                                                                                                   |
| --------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Atoms     | 19    | btn, form, check, radio, switch, link, breadcrumb, pagination, icon, label, pill, list, table, title, txt, code, specimen, swatch, tooltip |
| Molecules | 5     | card, form-field, btn-group, label-group, form-field-set                                                                                   |
| Organisms | 6     | header-example-02…05, content-columns, documentation-layout                                                                                |
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
| `syx-` | SYX component or utility    | `.syx-btn`, `.syx-d-flex`    |
| `u-`   | Utility (generated)         | `.u-p-sm`, `.u-text-primary` |
| `is-`  | State                       | `.is-open`, `.is-active`     |
| `js-`  | JavaScript hook (no styles) | `.js-toggle`                 |

### File Naming

| Pattern         | Example                                    |
| --------------- | ------------------------------------------ |
| Atom            | `atoms/_btn.scss`                          |
| Molecule        | `molecules/_form-field.scss`               |
| Organism        | `organisms/_header-example-01.scss`        |
| Token primitive | `abstracts/tokens/primitives/_colors.scss` |
| Token semantic  | `abstracts/tokens/semantic/_colors.scss`   |
| Token component | `abstracts/tokens/components/_btn.scss`    |

---

## Compilation Entry Points

```
styles-theme-example-01.scss  →  css/styles-theme-example-01.css
                                  (imports themes/example-01/setup.scss)

themes/example-01/bundle-app.scss      →  css/theme-01-bundle-app.css
themes/example-01/bundle-docs.scss     →  css/theme-01-bundle-docs.css
themes/example-01/bundle-marketing.scss→  css/theme-01-bundle-marketing.css
themes/example-01/bundle-blog.scss     →  css/theme-01-bundle-blog.css
```

---

## Key Design Decisions

| Decision                             | Rationale                                       |
| ------------------------------------ | ----------------------------------------------- |
| Dart Sass `@use` / `@forward`        | Explicit imports, no global namespace pollution |
| CSS Custom Properties for tokens     | Runtime theming, DevTools visibility            |
| CSS `@layer` instead of `!important` | Predictable cascade, no specificity wars        |
| Null-safe mixins                     | Shorthand without emitting empty properties     |
| Bundle-per-context                   | Smaller CSS per page type, no unused styles     |
| Bourbon philosophy for mixins        | Concise, well-documented, DRY                   |
