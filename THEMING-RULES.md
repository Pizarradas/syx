# SYX Theming Rules — Development Contract

> **Golden rule:** In pages and components, **never use `--primitive-*` directly**. Always use semantic tokens.

---

## The token hierarchy

```
PRIMITIVO  →  SEMÁNTICO  →  COMPONENTE  →  PÁGINA
  (valor)      (rol)         (elemento)    (layout)
```

- **Primitives** (`--primitive-color-*`): raw values. Used only _inside_ `_theme.scss` to define semantics.
- **Semantics** (`--semantic-color-*`): UI role. Used in components and pages.
- **Component** (`--component-*`): tokens specific to one atom/molecule.

---

## Mandatory substitution map

| ❌ Never in pages/components                              | ✅ Use instead               |
| ------------------------------------------------------------ | --------------------------------- |
| `--primitive-color-white` / `oklch(1 0 0)` / `oklch(1 0 0 / ...)` | `--semantic-color-bg-primary`     |
| `--primitive-color-gray-50`                                  | `--semantic-color-bg-secondary`   |
| `--primitive-color-gray-100` (backgrounds)                   | `--semantic-color-bg-tertiary`    |
| `--primitive-color-gray-100` (borders)                       | `--semantic-color-border-subtle`  |
| `--primitive-color-gray-200/300` (borders)                   | `--semantic-color-border-default` |
| `--primitive-color-gray-400/500` (borders)                   | `--semantic-color-border-strong`  |
| `--primitive-color-gray-900` (text)                          | `--semantic-color-text-primary`   |
| `--primitive-color-gray-500/600` (text)                      | `--semantic-color-text-secondary` |
| `--primitive-color-gray-300/400` (text)                      | `--semantic-color-text-tertiary`  |
| `oklch(1 0 0)` on dark backgrounds                                   | `--semantic-color-text-inverse`   |
| `text-inverse` / white on a brand fill                               | `--semantic-color-on-{rol}`       |
| `--semantic-color-{rol}` used as text (link, `.syx-text-*`)          | `--semantic-color-{rol}-text`     |
| `--semantic-color-primary` as a control border or fill (focus, check, tab) | `--semantic-color-primary-strong` |
| `--primitive-color-blue-50/200/600` (background, border and text of a tone label: pill, snippet header) | `--semantic-color-tone-{primary,secondary,success,warning,error}-subtle-{bg,border,fg}` |
| A fixed palette to tell categories apart (the feature icon layers) | `--semantic-color-category-{1…6}-{bg,fg}` |
| `--primitive-color-gray-900` as a dark surface in both modes | `--semantic-color-bg-emphasis` / `--semantic-color-on-emphasis` |
| Code block and syntax colours | `--semantic-color-code-*` |

---

## Available surface tokens

Defined once, in `scss/abstracts/tokens/semantic/_colors.scss` (the defaults) and in `_dark-mode.scss` (their dark reassignment). A theme overrides them only if it wants something else. The unprefixed legacy variables were retired in action 14 of the 2026-10 audit; the map from each one to its official token is in `contracts/legacy-map.json`.

```css
/* Backgrounds */
--semantic-color-bg-primary     /* main page background */
--semantic-color-bg-secondary   /* alternating sections, sidebars */
--semantic-color-bg-tertiary    /* cards, inputs, code blocks */

/* Borders */
--semantic-color-border-default /* visible borders */
--semantic-color-border-subtle  /* subtle dividers */
--semantic-color-border-strong  /* strong borders, focus rings */

/* Text */
--semantic-color-text-primary   /* headings, body */
--semantic-color-text-secondary /* labels, captions */
--semantic-color-text-tertiary  /* hints, placeholders */
--semantic-color-text-inverse   /* text on dark backgrounds */
```

---

## Brand colour: fill, ink, on-ink and strong variant

A brand colour does four different jobs and each has its own token. The **fill** (`--semantic-color-{primary,secondary,tertiary,quaternary,quinary}`) is the theme's identity and **is not touched to fix contrast**: what gets adjusted is what goes on top of it or next to it.

| Job | Token | Minimum | How it is obtained |
| --- | --- | --- | --- |
| Fill (button, table header, active page) | `--semantic-color-{rol}` | — | Declared by the theme |
| Text on the fill | `--semantic-color-on-{rol}`, `--semantic-color-on-state-hover-{rol}`, `--semantic-color-on-primary-strong` | 4.5:1 (1.4.3); 3:1 the check mark | The theme picks `var(--semantic-color-ink-light)` or `var(--semantic-color-ink-dark)` |
| The brand colour as text (link, placeholder, `.syx-text-primary`) | `--semantic-color-{rol}-text` | 4.5:1 | Derived: same hue and chroma, lightness `--semantic-brand-text-lightness` |
| Control boundary (focus ring, focused border, checked check/radio, tab indicator) | `--semantic-color-primary-strong`, `--semantic-color-state-success-strong` (switch) | 3:1 (1.4.11) | Derived: the fill's lightness clamped to ±0.12 of the ink's |

**Why the `on-*` inks are chosen, not computed.** Theme fills sit around L 0.60 in OKLCH: neither white nor a dark grey reaches 4.5:1 on them, only black (or near-black). Computing "the ink with the most contrast" in CSS requires `contrast-color()` or relative colour syntax with conditionals, and neither exists in the system's minimum support (Chrome 111, Safari 16.2, Firefox 121). So the theme declares the choice and `npm run check:contraste` validates it in all four mode states; if a pair falls short, the report says which of the two inks does pass:

```scss
// _theme.scss — semantic colour section
--semantic-color-on-primary: var(--semantic-color-ink-dark);   // light cyan: dark ink
--semantic-color-on-quinary: var(--semantic-color-ink-light);  // dark violet: light ink
// Optional: fine-tune both inks (they still go through the same contract)
--semantic-color-ink-dark: var(--primitive-color-ink);
```

Whatever is not declared stays at `--semantic-color-text-inverse`, the previous behaviour. Hover fills are a different colour and may need the other ink (in light mode, one step darker usually needs the light one): that is why they have their own `on-state-hover-*`. In dark mode, `dark-mode-tokens()` points each hover to its base fill, and its ink along with it.

**The ink and the strong variant derive themselves** with relative syntax inside `@supports`; where it is not available, they fall back to the fill (the previous behaviour). A theme that is already dark in its base mode raises `--semantic-brand-text-lightness` to 0.80 and both derivations follow it. A strong variant that falls inside the band comes out identical to the fill: only the themes that fell short change.

The pairs live in `contracts/contrast.json` (text on each fill and its hover, filled buttons, table header, active page, selection, link, placeholder, code syntax, focus ring, checked controls, switch, tab). A new theme is not finished until `npm run check:contraste` passes green.

---

## The theme contract

A theme is a list of declarations. This contract says which ones it must have, which it may have and which it may not, and each point is enforced by a guard in `npm run check`. The template (`scss/themes/_template/`) is the **minimum** contract: `npm run check:plantilla` compiles it as one more theme and runs everything here against it. (Audit 2026-10 · action 14)

### What a theme MUST declare

| What | Tokens | Enforced by |
| --- | --- | --- |
| Its brand, as its **own** primitives | `--primitive-color-brand-*` (or whatever name describes it), `--primitive-space-base` | — |
| The brand fills and their hovers | `--semantic-color-{primary,secondary,tertiary…}`, `--semantic-color-state-hover-*` | — |
| The ink on each fill | `--semantic-color-on-*`, `--semantic-color-on-state-hover-*` | `check:contraste` |
| What every theme declares and the system reads | icons `--icon-*` | `check:plantilla` |
| Dark mode with **both its entry points**, both using `dark-mode-tokens()` | `@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) {…} }` and `:root[data-theme="dark"] {…}` | `check:themes --strict`, `check:modo-claro` |
| Its fonts, once | `theme-x-fonts()` with `syx-font()` | `check:setups` |

Surfaces, text, borders, shadows, type scale, the brand ink as text (`--semantic-color-*-text`) and the controls' strong variant are provided by the system, in light and dark. A theme declares them only when it wants something else.

### What a theme MAY declare

- **Any semantic role** (`--semantic-*`): surfaces, text, states (`--semantic-color-state-*`), subtle tones, categorical colours, emphasis surface, code palette, inks… with a primitive or with a literal. This is where the theme translates its palette into roles.
- **Primitives**: its own, or the system's rewritten (see the inventory recommendation: its own is better).
- **Component tokens** (`--component-*`), as long as they **read roles** (R11): a `--semantic-*`, another `--component-*`, `--theme-*`, `--layout-*`, an icon or a literal length. There is no closed list of which ones can be overridden: R11 guarantees that whatever is overridden still follows the theme and the mode.
- Shape and structure: `--theme-radius`, `--theme-focus-ring-width`, `--layout-*`, `--reset-*`.

### What a theme MUST NOT declare

| No | Why | Enforced by |
| --- | --- | --- |
| A declaration nobody reads | It does nothing and nobody notices: example-06 "fixed" a contrast with `--btn-primary-filled-text`, which no button read. Only the system's `--semantic-*` are allowed, as they are public API for applications | `check:consumidores` |
| A `--component-*` that reads a `--primitive-*`, a legacy variable or a literal colour | The component would stop following the theme and the mode (the violet pill in the cyan theme) | R11 (`check:reglas` and `validate` on the source; `check:compilado` on the emitted CSS, also in atoms, molecules and organisms) |
| A deprecated token | Since 2026-10 deprecated aliases FOLLOW the canonical one: declaring the alias changes nothing. Declare the canonical one (`replacedBy` in `tokens.json`) | `check:tokens-json` |
| Variables without an official prefix | The legacy ones were retired; `contracts/legacy-map.json` says which official token each one maps to | R07 (`validate`) |
| A dark mode with a single entry point | The mode toggle would have no effect with the OS in light mode, or the theme would not follow the OS | `check:themes --strict` |

### Measured theme inventory (October 2026)

Declarations in each `_theme.scss`, before and after action 14 (all declarations, counting light and dark):

| Theme | Before | After | Primitives (system rewritten · own) | Semantic | Component | Primitives whose name is not their hue |
| --- | --- | --- | --- | --- | --- | --- |
| example-01 | 233 | 132 | 21 (9 · 12) | 55 | 11 | 4: `blue-500/400` indigo (h 277), `cyan-500` amber (h 70), `orange-500` indigo (h 277) |
| example-02 | 256 | 145 | 22 (12 · 10) | 71 | 7 | 3: `purple-500` pink (h 7), `blue-500` violet (h 293), `yellow-500` amber (h 70) |
| example-03 | 267 | 161 | 25 (6 · 19) | 81 | 10 | 0 |
| example-04 | 269 | 162 | 25 (4 · 21) | 82 | 10 | 0 |
| example-05 | 286 | 174 | 31 (4 · 27) | 88 | 10 | 0 |
| example-06 | 240 | 149 | 30 (4 · 26) | 64 | 10 | 0 |
| syx-sketch | 493 | 377 | 48 (36 · 12) | 189 | 94 | 0 |

What went away were legacy aliases and declarations without a reader. The example themes' component tokens are the list ones (`--component-list-*`, which they previously wrote with legacy names). syx-sketch's go down from 170 to 94, and all of them now read roles: the colours of its pills, icons, code and table moved to the semantic layer.

### Recommendation (pending decision)

1. **Primitives that don't lie.** example-01 and example-02 rewrite system primitives with a different hue (`purple-500` pink, `orange-500` indigo, `cyan-500` amber). Since R11 no component reads primitives, but the site layer does (`scss/site/tokens/`, which R01 allows), as does any application that uses the palette: it gets a pink "violet". The template's convention is better: own primitives named after their role in the brand (`--primitive-color-brand-*`) and the system's left intact.
2. **syx-sketch** is still the theme that rewrites the most (94 component tokens: cards, table, buttons, code). All read roles, so they follow the mode; if its language (stroke, hard shadow) is to be offered to other themes, the next step is to lift those settings into semantic shape roles (`--semantic-shadow-hard*` already exists) instead of repeating them component by component.
3. **A closed list of overridable components?** There is none today; R11 and `check:consumidores` cover what a list would protect (that the override takes effect and follows the theme). If wanted, it would go in `contracts/` and `check:consumidores` would read it.

### Steps for a new theme

1. Copy `scss/themes/_template/` and replace `template` with the name (see its README).
2. Change the values marked with ✎: brand, text, shape, typography.
3. Create `scss/styles-theme-<tema>.scss`, compile (`npm run build`) and run `npm run check` until it is green: `check:contraste` will tell you which `on-*` ink to declare on each fill, and `check:consumidores` which declarations nobody reads.

---

## Examples

### ✅ Correct

```scss
.my-section {
  background: var(--semantic-color-bg-secondary);
  border-bottom: 1px solid var(--semantic-color-border-subtle);
  color: var(--semantic-color-text-primary);
}
```

### ❌ Incorrect

```scss
.my-section {
  background: var(--primitive-color-gray-50); // ❌ breaks customization
  border-bottom: 1px solid oklch(0.928 0.006 264.531); // ❌ hardcoded, never changes
  color: var(--primitive-color-gray-900); // ❌ does not respect the theme
}
```

---

## Allowed exceptions

Primitives **may be used** in:

- `scss/themes/*/_theme.scss`, in the semantic layer — to give them a role (never in a `--component-*`: R11)
- `scss/abstracts/tokens/semantic/` and `scss/abstracts/tokens/primitives/` — where they are defined
- `scss/base/`, `scss/utilities/` and `scss/setup-builder.scss` — reset, helpers and the theme editor
- `scss/site/tokens/` — SYX's site layer, which is not part of the system

A colour that must not change with the theme does not go into a component as a primitive either: it has a semantic role with its default value (the emphasis surface, the code palette, the categorical colours), and a theme that wants something else changes it there.

---

## Dark Mode

Dark mode is activated in two ways:

1. **Automatic**: `@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { … } }` — respects the OS preference unless the user has chosen light
2. **Manual**: `[data-theme="dark"]` on `<html>` — explicit control from JS

The `:not([data-theme="light"])` is what makes choosing "light" work without a block that reverts dark by hand: the default `:root` stays intact. A light-by-default theme does not need `:root[data-theme="light"]`. Enforced by `npm run check:modo-claro`.

The dark-mode tokens are in `scss/abstracts/tokens/semantic/_dark-mode.scss`.
Only surface, text and border tokens are reassigned. Brand colours and states (success/error/warning) **do not change**.

```scss
// Enable dark mode manually from JS
document.documentElement.setAttribute('data-theme', 'dark');

// Disable
document.documentElement.setAttribute('data-theme', 'light');
```

> **Rule:** If a component uses `--semantic-color-bg-primary`, `--semantic-color-border-*` and `--semantic-color-text-*`, dark mode works automatically with no extra code.

---

## Overriding tokens from your app

The `:root` blocks that declare tokens are emitted **outside any `@layer`**, on purpose: that way no component rule can overwrite a token by accident (see `scss/ARCHITECTURE.md`). The consequence for whoever consumes SYX is concrete: **a declaration inside a layer never beats a SYX token**, even if it comes later. If your application organises its CSS in layers (Tailwind v4, for example), override the tokens outside them:

```css
/* capa: prototipo outside scss/ — CSS of the application that consumes SYX */
/* ✓ wins: unlayered, loaded after the SYX stylesheet */
:root {
  --semantic-color-primary: oklch(0.55 0.2 250);
}

/* ✗ does not win: any @layer loses to SYX's unlayered :root */
@layer theme {
  :root { --semantic-color-primary: oklch(0.55 0.2 250); }
}
```

To respect dark mode, repeat the override in the same two entry points the system uses: `@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { … } }` and `:root[data-theme="dark"] { … }`. If what you are changing is the whole identity and not a single token, it is not an override: it is a theme (see *How to create a new theme*).

---

## V4 Structure: Layer Responsibilities
In V4, the system strictly standardises the token lifecycle. **Never break this dependency cascade:**

1. **Primitive Tokens (Primitives):** Raw palettes (e.g. `purple-500`, `space-base`).
2. **Architecture and Theme (Theme Config):** Cross-component structural variables that define the *overall* look and feel of the system, such as focus rings, base borders or radii (e.g. `--theme-focus-ring-width`, `--theme-radius`).
3. **Semantic States (States):** Responsible exclusively for universal feedback, with a single name per state: `--semantic-color-state-*` (e.g. `--semantic-color-state-success`). The old names (`--semantic-tone-*-bg`, `--semantic-color-success`…) are deprecated aliases that follow it.
4. **Component Aliases (Components):** Dedicated explicit properties that consume from the upper levels. A button never defines `--semantic-color-primary`; it consumes its own prop, e.g. `--component-button-primary-filled-color`, which reads `--semantic-color-on-primary` and through it reacts to the theme and to dark mode. A component token only reads semantic roles or other component tokens (R11).
