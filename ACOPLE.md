# Acople mind-system ↔ SYX — lo que falta, y lo hace una persona

`mind-system/` quedó acoplado al motor. Cuatro cosas del acople caen en tier `human` según `contracts/trust.json` y por eso están aquí especificadas en vez de aplicadas: los contratos y los guardianes no los mueve quien es validado por ellos.

Las cuatro están probadas contra el repositorio real antes de escribirlas. Donde digo *funciona*, lo he ejecutado.

| # | Qué | Dónde | Tier | Urgencia |
|---|---|---|---|---|
| A | Cerrar el agujero `*.md` sobre la gobernanza | `contracts/trust.json` | `human` | **Alta** — hoy un agente puede reescribir su propia constitución |
| B | Guardián del córtex | `scripts/check-conocimiento.js` | `human` | Media |
| C | Exigir bloque `Knowledge` a cada modo | `scripts/check-modos.js` | `human` | Media |
| D | No publicar el córtex | `package.json` | `human` | Baja — hoy ya no se publica, conviene que sea explícito |

---

## A · `contracts/trust.json` — el agujero del patrón `*.md`

### El problema, con el mecanismo exacto

`confianza.js` resuelve el tier con dos reglas: un patrón `*.md` alcanza a **cualquier** markdown en cualquier carpeta (línea 54–55: *«Un patrón `*.md` también vale dentro de carpetas de documentación»*), y **gana el patrón más largo**. `*.md` mide 4 caracteres y está en `auto`. Ningún patrón de `mind-system/` existe todavía. Resultado:

```
mind-system/governance/          → human   (por defecto, sin patrón)
mind-system/governance/04-conflicts.md → auto   (patrón *.md)
```

El tier depende de si preguntas por la carpeta o por el fichero — y un agente pregunta siempre por el fichero que va a escribir. Es decir: **hoy un agente puede reescribir la escalera de precedencia, la constitución y las reglas de arbitraje de Atlas sin pasar por nadie.** Es exactamente el agujero que tus propias notas dicen haber cerrado para `contracts/`:

> *«contracts/trust.json está en `human` a propósito: un agente que pudiera ampliar sus propios permisos no tendría permisos, tendría una sugerencia.»*

### El parche

En `tiers.human.paths`, añadir cuatro entradas:

```json
"mind-system/governance/",
"mind-system/atlas-rules/",
"mind-system/constitution.md",
"mind-system/README.md",
```

No hace falta tocar nada más: como gana el patrón más largo, `mind-system/governance/` (23 caracteres) se impone sobre `*.md` (4) sin ambigüedad. El mecanismo ya lo soportaba; solo le faltaban las rutas.

### Verificado

Simulado sobre el contrato real, sin escribirlo:

```
mind-system/governance/04-conflicts.md                      auto  →  human
mind-system/governance/README.md                            auto  →  human
mind-system/atlas-rules/11-gobierno/11.0-arbitraje…md        auto  →  human
mind-system/atlas-rules/06-sistema-editorial/06.2-…md        auto  →  human
mind-system/constitution.md                                 auto  →  human
mind-system/README.md                                       auto  →  human
mind-system/routing.md                                      auto  →  auto
mind-system/knowledges/ux/laws-of-ux.md                     auto  →  auto
_agents/modes/ui.md                                         auto  →  auto
contracts/trust.json                                        human →  human
scss/themes/example-03/_theme.scss                          human →  human

6 rutas cambian de tier. El resto queda intacto.
```

### Por qué esas cuatro y no más

| Ruta | Tier | Razón |
|---|---|---|
| `mind-system/governance/` | `human` | Es el criterio con el que se juzga la composición de dos sistemas. Mismo argumento que `contracts/rules.json`. |
| `mind-system/atlas-rules/` | `human` | Es ley editorial. Tu propio `11.1` ya dice que una *revisión* solo la aprueba el equipo de diseño del sistema; esto lo hace cierto en vez de escrito. |
| `mind-system/constitution.md` | `human` | Define dominios y solapamientos de los ocho modos. |
| `mind-system/README.md` | `human` | Contiene la escalera de precedencia. Un agente que pueda editarla puede reordenarla. |
| `mind-system/routing.md` | **sigue `auto`** | Es un artefacto **derivado**: la fuente son los bloques `Knowledge` de los modos, que ya están vigilados. Ponerlo en `human` cobraría un peaje cada vez que un modo añade una línea, sin proteger nada que no esté protegido aguas arriba. Lo que hace falta ahí es el guardián B, no un candado. |
| `mind-system/knowledges/` | **sigue `auto`** | Corpus, no ley. Encaja en la definición de `auto` que tú escribiste: *«un error se ve leyendo el diff y no se propaga a nada compilado»*. Y el escalón 6 de la escalera ya le impide ganar una discusión contra una regla. |

### Nota que quizá quieras añadir a `notas[]`

```
"El patrón `*.md` alcanza a cualquier markdown en cualquier carpeta, así que la
 documentación que además es ley —gobernanza, constitución, reglas Atlas— tiene que
 nombrarse explícitamente en `human`. Si no, hereda `auto` por ser markdown, y el
 agente acaba pudiendo reescribir el criterio por el que se le juzga."
```

---

## B · `scripts/check-conocimiento.js` — el guardián que falta

El córtex tiene 286 ficheros y ninguna comprobación. Es la misma situación que motivó `check-modos.js`, con tu mismo argumento: *«los modos son documentos, y un documento puede prometer cualquier cosa»*. Un bloque `Knowledge` que apunta a un fichero que ya no existe falla en silencio: el agente no encuentra el módulo, se lo salta, y responde igual pero peor.

### Qué debe comprobar

1. **Cada modo abre con su bloque `Knowledge`**, con al menos una línea de carga. SKETCH es la excepción declarada: no tiene línea **Always** a propósito, y el guardián debe conocer esa excepción por nombre, no tolerarla por descuido.
2. **Toda ruta citada en un bloque `Knowledge` existe** bajo `mind-system/knowledges/`.
3. **No hay módulos huérfanos**: todo `.md` del córtex lo carga al menos un modo, excepto los de navegación (`index.md`, `00-indice/`, `05-plantillas/`) y `vendors/`, que es catálogo de consulta.
4. **`routing.md` concuerda con los modos.** Es derivado; si diverge, es que alguien editó uno de los dos y no el otro — que es exactamente cómo `mind-system/agents/` se separó de `_agents/modes/` sin que nadie lo notara durante meses.
5. **El filtro SYX sobre los bloques de código** (ver abajo). Es la comprobación que más ha encontrado.

### El filtro SYX — la comprobación que más rinde

Todo bloque ` ```scss ` / ` ```css ` del córtex pasa por `scripts/lib/rules.js`, el mismo motor R01–R04 que valida el repositorio. Dos detalles hacen que funcione en vez de dar ruido:

**Es consciente de la capa.** R01 depende de dónde vive el código: `var(--primitive-*)` es correcto en `scss/themes/` y prohibido en `scss/atoms/`. Un bloque declara su capa con un comentario en la primera línea, y el guardián lo usa como `rel`:

```scss
// capa: scss/themes/{nombre}/_theme.scss — aquí var(--primitive-*) es correcto (R01)
```

Sin declaración, se juzga como componente. Es deliberado: si un ejemplo no dice dónde vive, hay que asumir el sitio donde más duele copiarlo.

**Distingue el ejemplo del antipatrón.** Un bloque marcado `// ✗`, o precedido de «nunca», «evitar», «anti-patrón», puede violar lo que quiera — para eso está. Uno sin marca se lee como recomendación, y ahí la violación es real.

Medido sobre el córtex: **40 bloques revisados, 0 sin marca**. Antes de este repaso eran 5, y los cinco eran fallos de verdad:

| Fichero | Qué decía | Por qué estaba mal |
|---|---|---|
| `syx/token-system.md` | `--component-hero-font-size: clamp(var(--primitive-type-xl), …)` | El propio fichero enseña que un token de componente referencia semánticos. Se contradecía a sí mismo. Y `--primitive-type-xl` **no existe** en `tokens.json`. |
| `ui/typography-systems.md` | `font-size: clamp(var(--primitive-type-xl), 4vw, …)` sin decir la capa | Copiado a un componente es R01. Mismos tokens fantasma. |
| `ui/refactoring-ui.md` | `color: var(--primitive-color-brand-900)` marcado ✓ | Presentado como correcto. En un componente es R01. |
| `ui/motion-principles.md` | `@include reduced-motion { transition: none; }` | Redundante — el mixin `transition()` ya emite esa guarda — y R03 lo detecta línea a línea sin ver que estaba dentro. |
| `motion/03-patrones/horizontal-scroll.md` | `media (max-width: 1023px)` como fallback mobile | SYX es min-width estricto. Invertía la dirección de la cascada en un patrón que además depende de que llegue el JS. |

Los cinco están corregidos. Ninguno se ve leyendo el fichero de uno en uno: solo aparecen cuando el código del córtex pasa por el mismo motor que el código de producción.

**Un sexto, que el filtro no ve y conviene añadir**: tokens fantasma. `--primitive-type-*` no existe; la escala real es `--primitive-font-size-*` y `--semantic-font-size-h1…h6`. Cruzar los `--token-*` de los bloques **no marcados como antipatrón** contra `tokens.json` es barato y habría cazado dos de los cinco. Es distinto de la comprobación que descarto más abajo: ahí hablaba de *todo* el texto, y aquí solo de los bloques que se presentan como correctos.

### Estado actual, ya medido

Ejecutando 1–3 a mano sobre el árbol acoplado:

```
60 rutas citadas y existentes · 0 rotas
49 módulos en disco (sin vendors) · 0 huérfanos
```

Sale limpio porque el acople lo dejó limpio, no porque no pueda romperse. Al construir el índice inverso aparecieron tres fallos reales que ya están corregidos, y que son la prueba de que el guardián hace falta:

- `front/html-semantics.md` no lo cargaba **ningún** modo. Ahora es **Always** en UX.
- `front/progressive-enhancement.md` se citaba en el cuerpo de AUDIT pero no en su carga. Ahora es **When relevant**.
- `syx/theme-system.md` no entraba en AUDIT pese a que AUDIT tiene una sección entera de auditoría de temas. Ahora es **When relevant**.

Los tres son invisibles leyendo los ficheros de uno en uno. Solo aparecen al mirar el cableado desde el otro lado.

### Prototipo

Hay dos prototipos funcionando en el scratchpad de esta sesión:

- `verify.js` — comprobaciones 1–3. Extrae el bloque `Knowledge` de la cabecera de cada modo, corta en la primera línea que no empieza por `>`, resuelve cada ruta entre acentos graves contra `mind-system/knowledges/`, y cruza el resultado con un `walk` del árbol para sacar los huérfanos.
- `filtro-syx.js` — comprobación 5. Extrae los bloques ` ```scss `/` ```css `, lee la declaración `// capa:`, y los pasa por `revisar()` de `scripts/lib/rules.js`.

Juntos son unas 90 líneas y encajan en el estilo de `check-modos.js` — el mismo `comprobar(nombre, fn)` y el mismo resumen final. Dímelo y lo dejo escrito para que lo revises antes de moverlo a `scripts/`.

### Lo que NO debe comprobar todavía

Comprobar que cada `--token-*` citado en `knowledges/` existe en `tokens.json` **sería un falso positivo constante**. `knowledges/syx/color-oklch.md` enseña a construir una escala con `--primitive-color-brand-50…900` en `oklch(… 190)`, que son valores ilustrativos y no tienen por qué existir. Si quieres esa comprobación, necesita antes una convención que distinga el ejemplo del ejemplar: una valla `<!-- ilustrativo -->`, o un lenguaje de bloque distinto para el código que sí es real. Sin esa convención, el guardián enseña a ignorarlo, que es peor que no tenerlo.

---

## C · `scripts/check-modos.js` — exigir el bloque `Knowledge`

Hoy el guardián exige las cuatro líneas del bloque `Trust` y no sabe que el bloque `Knowledge` existe. Un modo nuevo puede nacer sin sinapsis y pasar 8/8.

En `CLAVES`, o como comprobación aparte:

```js
comprobar('cada modo declara de qué se alimenta', () => {
  const malos = [];
  for (const [modo, b] of bloques) {
    if (!b.cabecera.includes('> **Knowledge**')) { malos.push(`${modo}: sin bloque Knowledge`); continue; }
    // SKETCH no tiene Always a propósito: su tier 1 se compra no leyendo nada.
    if (modo !== 'sketch' && !b.cabecera.includes('· **Always:**')) malos.push(`${modo}: Knowledge sin línea Always`);
  }
  if (malos.length) throw new Error(malos.join(' · '));
});
```

Y añadir un punto 8 a la cabecera del fichero, donde enumeras qué comprueba.

Detalle de implementación que conviene conservar: el bloque `Knowledge` va **dentro de la cabecera**, antes del primer `## `. No es cosmético. La comprobación 5 (*«el bloque cubre todas las rutas que el modo nombra»*) solo mira el cuerpo, así que las rutas del córtex no la disparan; y para que sí queden cubiertas si alguien las nombra en el cuerpo, cada modo declara `mind-system/knowledges/` en su línea **Reads**. Ese es el motivo de que `Reads` cambiara en los ocho.

---

## D · `package.json` — que el córtex no se publique

`files[]` incluye `_agents/` y no incluye `mind-system/`, así que hoy el comportamiento ya es el correcto por omisión. Conviene hacerlo intencional, porque lo contrario es un accidente esperando:

- `mind-system/knowledges/vendors/` son **4,8 MB** de `DESIGN.md` de 58 empresas. Multiplicaría por varias veces el tamaño del paquete.
- `mind-system/atlas-rules/` son las reglas editoriales de **un** producto. Quien instale `syx-design-system` no debería recibirlas.

Dos cosas que sí merece la pena:

1. Un comentario en el `README.md` o en el propio `package.json` diciendo que la omisión es deliberada.
2. **Los modos que sí se publican citan un córtex que no viaja con ellos.** Está resuelto por diseño — el bloque `Knowledge` de cada modo dice que el córtex *informa* y nunca *ejecuta*, así que un modo es completo sin él y más afilado con él. Pero conviene que lo diga el `README.md` del paquete, para que un consumidor de npm que lea `_agents/modes/ui.md` y busque `mind-system/knowledges/syx/scss-pipeline.md` sepa por qué no está.

Añadir a los `scripts` de `package.json`, cuando exista B:

```json
"check:conocimiento": "node scripts/check-conocimiento.js",
```

y engancharlo donde tengas encadenados los demás `check:*`.

---

## Recordatorio suelto

**R08 sigue declarada y sin implementar** en `syx-validate.js`, como ya advierte `CLAUDE.md`. AUDIT la nombra en su tabla de reglas y en su formato de informe. No es deuda del acople —- venía de antes —- pero ahora hay un documento más que la promete.
