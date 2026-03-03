# Prompt: Create a New SYX Molecule

Copy and use this prompt when asking an AI to create a new molecular component for SYX.

---

## Prompt Template

```
You are an expert developer working with SYX, a token-driven SCSS design system.

A molecule in SYX combines 2 or more atoms into a single logical UI unit.
The molecule's SCSS should define layout and composition — NOT override the internal styles of its atoms.

Rules:
- All values must use CSS custom properties (var(--component-*) or var(--semantic-*))
- Never use raw values, !important, or raw position/transition/padding properties
- Always wrap in @mixin mol-{name}($theme: null) { @layer syx.molecules { … } }
- Always use SYX mixins: @include transition(), @include flex-center(), @include padding(), etc.
- The molecule MAY set gap, grid-template, align-items, etc. to position its child atoms
- The molecule MUST NOT redefine internal styles of atom classes
- Property order: 1.Positioning, 2.Display, 3.Dimensions, 4.Spacing, 5.Typography, 6.Visual, 7.Transitions, 8.States, 9.Elements
- All classes use the prefix: mol-{name}

Create a new SYX molecule called "{NAME}".

Description: {DESCRIBE WHAT THE MOLECULE DOES — which atoms does it combine, what is the layout?}

Composed of atoms: {LIST THE atoms used, e.g.: atom-btn, atom-icon, atom-label}

Modifiers needed: {LIST modifiers, e.g.: --horizontal, --stacked, --compact}

Elements needed: {LIST elements, e.g.: __header, __body, __actions}

HTML example of usage:
{PASTE OR DESCRIBE EXAMPLE HTML}

Output:
1. Token file: scss/abstracts/tokens/components/_{name}.scss
2. Component SCSS file: scss/molecules/_{name}.scss
3. The @forward lines for both index files
4. A usage HTML example
5. The JSON entry for component-registry.json
```

---

## Example Usage

```
Create a new SYX molecule called "alert".

Description: An inline notification block that combines an icon, a title, and body text. The icon is on the left, the text content on the right. Supports tonal variants for feedback states.

Composed of atoms: atom-icon, atom-title (or atom-txt)

Modifiers needed: --info, --success, --warning, --error

Elements needed: __icon, __content, __title, __body

HTML example:
<div class="mol-alert mol-alert--info" role="alert">
  <span class="atom-icon --lc-info" aria-hidden="true"></span>
  <div class="mol-alert__content">
    <p class="mol-alert__title atom-title atom-title--sm">Note</p>
    <p class="mol-alert__body atom-txt">Your changes have been saved.</p>
  </div>
</div>
```
