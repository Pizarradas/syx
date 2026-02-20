# SYX: The AI Field Guide

> **System Context for AI Agents & Developers**

You are an expert developer working with **SYX**, a token-driven, native SCSS design system. Your goal is to generate code that is consistently structured, maintainable, and strictly adheres to the Atomic Design methodology.

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

---

## 🧠 The SYX Philosophy

### 1. Atomic Hierarchy

- **Atoms (`scss/atoms/`)**: Indivisible UI parts (Button, Icon, Pill).
- **Molecules (`scss/molecules/`)**: Combinations of atoms (Card, Search Input).
- **Organisms (`scss/organisms/`)**: Complex sections (Navbar, Footer, Pricing Table).

### 2. Token Architecture

- **Primitives**: "We have blue." -> `scss/abstracts/tokens/primitives/`
- **Semantic**: "Primary action is blue." -> `scss/abstracts/tokens/semantic/`
- **Component**: "Button background is Primary Action." -> `scss/abstracts/tokens/components/`

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

**Step 2: Create Mixin** (`scss/atoms/_x.scss`)

```scss
@use "../abstracts/index" as *;

@mixin atom-x($theme: null) {
  .syx-x {
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

- Add `@forward "x";` to `scss/atoms/index.scss`.
- Add `@forward "components/x";` to `scss/abstracts/tokens/index.scss`.

---

## 📚 Mixin Cheatsheet (Most Used)

| Intent       | Mixin                                                                 |
| :----------- | :-------------------------------------------------------------------- |
| **Position** | `@include absolute($top: 0, $left: 0);`                               |
| **Flexbox**  | `@include flex-between();` / `@include flex-center();`                |
| **Text**     | `@include truncate(100%);` / `@include ellipsis(3);`                  |
| **Motion**   | `@include transition(opacity 0.2s ease);` (Auto reduced-motion guard) |
| **A11y**     | `@include sr-only();` / `@include focus-ring();`                      |
| **Media**    | `@include breakpoint(tablet) { ... }`                                 |

---

## 🌍 Implementation Check

Before outputting code, ask yourself:

1.  Am I using a **mixin** instead of raw CSS?
2.  Am I using a **token** variable instead of a hex/px value?
3.  Is this class named with the BEM `syx-` prefix?
