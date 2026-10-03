# themes/

Each subdirectory represents a **complete visual theme** of the system. A theme defines the brand-specific primitive tokens (color palette, typography, base spacing) and calls the themed helpers to generate the `.syx-*` classes of its own CSS bundle.

---

## Structure of a theme

```
themes/
├── _base/          # Universal values (social networks, external brands) + @layer stack
├── _shared/        # syx-core + the shared bundles (_bundle-full, _bundle-app…)
├── _template/      # Neutral template for creating new themes
├── example-01/     # Theme 1
│   ├── _theme.scss      ← The ONLY truly per-theme file: tokens + theme-x-fonts()
│   ├── _setup.scss      ← ~15 lines of wiring (only the theme name changes)
│   └── bundle-*.scss    ← Context bundles (app, docs, marketing, blog)
├── example-02/
└── ...
```

---

## How a theme works

The build bundle (`scss/styles-theme-example-01.scss`) imports the theme like this:

1. `@use "themes/example-01/setup"` — which runs the whole setup chain
   - `@include universal-values()` automatically emits the `@layer` stack as the first CSS rule
2. Each `_setup.scss` makes exactly six calls:
   - `@include universal-values()` — universal values + `@layer` stack
   - `@include theme-example-01()` — theme tokens (`_theme.scss`)
   - `@include theme-example-01-fonts()` — the `@font-face` rules (declared once in `_theme.scss`)
   - `@include syx-core(example-01)` — reset, base elements, `.syx-*` helpers and grid (`_shared/_core.scss`)
   - `@include syx-bundle-full(example-01)` — all the system components (`_shared/_bundle-full.scss`)
   - `@include syx-bundle-site(example-01)` — the site layer (only the SYX site themes; removable)

---

## Create a new theme

### 1. Copy the template

```
themes/_template/ → themes/mi-marca/
```

The `_template/` template is the **minimum contract** of a theme: brand → roles, inks on fills, text, shape, typography with `syx-font()`, icons and dark mode with its two entry points. Every declaration has a reader, and `npm run check:plantilla` compiles it and checks it like any other theme.

### 2. Change the values marked with ✎

In `themes/mi-marca/_theme.scss`: the brand palette as the theme's **own** primitives (`--primitive-color-brand-*`, not the system ones rewritten with another hue), which primitive each role is (`--semantic-color-primary`…), the ink on top of each fill (`--semantic-color-on-*`, chosen by `check:contraste`), text, radii and the font family.

> **Golden rule**: what the theme states are ROLES (`--semantic-*`). A component never reads a primitive (R01, R11), and a component override can only read roles. What a theme can and cannot declare: `THEMING-RULES.md`, "The theme contract".

### 3. Adjust `_setup.scss`

Replace "template" with the theme name — nothing else. The helpers are
emitted by `syx-core()` and the component list lives in
`themes/_shared/_bundle-full.scss`:

```scss
// themes/mi-marca/_setup.scss
@include universal-values();
@include theme-mi-marca();
@include theme-mi-marca-fonts();  // ← the fonts, declared in _theme.scss
@include syx-core(mi-marca);
@include syx-bundle-full(mi-marca);
```

### 4. Create the entry point

Create `scss/styles-theme-mi-marca.scss`:

```scss
// The @layer order is emitted automatically by universal-values() in _setup.scss
@use "themes/mi-marca/setup";
@use "utilities/index" as *;  // the .syx-* utilities come in ONLY through here
```

### 5. Compile

```bash
sass --no-source-map scss/styles-theme-mi-marca.scss:css/styles-theme-mi-marca.css
```

---

## `_shared/` directory

Contains mixins and styles shared across all themes. It must not contain tokens specific to any theme.

## `_base/` directory

Base tokens that act as a fallback if a theme does not override them. All themes inherit them implicitly.

---

## What a theme declares

The full contract —what a theme MUST declare, what it MAY and what it MAY NOT, with the guard that watches each point— is in `THEMING-RULES.md`, "The theme contract". In short: semantic roles with the theme palette, its two dark-mode entry points, no declaration without a reader (`check:consumidores`) and no component token that reads a primitive or a literal color (R11).

---

## Theme environment variables

The `$theme` variable passed to the helpers is a string used by the mixin for `@if $theme == "mi-marca"` comparisons. This allows per-theme build logic (for example, special backgrounds for one theme only).

<!-- syx: ejemplo-nuevo -->
```scss
// Example of theme logic in _backgrounds.scss
@if $theme == "example-02" {
  .syx-bg-color-special {
    background: var(--semantic-color-secondary);
  }
}
```
