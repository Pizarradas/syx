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
   - Update spacing (`--primitive-space-base`)
   - Update brand colors
   - Update typography (font families)
   - Update icons
   - Customize component variables as needed

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

7. **Compile in Prepros** and verify!

## Theme Structure

```
themes/
  your-theme-name/
    _theme.scss    ← All theme values (primitives + variables + dark-mode)
    setup.scss     ← Theme setup, @layer declaration, and component includes
    bundle-app.scss       ← (optional) App context bundle
    bundle-docs.scss      ← (optional) Documentation context bundle
    bundle-marketing.scss ← (optional) Marketing/landing context bundle
    bundle-blog.scss      ← (optional) Blog/editorial context bundle
```

## Tips

- **Primitivos**: Foundation values (colors, spacing, fonts)
- **Variables**: Semantic values that use primitivos
- **Keep it simple**: Start with basic values, add more as needed
- **Use existing themes**: Reference `example-01` for a complete working example
- **Dark mode**: Use `@include dark-mode-tokens()` from `semantic/_dark-mode.scss`

## Color Filter Generator

Use this tool to generate CSS filters for your brand colors:
https://codepen.io/sosuke/pen/Pjoqqp
