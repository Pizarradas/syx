Cambio revisado: `_agents/evals/fixtures/audit-02.diff`. `classify_change` sobre las dos rutas.

## Additional Violations

| Fichero | Tier (`contracts/trust.json`) | Hallazgo | Severidad |
|---|---|---|---|
| `scss/themes/example-03/_theme.scss` | human | Un agente no puede cambiar un tema: llega a todo lo que lo usa. Además el primario pasa a un paso más claro de la rampa y puede bajar de 4,5:1 como texto; hay que pasar `npm run check:contraste`. | error |
| `scss/atoms/_btn.scss` | pr | Correcto por la vía de propuesta. Cambiar el peso del botón es una decisión de diseño que el PR no justifica. | aviso |

- Tema: error — el tier `human` lo fija el contrato y el cambio llega a todos los consumidores — solo lo cambiaría que una persona lo firme como suyo.
- Botón: aviso y no error — la vía pr es la correcta y lo que falta es la razón, no el permiso — si el peso rompiera el contraste del texto del botón, sería error.

## Verdict

Contract: PASS (R01–R08) · Frontera: FAIL. No se fusiona tal cual. La parte del tema sale del PR y la decide una persona con la medida de contraste delante. La del botón puede seguir como propuesta si alguien explica por qué.

## Validation Command

`node scripts/syx-validate.js --report`
