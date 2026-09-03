---
description: Take SYX into Figma — variables, components and the order the steps have to happen in
---

# Workflow: Export to Figma

Use this workflow to stand up the SYX library inside Figma, or to refresh it after a
token or component change. It assumes you have Figma's own MCP server registered
alongside SYX's; if you only have SYX's, everything up to Step 3 still applies and the
last steps become a manual import.

**Direction matters.** SYX is the source. Figma is a consumer, like an app is a
consumer. Nothing in this workflow reads a design and writes SCSS.

---

## Step 0: Know what you are allowed to touch

`contracts/figma/` is a **generated artifact**. Never hand-edit it: the next
`npm run export:figma` overwrites it, and `npm run check:figma` will fail in the
meantime without telling anyone why.

If a value is wrong in Figma, it is wrong in the CSS. Fix it upstream — the token —
and regenerate. `classify_change` says who may do that.

```
→ classify_change { "token": "--component-button-border-radius" }
```

> **Open point, stated rather than worked around.** `contracts/figma/` matches no pattern
> in `contracts/trust.json`, so it falls to the `human` default — while `contracts/dtcg/`,
> the artifact it is a sibling of, is `auto`. Until a human adds it, an agent running
> `npm run export:figma` is writing to a human-tier path and **must ask first**. The fix is
> one line in the `auto` list, next to `contracts/dtcg/`; it is not an agent's to make,
> because an agent that can widen its own permissions does not have permissions, it has a
> suggestion.

---

## Step 1: Make sure the export is current

// turbo
```bash
npm run check:figma
```

**Expected result:** `7/7 temas al día`.

If it fails, the compiled CSS moved and the export didn't follow. Regenerate:

```bash
npm run build && npm run export:figma
```

`export:figma` reads `contracts/resolved-tokens.json`, which is built from the compiled
CSS — so a change that hasn't been compiled yet does not exist for this workflow.

---

## Step 2: Pick the theme, and know what won't travel

One file per theme: `contracts/figma/<theme>.figma.json`. Each carries two variable
collections with a `light` and a `dark` mode, plus the 34 components.

Read `_meta.cuentas` before anything else:

```json
"cuentas": {
  "variables": 543,
  "omitidas": 247,
  "fueraDeAlcance": { "primitive": 233, "icon": 17, "reset": 26, "layout": 12, "theme": 4 },
  "componentes": 34
}
```

- `omitidas` — listed one by one in `omitidos`, each with its reason. Fluid `clamp()`
  type, `color-mix()`, relative units, shadows, gradients, embedded SVGs. **These are
  not failures.** They are the parts of the system Figma does not store in a variable,
  and the reason field says where they do live (a shadow is an effect, a gradient is a
  fill, an image is an asset).
- `fueraDeAlcance` — primitives are excluded **by R01**. A component may not read a
  `--primitive-*` in CSS; shipping them to Figma as pickable variables would open in
  design the shortcut the contract closes in code. Do not "fix" this.

---

## Step 3: Create the variable collections

Create `SYX · Semantic` first, then `SYX · Component` — component variables are the ones
a designer binds to a node, semantic ones are what they alias to conceptually.

Each collection needs **two modes**, named `light` and `dark`, matching `modes`.

For every entry in `collections[].variables`:

| Field | Use it for |
| ----- | ---------- |
| `name` | The variable name. Slashes are Figma's grouping — keep them exactly |
| `type` | `COLOR`, `FLOAT` or `STRING` |
| `valuesByMode.light` / `.dark` | The value in each mode. Colours are `{r,g,b,a}`, 0–1 |
| `hexByMode` | Human-readable only. Never the source of truth — use `valuesByMode` |
| `token` | The CSS custom property it came from. Keep it in the variable description |

Keeping `token` in the description is what makes the round trip auditable later: someone
looking at a Figma variable can name the CSS token without asking.

---

## Step 4: Build the components

Query one at a time rather than reading the whole file:

```
→ get_figma_spec { "component": "btn", "theme": "syx-sketch", "mode": "light" }
```

For each entry in `propiedades`:

1. Set the node property named in `propiedad` (`cornerRadius`, `fills`, `strokeWeight`,
   `fontSize`, `itemSpacing`…).
2. **Bind it to the variable named in `variable`. Do not paste the value.** A pasted
   value is correct in light mode and wrong in dark, and nothing will tell you.
3. `valores.light` / `valores.dark` are there so you can verify the binding took without
   switching modes in the UI.

Use `variantes` to decide the component's variant properties: each key is a SYX modifier
segment (`primary`, `secondary`, `size-lg`…) with the number of tokens that belong to it.
Use `estado` on each property for the state variants (`hover`, `disabled`, `focus`).

Name the component with `figmaName` (`atom/btn`), not the short name. It is derived from
the base class, which is what has to match the code later.

**Read `inferencia` before you trust the grouping.** Classes and tokens come from the
registry, arbitrated against compiled CSS — those are facts. The split by variant and
state is deduced from token names. If a token lands in the wrong variant, that is a
naming coincidence, not a system error: fix it in Figma, don't file a bug.

---

## Step 5: What you cannot do from here

`sinPropiedad` and `sinTraducir` are not oversights. Each entry carries a `motivo`.
Before you improvise a value in Figma for anything in those lists, check the reason —
most say the thing exists in Figma somewhere else (an effect, a fill, an asset), and a
few say it does not exist at all (transitions, easing, z-index).

**Never hand-convert an `oklch()` or a `rem`.** If you need a value that is not in the
spec, ask:

```
→ get_token { "token": "--semantic-color-primary", "theme": "syx-sketch", "mode": "dark" }
```

and convert with the same layer everything else used, `scripts/lib/figma.js`. Two
conversions of the same colour is how a library starts drifting from its own system.

---

## Step 6: Code Connect (only once the components exist)

Mapping a Figma component back to `<button class="atom-btn atom-btn--primary">` needs
**node IDs**, which do not exist until Step 4 has run in a real file. That is why this
repository ships no Code Connect files: they cannot be generated from here.

What it does ship is the input. `get_component` returns the verified classes and
modifiers for every component; `figmaName` is already the pairing key. Once the nodes
exist, `add_code_connect_map` closes the loop, and from then on Figma's `get_design_context`
returns SYX classes instead of generic CSS.

---

## Checklist

- [ ] `npm run check:figma` green before starting
- [ ] Collections created with **both** modes, named `light` and `dark`
- [ ] Node properties **bound** to variables, not pasted
- [ ] Component named with `figmaName`
- [ ] No hand-converted colour or measure anywhere
- [ ] `contracts/figma/` untouched by hand
