# atoms/

Atoms are the **smallest, indivisible interface components** of the system. Each one is self-sufficient: it has its own component tokens, its BEM variants and its built-in accessibility. They are mounted in `@layer syx.atoms`.

**Class prefix**: `atom-*`
**Layer**: `@layer syx.atoms`
**`.syx-*` utilities always override atoms** (by design of the layer stack)

---

## When to use atoms

- To build **any basic interactive element**: buttons, fields, checks, links
- As **building blocks** of molecules and organisms
- Never split an atom — if you need two components together, it is already a molecule

---

## Atom catalog

### `atom-btn` — Button

The most used atom. It has color, fill style and size variants.

```html
<!-- Variant and fill are independent -->
<button class="atom-btn atom-btn--primary atom-btn--filled">
  Primary filled
</button>
<button class="atom-btn atom-btn--primary">Primary outline</button>
<button class="atom-btn atom-btn--secondary atom-btn--filled">
  Secondary filled
</button>
<button class="atom-btn atom-btn--secondary">Secondary outline</button>

<!-- Sizes -->
<button class="atom-btn atom-btn--primary atom-btn--filled atom-btn--size-sm">
  Small
</button>
<button class="atom-btn atom-btn--primary atom-btn--filled">
  Medium (default)
</button>
<button class="atom-btn atom-btn--primary atom-btn--filled atom-btn--size-lg">
  Large
</button>

<!-- Circular (icon only) -->
<button
  class="atom-btn atom-btn--primary atom-btn--filled atom-btn--circle"
  aria-label="Search"
>
  <span class="atom-icon atom-icon--lc-search" aria-hidden="true"></span>
</button>

<!-- Disabled -->
<button class="atom-btn atom-btn--primary atom-btn--filled" disabled>
  Disabled
</button>
```

**Available modifiers:**

- Color: `--primary` · `--secondary`
- Style: `--filled` (solid) · no modifier (outline)
- Size: `--size-sm` · `--size-lg` (medium is the default)
- Shape: `--circle` (for icon-only buttons)

---

### Form (`atom-input`, `atom-select`, `atom-textarea`, `atom-label`) — Text field / Select

```html
<!-- Input with label -->
<label class="atom-label" for="email">Email</label>
<span class="atom-input-wrapper">
  <input class="atom-input" id="email" type="email" placeholder="Type..." />
</span>

<!-- Select -->
<span class="atom-input-wrapper">
  <select class="atom-select">
    <option>Option 1</option>
  </select>
</span>
```

> Always wrap the field in `mol-form-field` to get the correct spacing and label.

---

### `atom-check` — Checkbox

```html
<label class="atom-check">
  <input type="checkbox" class="atom-check__input" />
  Option text
</label>

<!-- Checked -->
<label class="atom-check">
  <input type="checkbox" class="atom-check__input" checked />
  Selected
</label>

<!-- Disabled -->
<label class="atom-check">
  <input type="checkbox" class="atom-check__input" disabled />
  Disabled
</label>
```

---

### `atom-radio` — Radio button

```html
<label class="atom-radio">
  <input type="radio" class="atom-radio__input" name="grupo" />
  Option A
</label>
<label class="atom-radio">
  <input type="radio" class="atom-radio__input" name="grupo" checked />
  Option B
</label>
```

---

### `atom-switch` — Toggle switch

```html
<label class="atom-switch">
  <input type="checkbox" class="atom-switch__input" role="switch" />
  <span class="atom-switch__slider" aria-hidden="true"></span>
  Enable notifications
</label>
```

---

### `atom-link` — Semantic link

```html
<a class="atom-link" href="#">Standard link</a>
<a class="atom-link atom-link--primary" href="#">Link in the primary color</a>
```

---

### `atom-label` — Field label

```html
<label class="atom-label" for="mi-campo">Name</label>
<label class="atom-label atom-label--primary" for="mi-campo">Email *</label>
```

---

### `atom-pill` — Pill / Badge

```html
<span class="atom-pill">Default</span>
<span class="atom-pill atom-pill--primary">Primary</span>
<span class="atom-pill atom-pill--success">Success</span>
<span class="atom-pill atom-pill--warning">Warning</span>
<span class="atom-pill atom-pill--danger">Error</span>
<span class="atom-pill atom-pill--neutral">Info</span>
```

---

### `atom-icon` — Icon

Base for icons from the system's internal library (arrows, controls, UI icons). For social network icons use `base/helpers/_icons.scss`.

```html
<span class="atom-icon atom-icon--arrow-default" aria-hidden="true"></span>
<span class="atom-icon atom-icon--lc-x" aria-hidden="true"></span>
<span class="atom-icon atom-icon--lc-search" aria-hidden="true"></span>
```

> Always `aria-hidden="true"` on decorative icons. Add `syx-sr-only` if the icon carries meaning.

---

### `atom-title` — Content heading

For headings inside components (cards, articles). For page/layout headings, use `syx-type-h*` from utilities.

```html
<h2 class="atom-title atom-title--h2">Section title</h2>
<h3 class="atom-title atom-title--h3">Subtitle</h3>
<h4 class="atom-title atom-title--h4">Card title</h4>
```

---

### `atom-txt` — Text block

Paragraph text with the system's base styles.

```html
<p class="atom-txt">Standard paragraph with SYX styles.</p>
<p class="atom-txt atom-txt--primary">Paragraph in the primary color.</p>
<p class="atom-txt syx-type-body-small">Small text / metadata: the size is set by the utility.</p>
```

---

### `atom-breadcrumb` — Breadcrumbs

```html
<nav aria-label="Breadcrumb">
  <ol class="atom-breadcrumb">
    <li class="atom-breadcrumb__item"><a href="/">Home</a></li>
    <li class="atom-breadcrumb__item"><a href="/blog">Blog</a></li>
    <li
      class="atom-breadcrumb__item"
      aria-current="page"
    >
      Article
    </li>
  </ol>
</nav>
```

---

### `atom-list` — Styled list

```html
<ul class="atom-list">
  <li class="atom-list__item">Item 1</li>
  <li class="atom-list__item">Item 2</li>
</ul>
```

---

### `atom-table` — Table

```html
<table class="atom-table">
  <thead>
    <tr>
      <th>Column</th>
      <th>Other</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Data</td>
      <td>Data</td>
    </tr>
  </tbody>
</table>
```

---

### `atom-pagination` — Pagination

```html
<nav class="atom-pagination" aria-label="Pagination">
  <a class="atom-pagination__item" href="#">«</a>
  <a class="atom-pagination__item atom-pagination__item--is-active" href="#" aria-current="page">1</a>
  <a class="atom-pagination__item" href="#">2</a>
  <a class="atom-pagination__item" href="#">»</a>
</nav>
```

---

### `atom-feature-icon` — Featured icon for Cards

For feature cards with a special rounded / shadowed container over the neutral icon.

```html
<div class="atom-feature-icon">
  <img src="...logo.svg" />
</div>
```

---

### `atom-stat` — Large numeric counter

For Hero panels or statistic counters that take up a large size.

```html
<p class="atom-stat"><span class="atom-stat__number">100/100</span> <span class="atom-stat__label">Lighthouse</span></p>
```

---

## Atom rules

1. **Never hardcode values** — always `--component-*` tokens
2. **Always accessibility**: `aria-*`, roles, native `disabled`
3. **Strict BEM**: `.atom-switch__slider`, `.atom-btn--primary`, never `.atom-btn .icon`
4. **No layout of its own**: an atom does not position itself on the page — that is the responsibility of the molecule or organism that contains it
