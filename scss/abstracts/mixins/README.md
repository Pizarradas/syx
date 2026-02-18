# SYX Mixin Reference

> Complete reference for all 27 SYX native mixins.
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

Null-safe shorthand for `position` + offsets.

```scss
@include position(absolute, $top: 0, $right: 0);
// → position: absolute; top: 0; right: 0;

@include position(fixed, $bottom: 1rem, $left: 50%);
// → position: fixed; bottom: 1rem; left: 50%;

@include position(relative);
// → position: relative;
```

---

### `absolute($top, $right, $bottom, $left)`

Shorthand for `position(absolute, …)`.

```scss
@include absolute($top: 0, $left: 0);
// → position: absolute; top: 0; left: 0;

@include absolute($top: 50%, $left: 5px);
// → position: absolute; top: 50%; left: 5px;

@include absolute();
// → position: absolute;
```

---

### `fixed($top, $right, $bottom, $left)`

Shorthand for `position(fixed, …)`.

```scss
@include fixed($bottom: 0, $left: 0, $right: 0);
// → position: fixed; bottom: 0; left: 0; right: 0;
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
// → position: sticky; top: 0;
```

---

## Spacing

### `margin($values)`

Null-skipping shorthand for `margin`. Pass a space-separated list; `null` skips that side.

```scss
@include margin(1rem);
// → margin: 1rem;

@include margin(null auto);
// → margin-left: auto; margin-right: auto;

@include margin(1rem null 2rem null);
// → margin-top: 1rem; margin-bottom: 2rem;

@include margin(1rem 2rem 3rem 4rem);
// → margin-top: 1rem; margin-right: 2rem; margin-bottom: 3rem; margin-left: 4rem;
```

---

### `padding($values)`

Null-skipping shorthand for `padding`. Same API as `margin`.

```scss
@include padding(var(--component-btn-padding-y) var(--component-btn-padding-x));
// → padding-top: …; padding-right: …; padding-bottom: …; padding-left: …;

@include padding(null var(--layout-pad-4));
// → padding-left: …; padding-right: …;
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

Directional border shorthand. `$sides` can be `all`, `top`, `right`, `bottom`, `left`.

```scss
@include border(all, 1px, solid, var(--component-form-field-border));
// → border: 1px solid …;

@include border(bottom, 2px, solid, var(--semantic-color-primary));
// → border-bottom: 2px solid …;
```

---

### `border-radius($values)`

```scss
@include border-radius(var(--theme-radius));
// → border-radius: …;

@include border-radius(4px 8px);
// → border-radius: 4px 8px;
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
// → outline: 0.2rem solid var(--semantic-color-state-focus);
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

### `font-family($name, $path, $weight, $style, $display)`

Generates a complete `@font-face` rule.

```scss
@include font-family(
  "Space Grotesk",
  "../fonts/SpaceGrotesk-Regular",
  400,
  normal,
  swap
);
```

---

## Utilities

### `generate-utility($map, $prefix, $property)`

Generates utility classes from a Sass map.

```scss
$spacing-map: (
  sm: 0.5rem,
  md: 1rem,
  lg: 2rem,
);

@include generate-utility($spacing-map, "u-p", padding);
// → .u-p-sm { padding: 0.5rem; }
//   .u-p-md { padding: 1rem; }
//   .u-p-lg { padding: 2rem; }
```

---

### `generate-utility-directional($map, $prefix, $property)`

Generates directional utility classes (top/right/bottom/left/x/y).

```scss
@include generate-utility-directional($spacing-map, "u-m", margin);
// → .u-mt-sm { margin-top: 0.5rem; }
//   .u-mx-md { margin-left: 1rem; margin-right: 1rem; }
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

CSS triangle using borders.

```scss
@include triangle(8px, var(--semantic-color-primary), down);
```

---

### `behavior-in-ancestor($ancestor-class)`

Applies styles when an element has a specific ancestor class.

```scss
.syx-btn {
  @include behavior-in-ancestor(".theme-dark") {
    color: white;
  }
}
```
