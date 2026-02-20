# Token System Guide — SYX

## Introduction

The SYX token system is organized into **3 layers** that provide scalability, maintainability, and consistency.

## 3-Layer Architecture

```
Primitives → Semantic → Component
(Foundation)  (Context)  (Specific)
```

### Layer 1: Primitive Tokens

**Location**: `scss/abstracts/tokens/primitives/`

Raw base values with no semantic context. These are the "atoms" of the system.

**Naming**: `--primitive-{category}-{variant}-{modifier}`

**Examples**:

```scss
--primitive-color-purple-500
--primitive-space-4
--primitive-font-size-2
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
@mixin theme-codymer {
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
  --component-button-danger-color: var(--semantic-color-state-error);
  --component-button-danger-bg: transparent;
  --component-button-danger-border: var(--semantic-color-state-error);
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
--semantic-color-state-info: var(--primitive-color-info-500);

// 3. Use in component
// components/_alerts.scss
--component-alert-info-bg: var(--semantic-color-state-info);
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

### `base/helpers/` — Theme Helpers

**Location**: `scss/base/helpers/`
**Generated by**: mixins with a `$theme` parameter (e.g., `@include helper-spacer(example-01)`)
**Class prefix**: `syx-*` namespaced to the active theme

Classes generated **per-theme** that use the active theme's semantic tokens.
Includes: spacing, typography, colors, icons, gaps, dimensions, backgrounds.

```html
<!-- Class generated by helper-spacer(example-01) -->
<div class="syx-mt-4 syx-px-2">...</div>
```

**When to use**: when you need classes that respect the token system of the active theme.

---

### `utilities/` — Global Utilities

**Location**: `scss/utilities/`
**Generated by**: plain CSS classes with no theme parameter
**Class prefix**: generic `syx-*`

**Theme-agnostic** classes based on fixed values or native CSS variables.
Includes: display, text-align, basic spacing.

```html
<!-- Class from utilities/display -->
<div class="syx-d-flex syx-justify-between">...</div>
```

**When to use**: for quick layout and composition utilities that don't depend on the theme.

---

### Decision Rule

| You need...                       | Use                           |
| --------------------------------- | ----------------------------- |
| Theme colors, typography, spacing | `base/helpers/`               |
| Flexbox, display, alignment       | `utilities/`                  |
| Both                              | Both — they are complementary |

> **Note**: `base/helpers/helpers.scss` internally `@forward`s some utilities within the helpers namespace.
> This is legacy behavior and will be removed in v2.1.

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

### 🔵 Pending (v2.1+)

1. Remove `_token-aliases.scss` when no active references remain (milestone v2.1)
2. Add missing switch tokens (`--component-switch-slider-*`, `--component-switch-status-*`)
3. Consolidate legacy helpers with utilities
4. Organisms expansion
5. Public documentation site

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

> **Note**: If you see `!important` anywhere in the codebase, it's a bug. Report it.
