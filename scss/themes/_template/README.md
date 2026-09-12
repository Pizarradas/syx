# Creating a New Theme in SYX

## Quick Start

1. **Copy the template folder**:

   ```bash
   cp -r themes/_template themes/your-theme-name
   ```

2. **Rename the mixin** in `_theme.scss`:

   ```scss
   // Change from:
   @mixin theme-template {

   // To:
   @mixin theme-your-theme-name {
   ```

3. **Update _setup.scss**:
   - Replace all instances of `template` with `your-theme-name` — nothing else:
     the component list lives in `themes/_shared/_bundle-full.scss` and the
     font list in this theme's `_theme.scss` (`theme-your-theme-name-fonts()`)
   - The `@layer` order declaration is emitted automatically by `universal-values()` — **do not add it manually** to `_setup.scss`.

4. **Customize `_theme.scss`**:

   The file is organized in 3 sections:
   - **Sección 1 — Primitivos**: Raw values (colors, spacing, fonts). Override these to set your brand's palette and scale.
   - **Sección 2 — Variables del tema**: Semantic aliases that reference primitives. Override to map your primitives to roles.
   - **Sección 3 — Neutral Brand**: Overrides for `--semantic-color-*`, `--semantic-font-family-*`, `--semantic-border-radius-*`, and `--semantic-shadow-focus`. This section is what makes buttons and forms look presentable out of the box with the `_template` theme. Replace these with your brand's values.

   Minimum customization per section:

   ```scss
   // Sección 1 — your brand colors
   --primitive-color-primary-500: hsl(220, 90%, 50%);
   --primitive-font-family-primary: "Your-Font", Arial, sans-serif;

   // Sección 3 — wire up semantic tokens to your brand
   --semantic-color-primary: var(--primitive-color-primary-500);
   --semantic-font-family-primary: "Your-Font", Arial, sans-serif;
   --semantic-border-radius-default: 0.5rem;
   ```

5. **Add dark-mode support** (optional but recommended):

   In `_theme.scss`, add at the end:

   ```scss
   @media (prefers-color-scheme: dark) {
     :root {
       @include dark-mode-tokens();
     }
   }
   [data-theme="dark"] {
     @include dark-mode-tokens();
   }
   ```

6. **Create compilation file**:

   ```scss
   // styles-theme-your-theme-name.scss
   @use "themes/your-theme-name/setup";
   ```

7. **Compile**:

   ```bash
   # With npm
   sass scss/styles-theme-your-theme-name.scss css/styles-theme-your-theme-name.css

   # Or add a script to package.json
   "build:your-theme": "sass scss/styles-theme-your-theme-name.scss css/styles-theme-your-theme-name.css --style=compressed --no-source-map"
   ```

## Minimal Production Bundle

For SYX components without showroom overhead, every theme compiles
`bundle-core.scss` — the leanest functional bundle, defined once in
`themes/_shared/_bundle-core.scss`:

```bash
sass scss/themes/your-theme-name/bundle-core.scss dist/core.css --style=compressed
# measured on example-01: 203 KB raw · 36 KB gzip (goal: < 50 KB gzip)
```

## Theme Structure

```
themes/
  your-theme-name/
    _theme.scss    # All theme values (primitives + variables + dark-mode + theme-x-fonts())
    _setup.scss    # ~15 lines of wiring (no manual @layer, no component list)
    bundle-app.scss       # App context bundle
    bundle-blog.scss      # Blog/editorial context bundle
    bundle-core.scss      # Minimal production bundle
    bundle-docs.scss      # Documentation context bundle
    bundle-marketing.scss # Marketing/landing context bundle
```
(The SYX site themes also carry a `bundle-home.scss` for `home.html`.)

## Tips

- **Sección 1 (Primitivos)**: Foundation values — colors, spacing, fonts. Override these first.
- **Sección 2 (Variables)**: Semantic layer — maps primitives to roles (`--semantic-color-primary`, `--semantic-font-family-primary`…).
- **Sección 3 (Neutral Brand)**: Buttons and forms baseline — override `--semantic-*` tokens here.
- **Keep it simple**: Start with Sección 3 overrides, expand to Secciones 1 & 2 as needed.
- **Use existing themes**: Reference `example-01` for a complete branded example.
- **Dark mode**: Use `@include dark-mode-tokens()` from `semantic/_dark-mode.scss`.

## Color Filter Generator

Use this tool to generate CSS filters for your brand colors:
https://codepen.io/sosuke/pen/Pjoqqp
