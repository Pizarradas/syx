---
description: How to create a new SYX theme from the _template
---

# Workflow: Create a New Theme

Use this workflow every time you need to add a new visual theme to SYX. Each theme is isolated in its own folder and overrides only what it needs.

---

## Step 1: Copy the Template

// turbo
Duplicate `scss/themes/_template/` into a new folder with your theme name (lowercase, hyphenated):

```
scss/themes/{your-theme-name}/
├── _theme.scss           ← Primitive overrides (colors, spacing, fonts)
├── setup.scss            ← Assembles the full theme
├── bundle-app.scss       ← App context bundle
├── bundle-docs.scss      ← Documentation context bundle
├── bundle-marketing.scss ← Marketing/landing context bundle
└── bundle-blog.scss      ← Blog/editorial context bundle
```

---

## Step 2: Define Primitives in `_theme.scss`

Open `scss/themes/{name}/_theme.scss`. This file ONLY overrides primitive tokens.

**Section 1 — Color Primitives (mandatory):**

```scss
// Override the raw palette — these feed into semantics
--primitive-color-brand-50: oklch(…);
--primitive-color-brand-100: oklch(…);
// ...up to brand-900
--primitive-color-accent-50: oklch(…);
// ...
```

**Section 2 — Semantic Surface Tokens (mandatory, ALL must be defined):**

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

## Step 3: Configure setup.scss

Open `scss/themes/{name}/setup.scss`. This file assembles everything for this theme. Ensure all component mixins that have theme-specific behavior are called with the theme name:

```scss
// themes/{name}/setup.scss
@use "theme";
@use "../../abstracts/index" as *;
// ... other @use imports ...

// Pass theme name to mixins that use $theme parameter:
@include org-site-header("{theme-name}");
// etc.
```

---

## Step 4: Add to `$theme-config` (if needed)

If the theme has structural differences (e.g., sidebar on right instead of left, different logo size), add an entry to `scss/abstracts/_theme-config.scss`:

```scss
$theme-config: (
  // ... existing themes ...
  "{your-theme-name}": (
      header-sidenav-side: left,
      header-logo-size: 2rem,
    )
);
```

Only add keys that differ from the defaults. See existing entries for reference.

---

// turbo

## Step 5: Create the Entry Point SCSS File

In the root `scss/` folder, create `styles-theme-{name}.scss`:

```scss
@use "themes/{name}/setup";
```

---

// turbo

## Step 6: Add Build Script to `package.json`

Add the new theme to the build pipeline by adding a compile command:

```bash
sass scss/styles-theme-{name}.scss css/styles-theme-{name}.css --style=expanded --no-source-map
```

Or integrate it into the existing `build:css` npm script.

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
