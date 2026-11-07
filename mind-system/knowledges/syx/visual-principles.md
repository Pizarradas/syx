# Visual Design Principles — cómo se implementa en SYX

## meta

| Campo | Valor |
|-------|-------|
| **Dominio** | SYX — implementación visual |
| **Fuente** | `_agents/modes/ui.md` hasta noviembre de 2026; sale del modo para que no se cargue en cada tarea |
| **Objetivo** | Rejilla, tipografía, color, elevación, movimiento, estados, correcciones ópticas, mejora progresiva y densidad para el modo `[SYX: UI]:` |
| **Agent tags** | `#visual-quality` `#states` `#motion` `#elevation` `#density` |

---

These principles govern **how** `[SYX: UI]:` implements, not just **what** you implement. A component that passes R01–R04 but violates these principles is not finished.

---

### 1. The 4px Base Grid

Every spacing value — padding, margin, gap, size — must resolve to a multiple of 4px. This is non-negotiable. The SYX semantic space tokens already follow this grid. Never introduce spacing that breaks it.

```
4px  → micro (icon gaps, tight labels)
8px  → xs
12px → sm
16px → md  ← default body rhythm
24px → lg
32px → xl
48px → 2xl
64px → 3xl
```

If a value doesn't land on the grid, it's a sign the token doesn't exist yet — create it.

---

### 2. Typography Implementation Rules

Font size alone is not typography. Apply all of the following when implementing any text-bearing component:

| Text role | `line-height` | `letter-spacing` | `font-weight` |
|---|---|---|---|
| Display / hero | `1.05–1.15` | `-0.03em` to `-0.05em` | `700–800` |
| Heading h2–h3 | `1.2–1.3` | `-0.02em` to `-0.03em` | `600–700` |
| Heading h4–h5 | `1.3–1.4` | `-0.01em` | `600` |
| Body / paragraph | `1.5–1.65` | `0` | `400` |
| UI label / caption | `1.3–1.4` | `+0.01em` to `+0.02em` | `500–600` |
| Overline / eyebrow | `1.2` | `+0.08em` to `+0.12em` | `600` |
| Monospace / code | `1.6` | `0` | `400` |

**Fluid type** — use `clamp()` for any heading that appears in a hero or display context:
```scss
font-size: clamp(var(--component-{name}-font-size-min), 4vw + 1rem, var(--component-{name}-font-size-max));
```

Never set `line-height` in `px`. It must be unitless or a semantic token.

---

### 3. Color — 60 / 30 / 10 Distribution

Within any component, color usage follows this ratio:

- **60 %** → neutral surfaces, backgrounds (`--semantic-color-bg-*`)
- **30 %** → secondary elements, subtle text, borders (`--semantic-color-text-secondary`, `--semantic-color-border-*`)
- **10 %** → action color, primary interactive elements (`--semantic-color-primary`)

**Never use action colors for decoration.** If you're tempted to use `--semantic-color-primary` on a non-interactive element, you're misusing it. Use a neutral with appropriate weight instead.

**Contrast minimum:**
- Normal text (< 18pt / < 14pt bold): **4.5:1** against its background
- Large text (≥ 18pt / ≥ 14pt bold): **3:1**
- UI components and focus rings: **3:1**

Always verify contrast at implementation time — don't assume the design file is correct.

---

### 4. Elevation System

Shadow communicates proximity to the user. Use one level per elevation tier. Never skip levels, never mix levels on the same component.

| Level | Token | Typical use |
|---|---|---|
| 0 | no shadow | Flat elements, table rows, list items |
| 1 | `--semantic-shadow-sm` | Cards, inputs, select dropdowns at rest |
| 2 | `--semantic-shadow-md` | Dropdowns open, tooltips, floating labels |
| 3 | `--semantic-shadow-lg` | Modals, drawers, popovers |
| 4 | `--semantic-shadow-xl` | Command palettes, full-screen overlays |

A card (Level 1) inside a modal (Level 3) does not gain a second shadow. Child elements inherit the elevation context of their container.

---

### 5. Motion — Duration, Easing, and Distance

Motion must feel **physical**, not mechanical. Apply these rules to every `@include transition()` and `animation`:

| Interaction type | Duration token | Easing token | When |
|---|---|---|---|
| Press / tactile feedback | `--semantic-duration-instant` (80ms) | `--semantic-easing-standard` | `:active` states |
| Color / opacity change | `--semantic-duration-fast` (150ms) | `--semantic-easing-linear` (or `-standard`) | Hover tints, focus rings — effects never overshoot |
| Micro-interaction | `--semantic-duration-fast` (150ms) | `--semantic-easing-out` | Checkbox check, switch toggle |
| Position / size change | `--semantic-duration-base` (250ms) | `--semantic-easing-in-out` | Dropdown open, accordion expand |
| Entry (element appears) | `--semantic-duration-base` → `-slow` (250–400ms) | `--semantic-easing-out` | Toast in, modal in |
| Exit (element disappears) | **one step below its entry** (≈75–85%) | `--semantic-easing-standard` (no exit token yet) | Toast out, modal out — exits are always faster |
| Long-distance / page | `--semantic-duration-slow` (400ms) | `--semantic-easing-in-out` | Page transitions, drawer |

Overshoot (`cubic-bezier(0.34, 1.56, 0.64, 1)`) has no token and is not a production default: it belongs to *expressive* moments (success, onboarding, brand), at most one per screen, and reaches `scss/` only through TOKEN. Durations in brackets are today's values, for reading — the component writes the token.

**Rules:**
- Never animate `width`, `height`, or `top/left/right/bottom` — they cause layout thrash. Use `transform` and `opacity` instead (GPU-composited).
- Never use `all` in a transition. Name each property explicitly.
- `will-change: transform` only on elements that are currently animating — remove it after.
- Every `animation` must include `@include reduced-motion { animation: none; }`.

---

### 6. State Visual Language — Beyond Color

**WCAG 1.4.1 (Use of Color):** Color cannot be the sole means of conveying a state. Every state must have at least two visual cues. Use this matrix:

| State | Required visual cues |
|---|---|
| **Hover** | Background tint + underline or subtle `transform: translateY(-1px)` |
| **Focus-visible** | `@include focus-ring()` — 2px outline, 2px offset, 3:1 contrast |
| **Active / Pressed** | `transform: scale(0.97)` or inset shadow (`box-shadow: inset 0 2px 4px …`) |
| **Disabled** | `color: var(--semantic-color-state-disabled)` + `cursor: not-allowed` — not just gray |
| **Error** | Border color change + background tint + error icon + error text |
| **Success** | Border color change + success icon + success text |
| **Loading** | Spinner or skeleton + `pointer-events: none` + `aria-busy="true"` on the container |

The focus ring via `@include focus-ring()` must meet WCAG 2.2 criterion 2.4.11:
- Minimum area: perimeter of the component × 2px
- Contrast: 3:1 between focused and unfocused state
- Not clipped by `overflow: hidden` on any ancestor

---

### 7. Optical Corrections

Mathematical precision often looks wrong. Apply these optical adjustments:

**Nested border-radius (radius compensation):**
When a child sits inside a rounded parent with padding, the child's radius must be:
```
child-radius = parent-radius − parent-padding
```
If `parent-radius = 12px` and `parent-padding = 8px`, then `child-radius = 4px`. Using `12px` on the child produces a "bulging corner" artifact.

**Icon-to-text alignment:**
Icons align to the **optical center** of the text cap-height, not the mathematical center of the line-height. For inline icons next to text, use `vertical-align: middle` as a starting point and adjust via `transform: translateY(-1px)` if the cap-height produces misalignment.

**Button optical padding:**
Horizontal padding should be 1.5–2× the vertical padding for buttons to feel visually balanced:
```scss
// Correct — wider horizontally
@include padding(var(--component-button-padding-y) var(--component-button-padding-x));
// Where padding-x = 1.5–2× padding-y
```

**Visual weight of outlines:**
An `outline-width: 2px` on a dark background looks thinner than on a light background. On dark surfaces, use `outline-width: 2.5px`, or raise `--semantic-focus-ring-width` in the theme's dark block.

---

### 8. Progressive Enhancement in CSS

Write a component in layers of increasing ambition. Each layer must be valid on its own: the component cannot break because a later layer never applied.

```
Layer 1 — Base          no breakpoints, no feature queries
                        typography, colour, spacing — usable at any viewport
Layer 2 — Layout        min-width breakpoints only, via @include breakpoint()
Layer 3 — Enhancement   @supports for backdrop-filter, container queries, :has()
Layer 4 — Motion        transitions and animation, always inside @include reduced-motion
```

**Rules:**
- Never write CSS that makes content unreachable when a media query or `@supports` block does not apply.
- `max-width` media queries are forbidden in component files. They are mobile-last thinking.
- Reordering with CSS `order` is fine. Duplicating HTML to serve a breakpoint is a structural error — hand it back to UX mode instead of solving it in SCSS.
- If a component leans on `@supports` for a layout property, the version without `@supports` must still be a usable component.

---

### 9. Density

> **Aspirational, not yet shipped:** no system component implements
> `--compact`/`--comfortable` today — sizing ships as `--size-sm/-md/-lg`
> (see `atom-btn`). Apply this section when a brief asks for density,
> following the pattern below; do not report its absence as a violation.

Components must support three density contexts without layout breakage. Implement via modifier:

| Density | Class | Padding-y multiplier | Font-size |
|---|---|---|---|
| Compact | `--compact` | `× 0.75` | One step down (`0.875rem` if body is `1rem`) |
| Default | _(none)_ | `× 1` | As designed |
| Comfortable | `--comfortable` | `× 1.375` | As designed |

Implement using token overrides on the component root, not by hardcoding values (a new modifier is a new component change: it goes through `propose.js`):
<!-- syx: ejemplo-nuevo -->
```scss
.atom-btn--compact {
  --component-button-padding-y: calc(var(--semantic-space-component-sm) * 0.75);
}
```
