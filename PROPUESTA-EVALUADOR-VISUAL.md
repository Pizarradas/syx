# Propuesta — evaluador de composición

> **Estado:** borrador para revisión. Nada de este documento está implementado.
> **Origen:** `SYX_Evaluation_After_Cross_Style_Tests.md`, §14–15 y P0
> *visual quality evaluation*.
> **Por qué está escrito y no hecho:** toca `scripts/` y un fichero nuevo en la
> raíz, que `contracts/trust.json` marca `human`. Redactarlo, sí; firmarlo, no.
> **Depende de:** la misma línea de `trust.json` que espera `DECISION-patrones.md`.

---

## 1 · El hallazgo que cambia el coste

El informe da la evaluación de calidad visual por inexistente (🔴 *Limited*) y
propone inventarle un formato. El formato ya está escrito:

`mind-system/knowledges/branding/perception-of-prestige.rules.md` — **18 reglas
en 7 bloques**, cada una con identificador, señal positiva, señal negativa,
check y plantilla de salida, más un orden de prioridad por impacto y una tabla
de reporte. Compárese con el ejemplo del §15 del informe:

```
VISUAL-HIERARCHY-002 · Severity: recommendation
The N1 headline competes with two adjacent high-emphasis elements.
Suggested action: reduce emphasis of supporting content.
```

y con `R-TYP-01`, que ya existe:

```
Output: "Jerarquía tipográfica ambigua — los niveles [X] y [Y] presentan
contraste insuficiente. Esto elimina la señal de control y precisión."
```

Es la misma gramática. Lo que falta no es inventarla: es **generalizarla más
allá del prestigio, ponerle números y darle un guardián**. Eso cambia la
prioridad de «construir una capa nueva» a «terminar una que está a medias».

Lo que hoy le falta a ese fichero para ser lo que pide el informe: cubre una
familia de rasgos y solo una, es prosa que nadie ejecuta, no tiene umbrales
—«padding generoso» no es comprobable— y ningún modo lo aplica salvo a
petición.

---

## 2 · Qué de esas 18 puede comprobar una máquina

Las clasifiqué una a una contra lo que hay en disco: marcado, CSS compilado y
`contracts/resolved-tokens.json`.

| Comprobable sin renderizar | Necesita una persona o el activo |
|---|---|
| `R-TYP-01` jerarquía (escalón entre niveles, nº de familias) | `R-SPC-02` espacio intencional o residual |
| `R-TYP-02` interlineado y tracking | `R-COL-02` asociaciones culturales del color |
| `R-SPC-01` densidad (padding, separación de secciones) | `R-SYS-02` coherencia de tono verbal |
| `R-COL-01` tamaño de paleta y roles | `R-AUT-01/02/03` prueba social, precisión, credenciales |
| `R-COL-03` contraste ≥ 4.5:1 | `R-DET-03` calidad de los activos visuales |
| `R-SYS-01` radios y sombras entre componentes equivalentes | `R-ESC-01/02` contención del mensaje, exclusividad |
| `R-DET-01` alineación a la rejilla | |
| `R-DET-02` estados sin feedback (`:hover`, `:focus`) | |
| **8** | **10** |

**La frontera no es la que parecía.** No separa «prestigio medible» de
«prestigio subjetivo»: separa **composición de contenido**. Las ocho de la
izquierda miden relaciones entre elementos; las diez de la derecha miden lo que
la página *dice* y con qué activos lo dice. Un evaluador de composición no es
un evaluador recortado — es el evaluador entero de una mitad, y la otra mitad
no es suya.

Eso da el alcance de una vez y sin negociarlo después: **el evaluador mira
relaciones, no contenido.**

---

## 3 · Las doce dimensiones del informe, con la misma frontera

| Dimensión (§15) | ¿Medible sobre marcado + tokens resueltos? |
|---|---|
| hierarchy clarity | sí — escalón tipográfico entre niveles contiguos |
| visual competition | sí — cuántos elementos comparten el escalón máximo en una zona |
| density | sí — elementos y pasos de espaciado por sección |
| rhythm | sí — varianza de densidad entre secciones consecutivas |
| repetition / monotony | sí — geometría de rejilla repetida n veces seguidas |
| contrast | sí — ya se resuelve el valor real del token |
| scanability | parcial — nº y profundidad de encabezados, longitud de bloque |
| balance | no sin render |
| focus | no sin intención declarada |
| content prominence | no — es contenido |
| brand alignment | no — necesita la dirección de arte, que hoy no se escribe en ningún sitio |

Siete de doce, más una parcial. La última fila deja de ser «no» en cuanto
CREATIVE empiece a declarar su dirección de arte en el bloque `## Why`
(`_agents/decision-record.md`): sin carácter declarado no hay nada contra lo
que alinear, y por eso ese trabajo va antes que este.

---

## 4 · Lo que un evaluador no va a poder hacer nunca

El informe formula el hueco así: *«esta página cumple SYX y es visualmente
mediocre»*. Conviene partirlo, porque solo una mitad se cierra.

Un conjunto de heurísticas detecta **defectos de relación**: dos cosas
compitiendo, tres secciones iguales, una jerarquía que no se lee. Eso es
mecánico y se cierra.

No detecta **ausencia de idea**. Una página sin un solo defecto de relación y
sin nada que decir pasa todos los checks. Ausencia de defecto no es presencia
de calidad, y ningún umbral convierte una en la otra.

Decirlo ahora evita el fallo de diseño más caro que puede tener esta capa:
perseguir «bonito» con umbrales, no alcanzarlo nunca, y concluir que el sistema
está roto cuando lo que está mal es la pregunta. El evaluador sube el suelo. El
techo lo sigue poniendo quien diseña.

---

## 5 · Severidad: nunca `error`, y por eso no va en `rules.json`

R01–R08 miden conformidad: hay una respuesta correcta y el resto son
infracciones. Una heurística mide una relación: hay mejor y peor, y el peor
puede estar justificado por algo que la heurística no ve.

Meterlas en el mismo fichero obliga a elegir entre dos daños: o la heurística
hereda el poder de bloquear —y entonces el sistema tiene una policía del
gusto—, o se le añade a `rules.json` una severidad que no bloquea, y entonces
R01 deja de significar lo que significa hoy, que es *esto no sale*.

Registro propio, severidad única:

```
severidad: "recomendación"     — siempre, sin excepción
impacto:   "alto" | "medio" | "bajo"
```

El impacto no bloquea nada: ordena el informe. Y no hay que inventarlo — el
orden de prioridad de las diez primeras ya está escrito al final del fichero de
prestigio, calibrado por impacto en la percepción global.

---

## 6 · Dónde vive

`heuristics.json` en la raíz, tier `pr`, publicado con el paquete. Los mismos
argumentos que cerraron `DECISION-patrones.md`: `mind-system/` no se publica a
npm, y quien instala SYX en vez de clonarlo es justo quien no tiene a nadie que
le mire la página.

En la tabla de precedencia, **peldaño 5.6** — debajo de `patterns.json` (5.5),
porque un patrón dice cómo se compone y una heurística solo opina sobre el
resultado, y por encima de `knowledges/` (6), porque tiene esquema.

### La pregunta abierta que hay que decidir

El esquema de `patterns.json` ya tiene un campo `antiPatterns`. El ejemplo
`RHYTHM-004` del informe —tres secciones seguidas con la misma geometría— es
exactamente un anti-patrón de `equal-card-grid`. O sea: parte de esta capa ya
tiene casa asignada en una decisión cerrada.

Dos salidas:

1. **Fundirlas** — que `antiPatterns` desaparezca y toda heurística viva en
   `heuristics.json` con un campo `pattern` opcional. Un esquema, un guardián,
   cero duplicación. Coste: reabre una decisión que acabas de cerrar.
2. **Enlazarlas** — `antiPatterns` se queda como prosa que se lee *mientras se
   compone*, y `heuristics.json` es lo que se ejecuta *después*. El guardián
   exige que cada entrada de `antiPatterns` nombre el id de la heurística que
   la comprueba, y la duplicación se convierte en un enlace comprobado.

**Recomiendo la 2.** Son dos momentos distintos —generación y evaluación— y
fundirlos obliga a que quien compone cargue el registro entero de heurísticas
para leer las tres que le tocan. Y no reabre nada.

---

## 7 · Esquema

```json
{
  "id": "H-RIT-01",
  "dimension": "ritmo",
  "impacto": "medio",
  "mide": "secciones consecutivas con la misma geometría de rejilla y la misma densidad",
  "fuente": ["marcado", "css-compilado"],
  "umbral": { "seccionesIguales": 3 },
  "pattern": "equal-card-grid",
  "salida": "Tres secciones consecutivas ({zonas}) repiten rejilla y densidad. Riesgo: monotonía visual.",
  "accion": "Introducir una sección de densidad distinta o estructuralmente diferente entre ellas.",
  "falsoPositivoConocido": "un índice o un listado paginado repite geometría a propósito",
  "calibradaContra": ["home.html", "atlas/portada-economista.html"],
  "status": "active"
}
```

Dos campos que no estaban en el informe y que sostienen todo lo demás:

- **`falsoPositivoConocido`** — obligatorio. Una heurística que no sabe decir
  cuándo se equivoca no se puede desactivar con criterio, solo ignorar. Es la
  misma disciplina que el tercer campo del bloque `## Why`: lo que la falsaría,
  escrito por quien la propone.
- **`calibradaContra`** — obligatorio, y con páginas que existan en disco. Una
  heurística escrita sin una página donde dispare es una opinión con esquema,
  igual que un patrón sin respaldo. Si al pasarla por el corpus no salta en
  ninguna, el umbral está muerto; si salta en todas, está roto.

---

## 8 · Las primeras seis

Solo las que el corpus real puede calibrar hoy: `home.html`, `docs.html`,
`why-syx.html`, y las portadas y reportajes de `syx--atlas`.

| id | Mide | Umbral de partida |
|---|---|---|
| `H-JER-01` | dos niveles contiguos separados por menos de un escalón de la escala | < 1 escalón |
| `H-COMP-01` | elementos en el escalón tipográfico máximo dentro de la primera pantalla | > 1 |
| `H-RIT-01` | secciones consecutivas con igual rejilla y densidad | ≥ 3 |
| `H-DEN-01` | varianza de densidad entre secciones de la página | por debajo del umbral = página plana |
| `H-CON-01` | contraste de texto funcional contra su fondo resuelto | < 4.5:1 |
| `H-PAL-01` | colores distintos sin token semántico detrás | > 5 |

`H-COMP-01` y `H-RIT-01` son literalmente los dos ejemplos del §15 del informe.
`H-CON-01` y `H-PAL-01` son `R-COL-03` y `R-COL-01` con un número en vez de un
adjetivo. `H-DEN-01` es la única que no viene de ninguna de las dos fuentes:
sale de lo que ya dice `CLAUDE.md` sobre densidad y de lo que el informe observa
en §7.7 — que el valor está en *no* tratar todas las secciones con la misma
intensidad. Una página plana no infringe nada y es el defecto más común.

---

## 9 · Cómo se ejecuta, y qué falta de verdad

No es una tubería nueva. `scripts/lib/escaner.js` ya lee marcado y CSS, ya
resuelve tokens contra tema y modo, ya ignora `<pre>`, `<code>`, `<script>` y
`<textarea>` —el problema de los falsos positivos en documentación ya está
resuelto ahí— y exporta `escanear`, `clasesDe`, `trozosCss` y `vaciar`.

Lo que **no** tiene y hay que añadir es lo único caro del asunto: el escáner
mira un inventario plano de clases y valores, y cinco de las seis heurísticas
necesitan **estructura** — qué secciones hay, en qué orden, qué contiene cada
una y qué encabezado la abre. Un árbol de secciones y encabezados, ligero, sobre
el marcado ya vaciado.

Ese árbol es el trabajo real. Todo lo demás son comparaciones sobre datos que ya
se calculan.

```
scripts/evaluate.js <html> [--theme] [--mode] [--json]
scripts/lib/estructura.js     ← lo nuevo: árbol de secciones
scripts/lib/heuristicas.js    ← lee heuristics.json y lo aplica al árbol
```

Y una herramienta MCP, `evaluate_composition`, para que AUDIT pueda pedirla en
vez de leer el registro — la línea de «Ask, don't read» de ese modo ya está
escrita para recibirla.

---

## 10 · El guardián

`check:heuristics`, al nivel de los que ya existen:

- toda heurística tiene `falsoPositivoConocido` y `calibradaContra` no vacíos
- todo fichero de `calibradaContra` existe
- ninguna heurística declara `severidad` distinta de `recomendación`
- todo `pattern` referenciado existe en `patterns.json`
- toda entrada de `antiPatterns` en `patterns.json` nombra una heurística que
  existe — la salida 2 del §6, comprobada

Y una comprobación que no tienen los demás guardianes: **correr el registro
entero contra el corpus de `calibradaContra` y fallar si una heurística no
dispara en ninguna página o dispara en todas.** Un umbral no calibrado no da
error, da ruido, y el ruido apaga el evaluador entero — que es exactamente como
mueren los linters.

---

## 11 · Orden

1. El árbol de secciones (`estructura.js`). Sin él no hay cinco de las seis.
2. `H-CON-01` y `H-PAL-01` primero, que no necesitan el árbol: sirven para
   probar la tubería con datos que ya existen.
3. Las cuatro de composición, calibradas contra el corpus una a una.
4. El guardián, antes de que haya siete heurísticas y nadie recuerde con qué se
   calibró la tercera.
5. La herramienta MCP y la línea en AUDIT.

---

## 12 · El primer trazo

El mismo que espera `DECISION-patrones.md`, y por la misma razón. Una línea:

```diff
   "pr": {
     "paths": [
       ...
+      "patterns.json",
+      "heuristics.json",
       "tokens.json"
     ]
   },
```

`scripts/` sigue siendo `human`: `evaluate.js`, `estructura.js`,
`heuristicas.js` y `check-heuristics.js` los escribes tú, o me los pides como
borrador y los revisas antes de que entren.
