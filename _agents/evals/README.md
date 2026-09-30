# Tareas de referencia de los modos

Los modos son documentos: prometen un comportamiento, pero nada medía si un agente que los sigue lo cumple. Este banco lo mide con **18 tareas** —dos por modo— y una rúbrica común. Sirve para comparar un modo antes y después de cambiarlo, o dos modelos con el mismo modo.

| Fichero | Qué es |
|---|---|
| `tareas.json` | Enunciado, comprobaciones y preguntas de criterio de cada tarea |
| `referencias/` | Una respuesta que aprueba, por tarea |
| `fixtures/` | Lo que AUDIT tiene que revisar |
| `scripts/lib/evaluar.js` | El corrector |

## Cómo se usa

1. Se da al agente el `enunciado` de la tarea, con el modo activado como lo haría una persona.
2. Se guarda su respuesta completa en un `.md`.
3. `npm run eval:modo -- <id> respuesta.md` (o `node scripts/eval-modo.js --lista`).
4. Quien corrige —una persona, o `[SYX: AUDIT]` con las preguntas delante— puntúa C5.

## Rúbrica

Cada criterio vale 0, 1 o 2.

| | Criterio | Cómo se mide | 2 | 1 | 0 |
|---|---|---|---|---|---|
| C1 | **Contrato** | Cada bloque ` ```scss ` pasa `validate_snippet` en la ruta de la tarea | Conforme | — | Alguna violación R01–R04, o falta el código |
| C2 | **Tokens reales** | Cada `--semantic-*` / `--component-*` nombrado existe, salvo los nuevos que la tarea permite | Todos existen | — | Alguno inventado |
| C3 | **Frontera** | Lo que la tarea exige (`debe`) y prohíbe (`noDebe`): tier de confianza, vía de propuesta, herramientas | Todo | Un fallo | Dos o más |
| C4 | **Entrega** | Las secciones que la tarea pide | Todas | Falta una | Faltan dos o más |
| C5 | **Criterio** | Las preguntas de `criterio`, a juicio de quien corrige | Sí | En parte | No |

**Aprueba** una respuesta con C1–C4 en 8/8 y cada pregunta de C5 en 1 o más. Un modo aprueba si aprueban sus dos tareas.

C1 y C2 son binarios a propósito: un token inventado o un `transition:` a pelo no son medio fallos. C5 no se automatiza: una expresión regular no sabe si un flujo de UX es bueno, y fingir que lo sabe sería peor que no medir.

## Qué garantiza `npm run check:evals`

El banco, no a los agentes: que cada modo de `_agents/modes/` tiene dos tareas o más, que cada referencia saca 8/8 y que cada **mutante** —la referencia con un único fallo sembrado— suspende. Si alguien afloja el corrector hasta que todo aprueba, el mutante deja de suspender y la cadena se pone en rojo.

## Añadir una tarea

Una entrada en `tareas.json` con su referencia y un mutante que cambie una sola cosa. Una tarea sin mutante no demuestra que el corrector la vea.
