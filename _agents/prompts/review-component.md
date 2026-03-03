# Prompt: Review a SYX Component

Copy and use this prompt to ask an AI to review existing SCSS against SYX conventions.

---

## Prompt Template

```
You are a senior developer reviewing SCSS code for SYX, a token-driven design system.

Review the following SCSS against these strict rules. For each violation found, report:
- File and line reference
- The violation type
- The correct replacement

## Rules to check:

### Rule 1: No raw values
- ❌ Any hex color, oklch(), hsl(), rgb() value that is not inside a `--primitive-*` definition
- ❌ Any raw px or rem literal used as a design value (e.g., `padding: 1rem`, `border-radius: 4px`)
- ✅ All values must use var(--component-*) or var(--semantic-*)

### Rule 2: No raw CSS where mixins exist
- ❌ `position: absolute`, `position: fixed`, `position: sticky` → use @include absolute/fixed/sticky()
- ❌ `transition: …` → use @include transition(…)
- ❌ `padding: …` → use @include padding(…)
- ❌ `margin: …` → use @include margin(…)
- ❌ `display: flex; align-items: center; justify-content: center` → use @include flex-center()
- ❌ `display: flex; align-items: center; justify-content: space-between` → use @include flex-between()

### Rule 3: No !important

### Rule 4: Correct token layer usage
- Component rules must NEVER use --primitive-* tokens
- Correct path: --primitive → --semantic → --component → rule

### Rule 5: Correct BEM prefixes
- Atoms: atom-{name}  |  Molecules: mol-{name}  |  Organisms: org-{name}

### Rule 6: @mixin and @layer wrapper
- Every component must be inside @mixin {prefix}-{name}($theme: null)
- Mixin body must be inside @layer syx.{atoms|molecules|organisms} { … }

### Rule 7: No attribute selectors for BEM
- ❌ [class*="--primary"]  →  ✅ &.atom-btn--primary

### Rule 8: No breakpoints without mixins
- ❌ @media (min-width: 768px)  →  ✅ @include breakpoint(tablet)

### Rule 9: Max nesting depth = 3 levels

### Rule 10: Property order
Check that properties follow this order within each rule block:
1. Positioning (include absolute/relative/etc.)
2. Display / Box model
3. Dimensions (size)
4. Spacing (margin, padding)
5. Typography (font-size, color, line-height)
6. Visual (background, border, shadow)
7. Transitions
8. States (&:hover, &:focus-visible, &--modifier)
9. Elements (&__element)

---

SCSS to review:

{PASTE SCSS HERE}

---

Output format:
1. Violations list (file reference, rule, fix)
2. Clean SCSS rewrite (if violations found)
3. Verdict: PASS or FAIL with summary
```
