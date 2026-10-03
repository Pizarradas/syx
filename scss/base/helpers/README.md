# base/helpers/

**Theme-aware** mixins that generate `.syx-*` classes inside `@layer syx.utilities`. They are called from `themes/_shared/_core.scss` (`syx-core($theme)`), which every `_setup.scss` and every `bundle-*.scss` include; they receive the `$theme` parameter that lets them tell which theme is being compiled.

**Generated class prefix**: `.syx-*`
**Layer**: `@layer syx.utilities`
**Theme-dependent**: ✅ Yes — each theme produces its own variations of color, typography size, dimensions and icons

> **Key difference from `utilities/`**: The helpers generate classes that depend on the active theme's tokens. A hero in "example-01" can have a different `--icon-rrss-facebook` from the one in "example-02". The utilities in `utilities/` are identical across all themes.

---

## When to use these classes

Use the `base/helpers/` classes for:

- Themed **background colors** (`.syx-bg-color-primary` … `.syx-bg-color-quinary`, `.syx-bg-color-white`, `.syx-bg-color-black`)
- Themed **text colors** (`.syx-font-color-primary` … `.syx-font-color-quinary`, `.syx-font-color-white`, `.syx-font-color-black`)
- **Typography** with the theme's font scale (`.syx-font-size-1` to `.syx-font-size-5`)
- **Dimensions** from the theme's dimension system (`.syx-size-1` to `.syx-size-5`)
- **Social network icons** (`.syx-icon`, `.syx-icon--facebook-primary`, etc.)
- Theme **font weights and families** (`.syx-font-bold`, `.syx-font-medium`, `.syx-font-weight-1`/`-2` —families, not weights—, `.syx-font-scope-1`…`-5`)

Do **not** use these classes for:

- Layout, flexbox, grid → use `utilities/_display.scss`
- Generic margin / padding → use `utilities/_spacing.scss`
- Object-fit, iframes → use `utilities/_media.scss`
- Accessibility → use `utilities/_accessibility.scss`

---

## Active files

### `_backgrounds.scss` — Backgrounds (`helper-backgrounds`)

Generates background-size classes and **themed background color** classes.

#### Background-size

```html
<div class="syx-bg-auto">...</div>
<div class="syx-bg-cover">...</div>
<div class="syx-bg-contain">...</div>
```

#### Background colors (resolved by theme tokens)

```html
<div class="syx-bg-color-primary">Primary background of the active theme</div>
<div class="syx-bg-color-secondary">Secondary background</div>
<div class="syx-bg-color-tertiary">Tertiary background</div>
<div class="syx-bg-color-black">Black background</div>
<div class="syx-bg-color-white">White background</div>
```

> Some themes add extra logic with `@if $theme` to define the container's `color` when the background is dark — this is intentional and cannot be replaced by CSS custom properties. The color is defined directly on the container element (e.g. `.syx-bg-color-primary { color: var(--primitive-color-white) }`), and children inherit it naturally through the CSS cascade. `* { color }` selectors are not used.

---

### `_fonts.scss` — Themed typography (`helper-fonts`)

Typography color, weight and "scope" (size + line-height combined).

#### Text color

```html
<p class="syx-font-color-primary">Text in the theme's primary color</p>
<p class="syx-font-color-secondary">Text in the secondary color</p>
<p class="syx-font-color-tertiary">Text in the tertiary color</p>
<p class="syx-font-color-black">Black text</p>
<p class="syx-font-color-white">White text</p>
```

#### Font weight

```html
<span class="syx-font-medium">Medium</span>
<span class="syx-font-bold">Bold (bold weight and family)</span>
<!-- historical name: -weight-1/-2 change the FAMILY (text / bold), not the weight -->
<span class="syx-font-weight-1">Text family</span>
<span class="syx-font-weight-2">Bold family</span>
```

#### Scope (theme size + line height)

```html
<p class="syx-font-scope-1">1 — smallest text in the system</p>
<p class="syx-font-scope-2">2</p>
<p class="syx-font-scope-3">3</p>
<p class="syx-font-scope-4">4</p>
<p class="syx-font-scope-5">5</p>
```

---

### `_font-sizes.scss` — Responsive font sizes (`helper-font-sizes`)

5-level scale with responsive scaling. The `--font-size-{n}` tokens are defined by each theme.

```html
<p class="syx-font-size-1">Size 1 — largest</p>
<p class="syx-font-size-2">Size 2</p>
<p class="syx-font-size-3">Size 3 — base</p>
<p class="syx-font-size-4">Size 4</p>
<p class="syx-font-size-5">Size 5 — smallest</p>
```

> Difference from `syx-type-*` in utilities: `syx-font-size-*` uses the active theme's tokens; `syx-type-*` uses the core's fluid Major Third scale.

---

### `_dimensions.scss` — Themed dimensions (`helper-dimensions`)

Width/height sizes from the theme's dimension system. The `--dimension-{n}` tokens are defined by each theme.

```html
<div class="syx-size-1"><!-- Theme dimension 1 --></div>
<div class="syx-size-2">2</div>
<div class="syx-size-3">3</div>
<div class="syx-size-4">4</div>
<div class="syx-size-5">5</div>
```

---

> **`helper-spacer` retired (2026-09-12):** the ❌ `.syx-spacer-*` ✓ classes had
> no real use in the site or in the system. For spacing use
> `utilities/_spacing.scss` (`.syx-mt-*`, `.syx-pt-*`, …).

---

### `_icons.scss` — Social network icons (`helper-icons`)

Generates classes for social network icons including color, hover and variants. The `--icon-rrss-*` tokens are defined by each theme (which may have different brand colors per theme).

```html
<!-- Base icon -->
<span class="syx-icon syx-icon--facebook-primary" aria-hidden="true"></span>
<span class="syx-icon syx-icon--twitter-primary" aria-hidden="true"></span>
<span class="syx-icon syx-icon--instagram-primary" aria-hidden="true"></span>
<span class="syx-icon syx-icon--youtube-primary" aria-hidden="true"></span>
<span class="syx-icon syx-icon--whatsapp-primary" aria-hidden="true"></span>
<span class="syx-icon syx-icon--linkedin-primary" aria-hidden="true"></span>
```

Always use `aria-hidden="true"` on decorative icons. If the icon **is** the button's label, add `<span class="syx-sr-only">Label</span>` next to it.

```html
<!-- Accessible pattern -->
<a href="#" class="atom-link">
  <span class="syx-icon syx-icon--facebook-primary" aria-hidden="true"></span>
  <span class="syx-sr-only">Follow us on Facebook</span>
</a>
```

---

## How it works internally

1. `syx-core(example-01)` (in `themes/_shared/_core.scss`) calls `@include helper-backgrounds(example-01)`
2. The mixin compiles the `.syx-bg-color-*` classes with the theme tokens
3. The classes are wrapped in `@layer syx.utilities` → they always win over components
4. Each theme's final CSS has its own variations of these classes

## Adding a new helper

1. Create `_mi-helper.scss` in this folder
2. Define `@mixin helper-mi-helper($theme: null) { @layer syx.utilities { ... } }`
3. Use `.syx-*` as the prefix for the generated classes
4. `@forward` in `helpers/helpers.scss`
5. Call `@include helper-mi-helper($theme)` only once in `themes/_shared/_core.scss` (the `syx-core()` mixin)
