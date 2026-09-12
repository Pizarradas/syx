---
description: How to create a new SYX theme from the _template
---

# Workflow: Create a New Theme

Use this workflow every time you need to add a new visual theme to SYX. Each theme is isolated in its own folder and overrides only what it needs.

---

## Step 1: Copy the Template

// turbo
Duplicate `scss/themes/_template/` into a new folder with your theme name
(lowercase, hyphenated). The template contains three files:

```
scss/themes/_template/
├── _theme.scss           ← Primitive overrides + theme-x-fonts() (the font list)
├── _setup.scss           ← ~15 lines of wiring; only theme names change
└── bundle-template.scss  ← Copy once per context you need (app/blog/core/docs/marketing)
```

Duplicate `bundle-template.scss` into `bundle-app.scss`, `bundle-blog.scss`,
`bundle-core.scss`, `bundle-docs.scss` and `bundle-marketing.scss` as needed —
the real themes carry those five (plus `bundle-home.scss` in the SYX site
themes only). A new product theme does **not** include `syx-bundle-site`:
that layer is SYX-page furniture.

---

## Step 2: Define Primitives in `_theme.scss`

Open `scss/themes/{name}/_theme.scss`. This file ONLY overrides primitive tokens.

Everything goes inside `@mixin theme-{name} { :root { … } }` (the
`_setup.scss` calls `@include theme-{name}()`); the font list goes in a
second mixin, `@mixin theme-{name}-fonts`. Note there is no
`--primitive-color-brand-*` family in the system — real themes **rebind**
existing primitives (`--primitive-color-blue-500`, etc., `// rebind:`);
`brand`/`accent` below are didactic names.

**Section 1 — Color Primitives (mandatory):**

```scss
@mixin theme-{name} {
  :root {
    // Override the raw palette — these feed into semantics
    --primitive-color-brand-50: oklch(…);
    --primitive-color-brand-100: oklch(…);
    // ...up to brand-900 (scales end at 900)
    --primitive-color-accent-50: oklch(…);
    // ...
  }
}
```

**Section 2 — Semantic Surface Tokens (mandatory, ALL must be defined —
same `:root`, inside the same `theme-{name}` mixin):**

```scss
// Backgrounds
--semantic-color-bg-primary: var(--primitive-color-brand-50);
--semantic-color-bg-secondary: var(--primitive-color-brand-100);
--semantic-color-bg-tertiary: var(--primitive-color-brand-200);

// Borders
--semantic-color-border-subtle: var(--primitive-color-brand-100);
--semantic-color-border-default: var(--primitive-color-brand-200);
--semantic-color-border-strong: var(--primitive-color-brand-400);

// Text
--semantic-color-text-primary: var(--primitive-color-brand-900);
--semantic-color-text-secondary: var(--primitive-color-brand-600);
--semantic-color-text-tertiary: var(--primitive-color-brand-400);
--semantic-color-text-inverse: oklch(1 0 0); // white, for dark backgrounds

// Interactive
--semantic-color-primary: var(--primitive-color-accent-500);
--semantic-color-primary-hover: var(--primitive-color-accent-600);
```

**Dark Mode Rule:** If the theme is dark, invert the scale:

- `bg-primary` = darkest value
- `bg-tertiary` = lightest (but still dark) value

**Restriction:** Never skip from primitive to component tokens. Always: primitive → semantic → component.

---

## Step 3: Configure `_setup.scss` and the fonts

`scss/themes/{name}/_setup.scss` is generated boilerplate: replace every
occurrence of "template" with your theme name and you are done — the
component list lives in `themes/_shared/_bundle-full.scss`, never here:

```scss
// themes/{name}/_setup.scss
@include universal-values();
@include theme-{name}();
@include theme-{name}-fonts();   // ← the font list, declared in _theme.scss
@include syx-core({name});
@include syx-bundle-full({name});
```

Declare the theme's fonts once, in `_theme.scss`, inside
`@mixin theme-{name}-fonts { … }` — the setup and every `bundle-*.scss`
call that mixin instead of repeating the `@include font-family()` list.

---

## Step 4: Structural differences (if any)

If the theme has structural differences (e.g., sidebar on right instead of
left, different logo size), express them as component tokens overridden in
`_theme.scss`; for a difference no token can carry, use an
`@if $theme == "{your-theme-name}"` block inside the component partial.

> The `$theme-config` map and `theme-cfg()` were retired on 2026-09-12 —
> nothing ever read them.

---

// turbo

## Step 5: Create the Entry Point SCSS File

In the root `scss/` folder, create `styles-theme-{name}.scss`:

```scss
@use "themes/{name}/setup";
```

---

// turbo

## Step 6: Register the theme in the guards

There is no per-theme build script — `npm run build` (`sass scss:css`)
compiles the whole tree, the new entry point included. What DOES need
updating are the hardcoded `THEMES` lists in two guards, or the new theme
stays invisible to them:

- `scripts/check-setups.js` — selector symmetry across themes
- `scripts/check-theme-symmetry.js` — dark/light token symmetry

Both are `scripts/` (human-only): write out the one-line diff and hand it
over.

---

## Step 7: Test All Themes

After adding a new theme, test that existing themes still compile correctly:

```bash
npm run build
```

Fix any cross-contamination issues (e.g., a token defined only in the new theme but expected by a shared component).

---

## Step 8: Verify Surface Tokens Checklist

Open the compiled CSS and search for `var(--semantic-color-bg-primary)` to ensure all surface tokens resolve correctly. Every surface token MUST have a value in the theme's `_theme.scss`.

**Mandatory token checklist:**

- [ ] `--semantic-color-bg-primary`
- [ ] `--semantic-color-bg-secondary`
- [ ] `--semantic-color-bg-tertiary`
- [ ] `--semantic-color-border-subtle`
- [ ] `--semantic-color-border-default`
- [ ] `--semantic-color-border-strong`
- [ ] `--semantic-color-text-primary`
- [ ] `--semantic-color-text-secondary`
- [ ] `--semantic-color-text-tertiary`
- [ ] `--semantic-color-text-inverse`
- [ ] `--semantic-color-primary`
- [ ] `--semantic-color-primary-hover`

---

## Dark Mode

If the theme supports dark mode, add dark mode overrides to `scss/abstracts/tokens/semantic/_dark-mode.scss` inside the `[data-theme="dark"]` selector. Only surface, text, and border tokens change — brand and tone colors remain constant.
