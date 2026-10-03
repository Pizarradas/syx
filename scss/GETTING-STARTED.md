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
npm install                # install dependencies (Sass + PostCSS)
npm run build              # compile everything: the 7 themes + all bundles
npm run watch              # watch the whole scss/ tree for changes
```

For the sheets an app consumes, build `dist/`:

```bash
npm run build:dist         # all-in-one core/full per theme, plus the shared components
                           # sheet and one small token sheet per theme (see the README)
```

It prints the size of every sheet as it writes them, and writes them to
`dist/sizes.json`. They are not copied here:
a measured number in a guide is right for one release and wrong for every later one.

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

Consuming SYX from an app (install, import a theme, optional JS, light/dark) is the
README's *Quick Start*, and it is tested end to end by `npm run check:quickstart`.
Inside this repository, after `npm run build:dist`:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <!-- One theme, the whole system. css/styles-theme-*.css also works, but it
         carries SYX's own site layer: it is the sheet of the SYX pages, not of an app. -->
    <link rel="stylesheet" href="dist/example-01.full.min.css" />
  </head>
  <!-- No classes required on <html> or <body>; data-theme="dark|light" on <html> forces a mode -->
  <body>
    <!-- Components carry their layer prefix: atom-, mol-, org-. Never syx-. -->
    <button class="atom-btn atom-btn--primary">Primary Button</button>
    <button class="atom-btn atom-btn--secondary">Secondary Button</button>

    <!-- Utilities, and only utilities, use the syx- prefix -->
    <!-- All utilities live in @layer syx.utilities — they always win -->
    <div class="syx-d-flex syx-gap-2 syx-items-center">
      <span class="syx-p-1 syx-bg-primary syx-text-white">Badge</span>
      <p class="syx-type-body syx-text-gray syx-max-w-65ch">Body text</p>
    </div>

    <!-- Responsive visibility -->
    <nav class="syx-d-sm-only">Mobile nav</nav>
    <nav class="syx-d-md-up">Desktop nav</nav>

    <!-- Media -->
    <img src="photo.jpg" alt="" class="syx-img-fluid" />
    <div class="syx-embed syx-embed--16by9">
      <iframe
        class="syx-embed__item"
        src="https://www.youtube.com/embed/…"
      ></iframe>
    </div>
  </body>
</html>
```

> **Migration note:** If you are upgrading from an older SYX build, replace `.helper-dsp-*` → `.syx-d-*`, `.helper-algn-*` → `.syx-valign-*`, `.u-p-*` → `.syx-p-*`, `.u-text-*` → `.syx-text-*`. See [ARCHITECTURE.md](ARCHITECTURE.md) for the full mapping.

---

## 3. Create a New Atom

Follow this checklist when adding a new atomic component. The walk-through builds a
minimal `atom-tooltip` to show the steps — SYX already ships a full `mol-tooltip`, so in
real work check `component-registry.json` first and reuse it.

### Step 1 — Create the file

```bash
# Create the atom file
touch scss/atoms/_tooltip.scss
```

### Step 2 — Write the mixin

<!-- syx: ejemplo-nuevo -->
```scss
// scss/atoms/_tooltip.scss
// CORE
// ===============================================
@use "../abstracts/index" as *;
// ===============================================

// atom: tooltip
// ===============================================
@mixin atom-tooltip($theme: null) {
  @layer syx.atoms {
    .atom-tooltip {
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

### Step 6 — Include it in the shared full bundle

```scss
// scss/themes/_shared/_bundle-full.scss  (one line, reaches all 7 themes)
@include atom-tooltip($theme);
```

Never add component includes to per-theme `_setup.scss` files — they are
generated boilerplate; the component list lives only in `_bundle-full.scss`
(plus the context bundles that need it).

### Step 7 — Compile and verify

```bash
sass scss/styles-theme-example-01.scss css/test.css
```

---

### Option B — Minimal production bundle

Every theme ships `bundle-core.scss` — the leanest functional bundle,
defined once in `themes/_shared/_bundle-core.scss` (no showroom components,
no site layer):

```bash
sass scss/themes/example-01/bundle-core.scss build/core.css --style=compressed --no-source-map
```

That is the bare bundle: base components, forms and minimal layout, without the
`.syx-*` helpers and utilities and without the Lucide icon set. `npm run build:dist`
runs autoprefixer, prunes the tokens nothing reads (keeping every `--semantic-*`) and
ships it as `syx-design-system/bundles/<theme>.core.min.css`; the utilities, if you
want them, are `syx-design-system/utilities.css`. Its size is printed by the build.

```html
<link rel="stylesheet" href="build/core.css" />
```

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
// 1. Add primitive (scss/abstracts/tokens/primitives/_colors.scss)
--primitive-color-teal-500: hsl(175, 100%, 40%);

// 2. Point the semantic state at it (scss/abstracts/tokens/semantic/_colors.scss)
--semantic-color-state-info: var(--primitive-color-teal-500);

// 3. Use in component token (scss/abstracts/tokens/components/_alert.scss)
--component-alert-info-bg: var(--semantic-color-state-info);

// 4. Use in component SCSS
.mol-alert--info {
  background: var(--component-alert-info-bg);
}
```

### Adding a new spacing value

<!-- syx: ejemplo-nuevo -->
```scss
// Step 1: Primitive (primitives/_spacing.scss)
// Use an existing step or add a new one with a comment explaining why.
// Example: using the existing --primitive-space-20 (160px):
--primitive-space-20: calc(
  var(--primitive-space-base) * 20
); // 160px — layout-range, non-linear step

// Step 2: Semantic alias (semantic/_spacing.scss)
--semantic-space-layout-hero: var(--primitive-space-20);

// Step 3: Use directly (in a new organism)
.org-hero {
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
@include min-screen(48em) { … }          // 768px
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

| Mistake                                   | Correct approach                                     |
| ----------------------------------------- | ---------------------------------------------------- |
| `transition: color 0.2s ease;`            | `@include transition(color 0.2s ease);`              |
| `position: absolute; top: 0;`             | `@include absolute($top: 0);`                        |
| `color: #3B82F6;`                         | `color: var(--semantic-color-primary);`              |
| `color: var(--primitive-color-blue-500);` | `color: var(--component-btn-primary-color);`         |
| `!important` anywhere                     | Use `@layer` — utilities always win                  |
| Skipping token layers                     | Always Primitive → Semantic → Component              |
| Using `.helper-dsp-flex`                  | Use `.syx-d-flex` (utilities layer)                  |
| Using `.helper-algn-ctr`                  | Use `.syx-valign-middle` or `.syx-mx-auto`           |
| Using `.u-p-sm`, `.u-text-center`         | Use `.syx-p-1`, `.syx-text-center` (utilities layer) |
| Adding public classes to `base/helpers/`  | Add to `scss/utilities/` with `@layer syx.utilities` |
