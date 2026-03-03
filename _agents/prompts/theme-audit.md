# Prompt: Audit a SYX Theme File

Copy and use this prompt to ask an AI to audit a `_theme.scss` file for token contract violations.

---

## Prompt Template

```
You are a senior developer auditing a SYX theme file (_theme.scss) for token architecture violations.

The SYX token contract (V4) defines this strict cascade:
  --primitive-* → --semantic-* → --component-* → component rules

The _theme.scss file is the ONLY place where --primitive-* tokens should be assigned to --semantic-* tokens.
Component rules should NEVER appear in _theme.scss unless they override a specific --component-* token.

## Check for these violations:

### Violation 1: Missing mandatory surface tokens
Every _theme.scss MUST define ALL of these:
- --semantic-color-bg-primary
- --semantic-color-bg-secondary
- --semantic-color-bg-tertiary
- --semantic-color-border-subtle
- --semantic-color-border-default
- --semantic-color-border-strong
- --semantic-color-text-primary
- --semantic-color-text-secondary
- --semantic-color-text-tertiary
- --semantic-color-text-inverse
- --semantic-color-primary
- --semantic-color-primary-hover

Report any that are missing.

### Violation 2: Semantic tokens assigned directly (not via primitives)
In a branded theme, --semantic-* tokens should be assigned from --primitive-* tokens, not from raw values.
Exception: the _template theme's Section 3 (Neutral Brand) is allowed to set semantics directly.

❌ --semantic-color-bg-primary: oklch(0.98 0.01 240);  ← raw value in a branded theme
✅ --semantic-color-bg-primary: var(--primitive-color-brand-50);  ← via primitive

### Violation 3: Component tokens referencing primitives
--component-* tokens must reference --semantic-* tokens, not --primitive-* directly.
❌ --component-btn-primary-bg: var(--primitive-color-blue-500);
✅ --component-btn-primary-bg: var(--semantic-color-primary);

### Violation 4: Dark mode inversion
If this is a dark theme:
- --semantic-color-bg-primary should be the DARKEST value
- --semantic-color-bg-tertiary should be the LIGHTEST (but still dark) value
Check if the scale is correctly inverted.

### Violation 5: Unused --primitive-* overrides
Flag any --primitive-* token overridden in _theme.scss that is never referenced by any --semantic-* token in the theme.

---

_theme.scss file to audit:

{PASTE THE _theme.scss CONTENT HERE}

Theme name: {THEME NAME}
Is it a dark theme? {YES / NO}

---

Output:
1. List of missing mandatory tokens
2. List of raw value violations (with line references)
3. List of primitive-bypassing violations
4. Dark mode scale check (if applicable)
5. Overall verdict: COMPLIANT / NON-COMPLIANT + summary
```

---

## Example Usage

Paste the content of `scss/themes/example-02/_theme.scss` and set:

- Theme name: `example-02`
- Is it a dark theme? `YES`
