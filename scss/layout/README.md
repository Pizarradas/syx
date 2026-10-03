# layout/

SYX's layout pieces: the **column grid** and two **primitives** for what a product screen repeats over and over —a column with regular spacing and a row that wraps—.

| Class | File | For |
| ----- | ------- | ---- |
| `layout-grid` | `grids/_grid.scss` | The page or a section: 12 columns with the theme gutters |
| `layout-stack` | `_stack.scss` | Blocks one below another with the same spacing (`--xs` … `--xl`) |
| `layout-cluster` | `_cluster.scss` | Items in a row that wrap to a new line if they don't fit (`--xs` … `--lg`, `--between`, `--end`) |

**Layer**: `@layer syx.base` — any `.syx-*` utility overrides them without `!important`.
**They are included** from `themes/_shared/_core.scss`, so they are in every bundle.
The shell of an application (header, sidebar and content) is a component with its own color: `org-app-shell`, in `organisms/`.

---

## When to use the grid

Use `layout-grid` for **full-page layouts** or **content sections** that need a column grid with gutters consistent with the spacing system.

For micro-layouts (flex row, centering, one-off alignments), use the utilities in `utilities/_display.scss` (`.syx-d-flex`, `.syx-gap-*`, etc.).

---

## Base structure

```html
<!-- Grid container + 2 columns -->
<div class="layout-grid">
  <div class="layout-grid__col-xs-6">Left column</div>
  <div class="layout-grid__col-xs-6">Right column</div>
</div>
```

```html
<!-- 3 unequal columns -->
<div class="layout-grid">
  <div class="layout-grid__col-xs-3">Sidebar</div>
  <div class="layout-grid__col-xs-6">Main content</div>
  <div class="layout-grid__col-xs-3">Aside</div>
</div>
```

The columns must add up to **12** (12-column system).

---

## Container modifiers

| Modifier                    | Effect                                    |
| --------------------------- | ----------------------------------------- |
| `layout-grid--no-padding`   | Removes the container's side padding      |
| `layout-grid--is-edge2edge` | Full-width grid with no side padding      |
| `layout-grid--no-gap`       | Removes the gap between columns           |
| `layout-grid--align-center` | Vertically centered alignment             |

```html
<!-- Grid without padding (for edge-to-edge images) -->
<div class="layout-grid layout-grid--no-padding">
  <div class="layout-grid__col-xs-12">
    <img class="syx-img-fluid syx-obj-cover syx-w-full" src="..." alt="..." />
  </div>
</div>
```

---

## Responsive breakpoints

The grid uses a mobile-first system. Columns can be specified per breakpoint:

```html
<!-- 12 columns on mobile, 6 on tablet, 4 on desktop -->
<div class="layout-grid__col-xs-12 layout-grid__col-sm-6 layout-grid__col-md-4">
  ...
</div>
```

| Modifier       | Breakpoint                         |
| -------------- | ---------------------------------- |
| `__col-xs-{n}` | All screens (mobile-first)         |
| `__col-sm-{n}` | ≥ 48em (768px)                     |
| `__col-md-{n}` | ≥ 64em (1024px)                    |
| `__col-lg-{n}` | ≥ 80em (1280px)                    |

---

## Nested grid

For grids inside grids, the child grid inherits the parent container's padding. Use `--no-pad` on the child to remove the double padding:

```html
<div class="layout-grid">
  <div class="layout-grid__col-xs-8">
    <!-- Nested grid — use layout-grid__nested for the child grid -->
    <div class="layout-grid__nested">
      <div class="layout-grid__col-xs-6">Sub-col A</div>
      <div class="layout-grid__col-xs-6">Sub-col B</div>
    </div>
  </div>
  <div class="layout-grid__col-xs-4">Aside</div>
</div>
```

> `layout-grid__nested` has `padding: 0` by default to avoid the double gutter. No additional modifier is needed.

---

## Stack and cluster

```html
<!-- A settings screen: stacked sections, actions that wrap -->
<div class="layout-stack layout-stack--lg">
  <section>…</section>
  <section>…</section>
  <div class="layout-cluster layout-cluster--end">
    <button class="atom-btn atom-btn--secondary" type="button">Cancel</button>
    <button class="atom-btn atom-btn--primary atom-btn--filled" type="button">Save</button>
  </div>
</div>
```

| Modifier | Stack (`--semantic-space-stack-*`) | Cluster (`--semantic-space-inline-*`) |
| ----------- | ---------------------------------- | ------------------------------------- |
| default | `md` (24 px) | `xs` (8 px) |
| `--xs` … `--lg` | 8 · 16 · 24 · 32 px | 8 · 16 · 24 · 32 px |
| `--xl` | 48 px | — |
| `--between` | — | spreads to the ends |
| `--end` | — | aligns to the end of the line (logical: in RTL it is the left) |

They do not duplicate the utilities: `layout-stack` is `syx-d-flex syx-flex-col` with the stack scale by default, and `layout-cluster` is `syx-d-flex syx-flex-wrap syx-items-center` with the inline scale. Use the primitive when the pattern is exactly that (it reads better and the spacing comes from the right scale) and the utilities for a one-off adjustment. They use `gap`, never margins: a child with `hidden` leaves no gap.

---

## Combining with utilities

`.syx-*` utilities can be added directly to grid columns:

```html
<div class="layout-grid syx-gap-4">
  <div class="layout-grid__col-xs-6 syx-d-flex syx-flex-col syx-justify-center">
    <h2 class="syx-type-h2">Title</h2>
    <p class="atom-txt syx-text-gray">Description</p>
  </div>
  <div class="layout-grid__col-xs-6">
    <img class="syx-img-fluid syx-obj-cover" src="..." alt="..." />
  </div>
</div>
```

---

## Technical notes

- The grid uses CSS `padding` and `gap` for the gutters — the values come from the active theme's `--layout-*` tokens
- The `--no-padding` / `--is-edge2edge` modifier applies `padding: 0` — no `!important` needed thanks to `@layer syx.base`
- There are no JS dependencies — it is pure CSS

---

## Adding new layout systems

If you need a different layout system (masonry, CSS subgrid, etc.):

1. Create `grids/_mi-layout.scss` (a grid) or `_mi-primitiva.scss` (a primitive)
2. Add its `@forward` in `layout/index.scss`
3. Include its mixin in `themes/_shared/_core.scss`
4. Document it in this README
