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

3. **Update setup.scss**:
   - Replace all instances of `template` with `your-theme-name`
   - Update font declarations
   - Verify the `@layer` order declaration is present after `@use` statements:
     ```scss
     @layer syx.reset, syx.base, syx.tokens, syx.atoms, syx.molecules, syx.organisms, syx.utilities;
     ```
   - Update mixin call: `@include theme-your-theme-name();`

4. **Customize `_theme.scss`**:

   The file is organized in 3 sections:
   - **SecciÃ³n 1 â Primitivos**: Raw values (colors, spacing, fonts). Override these to set your brand's palette and scale.
   - **SecciÃ³n 2 â Variables del tema**: Semantic aliases that reference primitives. Override to map your primitives to roles.
   - **SecciÃ³n 3 â Neutral Brand**: Overrides for `--semantic-color-*`, `--semantic-font-family-*`, `--semantic-border-radius-*`, and `--semantic-shadow-focus`. This section is what makes buttons and forms look presentable out of the box with the `_template` theme. Replace these with your brand's values.

   Minimum customization per section:

   ```scss
   // SecciÃ³n 1 â your brand colors
   --primitive-color-primary-500: hsl(220, 90%, 50%);
   --primitive-font-family-primary: "Your-Font", Arial, sans-serif;

   // SecciÃ³n 3 â wire up semantic tokens to your brand
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

## Using `_template` as a Production Bundle

The `_template` theme is already configured as a **neutral, brand-agnostic baseline** in `styles-core.scss`. Use it directly for projects where you want SYX components without any brand identity:

```bash
npm run build:core   # â css/styles-core.css  (138 KB)
npm run purge:core   # â css/prod/styles-core.css (~110 KB, with PurgeCSS)
```

See `demo-bundle-weight.html` for a live reference.

## Theme Structure

```
themes/
  your-theme-name/
    _theme.scss    â All theme values (primitives + variables + dark-mode)
    setup.scss     â Theme setup, @layer declaration, and component includes
    bundle-app.scss       â (optional) App context bundle
    bundle-docs.scss      â (optional) Documentation context bundle
    bundle-marketing.scss â (optional) Marketing/landing context bundle
    bundle-blog.scss      â (optional) Blog/editorial context bundle
```

## Tips

- **SecciÃ³n 1 (Primitivos)**: Foundation values â colors, spacing, fonts. Override these first.
- **SecciÃ³n 2 (Variables)**: Semantic layer â maps primitives to roles (`--color-primary`, `--font-weight-1`â¦).
- **SecciÃ³n 3 (Neutral Brand)**: Buttons and forms baseline â override `--semantic-*` tokens here.
- **Keep it simple**: Start with SecciÃ³n 3 overrides, expand to Secciones 1 & 2 as needed.
- **Use existing themes**: Reference `example-01` for a complete branded example.
- **Dark mode**: Use `@include dark-mode-tokens()` from `semantic/_dark-mode.scss`.

## Color Filter Generator

Use this tool to generate CSS filters for your brand colors:
https://codepen.io/sosuke/pen/Pjoqqp
