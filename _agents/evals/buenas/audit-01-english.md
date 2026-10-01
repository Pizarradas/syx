---
tarea: audit-01
por qué: la auditoría entera en inglés, como el formato del modo
---
Reviewed `_agents/evals/fixtures/audit-01.scss` as `scss/molecules/_toast.scss`.

## Errors (must fix before release)

| Line | Rule | Severity | Violation | Fix |
|---|---|---|---|---|
| 5 | R04 | error | raw `position: fixed` | `@include fixed($bottom: var(--semantic-space-component-md))` |
| 8 | R01 | error | `--primitive-color-gray-900` in a molecule | `var(--semantic-color-bg-inverse)` |
| 9 | R02 | error | `!important` | remove it; fix the layer order instead |
| 10 | R03 | error | raw `transition` | `@include transition(opacity var(--semantic-duration-fast))` |

## Verdict

Contract: FAIL. Do not merge until `validate_snippet` reports it compliant.

FAIL is carried by R04 — a raw fixed position escapes the layer system — moving to `@include fixed()` would still leave three blocking errors.

## Validation Command

node scripts/syx-validate.js --report
