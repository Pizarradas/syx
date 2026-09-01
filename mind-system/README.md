# mind-system — El córtex de SYX

SYX tiene dos capas de agente, y hacen cosas distintas.

```
_agents/          MOTOR    — lo que un modo hace, en qué formato, con qué techo de permisos.
                             Se carga siempre. Es la capa que ejecuta.
                             Vigilada por `npm run check:modos`. Viaja en el paquete npm.

mind-system/      CÓRTEX   — por qué una decisión es correcta: teoría de color, leyes de UX,
                             WCAG, escalas, prestigio, movimiento, y las reglas editoriales
                             de Atlas. Se carga a demanda. Informa; no ejecuta.
```

La frontera es una sola frase: **el motor decide qué se escribe, el córtex decide por qué está bien escrito.** Un módulo de conocimiento nunca autoriza nada, nunca crea un token y nunca gana una discusión contra una regla.

---

## La escalera de precedencia

Es la pieza que hace que los dos sistemas convivan sin contradecirse. Cuando dos documentos de este repositorio dicen cosas distintas, gana el escalón más alto. Siempre, sin excepción de contexto.

| # | Autoridad | Qué decide | ¿Verificado? |
|---|---|---|---|
| 1 | `contracts/trust.json` | Quién puede escribir qué | ✅ `scripts/lib/confianza.js` · `classify_change` |
| 2 | `contracts/rules.json` | R01–R08 | ✅ `scripts/lib/rules.js` · `npm run validate` |
| 3 | `_agents/modes/*.md` → bloque `Trust` | El techo de cada modo | ✅ `npm run check:modos` |
| 4 | `mind-system/governance/` | Cómo se componen Atlas y los modos | ⚠️ solo declarado |
| 5 | `mind-system/atlas-rules/` | Decisiones editoriales (dominio invitado) | ⚠️ solo declarado |
| 6 | `mind-system/knowledges/` | El porqué | ⚠️ solo declarado |

**Regla de oro: un escalón no gana nunca a otro por encima suyo.**

Esto corrige de forma deliberada la formulación anterior de la constitución, que decía *«cuando hay conflicto entre una regla de modo SYX y una regla Atlas → Atlas prevalece»*. Esa frase, leída literalmente, ponía un documento markdown por encima de un contrato verificado por máquina, e incluía la nomenclatura de tokens y la arquitectura de carpetas. Un agente obediente podía usarla para saltarse R01.

La formulación correcta es más estrecha y más útil:

> Atlas prevalece **dentro de su dominio** — nivel editorial, jerarquía, densidad, proporción, zona, publicidad — que es un dominio que los modos no cubren en absoluto.
> Atlas no prevalece sobre R01–R08, ni sobre `trust.json`, ni sobre el bloque `Trust` de un modo. Ahí no hay conflicto que arbitrar: hay un contrato y un documento que no lo conocía.

Los escalones 1–3 los comprueba una máquina. Los escalones 4–6 hoy solo están escritos, y un documento puede prometer cualquier cosa — que es exactamente el argumento con el que se escribió `check-modos.js`. Ver *Lo que todavía no vigila nadie*, al final.

---

## Mapa

```
mind-system/
  README.md          ← este fichero: las dos capas y la escalera
  constitution.md      dominios de cada modo, solapamientos, protocolos de composición
  routing.md           las sinapsis: qué módulo de conocimiento entra en qué modo y cuándo

  governance/          composición Atlas ↔ modos SYX
    README.md          modelo, sintaxis, mantenimiento
    01-invocation.md   paquete de contexto editorial · orden de operación · matriz
    02-mode-delta.md   qué hace cada modo distinto con [ATLAS]: activo
    03-domains.md      dominios de autoridad · puente de tokens legacy · @layer
    04-conflicts.md    resolución de conflictos
    05-audit.md        protocolo AUDIT de tres capas

  atlas-rules/         DOMINIO INVITADO — reglas editoriales de ATLAS (00–12)
  knowledges/          el corpus: ux · ui · front · syx · branding · motion · vendors
```

Los modos **no** viven aquí. Viven en `_agents/modes/`, en un único ejemplar. Cada uno abre con su bloque `Trust` y, desde el acople, con un bloque `Knowledge` que dice qué módulos de este córtex carga y cuándo.

---

## `atlas-rules/` es un dominio invitado

Atlas no es el núcleo de SYX: es un consumidor de SYX con un dominio propio que SYX no cubre. Vive dentro del repositorio porque el sistema de gobernanza combinado (`[ATLAS]: … utilizando [SYX: MODE]`) necesita las dos mitades a mano. Pero es invitado, y eso significa tres límites:

1. **No se publica.** No entra en `package.json` → `files[]`. Quien instale `syx-design-system` recibe el motor, no las reglas editoriales de un producto concreto.
2. **No crea sistema.** Atlas no define tokens, no define contratos R, no define mixins. Puede *pedir* que existan; los crea TOKEN por la vía `pr`.
3. **No manda fuera de lo editorial.** Escalón 5 de la escalera. Su autoridad empieza y acaba en qué construir y por qué, nunca en cómo se escribe el SCSS.

Cuando `atlas-rules/` y el motor parecen contradecirse, casi siempre es el puente de tokens legacy: ver la tabla de `governance/03-domains.md`, que ya nombra el token autorizado para cada alias.

---

## Idioma

`_agents/` está en inglés porque viaja en el paquete npm y es la cara del sistema hacia fuera. `mind-system/` está en castellano porque es el corpus interno. No es un descuido: es la misma frontera de antes vista desde otro ángulo. Un bloque `Knowledge` dentro de un modo va en inglés, aunque el módulo al que apunta esté en castellano.

---

## Mantenimiento

Este árbol se revisa cuando:

- **Se añade un modo** → `_agents/modes/{nombre}.md` con bloque `Trust` y bloque `Knowledge`, fila en las tres tablas (`CLAUDE.md`, `AGENTS.md`, `_agents/modes/README.md`), fila en `routing.md`, y `npm run check:modos`.
- **Se añade un módulo de conocimiento** → fichero en su dominio con el schema `## meta / ## concepts / ## rules / ## checklist`, fila en `knowledges/index.md`, y fila en `routing.md`. Un módulo que ningún modo carga es un módulo que nadie va a leer.
- **Se añade una regla Atlas que toca a los modos** → revisar `governance/03-domains.md` y `governance/04-conflicts.md`.
- **Se detecta un conflicto no cubierto** → documentarlo en `governance/04-conflicts.md` y escalarlo a `atlas-rules/11-gobierno/11.0-arbitraje-principios.md`. No resolverlo en silencio.

Quien toque cualquiera de las dos capas comprueba si la otra necesita revisión.

---

## Lo que todavía no vigila nadie

Honestidad sobre el estado real, porque la alternativa es creerse cubierto:

- **El córtex no tiene guardián.** 286 ficheros de conocimiento y ninguna comprobación de que las rutas de `routing.md` existan, de que los tokens que citan sigan vivos, o de que no haya módulos huérfanos que nadie carga. La especificación de `scripts/check-conocimiento.js` está en `ACOPLE.md`, en la raíz; `scripts/` es tier `human`, así que lo escribe una persona.
- **`governance/` y `atlas-rules/` se clasifican `auto` a nivel de fichero.** El patrón `*.md` de `trust.json` alcanza a cualquier markdown en cualquier carpeta, así que hoy un agente puede reescribir esta misma escalera de precedencia sin pasar por nadie. El parche de tres líneas para `contracts/trust.json` está en `ACOPLE.md`. Hasta que se aplique, esta sección describe una intención, no un candado.
- **R08 está declarada y no implementada** en `syx-validate.js`, como ya advierte `CLAUDE.md`. AUDIT la nombra; nadie la ejecuta.
