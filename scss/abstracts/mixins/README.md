# SYX Mixin Reference

> Complete reference for the SYX native mixin library.
> All mixins are **null-safe** — passing `null` for any parameter skips that property entirely.

---

## Import

All mixins are available via the abstracts index:

```scss
@use "../abstracts/index" as *;

// Then use any mixin directly:
@include transition(color 0.2s ease);
```

---

## Positioning

### `position($position, $top, $right, $bottom, $left)`

Null-safe shorthand for `position` + offsets. The offsets are output as **logical properties** (`$top` → `inset-block-start`, `$right` → `inset-inline-end`, `$bottom` → `inset-block-end`, `$left` → `inset-inline-start`): the same in LTR, mirrored in RTL. To center with `translate`, use `absolute-center`, which is physical on purpose.

```scss
@include position(absolute, $top: 0, $right: 0);
// → position: absolute; inset-block-start: 0; inset-inline-end: 0;

@include position(fixed, $bottom: 1rem, $left: 50%);
// → position: fixed; inset-block-end: 1rem; inset-inline-start: 50%;

@include position(relative);
// → position: relative;
```

---

### `absolute($top, $right, $bottom, $left)`

Shorthand for `position(absolute, …)`.

```scss
@include absolute($top: 0, $left: 0);
// → position: absolute; inset-block-start: 0; inset-inline-start: 0;

@include absolute($top: 50%, $left: 5px);
// → position: absolute; inset-block-start: 50%; inset-inline-start: 5px;

@include absolute();
// → position: absolute;
```

---

### `fixed($top, $right, $bottom, $left)`

Shorthand for `position(fixed, …)`.

```scss
@include fixed($bottom: 0, $left: 0, $right: 0);
// → position: fixed; inset-block-end: 0; inset-inline-start: 0; inset-inline-end: 0;
```

---

### `relative($top, $right, $bottom, $left)`

Shorthand for `position(relative, …)`.

```scss
@include relative();
// → position: relative;
```

---

### `sticky($top, $right, $bottom, $left)`

Shorthand for `position(sticky, …)`.

```scss
@include sticky($top: 0);
// → position: sticky; inset-block-start: 0;
```

---

## Spacing

### `margin($values)`

Null-skipping shorthand for `margin`. Pass a space-separated list; `null` skips that side.

```scss
@include margin(1rem);
// → margin: 1rem;

@include margin(null auto);
// → margin-inline-end: auto; margin-inline-start: auto;

@include margin(1rem null 2rem null);
// → margin-block-start: 1rem; margin-block-end: 2rem;

@include margin(1rem 2rem 3rem 4rem);
// → margin-block: 1rem 3rem; margin-inline: 4rem 2rem;  (start end = left right in LTR)
```

---

### `padding($values)`

Null-skipping shorthand for `padding`. Same API as `margin`.

```scss
@include padding(var(--component-button-padding-y) var(--component-button-padding-x));
// → padding: … …;

@include padding(null var(--layout-pad-4));
// → padding-inline-end: …; padding-inline-start: …;
```

---

## Sizing

### `size($width, $height)`

Sets `width` and `height`. If only `$width` is given, applies to both.

```scss
@include size(48px);
// → width: 48px; height: 48px;

@include size(100%, 48px);
// → width: 100%; height: 48px;

@include size(null, 48px);
// → height: 48px;
```

---

## Borders

### `border($sides, $width, $style, $color)`

Directional border shorthand. `$sides` can be `all`, `top`, `right`, `bottom`, `left` (also `no-*`, `vertical`, `horizontal`, `top-left`…). Output is logical: `top` → `border-block-start`, `left` → `border-inline-start`, `horizontal` → `border-inline`.

```scss
@include border(all, 1px, solid, var(--component-form-field-border));
// → border: 1px solid …;

@include border(bottom, 2px, solid, var(--semantic-color-primary));
// → border-block-end: 2px solid …;
```

---

### `border-radius($values)`

```scss
@include border-radius(var(--theme-radius));
// → border-radius: …;

@include border-radius(4px 8px);
// → border-radius: 4px 8px;   (symmetric: the same in LTR and RTL)

@include border-radius(4px 0 0 4px);
// → border-start-start-radius: 4px; border-start-end-radius: 0;
//   border-end-end-radius: 0; border-end-start-radius: 4px;
```

---

## Transitions

### `transition($props...)`

Outputs `transition` with an automatic `prefers-reduced-motion: reduce` guard that sets `transition: none`.

```scss
@include transition(color 0.2s ease);
// → transition: color 0.2s ease;
//   @media (prefers-reduced-motion: reduce) { transition: none; }

@include transition(opacity 0.3s ease, transform 0.3s ease);
// → transition: opacity 0.3s ease, transform 0.3s ease;
//   @media (prefers-reduced-motion: reduce) { transition: none; }
```

> **Always use this mixin** instead of raw `transition:`. The reduced-motion guard is automatic.

---

## Media Queries

### `breakpoint($name)`

Named breakpoint shorthand. Mobile-first (min-width).

| Name          | Value             | Approx px |
| ------------- | ----------------- | --------- |
| `mobile-only` | max-width: 37.5em | 600px     |
| `phablet`     | min-width: 37.5em | 600px     |
| `tablet`      | min-width: 50em   | 800px     |
| `laptop`      | min-width: 64em   | 1024px    |
| `desktop`     | min-width: 70em   | 1120px    |
| `wide`        | min-width: 90em   | 1440px    |

```scss
@include breakpoint(tablet) {
  font-size: 1.25rem;
}
// → @media (min-width: 50em) { font-size: 1.25rem; }
```

---

### `min-screen($min)` / `max-screen($max)` / `screen($min, $max)`

Raw value range helpers.

```scss
@include min-screen(768px) { … }
// → @media (min-width: 768px) { … }

@include max-screen(600px) { … }
// → @media (max-width: 600px) { … }

@include screen(600px, 1024px) { … }
// → @media (min-width: 600px) and (max-width: 1024px) { … }
```

---

### `mq($args...)`

Generic keyword-argument media query builder.

```scss
@include mq($min-width: 60em, $max-width: 80em) { … }
// → @media only screen and (min-width: 60em) and (max-width: 80em) { … }
```

---

### `darkmode`

Outputs content for both OS dark mode preference and `data-theme="dark"` attribute.
Respects `data-theme="light"` override.

```scss
.card {
  background: white;

  @include darkmode {
    background: #111;
  }
}
// → @media (prefers-color-scheme: dark) {
//     :root:not([data-theme='light']) .card { background: #111; }
//   }
//   :root[data-theme='dark'] .card { background: #111; }
```

---

### `reduced-motion`

Wraps content in `prefers-reduced-motion: reduce`.

```scss
.btn {
  @include transition(opacity 0.3s ease);

  @include reduced-motion {
    transition: none;
  }
}
```

---

### `landscape` / `portrait`

```scss
@include landscape { … }
// → @media (orientation: landscape) { … }

@include portrait { … }
// → @media (orientation: portrait) { … }
```

---

## Flexbox

### `flex-center()`

`display: flex` + `align-items: center` + `justify-content: center`.

```scss
.icon-wrapper {
  @include flex-center();
}
// → display: flex; align-items: center; justify-content: center;
```

---

### `flex-between()`

`display: flex` + `align-items: center` + `justify-content: space-between`.

```scss
.toolbar {
  @include flex-between();
}
// → display: flex; align-items: center; justify-content: space-between;
```

---

## Accessibility

### `sr-only()`

WCAG-compliant visually hidden (screen-reader accessible).

```scss
.skip-link {
  @include sr-only();
}
// → position: absolute; width: 1px; height: 1px;
//   padding: 0; margin: -1px; overflow: hidden;
//   clip-path: inset(50%); white-space: nowrap; border: 0;
```

---

### `sr-only-reset()`

Reverts `sr-only()` — makes the element visible again.

```scss
.skip-link:focus {
  @include sr-only-reset();
}
```

---

### `focus-ring($color, $offset)`

Accessible focus outline.

```scss
.btn:focus-visible {
  @include focus-ring();
}
// → outline: 0.2rem solid var(--theme-focus-ring-color);
//   outline-offset: 0.2rem;
```

---

## Text

### `truncate($max-width)`

Single-line text truncation with ellipsis.

```scss
.card__title {
  @include truncate(200px);
}
// → max-width: 200px; overflow: hidden;
//   white-space: nowrap; text-overflow: ellipsis;
```

---

### `ellipsis($lines)`

Multi-line text clamp with ellipsis.

```scss
.card__excerpt {
  @include ellipsis(3);
}
// → display: -webkit-box; -webkit-line-clamp: 3;
//   -webkit-box-orient: vertical; overflow: hidden;
```

---

## Direction (RTL)

### `mirror-rtl($pseudo)`

Mirrors a directional icon horizontally (`scale: -1 1`) —a “next/previous” arrow or chevron— when the text runs right to left. It is included on the element; `$pseudo` targets its pseudo-element. It sits behind `@supports selector(:dir(rtl))`, so in browsers without `:dir()` the icon is simply not mirrored.

```scss
.atom-pagination__trigger {
  @include mirror-rtl('::before');
}
// → @supports selector(:dir(rtl)) { .atom-pagination__trigger:dir(rtl)::before { scale: -1 1; } }
```

---

## Layout

### `aspect-ratio($width, $height)`

Native `aspect-ratio` with `@supports` fallback.

```scss
.video-wrapper {
  @include aspect-ratio(16, 9);
}
// → @supports (aspect-ratio: 1) { aspect-ratio: 16 / 9; }
//   @supports not (aspect-ratio: 1) { /* padding-top fallback */ }
```

---

### `clearfix()`

Modern clearfix using `display: flow-root`.

```scss
.container {
  @include clearfix();
}
// → display: flow-root;
```

---

## Background

### `background-setup($image, $position-size, $repeat, $attachment, $origin, $clip, $color)`

Multi-property background shorthand.

```scss
@include background-setup(var(--icon-logo), "center / contain", no-repeat);
// → background: var(--icon-logo) center / contain no-repeat;
```

---

## Typography

### `syx-font($family, $weights)`

Declares one of the fonts SYX ships: one family per typeface, one woff2
`@font-face` per weight, plus a metric-matched fallback face
(`"<Family> Fallback"`, Arial/Times New Roman/Courier New rescaled with
`size-adjust`, `ascent-override` and `descent-override`) so the `swap` from
fallback to webfont does not shift the layout. Families and weights live in
`$syx-fonts`; asking for one that is not there is a compile error.

```scss
@include syx-font("Space Grotesk", 400 700);

// tokens name the family, then its fallback:
// "Space Grotesk", "Space Grotesk Fallback", Arial, sans-serif
// …and the weight goes in font-weight, not in the family name.
```

### `syx-font-external($family, $fallback-stack, $source: null)`

For a family SYX does not ship and the page loads elsewhere (a Google Fonts
`<link>`, a CDN). Emits no `@font-face`: it leaves a
`/* syx-font-external: … */` marker in expanded CSS (compressed output drops
it) so `check:setups` knows the family is loaded on purpose. The fallback stack
must end in a generic family, and the token must end with that same stack.
A family that is in `$syx-fonts` is a compile error: use `syx-font()`.

```scss
@include syx-font-external("Public Sans", (Arial, sans-serif), "Google Fonts");
// token: "Public Sans", Arial, sans-serif
```

### `font-family($name, $path, $weight, $style, $exts: woff2)`

A single `@font-face` for a font of your own (woff2 only by default, with
`font-display: swap`). Give every weight the same `$name`.

```scss
@include font-family("Brand Sans", "../fonts/brand/BrandSans-Regular", 400, normal);
@include font-family("Brand Sans", "../fonts/brand/BrandSans-Bold", 700, normal);
```

---

## Utilities

### `generate-utility($map, $prefix, $property)`

Generates utility classes from a Sass map.

<!-- syx: ejemplo-nuevo -->
```scss
$spacing-map: (
  sm: 0.5rem,
  md: 1rem,
  lg: 2rem,
);

// Illustration with a made-up map (sm/md/lg): the real utilities come
// from the system's 0–5 scale (.syx-p-0 … .syx-p-5).
@include generate-utility($spacing-map, "syx-p", padding);
// → .syx-p-sm { padding: 0.5rem; }
//   .syx-p-md { padding: 1rem; }
//   .syx-p-lg { padding: 2rem; }
```

---

### `generate-utility-directional($map, $prefix, $property)`

Generates directional utility classes (t/b/s/e/x/y, all logical; the physical l/r were retired in 5.0.0).

<!-- syx: ejemplo-nuevo -->
```scss
@include generate-utility-directional($spacing-map, "syx-m", margin);
// → .syx-mt-sm { margin-block-start: 0.5rem; }
//   .syx-ms-sm { margin-inline-start: 0.5rem; }
//   .syx-mx-md { margin-inline: 1rem; }
//   … etc
```

---

## Other

### `hide-visually()` / `unhide-visually()`

Legacy visually-hidden (prefer `sr-only()` for new code).

```scss
.legacy-hidden {
  @include hide-visually();
}
.legacy-shown {
  @include unhide-visually();
}
```

---

### `triangle($size, $color, $direction)`

CSS triangle using borders. Logical borders: `right` points to the end of the line and is mirrored in RTL; `up`/`down` do not change.

```scss
@include triangle(8px, var(--semantic-color-primary), down);
```

---

### `behavior-in-ancestor($ancestor-class)`

Applies styles when an element has a specific ancestor class.

```scss
.atom-btn {
  @include behavior-in-ancestor(".theme-dark") {
    color: white;
  }
}
```
