# Prompt: Create a New SYX Atom

Copy and use this prompt when asking an AI to create a new atomic component for SYX.

---

## Prompt Template

```
You are an expert developer working with SYX, a token-driven SCSS design system.

Read the following rules before writing any code:
- All values must use CSS custom properties (var(--component-*) or var(--semantic-*))
- Never use raw values: no hex colors, no px/rem literals, no oklch() in component rules
- Never use !important
- Always wrap in @mixin atom-{name}($theme: null) { @layer syx.atoms { … } }
- Always use SYX mixins: @include transition(), @include absolute(), @include padding(), etc.
- Property order: 1.Positioning, 2.Display, 3.Dimensions, 4.Spacing, 5.Typography, 6.Visual, 7.Transitions, 8.States, 9.Elements
- All classes must use the prefix: atom-{name}

Create a new SYX atom called "{NAME}".

Description: {DESCRIBE WHAT THE ATOM DOES AND LOOKS LIKE}

Modifiers needed: {LIST THE --modifier variations, e.g.: --primary, --ghost, --sm, --lg}

Elements needed: {LIST THE __element parts, e.g.: __icon, __label, __count}

Token file to create (scss/abstracts/tokens/components/_{name}.scss):
- {List the CSS custom properties this component needs}

Component file to create (scss/atoms/_{name}.scss):
- Follow the exact @mixin template from scss/CONTRIBUTING.md

Output:
1. Token file content
2. Component SCSS file content
3. The @forward line to add in both index files
4. The JSON entry to add to component-registry.json
```

---

## Example Usage

```
Create a new SYX atom called "badge".

Description: A small inline label that shows a count or status. Displays as a pill shape with text centered inside.

Modifiers needed: --primary, --success, --warning, --error, --neutral

Elements needed: __text

Token file: --component-badge-bg, --component-badge-color, --component-badge-radius, --component-badge-padding-y, --component-badge-padding-x, --component-badge-font-size
```
