# SYX — Spacing & Typography Token Reference

> **For AI agents.** This file is co-located with the token source files so that you read it in context.
> **Rule #1:** Never output raw `px` or `rem` values. Always use the token name from the tables below.
> **Rule #2:** Always map from Semantic or Component tokens. Never write `var(--primitive-*)` in a component or page.

---

## 1. Spacing System

### 1.1 Mental model

```
--primitive-space-base: 0.5rem  (= 8px)
--primitive-space-N  =  N × base

Fluid layout/component tokens reference --primitive-fluid-space-*
Static inline/stack tokens reference    --primitive-space-N
```

### 1.2 Primitive scale — static (8px grid)

| Token | Multiplier | Value |
|---|---|---|
| `--primitive-space-0` | 0× | 0 |
| `--primitive-space-0-5` | 0.5× | 4px |
| `--primitive-space-1` | 1× | 8px |
| `--primitive-space-1-5` | 1.5× | 12px |
| `--primitive-space-2` | 2× | 16px |
| `--primitive-space-2-5` | 2.5× | 20px |
| `--primitive-space-3` | 3× | 24px |
| `--primitive-space-4` | 4× | 32px |
| `--primitive-space-5` | 5× | 40px |
| `--primitive-space-6` | 6× | 48px |
| `--primitive-space-7` | 7× | 56px |
| `--primitive-space-8` | 8× | 64px |
| `--primitive-space-10` | 10× | 80px |
| `--primitive-space-12` | 12× | 96px |
| `--primitive-space-16` | 16× | 128px |
| `--primitive-space-20` | 20× | 160px |
| `--primitive-space-24` | 24× | 192px |

### 1.3 Primitive scale — fluid (mobile 375px → desktop 1440px)

| Token | Range |
|---|---|
| `--primitive-fluid-space-xs` | 4px → 8px |
| `--primitive-fluid-space-sm` | 8px → 16px |
| `--primitive-fluid-space-md` | 16px → 24px |
| `--primitive-fluid-space-lg` | 24px → 32px |
| `--primitive-fluid-space-xl` | 32px → 48px |
| `--primitive-fluid-space-xxl` | 48px → 64px |

### 1.4 Semantic tokens — use these in components and pages

#### Layout spacing (sections, page-level pading, grid gaps)

| Token | Resolves to | Range |
|---|---|---|
| `--semantic-space-layout-xs` | fluid-xs | 4–8px |
| `--semantic-space-layout-sm` | fluid-sm | 8–16px |
| `--semantic-space-layout-md` | fluid-md | 16–24px |
| `--semantic-space-layout-lg` | fluid-lg | 24–32px |
| `--semantic-space-layout-xl` | fluid-xl | 32–48px |
| `--semantic-space-layout-xxl` | fluid-xxl | 48–64px |

#### Component spacing (padding, internal gaps)

| Token | Resolves to | Range |
|---|---|---|
| `--semantic-space-component-xs` | fluid-xs | 4–8px |
| `--semantic-space-component-sm` | fluid-sm | 8–16px |
| `--semantic-space-component-md` | fluid-md | 16–24px |
| `--semantic-space-component-lg` | fluid-lg | 24–32px |
| `--semantic-space-component-xl` | fluid-xl | 32–48px |

#### Inline spacing (flex/grid gaps, icon-to-label distance)

| Token | Value |
|---|---|
| `--semantic-space-inline-xs` | 8px |
| `--semantic-space-inline-sm` | 16px |
| `--semantic-space-inline-md` | 24px |
| `--semantic-space-inline-lg` | 32px |

#### Stack spacing (vertical margin-bottom, row-gap)

| Token | Value |
|---|---|
| `--semantic-space-stack-xs` | 8px |
| `--semantic-space-stack-sm` | 16px |
| `--semantic-space-stack-md` | 24px |
| `--semantic-space-stack-lg` | 32px |
| `--semantic-space-stack-xl` | 48px |

### 1.5 Decision guide — which token to pick?

| Situation | Token family | Example |
|---|---|---|
| Section vertical padding (hero, features…) | `layout-xl` or `layout-xxl` | `padding: var(--semantic-space-layout-xl) 0` |
| Card internal padding | `component-md` or `component-lg` | `padding: var(--semantic-space-component-lg)` |
| Gap between flex items (icons, tags) | `inline-xs` or `inline-sm` | `gap: var(--semantic-space-inline-xs)` |
| Margin between stacked text blocks | `stack-sm` or `stack-md` | `margin-bottom: var(--semantic-space-stack-md)` |
| Compact theme override | Change `component-*` in `_theme.scss` | `--semantic-space-component-md: var(--primitive-fluid-space-xs)` |

> **Themes:** A "compact" theme overrides only `--semantic-space-component-*`.
> A "spacious" theme overrides only `--semantic-space-layout-*`.
> This keeps layout and density concerns independent.

---

## 2. Typography System

### 2.1 Mental model

```
Scale: Major Third (×1.250) — base 16px
Fluid: clamp(min @ 375px, preferred, max @ 1440px)
Display: clamp(56px, fluid, 80px)  ← hero-only
```

### 2.2 Font families

| Semantic token | Typeface | Use |
|---|---|---|
| `--semantic-font-family-primary` | Space Grotesk Regular | Body text |
| `--semantic-font-family-primary-bold` | Space Grotesk Bold | Bold body, UI labels |
| `--semantic-font-family-heading` | Syne Bold | H1–H3, display headings |
| `--semantic-font-family-heading-md` | Syne Medium | H4–H6, section titles |
| `--semantic-font-family-mono` | Courier New | Code blocks |

> **In themes:** override via `--primitive-font-family-*` in `_theme.scss` Section 1,
> then wire: `--semantic-font-family-heading: var(--primitive-font-family-{theme}-heading)`.

### 2.3 Font size scale — Major Third

| Step | Primitive token | Semantic (UI) token | Semantic (heading) token | Range |
|---|---|---|---|---|
| −2 | `--primitive-font-size-xs` | `--semantic-font-size-overline` / `caption` | — | ~11px |
| −1 | `--primitive-font-size-sm` | `--semantic-font-size-body-small` | — | ~14px |
| 0 | `--primitive-font-size-base` | `--semantic-font-size-body` | — | 16–18px |
| +1 | `--primitive-font-size-md` | `--semantic-font-size-body-large` | `--semantic-font-size-h6` | 20–22.5px |
| +2 | `--primitive-font-size-lg` | — | `--semantic-font-size-h5` | 25–28px |
| +3 | `--primitive-font-size-xl` | — | `--semantic-font-size-h4` | 31–35px |
| +4 | `--primitive-font-size-2xl` | — | `--semantic-font-size-h3` | 39–44px |
| +5 | `--primitive-font-size-3xl` | — | `--semantic-font-size-h2` | 49–55px |
| +6 | `--primitive-font-size-4xl` | — | `--semantic-font-size-h1` | 61–69px |
| display | `--primitive-fluid-font-display` | — | — | 56–80px |

> **Display size** (`--primitive-fluid-font-display`) is reserved for hero splash text only.
> It is **not** part of the heading semantic tokens. Use it directly on `.org-landing-hero__title`
> or similar via a component token; never assign it to a general semantic.

### 2.4 Helper classes for typography (use in HTML)

| Class | Resolves to | Approximate size |
|---|---|---|
| `.syx-type-display-1` | display fluid | 56–80px |
| `.syx-type-h1` | `--semantic-font-size-h1` | 61–69px |
| `.syx-type-h2` | `--semantic-font-size-h2` | 49–55px |
| `.syx-type-h3` | `--semantic-font-size-h3` | 39–44px |
| `.syx-type-h4` | `--semantic-font-size-h4` | 31–35px |
| `.syx-type-body-large` | `--semantic-font-size-body-large` | 20–22.5px |
| `.syx-type-body` | `--semantic-font-size-body` | 16–18px |
| `.syx-type-body-small` | `--semantic-font-size-body-small` | ~14px |
| `.syx-type-caption` | `--semantic-font-size-caption` | ~11px |
| `.syx-type-overline` | `--semantic-font-size-overline` | ~11px |

### 2.5 Line heights

| Token | Value | Use |
|---|---|---|
| `--semantic-line-height-tight` | 1.0 | Display / very large headings |
| `--semantic-line-height-snug` | 1.2 | Headings (H1–H3) |
| `--semantic-line-height-normal` | 1.5 | Captions, labels |
| `--semantic-line-height-relaxed` | 1.65 | Body text, long reads |
| `--semantic-line-height-heading` | → snug (1.2) | Alias for headings |
| `--semantic-line-height-body` | → relaxed (1.65) | Alias for body |
| `--semantic-line-height-caption` | → normal (1.5) | Alias for small text |

### 2.6 Font weights

| Token | Value | Use |
|---|---|---|
| `--semantic-font-weight-regular` | 400 | Body text |
| `--semantic-font-weight-medium` | 500 | Labels, navigation |
| `--semantic-font-weight-bold` | 700 | Headings, CTAs, emphasis |

### 2.7 Letter spacing

| Token | Value | Use |
|---|---|---|
| `--semantic-letter-spacing-tight` | −0.02em | Large headings |
| `--semantic-letter-spacing-normal` | 0 | Body text |
| `--semantic-letter-spacing-wide` | 0.06em | Overlines, tags |
| `--semantic-letter-spacing-wider` | 0.1em | All-caps labels |
| `--primitive-letter-spacing-display` | −0.03em | Display / hero text |

### 2.8 Decision guide — which type token?

| Content type | Size token | Weight | Line height | Letter spacing |
|---|---|---|---|---|
| Hero / Display heading | `syx-type-display-1` | bold | tight | display |
| H1 | `syx-type-h1` | bold | snug | tight |
| H2 (section title) | `syx-type-h2` | bold | snug | tight |
| H3 (subsection) | `syx-type-h3` | bold | snug | normal |
| H4 | `syx-type-h4` | bold | snug | normal |
| Lead paragraph | `syx-type-body-large` | regular | relaxed | normal |
| Body paragraph | `syx-type-body` | regular | relaxed | normal |
| UI label / nav | `syx-type-body-small` | medium | normal | normal |
| Caption / helper | `syx-type-caption` | regular | normal | normal |
| Overline / tag | `syx-type-overline` | medium | normal | wide |

---

## 3. Scale coherence rules

1. **Never skip more than 2 steps** between adjacent text elements.
   - ✅ H2 (step +5) → lead paragraph (step +1) → body (step 0)
   - ❌ H2 (step +5) → caption (step −2) — too extreme a jump without a visual bridge.

2. **Layout spacing should be proportional to type size.**
   - Large sections (hero, CTA) → `layout-xl` / `layout-xxl` padding.
   - Mid sections (features, pricing) → `layout-lg` padding.
   - Component internals → `component-md` or `component-lg`.
   - Inline gaps between small elements (pills, tags) → `inline-xs` or `inline-sm`.

3. **Do not mix fluid and static tokens in the same context.**
   - Section padding → fluid semantic (`layout-*`)
   - Inline icon gaps → static semantic (`inline-*`)

4. **Themes control scale via primitives only.**
   - Change the base measure: `--primitive-space-base: 0.375rem` → all static tokens shrink.
   - Change the fluid range: override `--primitive-fluid-space-*` → all layout/component tokens adapt.
   - Never hardcode new `clamp()` values in components.
