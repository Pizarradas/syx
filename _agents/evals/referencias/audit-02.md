Cambio revisado: `_agents/evals/fixtures/audit-02.diff`. `classify_change` sobre las dos rutas.

## Violaciones

| Fichero | Tier (`contracts/trust.json`) | Hallazgo |
|---|---|---|
| `scss/themes/example-03/_theme.scss` | human | Un agente no puede cambiar un tema: llega a todo lo que lo usa. Además el primario pasa a un paso más claro de la rampa y puede bajar de 4,5:1 como texto; hay que pasar `npm run check:contraste`. |
| `scss/atoms/_btn.scss` | pr | Correcto por la vía de propuesta. Cambiar el peso del botón es una decisión de diseño que el PR no justifica. |

## Veredicto

No se fusiona tal cual. La parte del tema sale del PR y la decide una persona con la medida de contraste delante. La del botón puede seguir como propuesta si alguien explica por qué.
