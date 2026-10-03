# SYX: The AI Field Guide (Strict Mode)

> **System Context for AI Agents & Developers**
>
> You are an expert developer working with **SYX**, a token-driven, native SCSS design system. Your goal is to generate code that is consistently structured, maintainable, and strictly adheres to the Atomic Design methodology.

---

## 🚫 The "Thou Shalt Not" Rules (Strict Mode)

1.  **NEVER use raw values.**
    - ❌ `padding: 1rem;`
    - ✅ `@include padding(var(--semantic-space-component-md));`
2.  **NEVER use raw CSS properties where a mixin exists.**
    - ❌ `position: absolute;` → ✅ `@include absolute();`
    - ❌ `display: flex; align-items: center;` → ✅ `@include flex-center();`
3.  **NEVER use `!important`.**
    - SYX uses CSS `@layer` to manage specificity. Utilities always win.
4.  **NEVER skip the token layer.**
    - Do not use Primitives (`--primitive-*`) in components.
    - **Always** map: Primitive → Semantic → Component. That is the colour path; the
      fourth kind of token, `--theme-*` (radius, focus ring), is structural and components
      may read it directly. Four kinds, three steps — see `scss/ARCHITECTURE.md`.
5.  **NEVER mix naming prefixes.**
    - Atoms MUST start with `.atom-`
    - Molecules MUST start with `.mol-`
    - Organisms MUST start with `.org-`
    - `.syx-` is for utilities only. A component is never `syx-atom-*`, `syx-mol-*`, `syx-org-*`,
      and a token is never `--syx-*`.
6.  **NEVER declare `transition` (or any `transition-*`) or `position: absolute|fixed|sticky` directly.**
    - ❌ `transition: opacity 0.2s ease;` → ✅ `@include transition(opacity 0.2s ease);`
    - ❌ `transition-property: opacity;` is the same violation, longhand.
    - ❌ `position: sticky; top: 0;` → ✅ `@include sticky($top: 0);`
    - Formatting does not change the verdict: the rules run on the parsed SCSS, so one-liners, missing spaces and `! important` are caught; comments and strings are ignored.
    - Every `@include` must name a mixin that exists (R09). Ask `list_mixins` / `get_mixin`; do not guess.
7.  **NEVER hand-convert a value for Figma.**
    - ❌ working out that `oklch(0.498 0.282 266.24)` is roughly `#1e3aff`
    - ✅ `get_figma_spec` / `scripts/lib/figma.js` — one conversion, or the library drifts from its own system.
    - `contracts/figma/` is generated. A wrong value there is a wrong token upstream: fix the token, regenerate.

---

## 🤖 AI First — Contracts Layer

SYX ships a machine-readable contracts layer. Before writing or editing code, an agent MUST understand these files:

| File                             | Purpose                                                          |
| -------------------------------- | ---------------------------------------------------------------- |
| `tokens.json`                    | Token registry (type, rawValue, status) — generated from the SCSS by `npm run build`, never edited by hand |
| `component-registry.json`        | All components: atoms, molecules, organisms                      |
| `contracts/rules.json`           | The contract rules, R01–R11: severities, allowed paths, matchers and exceptions. `scripts/lib/rules.js` runs it for `syx-validate.js` and `validate_snippet` |
| `contracts/lint-contract.json`   | Last validation output (violations, phantom tokens, legacy vars) |
| `contracts/validation-report.md` | Human-readable audit report                                      |
| `contracts/dtcg/`                | W3C DTCG export — Style Dictionary, Tokens Studio             |
| `contracts/figma/`               | Figma export — variable collections + components, per theme     |

### Running validation

```bash
node scripts/syx-validate.js           # Quick check (console only)
node scripts/syx-validate.js --report  # Full audit + write contracts/
```

### Exporting outward

```bash
npm run export:tokens   # → contracts/dtcg/    W3C DTCG, one file per theme + mode
npm run export:figma    # → contracts/figma/   variables + components, one file per theme
npm run check:figma     # fails if the Figma export is stale
```

Both read `contracts/resolved-tokens.json`, which is built from the **compiled** CSS —
so a change you have not compiled does not exist for either. Run `npm run build` first.

### Current contract rules

`contracts/rules.json` is the source of truth; this table is a summary. All of these are `error`.

| Rule    | Check                                                    | Allowed in (`allowedIn`)                                                                  |
| ------- | -------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| **R01** | `var(--primitive-*)` in values or `@include` parameters  | `scss/abstracts/`, `scss/themes/`, `scss/base/`, `scss/utilities/`, `scss/setup-builder.scss`, `scss/site/tokens/` (the site's own palette) — **not** `scss/pages/`, the components in `scss/site/`, `scss/layout/` or system components |
| **R02** | `!important` (any spacing or case)                       | Nowhere                                                                                   |
| **R03** | `transition` or `transition-*`, any vendor prefix        | `scss/abstracts/mixins/`                                                                  |
| **R04** | `position: absolute/fixed/sticky`                        | `scss/abstracts/mixins/`                                                                  |
| **R09** | `@include` of a mixin that no `@mixin` in `scss/` defines | Nowhere                                                                                  |
| **R10** | An exception that is malformed, unjustified or dead       | Nowhere                                                                                  |
| **R11** | A `--component-*` token that reads a `--primitive-*`, a legacy variable or a literal colour (it may read `--semantic-*`, `--component-*`, `--theme-*`, `--layout-*` and icons) | Checked only where component tokens are declared: `scss/abstracts/tokens/components/` and `scss/themes/` |

**Exceptions are per line, never per file.** Where a rule allows it (`inlineException: true`: R01, R03, R04, R11), write the reason on the line immediately above the one declaration it excuses:

```scss
// syx-allow R03: Chrome's autofill hack, not visible motion; reduced-motion would bring the flash back
transition: background-color 600000s 0s;
```

An exception that no longer excuses anything is an R10 error, and so is a single-file `allowedIn` entry that excuses nothing. `npm run validate` lists every live exception with its reason; `validate_snippet` returns them under `excepciones`.

> **Current status: ⚠️ PASSED WITH WARNINGS** — R01–R04 and R09–R11 all passing (two inline R03 exceptions). Warnings are R08 (unused registry tokens).

---

## 🧠 The SYX Philosophy & Naming Convention

### 1. Atomic Hierarchy

| Level               | Prefix    | Path              | Example                        |
| :------------------ | :-------- | :---------------- | :----------------------------- |
| **Atoms**           | `.atom-`  | `scss/atoms/`     | `.atom-btn`, `.atom-icon`      |
| **Molecules**       | `.mol-`   | `scss/molecules/` | `.mol-feature-card`, `.mol-form-field` |
| **Organisms**       | `.org-`   | `scss/organisms/` | `.org-site-header`             |
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
| `--semantic-focus-ring-color`    | focus ring color       |
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

<!-- syx: ejemplo-nuevo -->
```scss
:root {
  --component-x-bg: var(--semantic-color-bg-primary);
  --component-x-padding: var(--semantic-space-component-md);
}
```

**Step 2: Create Mixin** (`scss/atoms/_x.scss` OR `molecules/_x.scss`)

<!-- syx: ejemplo-nuevo -->
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
- Add `@include mol-x($theme);` **once** to `scss/themes/_shared/_bundle-full.scss`
  (and to the context bundles that need it) — never to per-theme `_setup.scss`
  files, which are generated boilerplate. Without this line the component
  compiles in no theme.
- Add entry to `component-registry.json`.

**Step 4: Validate**

```bash
node scripts/syx-validate.js
```

---

## 🎛️ The Mode System

Before a workflow, pick a lens. A **mode** tunes the whole response to one discipline and declares
what it may write. Activate one with a `[SYX: MODE]:` prefix — or `/syx MODE …` in Claude Code — and
**read `_agents/modes/{mode}.md` before answering**:

| Tier | Mode | Does | Writes |
| :--- | :--- | :--- | :--- |
| 1 | `[SYX: SKETCH]:` | Throwaway visual prototype | nothing |
| 2 | `[SYX: UX]:` | Structure, flow, accessibility | nothing |
| 3 | `[SYX: CREATIVE]:` | Experimental build, exempt from contracts | nothing |
| 4 | `[SYX: TOKEN]:` | Token architecture | `pr` / recommends |
| 5 | `[SYX: THEME]:` | OKLCH scales, `_theme.scss` | recommends |
| 6 | `[SYX: UI]:` | Component SCSS | `pr` |
| 7 | `[SYX: AUDIT]:` | R01–R11 conformance | nothing |
| 8 | `[SYX: MIGRATE]:` | Legacy variable resolution | `pr` / recommends |
| 9 | `[SYX: BRAND]:` | A complete visual identity — asks you axis by axis, or decides them all | recommends |

Use the **lowest tier that does the job**. Compose them with `→` (pipeline) and `+` (evaluative),
where **`+` groups before `→`** — so `[SYX: UX → UI + AUDIT]:` is `UX → (UI + AUDIT)`.

The tier is the cost of the turn, not the order of the work. BRAND sits last because it is the most
expensive response in the system — seven identity axes that have to come out consistent with each
other — but it runs **first** in the chain it belongs to: `BRAND → THEME → TOKEN → UI`. Running
THEME before BRAND inverts the dependency and yields a palette with no identity to answer to.

Every mode file opens with two blocks. **`Trust`** is its permission ceiling, graded by
`contracts/trust.json` and verified by `npm run check:modos` — a mode never grants a permission, it
inherits one. **`Knowledge`** is its reading list from `mind-system/knowledges/`, the cortex that
carries the reasoning (colour theory, UX laws, WCAG, scale models, motion). Knowledge informs; it
never executes. **If a module recommends what a rule above forbids, the rule wins.**

Full detail: `_agents/modes/README.md`, and `mind-system/README.md` for the precedence ladder.

---

## 🤖 Agent Workflows

SYX ships pre-built agent workflows in `_agents/workflows/`:

| Workflow            | Command           | What it does                                  |
| ------------------- | ----------------- | --------------------------------------------- |
| `/create-component` | See workflow file | Create atom, molecule or organism             |
| `/create-theme`     | See workflow file | Clone template and configure new theme        |
| `/audit-tokens`     | See workflow file | Run full token health check                   |
| `/update-changelog` | See workflow file | Maintain CHANGELOG using Conventional Commits |
| `/export-to-figma`  | See workflow file | Stand up the SYX library in Figma, in the right order |

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
5.  Does the token I need exist? Ask `get_token` (or grep `tokens.json` — generated, never edited by hand). If not: a component token goes through `node scripts/propose.js token`; a semantic one is recommended to a person (`contracts/trust.json`: that layer is human-only).
6.  Are my changes validated? Run `node scripts/syx-validate.js`.

---

