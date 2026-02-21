# Contributing to SYX

> Guidelines for maintaining code quality and architectural consistency.

---

## Core Principles

1. **Token-first** — Never hardcode values. Always use tokens.
2. **Mixin-first** — Always use SYX mixins instead of raw CSS properties.
3. **Null-safe** — Mixins skip null values. Use this to write concise shorthand.
4. **No `!important`** — CSS `@layer` manages specificity. Never use `!important`.
5. **BEM naming** — All component classes follow BEM with the `syx-` prefix.
6. **Atomic Design** — Know where your component lives in the hierarchy.

---

## Code Style Rules

### SCSS Authoring

```scss
// ✅ Correct
.atom-btn--primary {
  color: var(--component-btn-primary-color);
  @include padding(
    var(--component-btn-padding-y) var(--component-btn-padding-x)
  );
  @include transition(color 0.2s ease, background-color 0.2s ease);
  @include border-radius(var(--component-btn-border-radius));
}

// ❌ Wrong — raw CSS instead of mixins
.atom-btn--primary {
  color: #3b82f6; // hardcoded value
  padding: 0.5rem 1rem; // not using token
  transition: color 0.2s ease; // not using @include transition()
  border-radius: 6px; // not using token
}
```

### Property Order (within a rule)

Follow this order for consistency:

```scss
.syx-component {
  // 1. Positioning (use mixin)
  @include absolute($top: 0);

  // 2. Display / Box model
  display: flex;
  @include flex-center();

  // 3. Dimensions
  @include size(100%, 48px);

  // 4. Spacing (use mixin)
  @include margin(null auto);
  @include padding(var(--component-x-padding-y) var(--component-x-padding-x));

  // 5. Typography
  font-size: var(--component-x-font-size);
  font-weight: var(--primitive-font-weight-medium);
  line-height: var(--component-x-line-height);
  color: var(--component-x-color);

  // 6. Visual
  background-color: var(--component-x-bg);
  @include border(all, var(--component-x-border-width), solid, var(--component-x-border));
  @include border-radius(var(--component-x-border-radius));
  box-shadow: var(--component-x-shadow);

  // 7. Transitions (always last before states)
  @include transition(color 0.2s ease);

  // 8. States (&:hover, &:focus, &:disabled, &--modifier)
  &:hover { … }
  &:focus-visible { … }
  &:disabled { … }
  &--modifier { … }
}
```

---

## Adding a New Component

### Checklist

- [ ] File created in the correct layer (`atoms/`, `molecules/`, `organisms/`)
- [ ] Wrapped in `@mixin {layer}-{name}($theme: null)`
- [ ] `@use "../abstracts/index" as *;` at the top
- [ ] All values use component tokens (no hardcoded values)
- [ ] All transitions use `@include transition()`
- [ ] All positions use `@include absolute/relative/fixed/sticky()`
- [ ] All spacing uses `@include margin()` / `@include padding()`
- [ ] Component tokens defined in `abstracts/tokens/components/_{name}.scss`
- [ ] Token file registered in `abstracts/tokens/index.scss`
- [ ] Component mixin registered in `{layer}/index.scss`
- [ ] Compiles without errors in both themes (velox and terra)

### File Template

```scss
// CORE
// ===============================================
@use "../abstracts/index" as *;
// ===============================================

// atom: {name}
// ===============================================
@mixin atom-{name}($theme: null) {
  .syx-{name} {
    // base styles

    // &__element
    &__element {
      // element styles
    }

    // &--modifier
    &--modifier {
      // modifier styles
    }

    // States
    &:hover { … }
    &:focus-visible { … }
    &:disabled { … }
  }
}
```

---

## Token Naming Rules

### Primitives

```
--primitive-{category}-{variant}-{modifier}

Examples:
--primitive-color-blue-500
--primitive-space-4
--primitive-font-size-2
--primitive-font-weight-bold
--primitive-border-radius-md
--primitive-shadow-lg
```

### Semantic

```
--semantic-{purpose}-{variant}-{state}

Examples:
--semantic-color-primary
--semantic-color-text-primary
--semantic-color-state-error
--semantic-space-inset-md
--semantic-font-size-body
--semantic-border-radius-sm
```

### Component

```
--component-{name}-{property}-{variant}-{state}

Examples:
--component-btn-primary-bg
--component-btn-primary-bg-hover
--component-form-field-border-focus
--component-header-height
```

---

## Mixin Rules

| Rule                                                            | Reason                                   |
| --------------------------------------------------------------- | ---------------------------------------- |
| Always use `@include transition()`                              | Automatic `prefers-reduced-motion` guard |
| Always use `@include absolute/relative/fixed/sticky()`          | Null-safe, concise                       |
| Always use `@include margin()` / `@include padding()`           | Null-skipping shorthand                  |
| Always use `@include flex-center()` / `@include flex-between()` | Consistency                              |
| Never use `@include hide-visually()` in new code                | Use `@include sr-only()` instead         |

---

## Selector Rules

### No attribute selectors for BEM variants

Always use explicit class selectors for BEM modifiers. Never use `[class*=]` to detect variants:

```scss
// ✅ Correct
&.atom-btn--primary { ... }
&.atom-btn--filled { ... }
&:not(.atom-btn--circle) { ... }

// ❌ Wrong — fragile, unpredictable specificity
&[class*="--primary"] { ... }
&:is([class*="--filled"]) { ... }
```

---

## Breakpoints

Always use named breakpoints from `$syx-breakpoints`:

```scss
// ✅ Correct
@include breakpoint(tablet) { … }
@include breakpoint(desktop) { … }

// ✅ Also OK for one-off values
@include min-screen(768px) { … }

// ❌ Wrong — raw @media
@media (min-width: 768px) { … }
```

---

## CSS @layer Rules

- **Never** add `!important` to override specificity
- **Utilities** always win over components — that's by design
- If a utility isn't overriding a component, check that both are in the correct layer

---

## PR Checklist

Before submitting any change:

- [ ] `sass scss/styles-theme-velox.scss /dev/null` compiles without errors
- [ ] Both themes (velox, terra) compile without errors
- [ ] No hardcoded values (colors, spacing, font sizes)
- [ ] No `!important`
- [ ] No raw `transition:` (use `@include transition()`)
- [ ] No raw `position: absolute/fixed/sticky` (use mixins)
- [ ] No `[class*=]` attribute selectors for BEM variants (use explicit classes)
- [ ] Token naming follows the convention
- [ ] BEM naming follows the `syx-` prefix convention
- [ ] New tokens are documented in `TOKEN-GUIDE.md` if significant

---

## File Locations Quick Reference

| What                 | Where                                               |
| -------------------- | --------------------------------------------------- |
| New atom             | `scss/atoms/_{name}.scss`                           |
| New molecule         | `scss/molecules/_{name}.scss`                       |
| New organism         | `scss/organisms/_{name}.scss`                       |
| New component tokens | `scss/abstracts/tokens/components/_{name}.scss`     |
| New primitive token  | `scss/abstracts/tokens/primitives/_{category}.scss` |
| New semantic token   | `scss/abstracts/tokens/semantic/_{category}.scss`   |
| New mixin            | `scss/abstracts/mixins/_{name}.scss`                |
| New theme            | `scss/themes/{name}/` (copy from `_template/`)      |
| New utility          | `scss/utilities/_{name}.scss`                       |
