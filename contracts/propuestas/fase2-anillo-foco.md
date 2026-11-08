# Propuesta — Plan de generación, fase 2a y 2b: entrada de CHANGELOG del parche propuesto (anillo de foco con la variante fuerte; check:escaner lee el primario del sistema)
**Generada por** `scripts/propose.js files` · 2026-11-08T09:42:13.447Z · SYX v5.1.0
## Qué
| Fichero | Nivel |
|---|---|
| `CHANGELOG.md` | Vía propuesta (`*.md`) |
## Evidencia
```
┌─────────────────────────────────────────────────────────────┐
│  SYX Validate v2.0 — Contracts Layer Report                │
└─────────────────────────────────────────────────────────────┘

── RUNTIME SURFACE ─────────────────────────────────────────

   Total custom properties in CSS: 1444
   Official (--primitive/semantic/component/etc.): 1382
   Legacy (no SYX prefix): 62

── SOURCE vs RUNTIME ────────────────────────────────────────

✅ R06 — All tokens.json entries appear in runtime CSS

✅ R05 — All --component-* tokens in CSS are documented
ℹ️  R05 — 3 token(s) privados del tema de referencia, fuera de tokens.json por diseño (ver tokens.json _meta.themeContract)
ℹ️  R05 — 250 token(s) de la capa del sitio (scss/site/tokens/), fuera de tokens.json por diseño: no son del sistema

── LEGACY VARS (R07) ────────────────────────────────────────

✅ R07 — 0 legacy vars to migrate or remove · 62 kept on purpose (contracts/legacy-map.json says why)

── SCSS RULE VIOLATIONS ─────────────────────────────────────

✅ R01 — Un componente no usa --primitive-* directamente: pasa por --semantic-*: 0 violations

✅ R02 — Sin !important — la cascada se gobierna con @layer: 0 violations

✅ R03 — Sin `transition` ni `transition-*` en crudo — usa el mixin transition(): 0 violations

✅ R04 — Sin `position: absolute|fixed|sticky` en crudo — usa los mixins de posición: 0 violations

✅ R09 — Cada @include llama a un mixin que existe: 0 violations

✅ R10 — Toda excepción está justificada y excusa algo real: 0 violations

✅ R11 — Un --component-* lee roles (--semantic-*, --component-*, --theme-*, --layout-*, iconos): ni --primitive-* ni heredadas ni colores literales: 0 violations

ℹ️  2 inline exception(s) (// syx-allow), each with its reason:
   R03 scss/base/_reset.scss:340 — no es movimiento, es el truco que retrasa 600000s el fondo de autofill de Chrome; el mixin
   R03 scss/utilities/_accessibility.scss:78 — es el apagado de movimiento en sí, ya dentro de reduced-motion; transition() solo añadiría

── TOKEN USAGE (R08) ────────────────────────────────────────

⚠️  R08 — 85 semantic/component tokens in tokens.json that no compiled CSS uses:
   → --component-breadcrumb-bg-active
   → --component-breadcrumb-color
   → --component-breadcrumb-color-active
   → --component-breadcrumb-color-hover
   → --component-breadcrumb-font-size
   → --component-breadcrumb-gap
   → --component-breadcrumb-icon-filter
   → --component-breadcrumb-icon-margin-right
   → --component-breadcrumb-icon-size
   → --component-breadcrumb-item-padding-x
   → --component-button-gap
   → --component-button-padding-x
   → --component-button-padding-y
   → --component-button-primary-bg
   → --component-button-quaternary-bg
   … and 70 more. Run with --report to see all in lint-contract.json


📁 Contracts written to contracts/
   → runtime-tokens.json
   → token-contract.json
   → lint-contract.json
   → token-usage-map.json
   → validation-report.md
┌─────────────────────────────────────────────────────────────┐
│  Result: ⚠️  PASSED WITH WARNINGS                           │
└─────────────────────────────────────────────────────────────┘
```
```
── SNAPSHOT DE TOKENS RESUELTOS ────────────────────────────────

✅ Al día · 7 temas × 2 modos · 1382 tokens por tema
```
```
check:figma            7/7 temas al día
check:docs-componentes ✅ Referencia de componentes al día · 40 componentes en docs.html
check:contratos        
```
## Qué revisar
- Que el cambio hace lo que dice el porqué, no solo que compila.
- Que no introduce clases ni tokens que nadie consume.
