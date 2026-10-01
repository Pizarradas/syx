# SYX Validation Report

**Verdict: ⚠️ WARNINGS**

---

## Runtime Surface

| Metric | Count |
|---|---|
| Total custom properties in runtime CSS | 1425 |
| Official (SYX-prefixed) | 1363 |
| Legacy (no SYX prefix) | 62 |

## Source vs Runtime Gaps

### ✅ No phantom tokens

### ✅ All official tokens documented

## Legacy Vars (R07) — 62 found

| Lifecycle | Count | Action |
|---|---|---|
| 🔒 keep    | 62   | External dependency or intentional contract. No action. |
| 🔄 migrate | 0 | Has a SYX equivalent. Replace `var(old)` → `var(new)`. |
| 🗑️ kill    | 0   | No reader. Remove from codebase. |
| ❓ unknown | 0 | Not in contracts/legacy-map.json yet: decide and catalogue it. |

## SCSS Rule Violations

| Rule | Description | Severity | Count | Status |
|---|---|---|---|---|
| R01 | Un componente no usa --primitive-* directamente: pasa por --semantic-* | error | 0 | ✅ |
| R02 | Sin !important — la cascada se gobierna con @layer | error | 0 | ✅ |
| R03 | Sin `transition` ni `transition-*` en crudo — usa el mixin transition() | error | 0 | ✅ |
| R04 | Sin `position: absolute|fixed|sticky` en crudo — usa los mixins de posición | error | 0 | ✅ |
| R09 | Cada @include llama a un mixin que existe | error | 0 | ✅ |
| R10 | Toda excepción está justificada y excusa algo real | error | 0 | ✅ |
| R11 | Un --component-* lee roles (--semantic-*, --component-*, --theme-*, --layout-*, iconos): ni --primitive-* ni heredadas ni colores literales | error | 0 | ✅ |

### Inline exceptions (2)

_Each one excuses exactly one declaration, with its reason next to the code (`// syx-allow Rxx: …`)._

- R03 `scss/base/_reset.scss:340` — no es movimiento, es el truco que retrasa 600000s el fondo de autofill de Chrome; el mixin lo apagaría con reduced-motion y volvería el destello
- R03 `scss/utilities/_accessibility.scss:78` — es el apagado de movimiento en sí, ya dentro de reduced-motion; transition() solo añadiría la misma guarda otra vez

