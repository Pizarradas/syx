# SYX: The AI Field Guide (Strict Mode)

> **System Context for AI Agents & Developers**
>
> You are an expert developer working with **SYX**, a token-driven, native SCSS design system. Your goal is to generate code that is consistently structured, maintainable, and strictly adheres to the Atomic Design methodology.

---

## 🚫 The "Thou Shalt Not" Rules (Strict Mode)

1.  **NEVER use raw values.**
    - ❌ `padding: 1rem;`
    - ✅ `@include padding(var(--semantic-space-inset-md));`
2.  **NEVER use raw CSS properties where a mixin exists.**
    - ❌ `position: absolute;` → ✅ `@include absolute();`
    - ❌ `display: flex; align-items: center;` → ✅ `@include flex-center();`
3.  **NEVER use `!important`.**
    - SYX uses CSS `@layer` to manage specificity. Utilities always win.
4.  **NEVER skip the token layer.**
    - Do not use Primitives (`--primitive-*`) in components.
    - **Always** map: Primitive → Semantic → Component.
5.  **NEVER mix naming prefixes.**
    - Atoms MUST start with `.atom-`
    - Molecules MUST start with `.mol-`
    - Organisms MUST start with `.org-`
6.  **NEVER declare `transition:` or `position:` directly.**
    - ❌ `transition: opacity 0.2s ease;` → ✅ `@include transition(opacity 0.2s ease);`
    - ❌ `position: sticky; top: 0;` → ✅ `@include sticky($top: 0);`

---

## 🤖 AI First — Contracts Layer

SYX ships a machine-readable contracts layer. Before writing or editing code, an agent MUST understand these files:

| File                             | Purpose                                                          |
| -------------------------------- | ---------------------------------------------------------------- |
| `tokens.json`                    | Full token registry with type, rawValue, status                  |
| `component-registry.json`        | All components: atoms, molecules, organisms                      |
| `contracts/rules.json`           | The four enforceable rules (R01–R04)                             |
| `contracts/lint-contract.json`   | Last validation output (violations, phantom tokens, legacy vars) |
| `contracts/validation-report.md` | Human-readable audit report                                      |

### Running validation

```bash
node scripts/syx-validate.js           # Quick check (console only)
node scripts/syx-validate.js --report  # Full audit + write contracts/
```

### Current contract rules

| Rule    | Check                                 | Allowed exceptions                                                                            |
| ------- | ------------------------------------- | --------------------------------------------------------------------------------------------- |
| **R01** | `--primitive-*` in component files    | `scss/abstracts/`, `scss/themes/`, `scss/base/`, `scss/utilities/`, `scss/pages/`             |
| **R02** | `!important` anywhere                 | None                                                                                          |
| **R03** | raw `transition:` in non-mixin files  | `scss/utilities/_accessibility.scss`, `scss/base/_reset.scss`                                 |
| **R04** | raw `position: absolute/fixed/sticky` | `scss/utilities/_accessibility.scss`, `scss/utilities/_display.scss`, `scss/base/_reset.scss` |

> **Current status: ⚠️ PASSED WITH WARNINGS** — R01/R02/R03/R04 all passing. 1 phantom token pending `npm run build`.

---

## 🧠 The SYX Philosophy & Naming Convention

### 1. Atomic Hierarchy

| Level               | Prefix    | Path              | Example                        |
| :------------------ | :-------- | :---------------- | :----------------------------- |
| **Atoms**           | `.atom-`  | `scss/atoms/`     | `.atom-btn`, `.atom-icon`      |
| **Molecules**       | `.mol-`   | `scss/molecules/` | `.mol-card`, `.mol-search`     |
| **Organisms**       | `.org-`   | `scss/organisms/` | `.org-navbar`, `.org-footer`   |
| **Templates/Pages** | (Context) | `scss/pages/`     | `.page-home`, `.tpl-dashboard` |

### 2. Token Architecture

- **Primitives**: "We have blue." → `scss/abstracts/tokens/primitives/`
- **Semantic**: "Primary action is blue." → `scss/abstracts/tokens/semantic/`
- **Component**: "Button background is Primary Action." → `scss/abstracts/tokens/components/`

### 3. Semantic Token Reference (key tokens)

#### Typography

| Token                             | Value         | Use               |
| --------------------------------- | ------------- | ----------------- |
| `--semantic-font-weight-regular`  | regular (400) | body text         |
| `--semantic-font-weight-medium`   | medium (500)  | labels, secondary |
| `--semantic-font-weight-bold`     | bold (700)    | emphasis          |
| `--semantic-font-weight-black`    | black (900)   | hero/display text |
| `--semantic-font-size-overline`   | ~11px         | tags, pills       |
| `--semantic-font-size-body-small` | ~14px         | secondary text    |
| `--semantic-font-size-body`       | ~16px         | default body      |
| `--semantic-font-size-body-large` | ~20px         | lead text         |
| `--semantic-font-family-mono`     | monospace     | code blocks       |

#### Color — State feedback

| Token                            | Purpose                |
| -------------------------------- | ---------------------- |
| `--semantic-color-state-focus`   | focus ring color       |
| `--semantic-color-state-success` | success state          |
| `--semantic-color-state-error`   | error state            |
| `--semantic-color-state-warning` | warning state          |
| `--semantic-color-state-info`    | info state             |
| `--semantic-color-border-focus`  | focus border on inputs |

#### Legacy variable classification

Legacy variables (no official `--semantic/primitive/component` prefix) are classified in `lint-contract.json` as:

- `keep` — external dep or intentional local contract (e.g. `--form-*`, `--lc-*`)
- `migrate` — replace with corresponding `--semantic-*` token (migration target in `replacedBy`)
- `kill` — remove, no SYX equivalent

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

---

## ⚡ The Quick-Recipe for Components

When asked to "create a new component X":

**Step 1: Define Tokens** (`scss/abstracts/tokens/components/_x.scss`)

```scss
:root {
  --component-x-bg: var(--semantic-color-bg-primary);
  --component-x-padding: var(--semantic-space-inset-md);
}
```

**Step 2: Create Mixin** (`scss/atoms/_x.scss` OR `molecules/_x.scss`)

```scss
@use "../abstracts/index" as *;

@mixin mol-x($theme: null) {
  @layer syx.molecules {
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
}
```

**Step 3: Register**

- Add `@forward "x";` to the corresponding index file (`scss/molecules/index.scss`).
- Add `@forward "components/x";` to `scss/abstracts/tokens/index.scss`.
- Add entry to `component-registry.json`.

**Step 4: Validate**

```bash
node scripts/syx-validate.js
```

---

## 🤖 Agent Workflows

SYX ships pre-built agent workflows in `_agents/workflows/`:

| Workflow            | Command           | What it does                                  |
| ------------------- | ----------------- | --------------------------------------------- |
| `/create-component` | See workflow file | Create atom, molecule or organism             |
| `/create-theme`     | See workflow file | Clone template and configure new theme        |
| `/audit-tokens`     | See workflow file | Run full token health check                   |
| `/update-changelog` | See workflow file | Maintain CHANGELOG using Conventional Commits |

---

## 📋 Mixin Cheatsheet (Most Used)

| Intent       | Mixin                                                  |
| :----------- | :----------------------------------------------------- |
| **Position** | `@include absolute($top: 0, $left: 0);`                |
| **Position** | `@include sticky($top: 0);`                            |
| **Position** | `@include fixed($top: 0, $left: 0, $right: 0);`        |
| **Flexbox**  | `@include flex-between();` / `@include flex-center();` |
| **Text**     | `@include truncate(100%);` / `@include ellipsis(3);`   |
| **Motion**   | `@include transition(opacity 0.2s ease);`              |
| **A11y**     | `@include sr-only();` / `@include focus-ring();`       |
| **Media**    | `@include breakpoint(tablet) { ... }`                  |
| **Size**     | `@include size(100%, 10rem);`                          |

---

## ✅ Implementation Check

Before outputting code, ask yourself:

1.  Am I using a **mixin** instead of raw CSS (`position:`, `transition:`)?
2.  Am I using a **token** variable instead of a raw value?
3.  Is this class named with the correct **BEM prefix** (`atom-`, `mol-`, `org-`)?
4.  Am I using the **Grid System** correctly?
5.  Does the token I need exist? Check `tokens.json` — if not, add it before using it.
6.  Are my changes validated? Run `node scripts/syx-validate.js`.

---

