# SYX Authoring Guide

> Practical decision rules for writing HTML and SCSS with SYX. Read this before writing your first component.

> **On example names:** every sample that *uses* a component uses a real one, with its
> real modifiers — an agent copies what it reads, and a plausible name that does not
> exist paints nothing. Samples that teach how to *write a new* component use invented
> names and are marked `<!-- syx: ejemplo-nuevo -->` in the source. The real inventory is
> the *Current Inventory* table below (23 atoms · 15 molecules · 2 organisms: `app-shell`,
> `site-header`); check `component-registry.json` (or `list_components`) before using any
> name. `npm run check:clases-docs` fails if a sample cites a class that does not exist.
> Building an app on SYX rather than changing SYX? Read `CONSUMING.md` instead.

---

## 1. Choosing the Right Layer

The most common question: **where does my code go?** Use this flowchart before creating anything.

```
Is it a raw CSS helper with no markup dependency?
  └─ YES → util (.syx-*)             (scss/utilities/)
  └─ NO  ↓

Does it render as a single HTML element or a very small, self-contained pattern
with no meaningful sub-components?
  └─ YES → atom (atom-*)             (scss/atoms/)
  └─ NO  ↓

Does it combine 2+ atoms to form one logical UI unit?
(e.g. a label + input + error message, or an icon + text button group)
  └─ YES → molecule (mol-*)          (scss/molecules/)
  └─ NO  ↓

Does it represent a full UI section that users can perceive as a distinct region?
(a header, a footer, a sidebar — today the system organisms are app-shell and site-header)
  └─ YES → organism (org-*)          (scss/organisms/)
  └─ NO  ↓

Is it furniture for SYX's own pages (home.html, docs.html, why-syx.html)?
  └─ YES → site layer                (scss/site/ — outside the registry)
  └─ NO  ↓

Is it a one-off layout or override for a specific page only?
  └─ YES → page/template             (scss/pages/ or themes/*/bundle-*.scss)
```

### Quick Reference: When to Use What

| Layer        | File prefix | When to use                                                                | Anti-pattern                                    |
| ------------ | ----------- | -------------------------------------------------------------------------- | ----------------------------------------------- |
| **Util**     | `.syx-`     | Single CSS property override; display, spacing, text alignment, visibility | Never add visual design to utils                |
| **Atom**     | `atom-`     | Smallest reusable building block: btn, icon, label, pill, switch, input    | Don't compose atoms inside atoms                |
| **Molecule** | `mol-`      | Composition of 2+ atoms that always travel together                        | If sub-parts aren't always together → use utils |
| **Organism** | `org-`      | Complete section of the UI; appears in multiple pages                      | Don't put page-unique content in organisms      |
| **Page**     | (none)      | Fine-tuning of layout for one specific page, or page-specific overrides    | Don't duplicate component logic in page styles  |

### Worked Examples

```
"I need a button"                → atom-btn ✅
"I need a button with an icon"   → atom-btn atom-btn--has-icon + atom-icon (compose in HTML) ✅
                                   NOT a new mol- with both baked in ❌
"I need a search field"          → mol-form-field + atom-btn, composed in HTML;
                                   a new mol-* only once the pair recurs ✅
"I need a navigation header"     → org-site-header (it exists) ✅
"I need to center a div on this page only" → .syx-mx-auto or .syx-text-center ✅
"I need a hero section"          → a new org-* if reusable, or pages/_landing.scss (page-only) ✅
```

> **Rule of thumb:** If you're not sure between atom and molecule, ask: _"Would these sub-parts ever make sense independently?"_ If yes → keep them separate atoms. If no → molecule.

---

## 2. HTML Authoring

### 2.1 Semantic Structure First

Always start with the semantically correct element, then apply SYX classes. Never choose an element because of its default browser style.

```html
<!-- ✅ Semantic + SYX classes -->
<nav aria-label="Main navigation" class="org-site-header__nav">
  <ul role="list">
    <li><a href="/" class="atom-link">Home</a></li>
  </ul>
</nav>

<!-- ❌ Wrong — div soup with classes doing semantic work -->
<div class="org-site-header__nav">
  <div>
    <div><span class="atom-link">Home</span></div>
  </div>
</div>
```

### 2.2 BEM in HTML

The BEM block, element, and modifier classes map 1:1 to what's in SCSS:

```html
<!-- Block: mol-card · Element: mol-card__title · Modifier: mol-card--elevated -->
<article class="mol-card mol-card--elevated">
  <div class="mol-card__body">
    <h3 class="mol-card__title">Save</h3>
  </div>
</article>
```

**Rules:**

- **Block + modifier always go together.** Never put a modifier alone without the base block class.
  ```html
  <!-- ✅ -->
  <button class="atom-btn atom-btn--primary">
    <!-- ❌ -->
    <button class="atom-btn--primary"></button>
  </button>
  ```
- **Never extend BEM depth beyond 2 levels.** If you need `__element__sub-element`, you have two separate elements.
  ```html
  <!-- ✅ -->
  <div class="mol-card__header"><h3 class="mol-card__title">…</h3></div>
  <!-- ❌ -->
  <h3 class="mol-card__header__title">…</h3>
  ```
- **State classes use `is-`**, not BEM modifiers. BEM modifiers are permanent variants; `is-` is dynamic state.
  ```html
  <!-- ✅ Permanent variant -->
  <button class="atom-btn atom-btn--tertiary">…</button>
  <!-- ✅ Dynamic state, toggled by the page's script -->
  <header class="org-site-header is-scrolled">…</header>
  <!-- ❌ Don't mix conventions -->
  <button class="atom-btn atom-btn--loading"></button>
  ```

### 2.3 Composing Components in HTML

Organisms and molecules are composed in HTML, not in SCSS. Keep SCSS partials free of cross-component nesting references.

```html
<!-- ✅ Composed in HTML — molecules live inside organisms -->
<header class="org-site-header">
  <a href="/" class="org-site-header__brand">…</a>
  <nav class="org-site-header__nav" aria-label="Main">…</nav>
  <div class="org-site-header__actions mol-btn-group">
    <button class="atom-btn atom-btn--tertiary atom-btn--size-sm" type="button">Log in</button>
    <button class="atom-btn atom-btn--primary atom-btn--filled atom-btn--size-sm" type="button">Sign up</button>
  </div>
</header>

<!-- ❌ Wrong — organism's SCSS file hard-codes inner molecule styles -->
/* organisms/_site-header.scss */ .org-site-header .mol-btn-group { margin-left: auto; } ←
coupling between layers
```

> **Exception:** An organism CAN define layout-level spacing of its children (e.g. `gap`, `grid-template-areas`) — it just cannot override or redefine a molecule's internal styles.

### 2.4 Accessibility Every Time

These are not optional:

| Element           | Required attributes                                             |
| ----------------- | --------------------------------------------------------------- |
| `<img>`           | `alt=""` (decorative) or `alt="description"` (informational)    |
| `<button>`        | Visible text OR `aria-label="…"` if icon-only                   |
| `<a>` (icon-only) | `aria-label="…"` always                                         |
| `<nav>`           | `aria-label="…"` to distinguish multiple navs                   |
| `<section>`       | `aria-labelledby="heading-id"` referencing the section's `<h*>` |
| Interactive state | `aria-expanded`, `aria-current`, `aria-selected` as needed      |
| Hidden icons      | `aria-hidden="true"` on all decorative SVG / icon spans         |

```html
<!-- ✅ Icon-only button done right -->
<button
  class="atom-btn atom-btn--tertiary atom-btn--circle"
  type="button"
  aria-label="Close menu"
>
  <span class="atom-icon atom-icon--lc-x" aria-hidden="true"></span>
</button>
```

### 2.5 Grid Layout

Use `.layout-grid` for all main content areas. Never invent ad-hoc flex containers for page structure.

```html
<!-- ✅ Standard responsive layout -->
<main class="layout-grid">
  <div class="layout-grid__col-xs-12 layout-grid__col-md-8">
    <!-- Main content -->
  </div>
  <aside class="layout-grid__col-xs-12 layout-grid__col-md-4">
    <!-- Sidebar -->
  </aside>
</main>

<!-- ✅ Full-bleed section with inner constrained content -->
<section aria-labelledby="hero-title">
  <div class="layout-grid">
    <div
      class="layout-grid__col-xs-12 layout-grid__col-md-8 layout-grid__col-lg-6"
    >
      <h1 id="hero-title" class="atom-title atom-title--h1">…</h1>
    </div>
  </div>
</section>
```

---

## 3. SCSS Authoring for Efficient CSS Output

Every SCSS decision has a cost in the compiled CSS. These rules keep output lean.

### 3.1 Nesting Depth

**Maximum 3 levels of nesting.** Deep nesting creates long, specific selectors that are hard to override and inflate file size.

```scss
// ✅ Efficient — 3 levels max
.mol-menu {
  &__item {                       // level 2
    &--danger { … }               // level 3
  }
}
// Outputs: .mol-menu__item--danger { }

// ❌ Expensive — 5 levels compiles to a monster selector
.mol-menu {
  &__list {
    &__item {
      &__link {
        &--active { … }
      }
    }
  }
}
// Outputs: .mol-menu__list__item__link--active { }
```

### 3.2 The @mixin Wrapper Pattern

Every component MUST be wrapped in a `@mixin` with a `$theme` parameter. This is not optional — it's what enables selective inclusion and multi-theme support.

```scss
// ✅ Correct pattern
@mixin mol-card($theme: null) {
  @layer syx.molecules {
    .mol-card {
      // base styles
    }
    .mol-card--elevated {
      // modifier
    }
  }
}

// ❌ Do NOT write top-level rules
.mol-card {
  // These would compile into every bundle, cannot be tree-shaken
}
```

The mixin is registered **once**, in `themes/_shared/_bundle-full.scss` —
never in a per-theme `_setup.scss`, which is generated boilerplate:

```scss
// themes/_shared/_bundle-full.scss
@include mol-card($theme);
```

Every theme's `_setup.scss` compiles that bundle, so one line reaches all
seven themes.

### 3.3 Avoiding Selector Repetition

Use `@extend` only within the same `@layer`. Prefer mixins over `@extend` when sharing styles across components, since `@extend` can group selectors unexpectedly across layers.

```scss
// ✅ Shared visual pattern → extract a private mixin
@mixin --card-interactive-state {
  box-shadow: var(--component-card-shadow-hover);
  @include transition(box-shadow 0.2s ease);
}

.mol-card {
  @include --card-interactive-state;
}
.mol-feature-card {
  @include --card-interactive-state;
}

// ❌ @extend across components is unpredictable
.mol-feature-card {
  @extend .mol-card; // risky — may pull unexpected rules
}
```

### 3.4 Null-Safe Shorthand

SYX mixins skip `null` values. Use this aggressively to replace raw CSS and avoid emitting unnecessary properties:

```scss
// These two are equivalent in output — but only the mixin version is null-safe
@include padding(var(--semantic-space-inset-md) null);
// Output: padding-top: …; padding-bottom: …;  ← no left/right emitted

// Raw CSS always emits all properties
padding: var(--semantic-space-inset-md) 0; // ← emits all 4, sets left/right to 0
```

Practical impact: if a component only needs vertical padding, use `@include padding(var(--y) null)` instead of the 4-value shorthand. Cleaner token expression, no unintended side-effects.

### 3.5 Token Usage → CSS Output Map

| SCSS token reference                   | CSS output                                                                           | Notes                                   |
| -------------------------------------- | ------------------------------------------------------------------------------------ | --------------------------------------- |
| `var(--component-btn-primary-bg)`      | `var(--component-btn-primary-bg)`                                                    | 1 property, runtime                     |
| `var(--primitive-color-blue-500)`      | `var(--primitive-color-blue-500)`                                                    | ❌ skips semantic layer                 |
| Hardcoded `#3b82f6`                    | `#3b82f6`                                                                            | ❌ breaks theming                       |
| `@include size(100%, 48px)`            | `width: 100%; height: 48px;`                                                         | null-safe                               |
| `@include flex-center()`               | `display: flex; align-items: center; justify-content: center;`                       | 3 props from 1 include                  |
| `@include transition(color 0.2s ease)` | `transition: color 0.2s ease; @media (prefers-reduced-motion) { transition: none; }` | Adds reduced-motion guard automatically |

### Current Inventory

| Layer       | Count | Contents                                                                                                                                                 |
| ----------- | ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Atoms       | 23    | avatar, breadcrumb, btn, check, code, feature-icon, form (input, textarea, select), icon, icon-lucide, label, link, list, pagination, pill, progress, radio, skeleton, spinner, stat-counter, switch, table, title, txt |
| Molecules   | 15    | alert, btn-group, card, code-snippet, dialog, disclosure, empty-state, feature-card, form-field, form-field-set, label-group, menu, tabs, toast, tooltip |
| Organisms   | 2     | app-shell, site-header                                                                                                                                   |
| Layout      | 3     | `scss/layout/` — outside the registry, in every bundle: layout-grid, layout-stack, layout-cluster                                                         |
| Site layer  | 12    | `scss/site/` — SYX's own pages only, outside the registry: home-cta, home-features, home-footer, home-hero, home-layers, home-themes, home-tokens, evidence, score, ranking, compare-card, theme-swatch-card |
| Pages       | 1     | theme-builder                                                                                                                                            |

---

### 3.6 Property Order

Follow this order inside every rule (matches `CONTRIBUTING.md`):

<!-- syx: ejemplo-nuevo -->
```scss
.mol-example {
  // 1. Positioning
  @include absolute($top: 0, $left: 0);

  // 2. Display / Box model
  @include flex-center();
  // or: display: grid; grid-template-columns: …;

  // 3. Dimensions
  @include size(100%, 48px);

  // 4. Spacing
  @include margin(null auto);
  @include padding(var(--component-x-inset-y) var(--component-x-inset-x));

  // 5. Typography
  font-size: var(--component-x-font-size);
  font-weight: var(--primitive-font-weight-medium);
  line-height: var(--component-x-line-height);
  color: var(--component-x-color);
  text-decoration: none;

  // 6. Visual
  background-color: var(--component-x-bg);
  @include border(all, var(--component-x-border-width), solid, var(--component-x-border-color));
  @include border-radius(var(--component-x-radius));
  box-shadow: var(--component-x-shadow);

  // 7. Transitions — ALWAYS last, before states
  @include transition(color 0.2s ease, background-color 0.2s ease);

  // 8. States (interactive, disabled, modifiers)
  &:hover { … }
  &:focus-visible { @include focus-ring(); }
  &:disabled { … }
  &--modifier { … }

  // 9. Elements (__element)
  &__icon { … }
  &__label { … }
}
```

---

## 4. Mixin Deep-Dive

### 4.1 Positioning Mixins

All 5 position types have a mixin. They all share the same null-safe parameter signature:

```scss
@include position(absolute, $top: 0, $right: 0, $bottom: null, $left: null);
// Shorthands:
@include absolute($top: 0, $right: 0);
@include fixed($bottom: 0, $left: 0);
@include relative(); // just position: relative — no coords
@include sticky($top: 0);
```

**Tip:** Use `@include relative()` instead of `position: relative` even when no coords are needed — it's consistent and future-proof (you can add coords later without changing the pattern).

The offsets are written top/right/bottom/left but **emitted as logical properties** (`inset-block-start`, `inset-inline-end`, `inset-block-end`, `inset-inline-start`): identical in LTR, mirrored in RTL. See §5.10.

**Centering with absolute:**

```scss
// Classic absolute center — use the mixin, not absolute($left: 50%)
@include absolute-center;
// → top: 50%; left: 50%; transform: translate(-50%, -50%);
```

`transform` is physical, so a centre built from `$left: 50%` + `translate(-50%)` would drift off-centre in RTL (`inset-inline-start: 50%` becomes `right: 50%`). `absolute-center` keeps both physical on purpose.

### 4.2 Spacing Mixins

`@include margin()` and `@include padding()` follow CSS shorthand order but skip null values.

```scss
// 1-value: all sides
@include padding(var(--semantic-space-inset-md));
// → padding: …

// 2-value: top/bottom | left/right
@include padding(var(--semantic-space-inset-y) var(--semantic-space-inset-x));
// → padding: … …

// 4-value: top | right | bottom | left (null = skip that side)
@include padding(var(--y) null var(--y) null);
// → padding-block-start: …; padding-block-end: …;   ← no inline properties emitted

// 4 distinct values: split by axis so the inline sides follow the text
@include padding(1px 2px 3px 4px);
// → padding-block: 1px 3px; padding-inline: 4px 2px;

// Margin auto centering
@include margin(null auto);
// → margin-inline-end: auto; margin-inline-start: auto;
```

### 4.3 Flexbox Mixins

```scss
@include flex-center();
// → display: flex; align-items: center; justify-content: center;

@include flex-between();
// → display: flex; align-items: center; justify-content: space-between;
```

For other flex combinations, use direct properties (no mixin needed):

```scss
display: flex;
align-items: flex-start;
flex-wrap: wrap;
gap: var(--semantic-space-gap-md);
```

### 4.4 Transition Mixin

The most important behavioral mixin. It **automatically adds the `prefers-reduced-motion` guard**.

```scss
@include transition(color 0.2s ease);
// Outputs:
// transition: color 0.2s ease;
// @media (prefers-reduced-motion: reduce) { transition: none; }

// Multiple properties:
@include transition(opacity 0.3s ease, transform 0.3s ease);
```

**Never** write `transition:` directly — you'd have to manually add the motion guard every time.

### 4.5 Media Query Mixins

```scss
// Named breakpoints (recommended)
@include breakpoint(mobile)  { … }  // ≤ 767px
@include breakpoint(tablet)  { … }  // min-width: 50em (800px)
@include breakpoint(desktop) { … }  // min-width: 70em (1120px)
@include breakpoint(wide)    { … }  // min-width: 90em (1440px)

// Custom values — always em, never px (zoom-safe)
@include min-screen(48em)  { … }  // 768px equivalent
@include max-screen(49.9em){ … }  // mobile-only upper bound

// Special
@include darkmode { … }           // prefers-color-scheme: dark
@include reduced-motion { … }     // prefers-reduced-motion: reduce
@include high-contrast { … }      // forced-colors: active
```

**Mobile-first default:** Write base styles for mobile, then use `@include breakpoint(tablet)` to progressively enhance. Never write desktop-first and override with `max-screen`.

<!-- syx: ejemplo-nuevo -->
```scss
// ✅ Mobile-first
.org-hero__title {
  font-size: var(--semantic-font-size-xl); // mobile

  @include breakpoint(tablet) {
    font-size: var(--semantic-font-size-2xl); // tablet+
  }

  @include breakpoint(desktop) {
    font-size: var(--semantic-font-size-display); // desktop+
  }
}
```

### 4.6 Accessibility Mixins

```scss
// Visually hidden but accessible to screen readers
@include sr-only();

// Restore visibility (e.g. when :focus — skip links)
@include sr-only-focusable();

// WCAG-compliant focus ring (uses the focus-ring token)
@include focus-ring();
// → outline: var(--semantic-focus-ring-width) solid var(--semantic-focus-ring-color);
//   outline-offset: var(--semantic-focus-ring-offset);
```

Always apply `@include focus-ring()` inside `:focus-visible`, never `:focus`:

```scss
&:focus-visible {
  @include focus-ring();
}
```

### 4.7 Text Mixins

```scss
// Single-line truncation with ellipsis
@include truncate(200px);
// → max-width: 200px; overflow: hidden; white-space: nowrap; text-overflow: ellipsis;

// Multi-line clamp (CSS -webkit-line-clamp)
@include ellipsis(3);
// → display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 3; overflow: hidden;
```

### 4.8 Border Mixin

```scss
// Single side (→ border-block-start; `left` → border-inline-start)
@include border(top, 1px, solid, var(--semantic-color-border-subtle));

// All sides
@include border(
  all,
  var(--component-card-border-width),
  solid,
  var(--component-card-border-color)
);

// border-radius (separate mixin)
@include border-radius(var(--component-btn-radius));

// Individual corners
@include border-radius(
  var(--radius-md) var(--radius-md) 0 0
); // top corners only (symmetric → plain shorthand)
// Asymmetric corners (e.g. `r 0 0 r`) come out as border-start-start-radius…
```

---

## 5. Tips, Patterns & Gotchas

### 5.1 The "Wrong Layer" Trap

The most common mistake: **adding visual design to a utility class**.

```html
<!-- ❌ The user adds a visual class that doesn't exist → invents it as a util -->
<div class="syx-card-featured">…</div>
← ❌ This is a molecule, not a util

<!-- ✅ Correct: use the component -->
<div class="mol-card mol-card--elevated">…</div>
```

**Utilities are adjectives, not nouns.** `.syx-d-flex` (adjective: display is flex) is a util. `.mol-card` (noun: a card) is a molecule.

### 5.2 Don't Use `@include` for Single-Property CSS

Only use mixins when they provide null-safety or extra logic. Don't wrap everything:

```scss
// ❌ Unnecessary — no benefit over raw CSS
@include color(var(--component-x-color)); // doesn't exist or adds no value

// ✅ Use raw CSS for single properties that have no mixin
color: var(--component-x-color);
opacity: 0.5;
cursor: pointer;
z-index: var(--semantic-z-index-dropdown);
```

Mixins exist for: position, spacing, border, size, flex shortcuts, transition, media queries, accessibility, text truncation. Everything else → raw property.

### 5.3 Specificity: Let `@layer` Work

Never write rules to fight specificity. If a component style isn't winning, the issue is almost always a wrong layer assignment.

```scss
// ❌ Don't fight specificity this way
.org-header .atom-btn--primary {
  background: red; // increasing specificity to override
}

// ✅ Correct — if molecule overrides are needed, do it in the molecule's layer
// or use a utility since .syx-* always wins via @layer syx.utilities
```

### 5.4 Always Test All 7 Themes

Adding a CSS Custom Property to one theme's `_theme.scss` without a global fallback will cause the other themes to inherit an empty value.

```scss
// themes/example-02/_theme.scss
--component-header-bg: hsl(0, 0%, 5%); // ← only defined here

// Result: the other six themes get no value → visual bug

// ✅ Define a fallback in abstracts/tokens/components/_headers.scss
:root {
  --component-header-bg: var(--semantic-color-bg-primary); // default fallback
}
// Then override in the theme that needs it
```

Run `npm run watch` (`sass --watch scss:css`) after any token change; `npm run check:setups` verifies the seven themes stay symmetrical.

### 5.5 `$theme` Parameter Flow

When a mixin has theme-specific logic, the `$theme` string must flow from `_setup.scss`:

```scss
// themes/example-02/_setup.scss
@include syx-bundle-full("example-02"); // ← theme name flows into every mixin

// organisms/_site-header.scss
@mixin org-site-header($theme: null) {
  .org-site-header {
    // Method 1 — CSS token (automatic)
    background: var(--component-header-bg);

    // Method 2 — direct @if (for 1-2 themes only)
    @if $theme == "example-02" {
      backdrop-filter: blur(8px);
    }
  }
}
```

> The old Method 2 (a `$theme-config` Sass map read with `theme-cfg()`) was
> retired on 2026-09-12: nothing ever called it. Structural differences are
> tokens or `@if $theme` blocks.

> Never hardcode a theme name in a partial without `@if $theme == "…"`.

### 5.6 Icon Usage

SYX uses Lucide icons via CSS classes. The pattern is:

```html
<!-- Inline icon (decorative) -->
<span class="atom-icon --lc-home" aria-hidden="true"></span>

<!-- Icon with accessible label (standalone interactive) -->
<button class="atom-btn atom-btn--circle" aria-label="Go home">
  <span class="atom-icon --lc-home" aria-hidden="true"></span>
</button>
```

Icon sizing, color, and stroke width are controlled via CSS Custom Properties:

```scss
.atom-icon {
  --icon-size: var(--component-icon-size-md);
  --icon-color: currentColor; // inherits text color by default
}
```

Never set `width`/`height` directly on `.atom-icon`. Use the `--icon-size` token instead.

### 5.7 Responsive Images

Always wrap images in the utility class:

```html
<!-- ✅ Fluid image (max-width: 100%) -->
<img src="photo.jpg" alt="Description" class="syx-img-fluid" />

<!-- ✅ Responsive video embed -->
<div class="syx-embed syx-embed--16by9">
  <iframe class="syx-embed__item" src="…"></iframe>
</div>
```

### 5.8 Dark Mode

SYX handles dark mode via the `prefers-color-scheme` media query inside component tokens. Don't add one-off `@include darkmode { … }` inside atoms — the theme token system handles it automatically.

Only use `@include darkmode { … }` in page-level or organism files where you need structural differences (e.g. showing/hiding a pattern overlay):

<!-- syx: ejemplo-nuevo -->
```scss
// ✅ OK in organism — structural dark mode difference
.org-hero::before {
  opacity: 0.2;
  @include darkmode {
    opacity: 0.5; // stronger overlay in dark mode
  }
}
```

### 5.9 PurgeCSS Safety

If you add dynamic class names via JavaScript, PurgeCSS will remove them in production unless you safelist them.

Add to `postcss.config.js`:

```js
safelist: [
  /^atom-btn--/, // preserve all btn modifiers
  /^is-/, // preserve all state classes
];
```

Or use the full class name in a comment inside the HTML template (PurgeCSS scans content):

```html
<!-- is-open is-active is-loading atom-btn--danger -->
```

---

### 5.10 Propiedades lógicas y RTL

SYX escribe los lados con **propiedades lógicas**: `margin-inline-start` en vez de `margin-left`, `inset-block-start` en vez de `top`, `text-align: start` en vez de `left`. En una página LTR pinta exactamente igual; con `dir="rtl"` (árabe, hebreo) los componentes se espejan solos. (Auditoría 2026-10 · acción 13)

- **Mixins.** `margin()`, `padding()`, `position()`/`absolute()`/`fixed()`/`sticky()`/`relative()`, `border()`, `border-radius()`, `triangle()` y `cover` emiten ya propiedades lógicas. Su firma no cambia: top/right/bottom/left se traduce a block-start/inline-end/block-end/inline-start.
- **A mano.** Escribe `margin-block-end`, `padding-inline-start`, `border-inline-start`, `inset-inline-end`, `border-start-end-radius`, `text-align: start`. `npm run lint` rechaza las físicas de lado en `scss/` (`property-disallowed-list` y `declaration-property-value-allowed-list` en `.stylelintrc.json`).
- **Excepciones.** Solo lo que de verdad es físico: un dibujo hecho con bordes y girado (el ✓ de `atom-check`, el ⌄ de `mol-disclosure`), un centrado con `translate` (`absolute-center`), una sombra que cae hacia un lado. Se exceptúa en la línea, con el porqué:
  ```scss
  // stylelint-disable-next-line property-disallowed-list -- centrado con translateX, que es físico
  left: 50%;
  ```
- **`transform` es físico.** Si mueves algo con `translateX`, en RTL va al revés. Mejor anima el desplazamiento lógico (el pomo de `atom-switch` anima `inset-inline-start`) o espeja con `:dir(rtl)`.
- **Iconos direccionales.** `@include mirror-rtl('::before')` espeja con `scale: -1 1` una flecha o un chevron de «siguiente/anterior» en RTL (paginación, viñetas de `atom-list`, `atom-icon--lc-arrow-*`/`--lc-chevron(s)-left/right`, `atom-icon--arrow-*`). Va tras `@supports selector(:dir(rtl))`: en navegadores del mínimo sin `:dir()` el icono queda sin espejar. Arriba/abajo no se espejan.
- **Código.** `code`, `kbd`, `samp` y `pre` llevan `direction: ltr` + `unicode-bidi: isolate`: el código se lee de izquierda a derecha también en una página RTL.
- **Utilidades.** Usa `.syx-ms-*`/`.syx-me-*`/`.syx-ps-*`/`.syx-pe-*`, `.syx-ms-auto`/`.syx-me-auto`, `.syx-start-0`/`.syx-end-0` y `.syx-text-start`/`.syx-text-end`. Las físicas ❌ (`.syx-ml-*`, `.syx-mr-*`, `.syx-pl-*`, `.syx-pr-*`, `.syx-ml-auto`, `.syx-mr-auto`, `.syx-left-0`, `.syx-right-0`, `.syx-text-left`, `.syx-text-right`) ✓ se **retiraron en 5.0.0**: eran izquierda/derecha físicas y no seguían a la dirección del texto.
- **Probarlo.** `node tests/browser/run.mjs --axe --rtl` y `--capturas DIR --rtl` montan la página de pruebas con `dir="rtl"`.

---

## 6. Quick Decision Checklist

Before writing any new code, ask:

| Question                                            | Answer determines                                  |
| --------------------------------------------------- | -------------------------------------------------- |
| Is this a reusable UI piece?                        | Yes → component (atom/mol/org). No → page/util     |
| How many HTML elements does it need?                | 1 → atom. 2–5 atoms → molecule. Full section → org |
| Does it need theme-aware colors/spacing?            | Yes → use component tokens → `var(--component-*)`  |
| Will it appear on multiple pages?                   | Yes → component layer. No → page layer             |
| Is it a one-off CSS property tweak?                 | Yes → utility class `.syx-*`                       |
| Does it need JavaScript interaction?                | Add `.js-` hook class, no styles on `.js-` ever    |
| Am I adding a raw CSS value (oklch, px, etc.)?        | Stop → use a token instead                         |
| Am I writing `transition:` without `@include`?      | Stop → use `@include transition()`                 |
| Am I using `position: absolute` without `@include`? | Stop → use `@include absolute()`                   |
| Am I using `!important`?                            | Stop → check `@layer` order instead                |
