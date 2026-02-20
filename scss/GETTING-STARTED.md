# Getting Started with SYX

> Everything you need to go from zero to productive in SYX.

---

## Prerequisites

| Tool                                       | Version  | Purpose               |
| ------------------------------------------ | -------- | --------------------- |
| [Dart Sass](https://sass-lang.com/install) | ≥ 1.57   | Compilation           |
| [Node.js](https://nodejs.org/)             | ≥ 18.0.0 | npm scripts, PurgeCSS |
| A code editor                              | —        | VS Code recommended   |

> **Note:** SYX uses `@use` / `@forward` (Dart Sass module system). Legacy `@import` is not supported.

---

## 1. Compile Your First Theme

### With npm (recommended)

```bash
npm install                # install dependencies (Sass + PurgeCSS)
npm run build              # compile all 5 themes
npm run build:core         # compile minimal production bundle
npm run build:prod         # compile all themes + run PurgeCSS
npm run watch              # watch theme-01 for changes
```

### With Dart Sass CLI

```bash
# Compile a single theme (uncompressed for development)
sass scss/styles-theme-example-01.scss css/styles-theme-example-01.css

# Compile all themes (compressed for production)
sass scss/styles-theme-example-01.scss:css/styles-theme-example-01.css \
     scss/styles-theme-example-02.scss:css/styles-theme-example-02.css \
     --style=compressed
```

### With Watch Mode

```bash
sass --watch scss/styles-theme-example-01.scss:css/styles-theme-example-01.css
```

---

## 2. Use SYX in HTML

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <!-- Link the compiled CSS for your context -->
    <link rel="stylesheet" href="css/styles-theme-example-01.css" />
  </head>
  <body>
    <!-- SYX components use the .syx- prefix -->
    <button class="syx-btn syx-btn--primary">Primary Button</button>
    <button class="syx-btn syx-btn--secondary">Secondary Button</button>

    <!-- Utility classes use .syx- prefix too -->
    <div class="syx-d-flex syx-gap-2">
      <span class="syx-badge">Label</span>
    </div>
  </body>
</html>
```

---

## 3. Create a New Atom

Follow this checklist when adding a new atomic component.

### Step 1 — Create the file

```bash
# Create the atom file
touch scss/atoms/_tooltip.scss
```

### Step 2 — Write the mixin

```scss
// scss/atoms/_tooltip.scss
// CORE
// ===============================================
@use "../abstracts/index" as *;
// ===============================================

// atom: tooltip
// ===============================================
@mixin atom-tooltip($theme: null) {
  .syx-tooltip {
    @include relative();
    display: inline-block;

    // &__content
    &__content {
      @include absolute($top: calc(100% + 0.5rem), $left: 50%);
      @include padding(var(--semantic-space-inset-sm));
      @include transition(opacity 0.2s ease, transform 0.2s ease);
      // ... rest of styles
    }
  }
}
```

> **Rules:**
>
> - Always wrap in a `@mixin atom-{name}($theme: null)` mixin
> - Always `@use "../abstracts/index" as *` at the top
> - Use SYX mixins (`@include transition()`, `@include absolute()`, etc.)
> - Use component tokens, never hardcoded values

### Step 3 — Add component tokens

```scss
// scss/abstracts/tokens/components/_tooltip.scss
:root {
  --component-tooltip-bg: var(--semantic-color-text-primary);
  --component-tooltip-color: var(--primitive-color-white);
  --component-tooltip-border-radius: var(--semantic-border-radius-sm);
  --component-tooltip-padding-x: var(--semantic-space-inset-sm);
  --component-tooltip-padding-y: var(--semantic-space-inset-xs);
}
```

### Step 4 — Register in the index

```scss
// scss/atoms/index.scss
@forward "tooltip" show atom-tooltip; // add this line
```

### Step 5 — Register the token file

```scss
// scss/abstracts/tokens/index.scss
@forward "components/tooltip"; // add this line
```

### Step 6 — Compile and verify

```bash
sass scss/styles-theme-example-01.scss css/test.css
```

---

### Option B — Minimal production bundle

```bash
npm run build:core         # compiles styles-core.css (138 KB, no docs overhead)
npm run purge:core         # + PurgeCSS for production (~110 KB)
```

Link in HTML:

```html
<link rel="stylesheet" href="css/styles-core.css" />
```

See `demo-bundle-weight.html` for a live reference.

---

## 4. Create a New Theme

See [themes/\_template/README.md](themes/_template/README.md) for the full guide.

**Quick version:**

```bash
# 1. Copy the template
cp -r scss/themes/_template scss/themes/my-brand
```

```scss
// 2. Edit scss/themes/my-brand/_theme.scss
@mixin theme-my-brand {
  // Override primitive tokens only
  --primitive-color-blue-500: hsl(220, 90%, 50%); // brand primary
  --primitive-space-base: 0.5rem; // tighter spacing
}
```

```scss
// 3. Create scss/styles-theme-my-brand.scss
@use "themes/my-brand/setup";
```

```bash
# 4. Compile
sass scss/styles-theme-my-brand.scss css/styles-theme-my-brand.css
```

---

## 5. Add a New Token

### Adding a new color

```scss
// Step 1: Add primitive (scss/abstracts/tokens/primitives/_colors.scss)
--primitive-color-teal-500: hsl(174, 72%, 40%);
--primitive-color-teal-600: hsl(174, 72%, 32%);

// Step 2: Add semantic alias (scss/abstracts/tokens/semantic/_colors.scss)
--semantic-color-state-info: var(--primitive-color-teal-500);

// Step 3: Use in component token (scss/abstracts/tokens/components/_alert.scss)
--component-alert-info-bg: var(--semantic-color-state-info);

// Step 4: Use in component SCSS
.syx-alert--info {
  background: var(--component-alert-info-bg);
}
```

### Adding a new spacing value

```scss
// Step 1: Primitive (primitives/_spacing.scss)
--primitive-space-18: calc(
  var(--primitive-space-base) * 18
); // 72px at base 4px

// Step 2: Semantic alias (semantic/_spacing.scss)
--semantic-space-layout-hero: var(--primitive-space-18);

// Step 3: Use directly
.syx-hero {
  @include padding(var(--semantic-space-layout-hero) null);
}
```

---

## 6. Use the Mixin Library

SYX provides over 40 native mixins. Always prefer them over raw CSS properties.

```scss
// POSITIONING
@include position(absolute, $top: 0, $right: 0);
@include absolute($top: 0, $right: 0);      // shorthand
@include fixed($bottom: 0, $left: 0);
@include relative();
@include sticky($top: 0);

// SPACING (null-safe — null values are skipped)
@include margin(1rem null);                  // only top + bottom
@include padding(null var(--space-md));      // only left + right

// TRANSITIONS (auto prefers-reduced-motion guard)
@include transition(color 0.2s ease);
@include transition(opacity 0.3s ease, transform 0.3s ease);

// FLEXBOX
@include flex-center();                      // display:flex + align+justify center
@include flex-between();                     // display:flex + space-between

// MEDIA QUERIES
@include breakpoint(tablet) { … }           // min-width: 50em
@include breakpoint(desktop) { … }          // min-width: 70em
@include min-screen(768px) { … }
@include darkmode { … }
@include reduced-motion { … }

// ACCESSIBILITY
@include sr-only();                          // WCAG visually hidden
@include focus-ring();                       // accessible focus outline

// TEXT
@include truncate(200px);                    // single-line ellipsis
@include ellipsis(3);                        // multi-line clamp

// SIZING
@include size(100%, 48px);
@include aspect-ratio(16, 9);
```

→ Full reference: [abstracts/mixins/README.md](abstracts/mixins/README.md)

---

## Common Mistakes

| Mistake                                   | Correct approach                             |
| ----------------------------------------- | -------------------------------------------- |
| `transition: color 0.2s ease;`            | `@include transition(color 0.2s ease);`      |
| `position: absolute; top: 0;`             | `@include absolute($top: 0);`                |
| `color: #3B82F6;`                         | `color: var(--semantic-color-primary);`      |
| `color: var(--primitive-color-blue-500);` | `color: var(--component-btn-primary-color);` |
| `!important` anywhere                     | Use `@layer` — utilities always win          |
| Skipping token layers                     | Always Primitive → Semantic → Component      |
