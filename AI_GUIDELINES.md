# SYX: The AI Field Guide (Strict Mode)

> **System Context for AI Agents & Developers**
>
> You are an expert developer working with **SYX**, a token-driven, native SCSS design system. Your goal is to generate code that is consistently structured, maintainable, and strictly adheres to the Atomic Design methodology.

---

## 🛑 The "Thou Shalt Not" Rules (Strict Mode)

1.  **NEVER use raw values.**
    - ❌ `padding: 1rem;`
    - ✅ `@include padding(var(--semantic-space-inset-md));`
2.  **NEVER use raw CSS properties where a mixin exists.**
    - ❌ `position: absolute;` -> ✅ `@include absolute();`
    - ❌ `display: flex; align-items: center;` -> ✅ `@include flex-center();`
3.  **NEVER use `!important`.**
    - SYX uses CSS `@layer` to manage specificity. Utilities always win.
4.  **NEVER skip the token layer.**
    - Do not use Primitives (`--primitive-*`) in components.
    - **Always** map: Primitive → Semantic → Component.
5.  **NEVER mix naming prefixes.**
    - Atoms MUST start with `.syx-`
    - Molecules MUST start with `.mol-`
    - Organisms MUST start with `.org-`

---

## 🧠 The SYX Philosophy & Naming Convention

### 1. Atomic Hierarchy

| Level               | Prefix    | Path              | Example                        |
| :------------------ | :-------- | :---------------- | :----------------------------- |
| **Atoms**           | `.syx-`   | `scss/atoms/`     | `.syx-btn`, `.syx-icon`        |
| **Molecules**       | `.mol-`   | `scss/molecules/` | `.mol-card`, `.mol-search`     |
| **Organisms**       | `.org-`   | `scss/organisms/` | `.org-navbar`, `.org-footer`   |
| **Templates/Pages** | (Context) | `scss/pages/`     | `.page-home`, `.tpl-dashboard` |

### 2. Token Architecture

- **Primitives**: "We have blue." -> `scss/abstracts/tokens/primitives/`
- **Semantic**: "Primary action is blue." -> `scss/abstracts/tokens/semantic/`
- **Component**: "Button background is Primary Action." -> `scss/abstracts/tokens/components/`

---

## 📐 The Grid System (Strict Usage)

SYX uses a 12-column CSS Grid system. **Do not create custom flex grids for main layouts.**

### Wrapper

Use `.layout-grid` to define the main container. It handles max-width and responsive padding automatically.

```html
<div class="layout-grid">
  <!-- Content goes here -->
</div>
```

### Columns

Use `.layout-grid__col-{breakpoint}-{span}` to place items.

- **Breakpoints**: `xs` (mobile), `sm` (tablet), `md` (desktop), `lg` (wide).
- **Span**: 1 to 12.

```html
<!-- Example: Full width on mobile, half width on desktop -->
<div class="layout-grid__col-xs-12 layout-grid__col-md-6">...</div>
```

### Nested Grids

Reference `.layout-grid__nested` if you need a grid inside a column.

---

## ⚡ The Quick-Recipe for Components

When asked to "create a new component X":

**Step 1: Define Tokens** (`scss/abstracts/tokens/components/_x.scss`)

```scss
:root {
  --component-x-bg: var(--semantic-color-surface-primary);
  --component-x-padding: var(--semantic-space-inset-md);
}
```

**Step 2: Create Mixin** (`scss/atoms/_x.scss` OR `molecules/_x.scss`)

```scss
@use "../abstracts/index" as *;

// Ensure correct prefix based on Atomic type!
@mixin mol-x($theme: null) {
  .mol-x {
    // 1. Positioning
    @include relative();

    // 2. Box Model
    @include flex-center();
    @include padding(var(--component-x-padding));

    // 3. Visuals
    background: var(--component-x-bg);

    // 4. Transitions
    @include transition(all 0.2s ease);
  }
}
```

**Step 3: Register**

- Add `@forward "x";` to the corresponding index file (`scss/molecules/index.scss`).
- Add `@forward "components/x";` to `scss/abstracts/tokens/index.scss`.

---

## 📚 Mixin Cheatsheet (Most Used)

| Intent       | Mixin                                                  |
| :----------- | :----------------------------------------------------- |
| **Position** | `@include absolute($top: 0, $left: 0);`                |
| **Flexbox**  | `@include flex-between();` / `@include flex-center();` |
| **Text**     | `@include truncate(100%);` / `@include ellipsis(3);`   |
| **Motion**   | `@include transition(opacity 0.2s ease);`              |
| **A11y**     | `@include sr-only();` / `@include focus-ring();`       |
| **Media**    | `@include breakpoint(tablet) { ... }`                  |
| **Size**     | `@include size(100%, 10rem);`                          |

---

## 🌍 Implementation Check

Before outputting code, ask yourself:

1.  Am I using a **mixin** instead of raw CSS?
2.  Am I using a **token** variable instead of a hex/px value?
3.  Is this class named with the correct **BEM prefix** (`syx-`, `mol-`, `org-`)?
4.  Am I using the **Grid System** correctly?
