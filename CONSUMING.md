# Building an app on SYX — the consumer contract

> **Who this is for:** any agent or person writing a website or an app that *depends on*
> SYX (`npm install github:Pizarradas/syx`). If you are changing SYX itself, this is the
> wrong file: read `AGENTS.md`.
>
> It is model-agnostic on purpose. Nothing here assumes a particular assistant, editor or
> MCP client: every check has a route that only needs to read a file, and a stronger
> route for agents that can run a command. `npx syx-init` copies the short form of this
> contract into the app (see *Setting up an app* at the end).

SYX is a **closed vocabulary**. A class or a token either exists in the compiled CSS or
it paints nothing — and the browser never tells you. Almost every way an agent drifts
from SYX is the same mistake: writing a name that *looks* right instead of one that
*is* right. The rules below exist to stop that.

---

## 1. The ten rules

1. **Never invent a SYX name.** Every class with an `atom-`, `mol-`, `org-`, `syx-` or
   `layout-` prefix, and every `--primitive-*`, `--semantic-*`, `--component-*`,
   `--theme-*` or `--layout-*` token, must come from the vocabulary (section 2).
   Not found means it does not exist — not "use something close".
2. **Copy names exactly.** No abbreviating, no expanding, no re-prefixing:
   `atom-btn--size-sm` ✓, never ❌ `atom-btn--sm`; `mol-card` ✓, never ❌ `syx-mol-card`.
3. **Reuse before you write** — in the order of section 3. Most screens need no new CSS.
4. **Your own components use your own prefix**: `app-` for classes, `--app-` for tokens
   (or the prefix your project's `AGENTS.md` declares). Never `atom-`, `mol-`, `org-`,
   `syx-`, never `--semantic-`/`--component-`/`--primitive-`.
5. **Never restyle a SYX class from app CSS.** No `.mol-card { … }`, no
   `.app-page .atom-btn { … }`. Change its look with a modifier it already has, or by
   overriding a token (section 6).
6. **Tokens flow one way:** `--semantic-*` → `--app-*` → your rules. App CSS never reads
   `--primitive-*` and never reads another component's `--component-*`.
7. **No literal design values in rules.** Colours, spacing, radii, durations and fonts
   come from tokens. A literal may appear only as the value of an `--app-*` token, and a
   colour never.
8. **App CSS goes in `@layer syx.app`** (section 5). Never `!important`.
9. **Motion and positioning go through the mixins** if you write SCSS; in plain CSS,
   durations and easings are tokens and every transition has a reduced-motion opt-out.
10. **Scan before you hand over.** `npx syx-scan` on the files you touched must report no
    *alta* or *media* findings (section 8).

---

## 2. The vocabulary: where names come from

Use the first route your environment allows. All of them answer from the version of SYX
the app has installed.

| You can… | Ask with |
|---|---|
| Call MCP tools | `list_components`, `get_component` (classes, modifiers, elements, states), `get_token`, `find_token_by_value`, `validate_snippet` — register `npx syx-mcp` |
| Run a command | `node -e "console.log(JSON.stringify(require('syx-design-system').getComponent({ name: 'btn' }), null, 1))"` |
| Only read files | `SYX-VOCABULARY.md` at the app root (written by `npx syx-init`), or `node_modules/syx-design-system/component-registry.json` and `tokens.json` — search them for the one entry you need, don't load them whole |
| Only chat (no files) | Ask the person to paste `SYX-VOCABULARY.md` before you write markup |

A component's vocabulary is exactly five lists: its **block** (`atom-btn`), its
**modifiers** (`atom-btn--primary`), its **elements** (`mol-card__title`), its **states**
(`:disabled`, `.is-scrolled`) and what it is **composedOf**. Anything outside those lists
is not part of that component.

---

## 3. Reuse, in this order

Stop at the first step that does the job.

1. **An existing component, as is.** `<button class="atom-btn atom-btn--primary atom-btn--filled">`.
2. **An existing modifier of it.** Sizes, variants and tones are modifiers:
   `atom-btn--size-sm`, `mol-card--elevated`, `mol-alert--warning`.
3. **Composition in HTML.** Put existing components inside each other and lay them out
   with utilities (`syx-d-flex`, `syx-gap-2`, `syx-p-3`) or the grid
   (`layout-grid`, `layout-grid__col-md-6`). A "card with a button" is `mol-card` with an
   `atom-btn` inside — not a new component.
4. **A token override** when the change is to the *look of the whole app* (brand colour,
   radius, font): override `--semantic-*`/`--theme-*` tokens (section 6). If you are
   changing the whole identity, that is a new theme, not an override.
5. **An app component** (`app-*`) only when 1–4 cannot express it. It composes SYX
   components in its markup; its own CSS covers only what is new (section 4–5).

Never: ❌ add a modifier or element to a SYX block (`atom-btn--compact`) ✓, wrap a SYX class
in an app selector to change it, or copy a SYX component's CSS into an app class.

---

## 4. Markup rules

```html
<!-- ✓ block + modifiers, exact names, composed in HTML -->
<article class="mol-card mol-card--elevated">
  <div class="mol-card__body">
    <h3 class="mol-card__title">Plan Pro</h3>
    <button class="atom-btn atom-btn--primary atom-btn--filled atom-btn--size-sm" type="button">Choose</button>
  </div>
</article>
```

<!-- syx: ejemplo-incorrecto -->
```html
<!-- ✗ every class here paints nothing -->
<article class="syx-mol-card mol-card__body__title">
  <button class="atom-btn--primary atom-btn--sm">Choose</button>
</article>
```

- **A modifier always travels with its block.** `atom-btn atom-btn--primary`, never `atom-btn--primary` alone.
- **Elements are one level deep.** `mol-card__title`, never ❌ `mol-card__body__title`.
- **An element belongs to its block.** `mol-card__title` goes inside a `mol-card`.
- **Semantic HTML first**, then classes: a button is a `<button>`, a navigation is a `<nav>`.
- **State** on a SYX component is what it declares (`states`, native attributes, ARIA:
  `aria-selected`, `aria-expanded`, `aria-current`, `hidden`, `disabled`). Don't add state
  classes it does not list. State on *your* components: `is-*` classes or ARIA.
- **An app class may sit next to a SYX class** on the same element to *place* it
  (`class="atom-btn atom-btn--primary app-toolbar__action"`), and the app rule may only
  place it (`margin-*`, `grid-*`, `order`, `align-self`/`justify-self`, `flex-*`, `width`/`inline-size`)
  — never paint it. The same holds for a selector that reaches a SYX class from yours
  (`.app-pricing .mol-card__header { display: flex }` paints SYX: not allowed).
- **Utilities win.** Everything `syx-*` lives in the last layer: a utility on an element
  overrides component and app styles without `!important`.

---

## 5. App CSS: one layer, one prefix, three steps

SYX reserves an empty layer for you, between its organisms and its utilities:

```css
@layer syx.reset, syx.base, syx.tokens, syx.atoms, syx.molecules, syx.organisms, syx.app, syx.utilities;
```

- **Start every app stylesheet with that exact line** (in SCSS, right after the `@use`
  lines — Sass requires `@use` first). SYX emits it too; repeating it makes the order hold
  even if your CSS loads first.
- **Put every app rule inside `@layer syx.app { … }`.** Your rules then beat SYX
  components and lose to SYX utilities, the same contract SYX's own layers follow.
- **Declare `--app-*` tokens outside any layer**, in `:root`, like SYX does — unlayered
  declarations beat layered ones, so a token can't be overridden by accident.

```css
/* capa: prototipo — CSS of an app that consumes SYX */
@layer syx.reset, syx.base, syx.tokens, syx.atoms, syx.molecules, syx.organisms, syx.app, syx.utilities;

/* step 1 · app tokens read semantic roles (literal lengths allowed here, colours never) */
:root {
  --app-plan-card-bg: var(--semantic-color-bg-secondary);
  --app-plan-card-accent: var(--semantic-color-primary);
  --app-plan-card-gap: var(--semantic-space-component-md);
  --app-plan-card-min-width: 18rem;
}

/* step 2 · rules read only app tokens */
@layer syx.app {
  .app-plan-card {
    display: grid;
    gap: var(--app-plan-card-gap);
    min-inline-size: var(--app-plan-card-min-width);
    background: var(--app-plan-card-bg);
    border-block-start: var(--semantic-border-width-thick) solid var(--app-plan-card-accent);
  }
  .app-plan-card.is-current { --app-plan-card-accent: var(--semantic-color-state-success); }
}
```

Step 3 is the markup: `<article class="app-plan-card">` with SYX atoms inside.

The token path is the same idea SYX uses inside itself — **primitive → semantic →
component** — with your `--app-*` tokens in the component slot. App code starts at the
semantic level: primitives belong to themes, and another component's tokens are its
private wiring.

**If the app writes SCSS**, use the SYX mixins, and import **only** the mixins:

```scss
// capa: prototipo — SCSS of an app that consumes SYX (loadPaths: ['node_modules'])
@use 'syx-design-system/scss/abstracts/mixins/mixins' as *;

@layer syx.reset, syx.base, syx.tokens, syx.atoms, syx.molecules, syx.organisms, syx.app, syx.utilities;

@layer syx.app {
  .app-toast {
    @include fixed($bottom: var(--app-toast-offset), $right: var(--app-toast-offset));
    @include transition(opacity var(--semantic-duration-fast) var(--semantic-easing-standard));
  }
}
```

<!-- syx: ejemplo-incorrecto -->
```scss
// ✗ re-emits SYX's ~75 KB of default tokens after your theme and overrides it
@use 'syx-design-system/scss/abstracts' as *;
```

**If the app writes plain CSS**, there are no mixins: durations and easings are
`--semantic-duration-*` / `--semantic-easing-*`, and every transition gets
`@media (prefers-reduced-motion: reduce) { transition: none; }`.

---

## 6. Overriding SYX tokens

To change the look of the whole app (brand colour, radius), override the token — never the
component. Overrides go **outside any layer**, after SYX's stylesheet, and repeat for dark mode:

```css
/* capa: prototipo — app token overrides */
:root { --semantic-color-primary: oklch(0.55 0.2 250); }
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { --semantic-color-primary: oklch(0.72 0.15 250); } }
:root[data-theme="dark"] { --semantic-color-primary: oklch(0.72 0.15 250); }
```

For **one context only**, override the token on your own wrapper instead of `:root`:
`.app-pricing { --component-card-bg: var(--semantic-color-bg-secondary); }` — writing an
existing token is allowed; reading `--component-*` in your own rules is not.

You may override tokens that exist. You may not create new names under SYX's
prefixes: a new token is `--app-*`. Detail: `THEMING-RULES.md` → *Sobrescribir tokens desde tu aplicación*.

---

## 7. Names that agents invent (all wrong)

| Written | Real name |
|---|---|
| ❌ `syx-atm-btn`, `syx-atom-btn` | ✓ `atom-btn` |
| ❌ `syx-mol-card`, `syx-org-header`, `org-header` | ✓ `mol-card`, `org-site-header` |
| ❌ `atom-btn--sm`, `atom-btn--large` | ✓ `atom-btn--size-sm`, `atom-btn--size-lg` |
| ❌ `atom-btn--ghost`, `atom-btn--outline`, `atom-btn--solid` | ✓ every colour variant (`--primary` … `--quaternary`, `--danger`) is outlined; add `atom-btn--filled` to fill it |
| ❌ `atom-btn__icon`, `atom-btn__label` | ✓ `atom-btn` has no elements: put an `atom-icon` inside and add `atom-btn--has-icon` (icon-only: `atom-btn--circle` + `aria-label`) |
| ❌ `--syx-prv-*`, `--syx-sem-*`, `--syx-cmp-*` | ✓ `--primitive-*`, `--semantic-*`, `--component-*` |
| ❌ `--component-plan-card-bg` (new, in app CSS) | ✓ `--app-plan-card-bg` |
| ❌ `@layer atoms`, `@layer components` | ✓ SYX's layers are `syx.*`; the app writes in `syx.app` |

The token architecture has **four kinds** of token: primitive, theme (`--theme-*`:
radius, focus ring), semantic and component. The colour path is three steps,
primitive → semantic → component; `--theme-*` is structural and may be read directly.

---

## 8. Checking the work

```bash
npx syx-scan src                       # a folder: every .html .css .scss .vue .svelte .astro .jsx .tsx inside
npx syx-scan src --fallar-si-media     # for CI: exit 1 on any alta or media finding
```

It reports, against the installed version: classes with a SYX prefix that don't exist, invented
modifiers, modifiers without their block, SYX tokens that don't exist, new tokens created under
SYX's prefixes, `--primitive-*` read by the app, app rules that paint a SYX class, transitions
without a reduced-motion exit, `@use` of the whole `scss/abstracts`, hand-written values that are
already a token, expired fallbacks and `!important`. It does not judge literal lengths in your
rules (rule 7) — that one is on you. With MCP, `validate_snippet` runs the rules *before* you write
and `scan_for_drift` is the same scanner.

**Before handing anything over, answer yes to all five:**

1. Every SYX class and token I wrote is in the vocabulary, spelled exactly.
2. I used the lowest step of section 3 that does the job.
3. My own classes and tokens carry the app prefix, and none of my rules targets a SYX class.
4. My rules read `--app-*` tokens; my tokens read `--semantic-*`/`--theme-*`/`--layout-*`.
5. `npx syx-scan` shows no *alta* or *media* findings in the files I touched.

---

## Setting up an app

```bash
npx syx-init                 # writes AGENTS.md (or updates its SYX block) + SYX-VOCABULARY.md
npx syx-init --prefix shop   # your own prefix instead of app-
npx syx-init --update        # after upgrading SYX: refresh the vocabulary and the block
```

It writes the contract where each tool looks for it — `AGENTS.md` (the open convention:
Codex, Cursor, GitHub Copilot, Jules, Zed and others), plus `GEMINI.md`, `CLAUDE.md` and
`.github/copilot-instructions.md` as pointers — and never touches anything outside the
`<!-- syx:start -->` / `<!-- syx:end -->` markers of a file that already exists. For an
assistant with no file access, paste `AGENTS.md` and `SYX-VOCABULARY.md` into its
instructions (a custom GPT, a Gem, a Project).
