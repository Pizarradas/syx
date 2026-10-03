# utilities/

**Theme-agnostic** utility classes. They live in `@layer syx.utilities` — the highest layer in the stack, which means they **always override** any component (`atom-*`, `mol-*`, `org-*`) without needing `!important`.

**Prefix**: `.syx-*`
**Layer**: `@layer syx.utilities`
**Theme-dependent**: ❌ No — they are the same in every theme

> **Key difference from `base/helpers/`**: The utilities here are universal (they do not change by theme). If you need color, typography or icon classes that do vary by theme, use the helpers in `base/helpers/`.

---

## Numeric scale table

Several utilities use a `-1` to `-5` scale whose values **are always the same** and map directly to semantic tokens. This table is the decoding key:

| Step | Semantic token               | Approx. value    |
| ---- | ---------------------------- | ---------------- |
| `-1` | `--semantic-space-inline-xs` | 8px              |
| `-2` | `--semantic-space-inline-sm` | 16px             |
| `-3` | `--semantic-space-inline-md` | 24px             |
| `-4` | `--semantic-space-inline-lg` | 32px             |
| `-5` | `--semantic-space-layout-xl` | 32–48px (fluid)  |

Step `-0` is always `0`. **Spacing is fluid** in the layout range: the exact value varies between the minimum and maximum depending on the viewport.

Applies to: `.syx-m-*` · `.syx-p-*` · `.syx-gap-*` · `.syx-col-gap-*` · `.syx-row-gap-*`

---

## When to use these classes

Use `utilities/` to:

- **Compose layouts** with flexbox/grid without writing your own CSS
- **Adjust spacing** in one-off cases (margins, paddings)
- **Hide/show** elements by breakpoint
- **Control typography** (weight, alignment, transform, semantic color)
- **Embed responsive** iframes/maps/videos
- **Accessibility** (skip links, screen reader only)

**Do not** use these classes for:

- Theme-specific brand colors → use `base/helpers/` (`.syx-bg-color-primary`, `.syx-font-color-primary`)
- SVG icons → use `base/helpers/` (`.syx-icon--facebook-primary`)
- Components → use `atoms/`, `molecules/`, `organisms/`

---

## Files and classes

### `_display.scss` — Display, Flex, Grid, Position, Visibility

#### Display

| Class                 | Effect                                |
| --------------------- | ------------------------------------- |
| `.syx-d-flex`         | `display: flex`                       |
| `.syx-d-inline-flex`  | `display: inline-flex`                |
| `.syx-d-block`        | `display: block`                      |
| `.syx-d-inline-block` | `display: inline-block`               |
| `.syx-d-inline`       | `display: inline`                     |
| `.syx-d-none`         | `display: none` (hides the element)   |
| `.syx-d-grid`         | `display: grid`                       |
| `.syx-d-inline-grid`  | `display: inline-grid`                |
| `.syx-d-contents`     | `display: contents`                   |
| `.syx-d-table`        | `display: table`                      |
| `.syx-d-table-cell`   | `display: table-cell`                 |
| `.syx-d-table-row`    | `display: table-row`                  |
| `.syx-d-list-item`    | `display: list-item`                  |

#### Responsive visibility

| Class            | Behavior                                |
| ---------------- | --------------------------------------- |
| `.syx-d-sm-only` | Visible on mobile only (< 48em)         |
| `.syx-d-sm-up`   | Visible from 48em (768px) up            |
| `.syx-d-md-up`   | Visible from 64em (1024px) up           |
| `.syx-d-lg-up`   | Visible from 80em (1280px) up           |
| `.syx-d-xlg-up`  | Visible from 90em (1440px) up           |

#### Width / Height

`.syx-w-full` · `.syx-w-auto` · `.syx-h-full` · `.syx-h-auto` · `.syx-w-screen` · `.syx-h-screen`

#### Border

`.syx-border` · `.syx-border-none`

#### Flex — direction

`.syx-flex-row` · `.syx-flex-row-reverse` · `.syx-flex-col` · `.syx-flex-col-reverse`

#### Flex — wrap

`.syx-flex-wrap` · `.syx-flex-nowrap`

#### Flex — grow/shrink

`.syx-flex-1` · `.syx-flex-auto` · `.syx-flex-none`

#### Justify content

`.syx-justify-start` · `.syx-justify-end` · `.syx-justify-center` · `.syx-justify-between` · `.syx-justify-around` · `.syx-justify-evenly`

#### Align items

`.syx-items-start` · `.syx-items-end` · `.syx-items-center` · `.syx-items-baseline` · `.syx-items-stretch`

#### Align content

`.syx-content-start` · `.syx-content-end` · `.syx-content-center` · `.syx-content-between` · `.syx-content-around`

#### Align self

`.syx-self-start` · `.syx-self-end` · `.syx-self-center` · `.syx-self-auto`

#### Gap (references to `--semantic-space-inline-*` tokens)

| Class        | Token                        |
| ------------ | ---------------------------- |
| `.syx-gap-0` | 0                            |
| `.syx-gap-1` | `--semantic-space-inline-xs` |
| `.syx-gap-2` | `--semantic-space-inline-sm` |
| `.syx-gap-3` | `--semantic-space-inline-md` |
| `.syx-gap-4` | `--semantic-space-inline-lg` |
| `.syx-gap-5` | `--semantic-space-layout-xl` |

Also: `.syx-col-gap-{1–5}` and `.syx-row-gap-{1–5}` (same scale, equally exhaustive)

#### Overflow

`.syx-overflow-hidden` · `.syx-overflow-auto` · `.syx-overflow-scroll` · `.syx-overflow-x-hidden` · `.syx-overflow-y-auto`

#### Position

`.syx-relative` · `.syx-absolute` · `.syx-sticky` · `.syx-fixed` · `.syx-static`

Insets: `.syx-inset-0` · `.syx-top-0` · `.syx-bottom-0` · `.syx-start-0` · `.syx-end-0`

Retired in 5.0.0 (they were physical): ❌ `.syx-left-0` ✓ → `.syx-start-0` · ❌ `.syx-right-0` ✓ → `.syx-end-0`

#### Vertical align

`.syx-valign-top` · `.syx-valign-middle` · `.syx-valign-bottom` · `.syx-valign-baseline` · `.syx-valign-sub` · `.syx-valign-super`

#### Animations

`.syx-fade-in` — smooth fade in with `cubic-bezier`

---

### `_spacing.scss` — Margin and Padding

Scales from 0 to 5 mapped to `--semantic-space-inline-*` and `--semantic-space-layout-*`:

| Suffix | Token                        |
| ------ | ---------------------------- |
| `-0`   | 0                            |
| `-1`   | `--semantic-space-inline-xs` |
| `-2`   | `--semantic-space-inline-sm` |
| `-3`   | `--semantic-space-inline-md` |
| `-4`   | `--semantic-space-inline-lg` |
| `-5`   | `--semantic-space-layout-xl` |

All of them emit **logical properties** (`margin-block-start`, `padding-inline`…): `t`/`b` are the block axis, `x`/`y` the two axes, and the line sides use `s` (start: left in LTR, right in RTL) and `e` (end).

**Margin**: `.syx-m-{0–5}` · `.syx-mt-*` · `.syx-mb-*` · `.syx-ms-*` · `.syx-me-*` · `.syx-mx-*` · `.syx-my-*`

**Padding**: `.syx-p-{0–5}` · `.syx-pt-*` · `.syx-pb-*` · `.syx-ps-*` · `.syx-pe-*` · `.syx-px-*` · `.syx-py-*` (`.syx-pis-*`/`.syx-pie-*` are aliases of `ps`/`pe`)

**Shorthands**: `.syx-pad-section` (section padding) · `.syx-mx-auto` · `.syx-ms-auto` · `.syx-me-auto`

**Retired in 5.0.0** (deprecated since the 2026-10 audit, action 13). They were **physical** left/right and did not follow the text direction. To migrate, replace each class with its logical equivalent (in LTR they paint exactly the same):

| Retired | Use |
| --- | --- |
| ❌ `.syx-ml-*` · `.syx-mr-*` | ✓ `.syx-ms-*` · `.syx-me-*` |
| ❌ `.syx-pl-*` · `.syx-pr-*` | ✓ `.syx-ps-*` · `.syx-pe-*` |
| ❌ `.syx-ml-auto` · `.syx-mr-auto` | ✓ `.syx-ms-auto` · `.syx-me-auto` |
| ❌ `.syx-left-0` · `.syx-right-0` | ✓ `.syx-start-0` · `.syx-end-0` |
| ❌ `.syx-text-left` · `.syx-text-right` | ✓ `.syx-text-start` · `.syx-text-end` |

---

### `_text.scss` — Text, Typography and Color

#### Text color

`.syx-text-primary` · `.syx-text-secondary` · `.syx-text-white` · `.syx-text-gray` · `.syx-text-muted` · `.syx-text-inverse` · `.syx-text-error` · `.syx-text-success` · `.syx-text-warning`

Brand colors: `.syx-text-facebook` · `.syx-text-twitter` · `.syx-text-instagram` · `.syx-text-whatsapp`

#### Alignment

`.syx-text-center` · `.syx-text-start` · `.syx-text-end` · `.syx-text-justify` — retired in 5.0.0: ❌ `.syx-text-left` · `.syx-text-right` ✓ (see the `_spacing.scss` table)

#### Decoration

`.syx-text-underline` · `.syx-text-overline` · `.syx-text-strikethrough` · `.syx-text-no-underline`

#### Transform

`.syx-text-uppercase` · `.syx-text-lowercase` · `.syx-text-capitalize`

#### Font weight

`.syx-font-medium` · `.syx-font-bold`

#### Text measure (max-width)

`.syx-max-w-15ch` · `.syx-max-w-50ch` · `.syx-max-w-65ch`

#### Fluid type scale (Major Third × 1.250, fluid `clamp()`)

| Class                           | Use                         |
| ------------------------------- | --------------------------- |
| `.syx-type-h1` – `.syx-type-h4` | Content headings            |
| `.syx-type-body-large`          | Lead paragraph              |
| `.syx-type-body`                | Standard text               |
| `.syx-type-body-small`          | Secondary text / metadata   |
| `.syx-type-caption`             | Caption / overline          |

> For headings inside content components (articles, cards) prefer `atom-title atom-title--h{n}`.
> `syx-type-*` is better for page headings or layout sections.

---

### `_media.scss` — Images, Iframes and Object-fit

#### Responsive image

```html
<img class="syx-img-fluid" src="..." alt="..." />
```

#### Embed with aspect-ratio

```html
<div class="syx-embed syx-embed--16by9">
  <iframe class="syx-embed__item" src="..."></iframe>
</div>
```

Variants: `--16by9` · `--8by5` · `--3by2` · `--4by3` · `--1by1`

#### Map (Google Maps, etc.)

```html
<div class="syx-map syx-map--16by9">
  <iframe class="syx-map__iframe" src="..."></iframe>
</div>
```

Variants: `--16by9` · `--8by5` · `--4by3` · `--3by2` · `--h100`

#### Object-fit

`.syx-obj-cover` · `.syx-obj-contain` · `.syx-obj-fill` · `.syx-obj-none` · `.syx-obj-scale-down`

#### Object-position

`.syx-obj-center` · `.syx-obj-top` · `.syx-obj-bottom`

#### Background-size

`.syx-bg-cover` · `.syx-bg-contain` · `.syx-bg-auto`

---

### `_accessibility.scss` — A11y

| Class                    | Use                                                           |
| ------------------------ | ------------------------------------------------------------- |
| `.syx-sr-only`           | Visually hidden, accessible to screen readers                 |
| `.syx-sr-only-focusable` | Like `sr-only` but visible when it receives focus (tab)       |
| `.syx-skip-link`         | Skip-to-content at the start of the `<body>`                  |
| `.syx-motion-safe`       | Disables animations if the user prefers reduced-motion        |

```html
<!-- Skip link — at the start of the <body> -->
<a href="#main-content" class="syx-skip-link">Ir al contenido principal</a>

<!-- Accessible label for an icon -->
<button class="atom-btn atom-btn--primary atom-btn--circle" type="button">
  <span class="atom-icon atom-icon--lc-search" aria-hidden="true"></span>
  <span class="syx-sr-only">Buscar</span>
</button>
```

---

## Typical composition pattern

```html
<!-- Centered card, flex column, gap-3 -->
<div class="syx-d-flex syx-flex-col syx-items-center syx-gap-3 syx-p-4">
  <img class="syx-img-fluid syx-obj-cover" src="..." alt="..." />
  <p class="syx-type-body syx-text-gray syx-max-w-65ch">...</p>
  <button class="atom-btn atom-btn--primary atom-btn--filled syx-mt-2">
    CTA
  </button>
</div>
```

---

## Adding new utilities

1. Create `_mi-utilidad.scss` in this folder
2. Wrap everything in `@layer syx.utilities { ... }`
3. Use the prefix `.syx-{propiedad}-{valor}`
4. Register the `@forward` in `utilities/index.scss`
5. Do not use `!important`
6. Do not hardcode values — reference `--semantic-*` or `--primitive-*` tokens
