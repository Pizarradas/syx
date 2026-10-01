# SYX Validation Report

**Verdict: ⚠️ WARNINGS**

---

## Runtime Surface

| Metric | Count |
|---|---|
| Total custom properties in runtime CSS | 1610 |
| Official (SYX-prefixed) | 1329 |
| Legacy (no SYX prefix) | 281 |

## Source vs Runtime Gaps

### ✅ No phantom tokens

### ✅ All official tokens documented

## Legacy Vars (R07) — 281 found

| Lifecycle | Count | Action |
|---|---|---|
| 🔒 keep    | 127   | External dependency or intentional contract. No action. |
| 🔄 migrate | 27 | Has a SYX equivalent. Replace `var(old)` → `var(new)`. |
| 🗑️ kill    | 127   | No SYX equivalent. Remove from codebase. |

### Top migration candidates

- `--base-measure` → `--primitive-space-base`
- `--font-family-1` → `--semantic-font-family-body`
- `--font-family-2` → `--semantic-font-family-heading`
- `--font-weight-1` → `--primitive-font-weight-regular`
- `--font-weight-2` → `--primitive-font-weight-bold`
- `--font-bold`
- `--gap-1`
- `--inner-1`
- `--font-size-1`
- `--font-size-2`
- … and 17 more (see contracts/lint-contract.json)

## SCSS Rule Violations

| Rule | Description | Severity | Count | Status |
|---|---|---|---|---|
| R01 | Un componente no usa --primitive-* directamente: pasa por --semantic-* | error | 0 | ✅ |
| R02 | Sin !important — la cascada se gobierna con @layer | error | 0 | ✅ |
| R03 | Sin `transition` ni `transition-*` en crudo — usa el mixin transition() | error | 0 | ✅ |
| R04 | Sin `position: absolute|fixed|sticky` en crudo — usa los mixins de posición | error | 0 | ✅ |
| R09 | Cada @include llama a un mixin que existe | error | 0 | ✅ |
| R10 | Toda excepción está justificada y excusa algo real | error | 0 | ✅ |

### Inline exceptions (2)

_Each one excuses exactly one declaration, with its reason next to the code (`// syx-allow Rxx: …`)._

- R03 `scss/base/_reset.scss:337` — no es movimiento, es el truco que retrasa 600000s el fondo de autofill de Chrome; el mixin lo apagaría con reduced-motion y volvería el destello
- R03 `scss/utilities/_accessibility.scss:78` — es el apagado de movimiento en sí, ya dentro de reduced-motion; transition() solo añadiría la misma guarda otra vez

