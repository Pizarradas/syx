Fichero revisado: `_agents/evals/fixtures/audit-01.scss`, contexto `scss/molecules/_toast.scss`.

## Violaciones

| Línea | Regla | Severidad | Qué hay | Arreglo |
|---|---|---|---|---|
| 5 | R04 | error | `position: fixed` a pelo | `@include position(fixed, $bottom: var(--semantic-space-component-md))` |
| 8 | R01 | error | `var(--primitive-color-gray-900)` en una molécula | `var(--semantic-color-bg-inverse)`, o un token de componente del toast que apunte a él |
| 9 | R02 | error | `!important` | quitarlo; si algo lo pisa, el problema está en la capa, no aquí |
| 10 | R03 | error | `transition: opacity 200ms ease` | `@include transition(opacity var(--semantic-duration-fast))` |

`bottom: 1rem` es un valor a pelo: aviso, se resuelve dentro del mixin de posición con un token de espacio.

## Veredicto

No conforme: 4 errores de contrato. No se fusiona hasta que `validate_snippet` diga conforme.
