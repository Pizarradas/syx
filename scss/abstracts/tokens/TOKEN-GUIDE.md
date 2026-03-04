# Token System Guide — SYX

## Introduction

The SYX token system is organized into **4 layers** that provide scalability, maintainability, and consistency.

## Token Layer Architecture

```
─── Application Layers ──────────────────────────────────────────────────────

  Layer 1 — Primitives   (--primitive-*)   Raw values: colors, sizes, font scales,
             [prefix]                       icon data-URIs, CSS filter values

  Layer 2 — Semantic     (--semantic-*)    Contextual aliases: what a value MEANS,
             [prefix]                       not what it IS

  Layer 3 — Component    (--component-*)   Component-specific overrides, scoped
             [prefix]                       to a single component

─── System Layers (cross-cutting) ───────────────────────────────────────────

  Layout    (--layout-*)  Structural tokens: max-width, gaps, paddings.
                          Override per theme/breakpoint.

  Reset     (--reset-*)   Base element defaults (html, body, h1–h6, selection),
                          wired to semantic tokens.

  Icon      (--icon-*)    Semantic icon aliases that point to --primitive-icon-*.
                          Note: raw SVG data-URIs live in --primitive-icon-*;
                          --icon-* are convenient semantic names for them.

  Theme     (--theme-*)   Architectural config tokens: focus shadow, global
                          border radius, thin border width. Override per theme.
```

> **Rule of thumb**: Always consume the highest layer available for your context.
> Components use `--component-*` → `--semantic-*`. Never reach directly into `--primitive-*`
> from a component (R01 rule enforced by the SYX validator).

---

### Layer 1: Primitive Tokens

**Location**: `scss/abstracts/tokens/primitives/`

Raw base values with no semantic context. These are the "atoms" of the system.
Also includes raw icon SVG data-URIs (`--primitive-icon-*`) and CSS filter
values for colorizing icons (`--primitive-filter-*`).

**Naming**: `--primitive-{category}-{variant}-{modifier}`

**Examples**:

```scss
--primitive-color-purple-500
--primitive-space-4
--primitive-font-size-2
--primitive-icon-arrow-default   // SVG data-URI
--primitive-filter-error         // CSS filter value
```

### Layer 2: Semantic Tokens

**Location**: `scss/abstracts/tokens/semantic/`

Contextual tokens that reference primitive tokens and carry meaning.

**Naming**: `--semantic-{purpose}-{variant}-{state}`

**Examples**:

```scss
--semantic-color-primary
--semantic-space-layout-md
--semantic-font-size-body
```

### Layer 3: Component Tokens

**Location**: `scss/abstracts/tokens/components/`

Component-specific tokens that reference semantic tokens.

**Naming**: `--component-{name}-{property}-{variant}-{state}`

**Examples**:

```scss
--component-button-primary-color
--component-form-field-padding-x
--component-table-border-width
```

---

## How to Use Tokens

### In SCSS Components

```scss
.my-button {
  // ✅ Correct: use component tokens
  color: var(--component-button-primary-color);
  padding: var(--component-button-padding-y) var(--component-button-padding-x);
  border-radius: var(--component-button-border-radius);

  &:hover {
    color: var(--component-button-primary-color-hover);
  }
}
```

### In Themes

Themes should only override **primitive tokens**. Semantic and component tokens will cascade automatically.

```scss
@mixin theme-example-02 {
  // ✅ Correct: override primitives only
  --primitive-space-base: 0.5rem;
  --primitive-color-purple-500: hsl(248, 62%, 22%);

  // ❌ Wrong: do not override semantic or component tokens
  // --semantic-color-primary: ...
  // --component-button-primary-color: ...
}
```

---

## Usage Rules

### ✅ Do

1. **Use component tokens** in your component styles
2. **Reference tokens from lower layers** (component → semantic → primitive)
3. **Override primitives only** in themes
4. **Create new tokens** following the established naming convention

### ❌ Don't

1. **Never hardcode values** (e.g., `color: #ff0000`)
2. **Never skip layers** (e.g., using primitives directly in components)
3. **Never override semantic or component tokens** in themes
4. **Never create inconsistent naming**

---

## Practical Examples

### Example 1: Create a New Button Variant

```scss
// 1. Define component tokens (if they don't exist)
:root {
  --component-button-danger-text: var(--semantic-tone-error-text);
  --component-button-danger-bg: transparent;
  --component-button-danger-border: var(--semantic-tone-error-bg);
}

// 2. Use in the component
.button--danger {
  color: var(--component-button-danger-color);
  background: var(--component-button-danger-bg);
  border: var(--component-button-border-width) solid
    var(--component-button-danger-border);
}
```

### Example 2: Create a New Theme

```scss
// themes/_my-theme.scss
@mixin theme-my-theme {
  // Change base measure
  --primitive-space-base: 0.25rem;

  // Change brand colors
  --primitive-color-purple-500: hsl(280, 60%, 30%);
  --primitive-color-pink-500: hsl(350, 100%, 65%);

  // Change typography
  --primitive-font-family-space-grotesk-regular: "Helvetica", Arial, sans-serif;
}
```

### Example 3: Add a New State Color

```scss
// 1. Add primitive
// primitives/_colors.scss
--primitive-color-info-500: hsl(200, 100%, 50%);

// 2. Add semantic alias
// semantic/_colors.scss
--semantic-tone-info-bg: var(--primitive-color-info-500);

// 3. Use in component
// components/_alerts.scss
--component-alert-info-bg: var(--semantic-tone-info-bg);
```

---

## Available Token Categories

### Colors

- **Primitives**: `--primitive-color-{name}-{shade}`
- **Semantic**: `--semantic-color-{purpose}`
- **Component**: `--component-{name}-{property}-color`

### Spacing

- **Primitives**: `--primitive-space-{number}`
- **Semantic**: `--semantic-space-{context}-{size}`
- **Component**: `--component-{name}-{property}`

### Typography

- **Primitives**: `--primitive-font-{property}-{value}`
- **Semantic**: `--semantic-font-{purpose}`
- **Component**: `--component-{name}-font-{property}`

### Borders

- **Primitives**: `--primitive-border-{property}-{value}`
- **Semantic**: `--semantic-border-{property}-{size}`
- **Component**: `--component-{name}-border-{property}`

### Shadows

- **Primitives**: `--primitive-shadow-{size}`
- **Semantic**: `--semantic-shadow-{purpose}`
- **Component**: `--component-{name}-shadow-{state}`

---

## Benefits

✅ **Scalability**: Add new themes with minimal effort
✅ **Maintainability**: Global changes via primitive tokens only
✅ **Consistency**: Predictable naming across the system
✅ **Self-documenting**: Naming conveys purpose and context
✅ **Collaboration**: Designers and developers share the same vocabulary

---

## Helpers vs Utilities — Which to Use?

SYX has two utility class systems with distinct purposes:

### `base/helpers/` — Theme-Aware Helpers

**Location**: `scss/base/helpers/`
**Generated by**: mixins with a `$theme` parameter (e.g., `@include helper-backgrounds(example-01)`)
**Class prefix**: `.syx-*` — inside `@layer syx.utilities`

Classes generated **per-theme compilation** that use the active theme's custom property tokens.
Includes: spacers, font-sizes, dimensions, fonts, backgrounds, icons.

```html
<!-- Class generated by helper-spacer(example-01) -->
<div class="syx-spacer-gap-t-1 syx-font-color-primary">...</div>
```

**When to use**: when you need classes that are bound to the active theme's tokens (colors, icon sets, dimensions).

---

### `utilities/` — Global Utilities

**Location**: `scss/utilities/`
**Generated by**: plain CSS classes with no theme parameter
**Class prefix**: `.syx-*` — inside `@layer syx.utilities`

**Theme-agnostic** classes. Both systems share the `.syx-*` prefix and the `@layer syx.utilities` layer.
Includes: display, flexbox, spacing, text alignment, media, accessibility.

```html
<!-- Class from utilities/display -->
<div class="syx-d-flex syx-justify-between">...</div>
```

**When to use**: for layout and composition utilities independent of any theme configuration.

---

### Decision Rule

| You need...                          | Use                               |
| ------------------------------------ | --------------------------------- |
| Theme colors, icons, dimensions      | `base/helpers/`                   |
| Flexbox, display, spacing, alignment | `utilities/`                      |
| Both                                 | Both — they complement each other |

---

## Roadmap

### ✅ Done (Feb 2026)

1. ✅ Components migrated to semantic tokens (card, btn, utilities)
2. ✅ Granular `@layer` implemented: `syx.atoms`, `syx.molecules`, `syx.organisms`, `syx.utilities`
3. ✅ Accessibility: `.syx-sr-only`, `.syx-skip-link`, `.syx-motion-safe` added to `_a11y.scss`
4. ✅ `color-mix()` for button hover tints
5. ✅ Dark mode: card, borders and utilities respect the theme
6. ✅ **Core bundle** (`styles-core.scss`): production-ready, no documentation overhead. **138 KB** without PurgeCSS, **~110 KB** with PurgeCSS.
7. ✅ **`_template` neutral theme (Section 3)**: buttons and forms have minimal visual identity with no SYX branding. Ideal base for new projects.
8. ✅ **Sass deprecation warnings** fixed in `_directional.scss`, `_font.scss`, `_triangle.scss`, `_theme-config.scss`.

### ✅ Done (v4.0+)

1. ✅ Remove deprecated helper stub files — done. Only 6 active theme-aware helpers remain in `base/helpers/`.
2. ✅ **All 6 theme helpers modernized**: `.helper-*` class names renamed to `.syx-*`; all wrapped in `@layer syx.utilities`.
3. ✅ **`layout/_index.scss` renamed to `layout/index.scss`** — consistent with the rest of the index files across the project.
4. ✅ **v4.0.0 QA pass (Feb/Mar 2026)**:
   - `line-height` bug fixed in 10 utility classes (`_font-sizes.scss`, `_fonts.scss`)
   - Universal `* { color }` selectors removed from `_backgrounds.scss`
   - Breakpoints standardised to `em` across 5 files (21 occurrences)
   - `index.html` audited to WCAG AA
5. ✅ Organisms expansion (v4.0.1)
6. ✅ Public documentation site (`home.html`, `docs.html`, `why-syx.html`)

---

## CSS @layer — Specificity Management

SYX uses native CSS `@layer` to manage specificity without `!important`.

### Layer Stack

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

### Golden Rule

Utility classes **always** win over components. This is by design.

```html
<!-- .syx-d-none always hides the button, no !important needed -->
<button class="atom-btn atom-btn--primary syx-d-none">Hidden</button>
```

### Why You Don't Need !important

```scss
// ❌ Before (without @layer)
.syx-d-none {
  display: none !important;
}

// ✅ Now (with @layer)
@layer syx.utilities {
  .syx-d-none {
    display: none; // Wins by position in the stack, not by !important
  }
}
```

> **Note**: `!important` is avoided throughout SYX by relying on `@layer`. The only accepted use is:
>
> - `animation: none !important` inside `@media (prefers-reduced-motion)` — required by the spec
>
> If you find any other use of `!important`, it's likely a bug. Report it.
