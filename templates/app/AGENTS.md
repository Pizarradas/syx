<!-- syx:start — written by `npx syx-init` (SYX {{version}}). Edit outside these markers; `npx syx-init --update` rewrites what is inside. -->
## UI: this app is built on the SYX design system

Every agent and model working on this repository follows these rules for anything that
produces markup, CSS or SCSS. They are binding, not style advice. The full contract is
`node_modules/syx-design-system/CONSUMING.md`; this is its short form.

**App prefix: `{{prefix}}`** — classes `{{prefix}}-*`, tokens `--{{prefix}}-*`.

### Where names come from

SYX is a closed vocabulary: a class or token that is not in it paints nothing, silently.
Before writing any SYX name, look it up — in this order, whichever you can:

1. MCP tools, if registered (`npx syx-mcp`): `get_component`, `list_components`, `get_token`, `validate_snippet`.
2. A command: `node -e "console.log(JSON.stringify(require('syx-design-system').getComponent({ name: 'btn' }), null, 1))"`.
3. The file `SYX-VOCABULARY.md` at the root of this repository: every component with its
   block, modifiers, elements and states, every utility and every semantic token.

Not found = does not exist. Never use the closest-looking name.

### Rules

1. **Never invent a SYX name.** Classes `atom-*`, `mol-*`, `org-*`, `syx-*`, `layout-*` and
   tokens `--primitive-*`, `--semantic-*`, `--component-*`, `--theme-*`, `--layout-*`
   come only from the vocabulary, copied exactly. SYX components have **no** `syx-` prefix
   (`atom-btn`, not ❌ `syx-atm-btn`); `syx-` is only for utilities (`syx-d-flex`).
2. **Reuse in this order** and stop at the first that works: (a) an existing component;
   (b) one of its existing modifiers; (c) existing components composed in HTML, laid out
   with `syx-*` utilities or `layout-grid`; (d) overriding an existing `--semantic-*` token
   for the whole app; (e) only then, a new `{{prefix}}-*` component.
3. **Block + modifier together**: `atom-btn atom-btn--primary`, never the modifier alone.
   Elements one level deep (`mol-card__title`), inside their block.
4. **Never style a SYX class from app CSS** (`.mol-card {…}`, `.{{prefix}}-x .atom-btn {…}`).
   An app class next to a SYX class (or an app selector reaching one, like `.{{prefix}}-x .mol-card__header`)
   may only place it: margin, grid-*, order, align/justify-self, flex-*, width.
5. **App CSS**: start each stylesheet (in SCSS, right after the `@use` lines) with
   `@layer syx.reset, syx.base, syx.tokens, syx.atoms, syx.molecules, syx.organisms, syx.app, syx.utilities;`
   and put every rule inside `@layer syx.app { … }`. Never `!important`.
6. **Tokens flow one way**: `--semantic-*` → `--{{prefix}}-*` (declared in `:root`, outside any
   layer) → your rules. Rules read only `--{{prefix}}-*`. Never read `--primitive-*` or another
   component's `--component-*`. Never declare a new token under a SYX prefix.
7. **No literal design values in rules**: colours, spacing, radii, fonts and durations are
   tokens. A literal length may only be the value of a `--{{prefix}}-*` token; a colour never.
8. **SCSS**: `@use 'syx-design-system/scss/abstracts/mixins/mixins' as *;` and use the
   mixins for `transition` and `position: absolute|fixed|sticky`. Never `@use` the whole
   `scss/abstracts` (it re-emits SYX's tokens over your theme). Plain CSS: durations and
   easings from `--semantic-duration-*`/`--semantic-easing-*`, plus a
   `prefers-reduced-motion: reduce` opt-out on every transition.
9. **State**: on SYX components, only what they declare (ARIA, native attributes, listed
   `is-*` classes). On `{{prefix}}-*` components: `is-*` or ARIA.
10. **Verify before handing over**: `npx syx-scan src` (or the files you touched) must show no
    *alta* or *media* findings. If you cannot run it, say so instead of claiming compliance.

### Names models get wrong

| ❌ Written | ✓ Real |
|---|---|
| ❌ `syx-atm-btn`, `syx-mol-card`, `syx-org-header` | ✓ `atom-btn`, `mol-card`, `org-site-header` |
| ❌ `atom-btn--sm`, `atom-btn--ghost` | ✓ `atom-btn--size-sm`; variants are outlined until you add `atom-btn--filled` |
| ❌ `atom-btn__icon` | ✓ an `atom-icon` inside `atom-btn atom-btn--has-icon` |
| ❌ `--syx-sem-*`, `--syx-cmp-*` | ✓ `--semantic-*`; your own tokens are `--{{prefix}}-*` |
| ❌ `@layer atoms`, `@layer components` | ✓ SYX's layers are `syx.*`; app code goes in `syx.app` |
<!-- syx:end -->
