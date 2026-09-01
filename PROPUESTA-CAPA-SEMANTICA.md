# Propuesta — capa semántica del registro y hogar de los patrones

> **Estado:** propuesta. Nada de este documento está implementado.
> **Origen:** `SYX_AI_Improvement_Brief.md`, huecos 3.1, 3.2 y 3.6.
> **Por qué está escrito y no hecho:** las dos decisiones tocan `scripts/` y
> `contracts/`, que `contracts/trust.json` marca `human`. Un agente puede
> analizarlas y redactarlas; firmarlas no.

Lo que **sí** está hecho, y no necesita esta propuesta: los 34 componentes del
registro ya tienen `description` y `usage`, y cada `description` abre con
`[scope: system-reusable | domain-reusable | product-specific]`. Sobrevive a
`npm run build:registry` y `get_component` ya lo devuelve. Este documento pide
convertir esa convención de prosa en campos de verdad, y decidir dónde vive lo
que todavía no existe.

---

## Propuesta A — que el generador conserve más de dos campos

### El problema exacto

`scripts/build-component-registry.js` regenera el registro desde el SCSS y
**borra todo lo que no sepa reconstruir**, salvo dos excepciones escritas a
mano en cuatro sitios del fichero. Hoy esas excepciones son `description` y
`usage`. Cualquier campo nuevo — `useWhen`, `avoidWhen`, `alternatives` — se
escribiría una vez y desaparecería en la siguiente regeneración, sin aviso.

Por eso el `[scope: …]` de arriba va incrustado dentro de `description`: es el
único sitio donde hoy sobrevive. Funciona, pero es una convención que solo
existe si alguien la respeta al escribir. Un campo la haría verificable.

### Campos que propongo añadir

| Campo | Tipo | Qué contesta | Por qué merece ser campo y no prosa |
|---|---|---|---|
| `scope` | enum: `system-reusable` · `domain-reusable` · `product-specific` | ¿Puede otro producto usar esto? | Es filtrable. Un agente que construye fuera de este repo quiere pedir *solo* `system-reusable` y hoy tiene que leer 34 párrafos para saberlo. |
| `useWhen` | `string[]` | ¿Cuándo es la elección correcta? | Cada entrada es una condición que se puede casar contra un intent. En prosa no se puede casar nada. |
| `avoidWhen` | `string[]` | ¿Cuándo es la elección equivocada? | Es el campo del hueco 3.2: sin él, un agente solo sabe que `mol-feature-card` *existe*. |
| `alternatives` | `string[]` (nombres del propio registro) | Si este no, ¿cuál? | Un `avoidWhen` sin salida deja al agente parado o inventando. Validable: los nombres tienen que existir. |
| `relatedPatterns` | `string[]` (ids de patrón) | ¿En qué composición entra? | El enganche con la Propuesta B. Vacío hasta que B se decida. |

`accessibility` lo dejo fuera a propósito. Lo que hoy sabemos decir de
accesibilidad por componente es una frase, y ya está dentro de `description`.
Un array de una frase no gana nada y hay que mantenerlo.

### El parche, exacto

Cuatro puntos, todos en `scripts/build-component-registry.js`. Los doy
literales porque el fichero es `human` y quien lo aplique no debería tener que
buscarlos.

**1 · La cabecera (línea 25).** Es documentación que dejaría de ser cierta:

```js
 * · description, usage         NO se generan: son prosa escrita a mano y se
 *                              conservan tal cual del registro anterior
```

pasa a nombrar los siete campos conservados.

**2 · El ensamblado de la entrada (líneas 258-259).** Hoy:

```js
    if (prosa.description) entrada.description = prosa.description;
    if (prosa.usage) entrada.usage = prosa.usage;
```

pasa a recorrer una constante única, declarada arriba del fichero, para que los
cuatro puntos no puedan desincronizarse entre sí:

```js
const PROSA = ['description', 'usage', 'scope', 'useWhen', 'avoidWhen', 'alternatives', 'relatedPatterns'];
// ...
    for (const campo of PROSA) if (prosa[campo] !== undefined) entrada[campo] = prosa[campo];
```

**3 · La lectura del registro anterior (línea 295).** Hoy:

```js
      if (c.description || c.usage) out[c.name] = { description: c.description, usage: c.usage };
```

pasa a copiar los campos de `PROSA` que estén presentes. **Este es el punto que
importa:** si se olvida, el campo se escribe y se pierde en silencio.

**4 · El comparador `diferencias` (línea 330).** Hoy enumera los campos a mano:

```js
    for (const campo of ['classes', 'modifiers', 'elements', 'states', 'tokens', 'tokenFiles', 'composedOf', 'file', 'layer', 'description', 'usage']) {
```

pasa a `[...GENERADOS, ...PROSA]`. Sin esto, `npm run check:registry` seguiría
diciendo «al día» con un `avoidWhen` cambiado — un guardián que no mira el
campo nuevo es peor que no tenerlo, porque da una garantía falsa.

### Lo que hay que validar además

- `scope` fuera del enum → error del generador, no aviso.
- `alternatives` que nombre un componente inexistente → error. Es la clase de
  dato que envejece solo, igual que envejecieron los `tokenFile` que hoy están
  corregidos.
- `relatedPatterns` sin registro de patrones → se queda vacío y no valida nada.
  Depende de la Propuesta B.

### Coste y riesgo

Un fichero, cuatro puntos, sin cambio de esquema en el JSON (los campos son
opcionales, así que un consumidor viejo no se entera). El riesgo real no es el
código: es que siete campos a mano por 34 componentes se pudran si nadie los
revisa. Mitigación posible, para después: un aviso de `check:registry` cuando
un componente tiene `avoidWhen` vacío, al nivel de aviso, nunca de error.

---

## Propuesta B — dónde vive un patrón

### La pregunta, y por qué no es de fontanería

El brief pide una capa de patrones (`feature + rail`, `content stream`,
`master/detail`…) y propone un `patterns/` en la raíz. Pero SYX **ya tiene** un
sitio donde vive el conocimiento de composición: `mind-system/`, con precedencia
declarada en `CLAUDE.md` — `governance/` en el peldaño 4, `atlas-rules/` en el 5,
`knowledges/` en el 6. Y `atlas-rules/06-sistema-editorial/` ya contiene
jerarquía de contenido, densidad y flujo editorial.

Si se añade `patterns.json` sin decidir esto, la jerarquía editorial acaba
escrita en dos sitios que nadie compara. Eso es exactamente la deriva que el
propio brief denuncia en su punto 3.7, plantada a mano.

Hay un segundo dato que decide más de lo que parece: **`mind-system/` no se
publica a npm.** Una app que instala `syx-design-system` en vez de clonar el
repo no ve el córtex. Si los patrones viven solo ahí, los patrones no llegan a
quien consume el sistema.

### Tres salidas

**B1 — Los patrones son un dominio más del córtex.** `mind-system/patterns/`.
Barato, respeta la precedencia existente, cero decisiones nuevas.
*Se cae por lo anterior:* no se publica. Los patrones serían conocimiento que
solo existe dentro de este repositorio, y el consumidor npm — que es justo quien
más necesita que le digan qué componer — no los alcanza.

**B2 — Los patrones son núcleo.** `patterns.json` en la raíz, junto a
`tokens.json` y `component-registry.json`, publicado, consultable por MCP.
Llega a todo el mundo. *Cuesta:* hay que decidir su peldaño en la tabla de
precedencia, y hay que decidir qué pasa cuando un patrón de núcleo y una regla
de ATLAS dicen cosas distintas.

**B3 — Partido por autoridad. Recomendado.**

- **El esquema y los patrones genéricos van al núcleo**, en `patterns.json`. Son
  los que no dependen de un dominio: `equal-card-grid`, `master/detail`,
  `search/filter/results`, `empty state`, `form flow`, `settings group`.
- **Los patrones editoriales se quedan en `atlas-rules/`** y **referencian por
  id** un patrón del núcleo, en vez de redefinirlo. ATLAS dice *«una portada
  con una historia dominante es N1 sobre N3, y eso se compone con el patrón
  `feature-rail`»*; `patterns.json` dice qué es `feature-rail` en rejilla,
  componentes y tokens. Ninguno de los dos repite al otro.

Esto es la tabla de precedencia que ya existe, aplicada tal cual: ATLAS decide
**qué** y **por qué** (peldaño 5), el núcleo decide **con qué** — y sigue siendo
cierto que un módulo del córtex nunca gana una discusión contra una regla.

### Lo que B3 exige decidir, y es humano

1. **Peldaño en la tabla de `CLAUDE.md`.** Mi lectura: `patterns.json` **no** es
   un contrato. No valida nada, no rechaza nada, no tiene severidades — R01–R08
   siguen siendo lo único que ejecuta. Es conocimiento, pero con esquema y
   publicado, así que va por encima de `knowledges/` en prosa y por debajo de
   `atlas-rules/`. Un peldaño 5.5, o una fila propia entre el 5 y el 6.
2. **Tier en `contracts/trust.json`.** Propongo `pr`, la misma casilla que
   `tokens.json`: alcance acotado, reversible de un vistazo, pero se publica.
   `auto` sería demasiado — un patrón dirige lo que se construye después, y eso
   se propaga más lejos que un componente. Añadir la ruta es un cambio en
   `trust.json`, que es `human` a propósito.
3. **Cuántos patrones de salida.** El brief dice 5–8 y tiene razón. Yo empezaría
   por **tres**, y solo con los que este repositorio ya puede demostrar con una
   página real. Un patrón escrito sin un uso que lo respalde es una opinión con
   esquema.
4. **Si hay guardián.** Todo lo demás en SYX tiene uno: `check:registry`,
   `check:modos`, `check:mixins`. Un `check:patterns` que verifique que cada
   `recommendedComponents` existe en el registro y que cada id referenciado
   desde `atlas-rules/` existe en `patterns.json`. Sin eso, la capa de patrones
   es el primer sitio del sistema donde se puede mentir sin que salte nada.

### Lo que no propongo

`pattern-*.scss`. El brief lo desaconseja en su punto 6.3 y estoy de acuerdo:
un patrón que se compila deja de ser conocimiento y se convierte en el
componente que se quería evitar crear.

---

## Orden

A antes que B. A es un fichero y desbloquea `relatedPatterns`; B es una
decisión de arquitectura que, mal tomada, duplica el córtex. Y `resolve_intent`
—lo que el brief llama su capacidad más importante— no debería escribirse hasta
que A y B estén cerradas: sin metadata semántica ni patrones, devolvería
recomendaciones inventadas con cara de autoridad, que es peor que no tenerlo.
