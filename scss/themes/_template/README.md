# Create a new theme in SYX

The template is the **minimum contract** of a theme: every declaration in
`_theme.scss` is read by some system component, it brings dark mode with its
two entry points and it passes WCAG 2.2 AA contrast in the four mode states.
`npm run check:plantilla` verifies it on every `npm run check`: it instantiates this
folder as one more theme in a copy of the tree and runs the guards of the
real themes on it.

What a theme can and cannot declare: [THEMING-RULES.md](../../../THEMING-RULES.md),
"The theme contract".

## Steps

1. **Copy the folder**

   ```bash
   cp -r scss/themes/_template scss/themes/mi-marca
   ```

2. **Replace `template` with the theme name** in `_theme.scss` and `_setup.scss`
   (the `theme-template` and `theme-template-fonts` mixins, and the
   `syx-core(template)` and `syx-bundle-full(template)` calls). Nothing else: the
   component list lives in `themes/_shared/_bundle-full.scss` and the order of the
   `@layer`s is emitted by `universal-values()`.

3. **Change the values marked with ✎** in `_theme.scss`, by section:

   | Section | What it is |
   | --- | --- |
   | 1 · Brand | The theme palette as its own primitives, and the space unit |
   | 2 · Brand roles | Which primitive is the primary, the secondary, the tertiary and their hovers; the ink on top of each fill (`--semantic-color-on-*`) |
   | 3 · Text | The text grays |
   | 4 · Shape | Radii and column width |
   | 5 · Typography | The family, declared with `syx-font()` in section 8 |
   | 6 · Icons | The ones the components read (Lucide's by default) |
   | 7 · Dark mode | What the theme fine-tunes on top of `dark-mode-tokens()`, in **both** entry points |
   | 8 · Fonts | `theme-x-fonts()`: `@include syx-font("Familia", 400 700);` |

   If you change a brand fill, `npm run check:contraste` tells you which ink
   (`--semantic-color-ink-light` or `-ink-dark`) to declare on top.

4. **Create the entry point** `scss/styles-theme-mi-marca.scss`:

   ```scss
   @use "themes/mi-marca/setup";
   @use "utilities/index" as *;
   ```

5. **Compile and check**

   ```bash
   npm run build
   npm run check
   ```

   `check:consumidores` warns about any theme declaration that nobody
   reads: if you meant to change something, look for the token the component
   actually reads (`tokens.json`, or `get_component` on the MCP server).

## What you do NOT need to declare

Surfaces, borders, shadows, type scale, spacing, the brand ink
as text (`--semantic-color-*-text`) and the strong variant of controls
(`--semantic-color-primary-strong`): the system derives them from the role, in light and in
dark. A theme only declares them when it wants something else.

## Context bundles

`bundle-template.scss` is the skeleton of a context bundle (`bundle-app`,
`bundle-blog`…). Each theme also compiles `bundle-core.scss`, the lightest one,
defined once in `themes/_shared/_bundle-core.scss`.
