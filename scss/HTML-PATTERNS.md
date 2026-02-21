# SYX — HTML Architecture & Class Naming Guide

> **For AI agents.** This file is co-located with `scss/` so you read it next to the component source.
> When generating or modifying HTML, always check this file first.

---

## 1. Class prefix rules (mandatory)

| Prefix | Layer | SCSS location | Example |
|---|---|---|---|
| `atom-` | Atomic component | `scss/atoms/` | `atom-btn`, `atom-icon` |
| `mol-` | Molecule | `scss/molecules/` | `mol-card`, `mol-landing-feature-card` |
| `org-` | Organism (layout section) | `scss/organisms/` | `org-landing-hero`, `org-landing-navbar` |
| `syx-` | Utility / helper | `scss/utilities/`, `scss/base/helpers/` | `syx-d-flex`, `syx-mt-4` |
| `layout-grid` | Grid system | `scss/layout/` | `layout-grid`, `layout-grid__col-xs-12` |
| `page-` | Page-level layout | `scss/pages/` | `page-home` |
| `helper-` | Theme helper (generated) | `scss/base/helpers/` | `helper-bg-color-primary` |

> **Never mix prefixes on the wrong element.**
> A card is `.mol-card`, not `.card` or `.syx-card`.

---

## 2. BEM structure within a component

```
.{prefix}-{component}               ← Block
.{prefix}-{component}__element      ← Element (double underscore)
.{prefix}-{component}--modifier     ← Modifier (double dash)
```

### Example: button (atom)

```html
<a class="atom-btn atom-btn--primary atom-btn--filled atom-btn--size-lg">
  Start Building Free
</a>
```

- `atom-btn` → block
- `atom-btn--primary` → modifier (color variant)
- `atom-btn--filled` → modifier (style variant)
- `atom-btn--size-lg` → modifier (size variant)

> Multiple modifiers on the same block are fine and intended.
> Do **not** nest modifiers: ~~`atom-btn--primary--filled`~~.

---

## 3. Class layering on a single element

One HTML element may carry classes from **multiple layers simultaneously**. The order should follow this mental model:

```
[organism/molecule/atom]  [layout]  [utilities]
```

### Real example from landing-velox.html

```html
<!-- Organism block + utility classes on the same div -->
<div class="org-landing-navbar__cta layout-grid__col-xs-3 layout-grid__col-sm-3
            syx-d-flex syx-justify-end syx-items-center syx-gap-2">
```

- `org-landing-navbar__cta` → BEM element of the navbar organism
- `layout-grid__col-xs-3` → grid column at xs breakpoint
- `layout-grid__col-sm-3` → grid column at sm breakpoint
- `syx-d-flex syx-justify-end syx-items-center syx-gap-2` → utility classes

> Utilities **always win** over organism styles (CSS `@layer` guarantees this).
> Use utilities to override layout/alignment without touching the component SCSS.

---

## 4. Grid system usage

```html
<!-- Always wrap in layout-grid -->
<div class="layout-grid">

  <!-- Full width on mobile, 8 cols on desktop, centred -->
  <div class="layout-grid__col-xs-12 layout-grid__col-md-8">
    ...
  </div>

</div>
```

### Breakpoint names

| Breakpoint | Token | Approximate width |
|---|---|---|
| `xs` | mobile | 0+ |
| `sm` | tablet | ~600px+ |
| `md` | desktop | ~1024px+ |
| `lg` | wide | ~1280px+ |

### Column span (1–12)

```html
<!-- Half width on desktop, full on mobile -->
<div class="layout-grid__col-xs-12 layout-grid__col-md-6">

<!-- One-third on desktop -->
<div class="layout-grid__col-xs-12 layout-grid__col-md-4">

<!-- Centred 8-col content block -->
<div class="layout-grid layout-grid--justify-center">
  <div class="layout-grid__col-xs-12 layout-grid__col-md-8">
```

> **Rule:** Never create custom flex containers for main page layout.
> Use `layout-grid` + `layout-grid__col-*` for all section-level grid placement.
> Use `syx-d-flex` + `syx-gap-*` only for **inline** composition inside columns.

---

## 5. Landing page section anatomy

Every section in a landing follows this structure:

```html
<section class="org-landing-{name}" id="{anchor}" aria-labelledby="{name}-title">
  <div class="org-landing-{name}__inner [layout-grid] [layout-grid--justify-center]">

    <!-- Section header (shared pattern across all sections) -->
    <div class="org-landing-section-head">
      <div class="org-landing-section-tag">Category label</div>
      <h2 class="org-landing-section-title" id="{name}-title">Section heading</h2>
      <p class="org-landing-section-lead">Supporting description</p>
    </div>

    <!-- Section body: grid of molecules -->
    <div class="org-landing-{name}__grid">
      <article class="mol-landing-{card-type}">
        ...
      </article>
    </div>

  </div>
</section>
```

### Shared section header classes (do not rename, they are global)

| Class | Purpose |
|---|---|
| `org-landing-section-head` | Container for tag + title + lead |
| `org-landing-section-tag` | Small category label above heading (e.g. "Platform", "Pricing") |
| `org-landing-section-title` | The `<h2>` of the section |
| `org-landing-section-lead` | Introductory paragraph below the heading |

---

## 6. Canonical organism patterns

### 6.1 Navbar

```html
<nav class="org-landing-navbar" aria-label="Main navigation">
  <div class="org-landing-navbar__bar layout-grid">
    <a href="..." class="org-landing-navbar__logo layout-grid__col-xs-3 layout-grid__col-sm-2">BRAND</a>
    <ul class="org-landing-navbar__links layout-grid__col-xs-6 layout-grid__col-sm-7" role="list">
      <li><a href="#section">Link</a></li>
    </ul>
    <div class="org-landing-navbar__cta layout-grid__col-xs-3 layout-grid__col-sm-3 syx-d-flex syx-justify-end syx-items-center syx-gap-2">
      <a href="#cta" class="atom-btn atom-btn--primary atom-btn--filled atom-btn--size-sm">CTA</a>
      <button class="org-landing-navbar__toggle" aria-expanded="false" aria-controls="mobile-menu">
        <span></span><span></span><span></span>
      </button>
    </div>
  </div>
  <div class="org-landing-navbar__mobile-menu" id="mobile-menu" role="navigation">
    <nav class="org-landing-navbar__mobile-nav">
      <a href="#section" class="org-landing-navbar__mobile-link">Link</a>
      <a href="#cta" class="org-landing-navbar__mobile-link org-landing-navbar__mobile-link--cta">CTA →</a>
    </nav>
  </div>
</nav>
```

### 6.2 Hero

```html
<section class="org-landing-hero" aria-labelledby="hero-title">
  <div class="org-landing-hero__inner layout-grid layout-grid--justify-center">
    <div class="layout-grid__col-xs-12 layout-grid__col-md-8 syx-text-center">

      <!-- Pill / badge -->
      <div class="org-landing-hero__pill syx-d-inline-flex syx-items-center syx-gap-1" role="note">
        <span>⚡</span>
        <span class="syx-type-caption syx-font-medium">Short announcement text</span>
      </div>

      <!-- Title -->
      <h1 class="org-landing-hero__title syx-type-display-1 syx-mt-3" id="hero-title">
        Primary headline.<br>
        <span class="org-landing-hero__accent">Accent phrase.</span>
      </h1>

      <!-- Lead -->
      <p class="org-landing-hero__lead syx-type-body-large syx-mt-3 syx-max-w-65ch syx-mx-auto">
        Supporting description.
      </p>

      <!-- CTA group -->
      <div class="org-landing-hero__actions syx-d-flex syx-justify-center syx-items-center syx-gap-3 syx-mt-4 syx-flex-wrap">
        <a href="#cta" class="atom-btn atom-btn--primary atom-btn--filled atom-btn--size-lg">Primary CTA</a>
        <a href="#features" class="atom-btn atom-btn--size-lg org-landing-hero__btn-ghost">Secondary CTA</a>
      </div>

    </div>
  </div>
</section>
```

### 6.3 Feature card (molecule inside a grid)

```html
<div class="org-landing-features__grid">
  <article class="mol-landing-feature-card">
    <div class="mol-landing-feature-card__icon" aria-hidden="true">⚡</div>
    <h3 class="mol-landing-feature-card__title">Feature Name</h3>
    <p class="mol-landing-feature-card__desc">Feature description text.</p>
  </article>
</div>
```

> **Rule:** The grid wrapper (`.org-landing-features__grid`) is owned by the **organism**.
> Individual cards (`mol-landing-feature-card`) are **molecules** — they don't know about the grid.
> This separation allows cards to be reused in other contexts.

### 6.4 Pricing plan (molecule with modifier)

```html
<!-- Standard plan -->
<article class="mol-landing-plan">
  <p class="mol-landing-plan__name">Plan name</p>
  <p class="mol-landing-plan__price">$XX <span>/ month</span></p>
  <p class="mol-landing-plan__desc">Short description.</p>
  <ul class="mol-landing-plan__features">
    <li>Feature one</li>
  </ul>
  <a href="#cta" class="atom-btn atom-btn--primary atom-btn--size-md syx-w-full">Get Started</a>
</article>

<!-- Featured plan: add --featured modifier to the block -->
<article class="mol-landing-plan mol-landing-plan--featured">
  <div class="mol-landing-plan__badge">Most Popular</div>
  ...
  <a href="#cta" class="atom-btn atom-btn--primary atom-btn--filled atom-btn--size-md syx-w-full">Start Trial</a>
</article>
```

### 6.5 Testimonial (molecule)

```html
<blockquote class="mol-landing-testimonial">
  <div class="mol-landing-testimonial__stars" aria-label="5 stars">★★★★★</div>
  <p class="mol-landing-testimonial__body">&ldquo;Quote text.&rdquo;</p>
  <div class="mol-landing-testimonial__author">
    <div class="mol-landing-testimonial__avatar" aria-hidden="true">AB</div>
    <div>
      <div class="mol-landing-testimonial__name">Name S.</div>
      <div class="mol-landing-testimonial__role">Role, Company</div>
    </div>
  </div>
</blockquote>
```

### 6.6 CTA band

```html
<section class="org-landing-cta helper-bg-color-primary" id="cta" aria-labelledby="cta-title">
  <div class="org-landing-cta__inner layout-grid layout-grid--justify-center">
    <div class="layout-grid__col-xs-12 syx-text-center">
      <h2 class="org-landing-cta__title syx-type-h2" id="cta-title">Call to action headline</h2>
      <p class="org-landing-cta__lead syx-type-body-large syx-mt-3">Supporting copy.</p>
      <div class="org-landing-cta__actions syx-d-flex syx-justify-center syx-items-center syx-gap-3 syx-mt-4 syx-flex-wrap">
        <a href="#" class="atom-btn atom-btn--secondary atom-btn--filled atom-btn--size-md">Primary action</a>
        <a href="#" class="atom-btn atom-btn--secondary atom-btn--size-md">Secondary action</a>
      </div>
      <p class="org-landing-cta__sub syx-type-body-small syx-mt-3">Legal/trust copy.</p>
    </div>
  </div>
</section>
```

> Note: on a colored background section, buttons switch to `--secondary` so they contrast.
> Primary button on white/dark bg → `atom-btn--primary --filled`.
> Primary button on brand-colored bg → `atom-btn--secondary --filled`.

### 6.7 Footer

```html
<footer class="org-landing-footer" role="contentinfo">
  <div class="org-landing-footer__inner">

    <div class="org-landing-footer__brand layout-grid__col-xs-12 layout-grid__col-md-3">
      <div class="org-landing-footer__brand-name syx-type-h4 syx-font-bold syx-text-primary">BRAND</div>
      <p class="org-landing-footer__tagline syx-type-body-small syx-text-muted syx-mt-2">Tagline.</p>
    </div>

    <div class="layout-grid__col-xs-12 layout-grid__col-sm-6 layout-grid__col-md-3">
      <h3 class="org-landing-footer__col-title syx-type-overline syx-mb-2">Column title</h3>
      <ul class="org-landing-footer__links syx-type-body-small" role="list">
        <li><a href="#">Link</a></li>
      </ul>
    </div>

  </div>
  <p class="org-landing-footer__copy syx-type-caption syx-text-muted">© Year Brand — Legal copy.</p>
</footer>
```

---

## 7. Body and theme wiring

```html
<!-- Always on <body>: -->
<body class="syx syx--theme-{theme-name}">
```

> `syx` → activates the base layer.
> `syx--theme-{name}` → applies the brand theme CSS custom properties.
> Current themes: `syx--theme-velox`, `syx--theme-terra`.

---

## 8. Accessibility conventions

| Need | Pattern |
|---|---|
| Skip link | `<a href="#main-content" class="syx-skip-link">Skip to main content</a>` (first child of `<body>`) |
| Main landmark | `<main id="main-content">` |
| Section label | `aria-labelledby="{section}-title"` on `<section>`, matching `id` on the `<h2>` |
| Decorative icon | `aria-hidden="true"` on the icon element |
| Navigation | `aria-label="Main navigation"` on `<nav>`, `role="list"` on `<ul>` nav lists |
| Mobile toggle | `aria-expanded="false"` (toggled by JS), `aria-controls="mobile-menu"` |

---

## 9. What not to do

| ❌ Avoid | ✅ Do instead |
|---|---|
| `<div class="card">` | `<article class="mol-card">` |
| `<div style="padding: 24px">` | `class="syx-p-3"` or component token in SCSS |
| `<div class="flex-row">` (custom) | `class="syx-d-flex syx-gap-2"` |
| `<section class="features-section">` | `<section class="org-landing-features">` |
| Inline `style=""` for colors | Use `helper-bg-color-*` or semantic token in SCSS |
| `!important` anywhere | None needed — use `@layer` order |
| Raw hex/px values in `<style>` blocks | Define a token, use the token |
