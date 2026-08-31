# Propuesta — `--component-radio-bg`
**Generada por** `scripts/propose.js` · 2026-08-31T22:40:56.831Z · SYX v4.27.0
## Qué
| | |
|---|---|
| Token | `--component-radio-bg` |
| Valor | `var(--semantic-color-bg-primary)` |
| Fichero | `scss/abstracts/tokens/components/_forms.scss` |
| Nivel de confianza | Vía propuesta — El alcance está acotado a un componente. Es reversible de un vistazo, pero toca CSS que se envía a producción. |
**Por qué:** Fondo del radio sin marcar: mismo caso que el checkbox, solo existia --component-radio-bg-checked

## Dónde va, y por qué ahí
Nadie lo ha dicho: se dedujo de la familia `radio-bg`, que ya vive en ese fichero (`--component-radio-bg-checked`). Se insertó al final de su bloque para no partir la agrupación.
## Evidencia
```
┌─────────────────────────────────────────────────────────────┐
│  SYX Validate v2.0 — Contracts Layer Report                │
└─────────────────────────────────────────────────────────────┘

── RUNTIME SURFACE ─────────────────────────────────────────

   Total custom properties in CSS: 1357
   Official (--primitive/semantic/component/etc.): 1082
   Legacy (no SYX prefix): 275

── SOURCE vs RUNTIME ────────────────────────────────────────

✅ R06 — All tokens.json entries appear in runtime CSS

⚠️  R05 — 3 undocumented --component-* tokens (in CSS but NOT in tokens.json):
   → --primitive-font-weight-black
   → --component-check-bg
   → --component-radio-bg

── LEGACY VARS (R07) ────────────────────────────────────────

ℹ️  R07 — 275 legacy vars found (no official SYX prefix):
   → --base-measure
   → --font-family-1
   → --font-family-2
   → --font-weight-1
   → --font-weight-2
   → --font-bold
   → --gap-1
   → --inner-1
   → --font-size-1
   → --font-size-2
   → --font-size-3
   → --font-size-4
   → --font-size-5
   → --dimension-1
   → --dimension-2
   … and 260 more. See contracts/lint-contract.json

── SCSS RULE VIOLATIONS ─────────────────────────────────────

✅ R01 — Primitive tokens in components: 0 violations

✅ R02 — !important usage: 0 violations

✅ R03 — Raw transition: property: 0 violations

✅ R04 — Raw position: absolute/fixed/sticky: 0 violations

┌─────────────────────────────────────────────────────────────┐
│  Result: ⚠️  PASSED WITH WARNINGS                           │
│  Tip: run with --report to generate contracts/ JSON files  │
└─────────────────────────────────────────────────────────────┘
```
```
── SNAPSHOT DE TOKENS RESUELTOS ────────────────────────────────

✅ Al día · 7 temas × 2 modos · 1082 tokens por tema
```
## Qué revisar
- Que el valor semántico elegido es el que corresponde, no solo uno que compila.
- Que el token se usa en algún sitio: un token que nadie consume es peso muerto.
- Que el nombre encaja con la familia y no inventa una convención nueva.
