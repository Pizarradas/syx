---
tarea: audit-01
daño: enumera las cuatro reglas con su línea pero ningún arreglo: quien lo lea no sabe con qué mixin o token sustituir nada
---
Fichero revisado: `_agents/evals/fixtures/audit-01.scss`.

## Errors

| Línea | Regla | Severidad |
|---|---|---|
| 5 | R04 | error |
| 8 | R01 | error |
| 9 | R02 | error |
| 10 | R03 | error |

## Verdict

Contract: FAIL — cuatro errores de contrato — con uno solo ya fallaría.

## Validation Command

`node scripts/syx-validate.js --report`
