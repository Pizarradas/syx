---
description: How to create a new SYX component (atom, molecule, or organism)
---

# Workflow: Create a New Component

Use this workflow every time you need to add a new atom, molecule, or organism to SYX. Follow the steps in order — do not skip any.

---

## Step 0: Decide the Layer

Answer these questions before writing any code:

1. Is it a single HTML element or a very small self-contained pattern?
   → **Atom** (`scss/atoms/`, prefix `atom-`)

2. Does it combine 2+ atoms into one logical UI unit?
   → **Molecule** (`scss/molecules/`, prefix `mol-`)

3. Does it represent a full UI section (header, hero, feature grid)?
   → **Organism** (`scss/organisms/`, prefix `org-`)

4. Is it a pure CSS helper with no markup dependency?
   → **Utility** (`scss/utilities/`, prefix `syx-`) — this is NOT a component.

> **If unsure between atom and molecule:** ask "Would these sub-parts ever make sense independently?" If yes → separate atoms. If no → molecule.

---

## Step 1: Define Component Tokens

Create `scss/abstracts/tokens/components/_{name}.scss`:

```scss
// component: {name}
// ===============================================
:root {
  --component-{name}-bg:            var(--semantic-color-bg-primary);
  --component-{name}-color:         var(--semantic-color-text-primary);
  --component-{name}-border:        var(--semantic-color-border-default);
  --component-{name}-border-width:  var(--semantic-border-width);
  --component-{name}-radius:        var(--semantic-border-radius-md);
  --component-{name}-padding-y:     var(--semantic-space-inset-md);
  --component-{name}-padding-x:     var(--semantic-space-inset-lg);
  // Add only the tokens this component actually needs
}
```

**Rules:**

- Token names follow: `--component-{name}-{property}-{variant}-{state}`
- Never use `--primitive-*` here. Always map from `--semantic-*`.
- Only define tokens that need to be overridden per theme.

// turbo

## Step 2: Register the Token File

Add to `scss/abstracts/tokens/index.scss`:

```scss
@forward "components/{name}";
```

---

## Step 3: Create the Component File

Create `scss/{layer}/_{name}.scss` using this exact template:

```scss
// CORE
// ===============================================
@use "../abstracts/index" as *;
// ===============================================

// {layer}: {name}
// ===============================================
@mixin {prefix}-{name}($theme: null) {
  @layer syx.{atoms|molecules|organisms} {

  .{prefix}-{name} {
    // 1. Positioning
    @include relative();

    // 2. Display / Box model
    @include flex-center();

    // 3. Dimensions
    // @include size(…, …);

    // 4. Spacing
    @include padding(var(--component-{name}-padding-y) var(--component-{name}-padding-x));

    // 5. Typography
    color: var(--component-{name}-color);

    // 6. Visual
    background-color: var(--component-{name}-bg);
    @include border(all, var(--component-{name}-border-width), solid, var(--component-{name}-border));
    @include border-radius(var(--component-{name}-radius));

    // 7. Transitions
    @include transition(background-color 0.2s ease, color 0.2s ease);

    // 8. States
    &:hover { … }

    &:focus-visible {
      @include focus-ring();
    }

    // 9. Elements
    &__element { … }

    // Modifiers
    &--modifier { … }

    // Theme variations
    @if $theme == "example-02" {
      // theme-specific one-off rules here
    }

  }

  } // end @layer
}
```

**Checklist before proceeding:**

- [ ] Layer declaration (`@layer syx.{atoms|molecules|organisms}`) wraps ALL rules
- [ ] No hardcoded values (no hex, no oklch, no px for design values)
- [ ] All positions use `@include absolute/relative/fixed/sticky()`
- [ ] All spacing uses `@include margin()` / `@include padding()`
- [ ] All transitions use `@include transition()`
- [ ] All borders use `@include border()`
- [ ] Focus state uses `@include focus-ring()` inside `:focus-visible`
- [ ] Mixin has `$theme: null` parameter

// turbo

## Step 4: Register the Component Mixin

Add to `scss/{layer}/index.scss`:

```scss
@forward "{name}";
```

---

// turbo

## Step 5: Add to Theme setup.scss files

For each theme that should include this component, add to `scss/themes/{theme}/setup.scss`:

```scss
@include {prefix}-{name}();
// or with theme:
@include {prefix}-{name}("{theme-name}");
```

---

## Step 6: Test Compilation

Run for each theme:

```bash
sass scss/styles-theme-example-01.scss css/styles-theme-example-01.css --style=compressed --no-source-map
sass scss/styles-theme-example-02.scss css/styles-theme-example-02.css --style=compressed --no-source-map
# ...repeat for all 6 themes
```

Or shorthand: `npm run build`

Fix any errors before proceeding.

---

// turbo

## Step 7: Update component-registry.json

Add an entry to `component-registry.json`:

```json
{
  "name": "{name}",
  "layer": "atom|molecule|organism",
  "file": "scss/{layer}/_{name}.scss",
  "tokenFile": "scss/abstracts/tokens/components/_{name}.scss",
  "classes": ["{prefix}-{name}", "{prefix}-{name}--modifier"],
  "elements": ["{prefix}-{name}__element"],
  "tokens": ["--component-{name}-bg", "--component-{name}-color"]
}
```

---

## PR Checklist

Before committing:

- [ ] Token file created and registered
- [ ] Component file created with `@mixin` wrapper and `@layer`
- [ ] Registered in `{layer}/index.scss`
- [ ] All 6 themes compile without errors
- [ ] No hardcoded values, no `!important`, no raw `transition:` or `position:`
- [ ] `component-registry.json` updated
