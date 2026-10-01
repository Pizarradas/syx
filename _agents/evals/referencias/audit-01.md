Fichero revisado: `_agents/evals/fixtures/audit-01.scss`, contexto `scss/molecules/_toast.scss`. `validate_snippet` → no conforme.

## Errors

| Línea | Regla | Severidad | Qué hay | Arreglo |
|---|---|---|---|---|
| 5 | R04 | error | `position: fixed` a pelo | `@include position(fixed, $bottom: var(--semantic-space-component-md))` |
| 8 | R01 | error | `var(--primitive-color-gray-900)` en una molécula | `var(--semantic-color-bg-inverse)`, o un token de componente del toast que apunte a él |
| 9 | R02 | error | `!important` | quitarlo; si algo lo pisa, el problema está en la capa, no aquí |
| 10 | R03 | error | `transition: opacity 200ms ease` | `@include transition(opacity var(--semantic-duration-fast))` |

## Additional Violations

| Línea | Hallazgo | Severidad | Why |
|---|---|---|---|
| 6 | `bottom: 1rem` es un valor a pelo | aviso | aviso y no error — no rompe R01–R04 y el arreglo de R04 lo absorbe con un token de espacio — si el valor se repitiera en otro componente, sería un token que falta y pasaría a error de R05 |

## Verdict

Contract: FAIL — cuatro errores de contrato. No se fusiona hasta que `validate_snippet` diga conforme.

FAIL lo carga R04 — `position: fixed` sin mixin deja el toast fuera del sistema de capas — si el componente pasara a usar `@include fixed()`, quedarían tres errores igual de bloqueantes.

## Validation Command

`node scripts/syx-validate.js --report`
