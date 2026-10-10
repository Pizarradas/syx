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

1. **Create the theme**

   ```bash
   npm run theme:new -- mi-marca            # a product theme
   npm run theme:new -- mi-marca --sitio    # a theme that also paints the SYX pages
   ```

   It copies the `.scss` files of this folder to `scss/themes/mi-marca/`
   (not this README, not `bundle-template.scss`), puts the name in the
   identifiers only, creates the entry point `scss/styles-theme-mi-marca.scss`,
   registers it in `prepros.config`, regenerates the derived artifacts (below)
   and runs the theme guards, reporting every failure at the end.

2. **Or by hand.** Copy the folder and replace `template` **only in the
   identifiers**: the `theme-template` and `theme-template-fonts` mixins and
   the argument of the bundle calls (`syx-core(template…)`,
   `syx-bundle-full(template)`, `syx-bundle-core(template)`,
   `syx-bundle-site(template)`). A blind replace of the word also rewrites the
   prose of the comments.

   ```bash
   cp -r scss/themes/_template scss/themes/mi-marca
   rm scss/themes/mi-marca/README.md scss/themes/mi-marca/bundle-template.scss
   sed -E -i 's/(theme-|\()template\b/\1mi-marca/g' scss/themes/mi-marca/*.scss
   ```

   Then create the entry point `scss/styles-theme-mi-marca.scss`:

   ```scss
   @use "themes/mi-marca/setup";
   @use "utilities/index" as *;
   ```

   add it to `prepros.config` like the other `styles-theme-*.scss`, and
   regenerate the derived artifacts. Nothing else: the component list lives
   in `themes/_shared/_bundle-full.scss` and the order of the `@layer`s is
   emitted by `universal-values()`.

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
   | 8 · Fonts | `theme-x-fonts()`: `@include syx-font("Familia", 400 700);` — or `syx-font-external()` for a family loaded elsewhere ([below](#fonts-syx-does-not-ship)) |

   If you change a brand fill, `npm run check:contraste` tells you which ink
   (`--semantic-color-ink-light` or `-ink-dark`) to declare on top.

4. **Compile and check**

   ```bash
   npm run build:css
   npm run check          # stops at the first failure (what CI runs)
   npm run check:todo     # the same chain, reporting every failure at the end
   ```

   `check:consumidores` warns about any theme declaration that nobody
   reads: if you meant to change something, look for the token the component
   actually reads (`tokens.json`, or `get_component` on the MCP server).

## Derived artifacts

A theme is not only its folder. These files are generated from the themes,
are versioned (except `dist/`) and have a guard in `npm run check` that fails
when they are stale. `theme:new` regenerates all of them; after changing a
theme by hand, regenerate the ones whose guard fails.

| Artifact | Regenerate with | Guard |
| --- | --- | --- |
| `css/styles-theme-<theme>.css` | `npm run build:css` | `check:compilado`, `check:themes`, `check:contraste`… |
| `contracts/resolved-tokens.json` | `npm run build:css` (runs `build:tokens`) | `check:tokens` |
| `tokens.json` | `npm run build:css` (runs `build:tokens-json`) | `check:tokens-json` |
| `contracts/token-contract.json`, `contracts/lint-contract.json`, `contracts/token-usage-map.json`, `contracts/runtime-tokens.json`, `contracts/validation-report.md` | `npm run validate:report` | none: `npm run check` rewrites them |
| `contracts/figma/<theme>.figma.json` | `npm run export:figma` | `check:figma` |
| `prepros.config` entry for `scss/styles-theme-<theme>.scss` | by hand, or `theme:new` | `check:prepros` |
| `dist/` (not versioned; `prepare` builds it on `npm pack` and on install from git) | `npm run build:dist` | `check:package`, `check:plantilla` |

## Fonts SYX does not ship

`syx-font()` only knows the families in `$syx-fonts`
(`scss/abstracts/mixins/_font.scss`). For any other family:

- **Self-hosted woff2** — `@include font-family("Brand Sans", "#{$fonts-path}/brand/BrandSans-Regular", 400, normal);`
  in `theme-x-fonts()`, one call per weight.
- **Loaded elsewhere** (a Google Fonts `<link>`, a CDN, the app's own CSS) —
  register it in `theme-x-fonts()`. It emits no `@font-face`; it records the
  family and the fallback stack the token will carry:

  ```scss
  @mixin theme-mi-marca-fonts {
    @include syx-font-external("Public Sans", (Arial, sans-serif), "Google Fonts");
    @include syx-font-external("IBM Plex Mono", ("Courier New", monospace), "Google Fonts");
  }
  // section 5:
  // --semantic-font-family-primary: "Public Sans", Arial, sans-serif;
  ```

  Loading the font is then the page's job: SYX does not add the `<link>`.

`check:setups` fails when the first family of a `--semantic-font-family-*`
stack is neither loaded by `syx-font()` / `font-family()`, nor registered with
`syx-font-external()` (followed by the fallback it was registered with), nor a
generic or system family (`sans-serif`, `ui-monospace`, Arial, Georgia…).

## What you do NOT need to declare

Surfaces, borders, shadows, type scale, spacing, the brand ink
as text (`--semantic-color-*-text`) and the strong variant of controls
(`--semantic-color-primary-strong`): the system derives them from the role, in light and in
dark. A theme only declares them when it wants something else.

## Bundles

Every theme carries `bundle-docs.scss` (the full system) and
`bundle-core.scss` (the lightest one, defined once in
`themes/_shared/_bundle-core.scss`): `build-dist` compiles both for every
theme into the npm package, so a theme without them breaks `npm run build`,
`npm pack` and `npm install` from git. The site layer is optional: only themes
that include `syx-bundle-site(...)` in their `_setup.scss` go into
`dist/site/`.

`bundle-template.scss` is the skeleton of an extra context bundle
(`bundle-app`, `bundle-blog`…); it stays in this folder.
