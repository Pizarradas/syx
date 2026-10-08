# Tareas de referencia de los modos

Los modos son documentos: prometen un comportamiento, pero nada medía si un agente que los sigue lo cumple. Este banco lo mide con **20 tareas** —dos por modo— y una rúbrica común. Sirve para comparar un modo antes y después de cambiarlo, o dos modelos con el mismo modo.

| Fichero | Qué es |
|---|---|
| `tareas.json` | Enunciado, reglas de frontera con forma, secciones del modo y preguntas de criterio de cada tarea; las reglas comunes y los equivalentes ES/EN de los encabezados |
| `referencias/` | Una respuesta que aprueba, por tarea, escrita con el Response Format de su modo y su `## Why` |
| `anti/` | Respuestas **dañinas** escritas para engañar al corrector (recitan lo que busca y hacen lo contrario). Todas tienen que suspender |
| `buenas/` | Respuestas **correctas** escritas de otra manera que la referencia (en otro idioma, nombrando lo prohibido en negativo). Todas tienen que aprobar |
| `fixtures/` | Lo que AUDIT y MIGRATE tienen que revisar |
| `juez.md` | La rúbrica del juez opcional (C3 y C5) |
| `runs/` | Ejecuciones del runner; git solo guarda el `RESUMEN.md` de cada una |
| `scripts/lib/evaluar.js` | El corrector determinista |
| `scripts/lib/juez.js` | El juez, si hay credenciales |
| `scripts/eval-runner.js` | Lanza un agente headless por tarea y lo corrige |

## Rúbrica

Cada criterio vale 0, 1 o 2.

| | Criterio | Cómo se mide | 2 | 1 | 0 |
|---|---|---|---|---|---|
| C1 | **Contrato** | Cada bloque ` ```scss ` (o lo que deja un ` ```diff `, sin el tramo citado como «// Antes») pasa `validate_snippet` en la ruta de la tarea; cada `.scss` que el agente escribió, en la suya | Conforme | — | Alguna violación de las reglas de árbol (R01–R04, R09, R10), un bloque que no parsea, o falta el código |
| C2 | **Tokens reales** | Cada `--semantic-*` / `--component-*` nombrado existe, salvo los nuevos que la tarea permite, los de componente que la propia respuesta declara y los que solo se nombran para descartarlos («no un `--component-card-bg` nuevo»). Un nombre de familia con comodín (`--semantic-color-state-*`) no cuenta | Todos existen | — | Alguno inventado |
| C3 | **Frontera** | Las reglas `debe` y `noDebe` de la tarea, con forma (abajo) | Todo | Un fallo | Dos o más |
| C4 | **Entrega** | Las secciones del **Response Format del modo** que la tarea pide, y el `## Why` cuando el modo lo debe | Todas | Falta una | Faltan dos o más |
| C5 | **Criterio** | Las preguntas de `criterio`: el juez si hay credenciales; si no, una persona o AUDIT | Sí | En parte | No |

**Aprueba** una respuesta con C1–C4 en 8/8 y cada pregunta de C5 en 1 o más. Un modo aprueba si aprueban sus dos tareas.

C1 y C2 son binarios a propósito: un token inventado o un `transition:` a pelo no son medio fallos.

### C3 · reglas con forma

La primera versión de C3 buscaba palabras. Ocho respuestas dañinas sacaban 8/8 recitando lo que buscaba —«R01 R02 R03 R04 / Todo bien, se puede fusionar»—, y una correcta suspendía por decir lo prohibido en negativo: «esto no pasa por propose.js». Una expresión regular suelta no distingue mencionar de recomendar, ni sabe en qué parte de la respuesta está. Ahora cada regla lo dice:

| Campo | Qué hace |
|---|---|
| `forma: "menciona"` | `debe`: aparece en algún sitio. `noDebe`: no puede aparecer de ninguna forma (un bloque ` ```scss ` en UX) |
| `forma: "afirma"` | `debe`: aparece al menos una vez **fuera de una cláusula negada** |
| `forma: "recomienda"` | `noDebe`, por defecto: suspende solo si aparece fuera de una cláusula negada |
| `en` | `prosa`, `codigo` o un lenguaje (`scss`, `html`…): «el mixin en el código», no en la explicación |
| `seccion` | Solo mira debajo de esa sección del modo: «FAIL» tiene que estar en el veredicto |
| `junto` | Otra expresión en la misma línea: cada R0x con su arreglo en la misma fila |
| `multilinea` | La expresión se aplica al texto entero (un bloque con dos migraciones) |
| `comun` | Una regla del bloque `comunes` (`escribio`, `commitMain`) |

En el código, lo que se cita como estado anterior —de un comentario `// Antes` hasta `// Después`, o las líneas `-` de un diff— no cuenta para las reglas que prohíben: es lo que se quita, no lo que se entrega.

La negación se lee por cláusulas: «no», «nunca», «se niega», «not»… niegan la cláusula entera; «en vez de», «sin», «instead of» niegan lo que viene detrás. Las cláusulas se cortan en la puntuación de frase, los paréntesis, las celdas de tabla y las conjunciones que encadenan una orden con su contraria (`sino`, `pero`, `y`) o con su finalidad (`para que`, `porque`). Es una heurística, y sus límites los cubren dos cosas: el juez, y los bancos `anti/` y `buenas/`, que hacen de pruebas de regresión del propio corrector.

### C4 · el formato lo dice el modo

Las secciones ya no se escriben a mano en `tareas.json` en español: se leen del bloque de formato de `_agents/modes/<modo>.md` (`## Response Format`, o `Violation Report Format` en AUDIT y `What You Output` en MIGRATE), y la tarea elige cuáles exige por su nombre canónico, en inglés, como el modo. Un encabezado vale si empieza por el canónico o por uno de sus **equivalentes** (`"Verdict": ["Veredicto"]`) —«Usages Found (únicos en el repo)» vale por «Usages Found»—, en `#`–`####` o como etiqueta en negrita. Una entrada de `secciones` puede ser una lista de alternativas: `[["Errors", "Additional Violations"], "Verdict"]`. Los equivalentes salieron de respuestas reales del runner; cuando un agente use otro nombre razonable, se añade ahí, no se afloja la comparación. Si un modo renombra una sección, la tarea que la pide se pone en rojo en `check:evals`.

El **Why** sale de `_agents/decision-record.md`: SKETCH está exento; AUDIT y MIGRATE cuelgan cada línea de su hallazgo, así que basta con una línea de tres campos en cualquier sitio; los demás cierran con un bloque `## Why` que tiene que ser el último, con cada línea en la forma `decidido — porque — qué lo cambiaría` (o con su condición explícita: «… sería error si …»), y sin pasar del techo (cinco; nueve en BRAND). Una tarea puede declarar `sinWhy` con su porqué cuando no hay decisión con alternativa (brand-02 solo redirige).

### El juez

Con `ANTHROPIC_API_KEY` en el entorno (API de Mensajes, modelo `SYX_JUEZ_MODELO`) o la CLI `claude` instalada (`claude -p --json-schema`, sin herramientas y fuera del repositorio), un modelo puntúa C3 y C5 con la rúbrica de `juez.md` y devuelve JSON. **Solo resta**: en C3 vale la menor de las dos notas. Sin credenciales —o con `SYX_JUEZ=0`, o `--sin-juez`— se salta con un aviso y la nota determinista sigue valiendo. Su nota varía entre ejecuciones: para comparar modelos, mira la tendencia de varias corridas, no una.

## Cómo se usa

**A mano**, con una respuesta pegada:

```
npm run eval:modo -- <id> respuesta.md          # con juez si hay credenciales
npm run eval:modo -- <id> respuesta.md --sin-juez
node scripts/eval-modo.js --lista
```

**Con un agente de verdad**, el runner:

```
npm run eval:runner                              # las 20, con `claude -p`
npm run eval:runner -- --modo ui,token           # un filtro por modo
npm run eval:runner -- --id audit-01 --paralelo 3 --etiqueta sonnet
SYX_AGENT_MODEL=<modelo> npm run eval:runner     # otro modelo de Claude
SYX_AGENT_CMD="mi-agente --flag" npm run eval:runner   # otro agente
```

Para cada tarea, el runner:

1. Copia el repositorio a un directorio temporal (los ficheros que git conoce, `node_modules` enlazado, un repositorio git propio para que `propose.js` funcione). **De `_agents/evals/` solo viaja `fixtures/`**: ni referencias ni reglas, o el agente podría leer las soluciones.
2. Lanza el agente con el cwd en esa copia. Por defecto, `claude -p "<enunciado>" --output-format stream-json --verbose --max-turns 30 --permission-mode dontAsk --allowedTools "…" --mcp-config <servidor syx de la copia> --strict-mcp-config --no-session-persistence`. Sin `--bare`, porque el agente tiene que leer `CLAUDE.md`, que es lo que activa el modo con el prefijo `[SYX: UI]:` del enunciado. `SYX_AGENT_TOOLS`, `SYX_AGENT_MAX_TURNS` y `SYX_AGENT_TIMEOUT` (segundos) lo ajustan.
3. Con `SYX_AGENT_CMD`, ejecuta ese comando con `sh -c` en la copia; recibe el enunciado por stdin y en `SYX_EVAL_ENUNCIADO` (además de `SYX_EVAL_ID`, `SYX_EVAL_MODO`, `SYX_EVAL_DIR`), y su salida puede ser texto, un JSON con `result` o stream-json.
4. Corrige la respuesta final **y los ficheros que el agente escribió**: en su copia (un agente que escribe el átomo en `scss/atoms/` en vez de pegarlo pasa C1 igual; lo derivado, `css/` o `contracts/`, no cuenta) y fuera de ella según su transcripción (el boceto que SKETCH deja en `/tmp`). Por defecto el agente solo puede escribir en su copia y en el directorio temporal del sistema. Con el juez, si hay credenciales.
5. Escribe en `_agents/evals/runs/<fecha>-<etiqueta>/`: `<id>.md` (transcripción resumida, ficheros tocados y nota), `<id>.respuesta.md` y `<id>.anexos.json` (lo que se corrigió), `<id>.jsonl` (salida cruda), `RESUMEN.md` (tabla tarea · nota · fallos, y veredicto por modo) y `resumen.json`. Git ignora todo salvo `RESUMEN.md`.

Cuando cambia el corrector, `npm run eval:runner -- --recorregir _agents/evals/runs/<carpeta>` vuelve a corregir las respuestas guardadas sin lanzar agentes: separa el cambio de nota que viene del corrector del que viene de la variación del agente, y no cuesta nada.

Si el runner corre dentro de otra sesión de Claude Code, no pasa al agente las variables que lo atarían a la sesión padre (su id, su canal de mensajes): sin eso, el hijo compartía sesión y su salida se cortaba sin evento `result`.

Sale con 1 si el agente no se pudo ejecutar en alguna tarea; con `--estricto`, también si alguna suspende.

En GitHub, el workflow manual **Evaluación de los modos** (`.github/workflows/evals.yml`, `workflow_dispatch`) hace lo mismo con el secreto `ANTHROPIC_API_KEY` y sube la carpeta de la ejecución como artefacto.

## Qué garantiza `npm run check`

El banco y el runner, no a los agentes. Sin red.

`check:evals`:

1. Cada modo de `_agents/modes/` tiene dos tareas o más.
2. Cada tarea está bien formada: reglas con forma conocida y expresiones válidas, y cada sección que pide existe en el Response Format de su modo.
3. Cada referencia saca 8/8, **también con sus encabezados traducidos al español**.
4. Cada **mutante** —la referencia con un único fallo sembrado— suspende.
5. Cada **anti-referencia** suspende en la parte determinista. Si alguien afloja el corrector hasta que todo aprueba, esto se pone en rojo.
6. Cada **respuesta buena alternativa** aprueba. Si alguien endurece el corrector hasta que suspende respuestas correctas, esto se pone en rojo.

`check:runner` ejecuta el runner de punta a punta con un agente simulado (`scripts/eval-agente-simulado.js`) sobre AUDIT y THEME: las referencias aprueban en los tres formatos de salida, las anti suspenden, la copia no lleva las soluciones y el árbol real no cambia.

## Añadir una tarea

Una entrada en `tareas.json` con su referencia (en el formato de su modo, con su Why), un mutante que cambie una sola cosa y, si la tarea tiene una forma realista de hacer daño, una anti-referencia en `anti/` que lo haga recitando lo que el corrector busca. Una tarea sin mutante no demuestra que el corrector la vea; una regla sin anti-referencia no demuestra que no se la pueda engañar.

Las anti-referencias y las buenas llevan cabecera:

```
---
tarea: audit-01
daño: recita las cuatro reglas sin línea ni arreglo y aprueba el fragmento
---
```

(`por qué:` en vez de `daño:` en `buenas/`.)
