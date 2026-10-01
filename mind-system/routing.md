# routing — Las sinapsis

Qué módulo del córtex entra en qué modo, y cuándo. Es el cableado entre `mind-system/knowledges/` y `_agents/modes/`.

**La fuente son los modos, no este fichero.** Cada modo declara su carga en el bloque `Knowledge` de su cabecera, junto al bloque `Trust`. Esta página es el mismo cableado visto de lado y en dos direcciones, para poder responder a dos preguntas que un modo por sí solo no contesta: *¿qué carga cada uno?* y sobre todo *¿a quién le sirve este módulo?* — que es la pregunta con la que se detectan los huérfanos.

---

## Las cinco formas de cargar

| Etiqueta | Significado |
|---|---|
| **Always** | Entra siempre. Es el suelo del modo. |
| **When relevant** | Entra cuando la tarea toca su materia. El disparador está escrito en la propia línea. |
| **With GSAP** | Solo CREATIVE. Entra cuando hay animación de librería: sus módulos de entrada, y de `03-patrones/` y `js/` solo el índice y el fichero que el encargo nombra. |
| **On request** | Solo si el brief lo pide o lo nombra, y **de una en una**: la carga que nombra, nunca la lista entera. Nunca por iniciativa propia. |
| **Self-check** | Solo TOKEN. Se lee al final, contra el propio output, no al principio. |

Ninguna de las cinco autoriza nada. El conocimiento informa; la regla ejecuta.

**Una carpeta no se carga en bloque.** Cuando un modo cita una carpeta (`motion/04-teoria/`), entra su módulo de entrada —`index.md`, o el que se llama como el estrato: `teoria.md`— y, como mucho, el fichero que ese módulo señale. Una carpeta sin módulo de entrada no se puede citar: `npm run check:conocimiento` falla.

### Presupuesto de contexto

| Tramo | Qué suma | Límite |
|---|---|---|
| **Entrada** | `CLAUDE.md` + lo que manda leer antes de nada (`AI_GUIDELINES.md`, `contracts/rules.json`) + el fichero del modo + sus módulos **Always** | ≤ 25 000 tokens |
| **Peor caso** | Entrada + todo **When relevant** + **With GSAP** + **Self-check** + la mayor carga **On request** | ≤ 60 000 tokens |

Tokens ≈ bytes / 3,5. Las cifras no se copian aquí a mano —se quedaban viejas: esta página llegó a prometer un techo de 83 KB que no contaba la capa GSAP mientras el peor caso real de CREATIVE pasaba de 270 KB—; las mide e imprime `npm run check:conocimiento`, que falla si un modo se pasa. Si se pasa, la salida es bajar un módulo de **Always** a **When relevant** con su disparador, partir el módulo grande o citar el fichero concreto en vez de la carpeta; no subir el límite.

---

## Matriz directa — qué carga cada modo

`●` Always · `○` When relevant · `◐` With GSAP · `·` On request · `✓` Self-check

| Módulo | SKETCH | UX | CREATIVE | TOKEN | THEME | UI | AUDIT | MIGRATE | BRAND |
|---|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| `ux/laws-of-ux.md` | | ● | | | | | | | |
| `ux/nielsen-heuristics.md` | | ● | | | | | | | |
| `ux/dont-make-me-think.md` | | ○ | | | | | | | |
| `ux/microinteractions.md` | | ○ | | | | | | | |
| `ux/strategic-writing-for-ux.md` | | ○ | | | | | | | |
| `ui/refactoring-ui.md` | | | | | | ○ | | | |
| `ui/color-theory.md` | | | ○ | ○ | ○ | | | | ● |
| `ui/typography-systems.md` | | | ○ | | | ○ | | | ○ |
| `ui/motion-principles.md` | | | ● | | | ○ | | | ○ |
| `ui/practical-ui.md` | | | ○ | | | | | | ○ |
| `front/html-semantics.md` | | ● | | | | | | | |
| `front/mobile-first.md` | · | ● | | | | ● | ○ | | |
| `front/accessibility-wcag.md` | | ● | | | | | ○ | | |
| `front/progressive-enhancement.md` | | ○ | | | | | ○ | | |
| `front/javascript-patterns.md` | | ○ | | | | | | | |
| `front/css-architecture.md` | | | | | | ○ | | | |
| `front/size-models.md` | | | | ○ | ○ | | | | ○ |
| `front/size-models-checklist.md` | | | | ✓ | | | ○ | | |
| `syx/token-system.md` | | | | ● | ● | ● | ● | ● | ● |
| `syx/scss-pipeline.md` | | | | | | ● | ● | | |
| `syx/component-patterns.md` | · | | ○ | | | ● | ● | ○ | |
| `syx/theme-system.md` | | | | | ● | | ○ | | ● |
| `syx/color-oklch.md` | | | | ○ | ● | | | | ○ |
| `branding/perception-of-prestige-foundations.md` | | · | ● | | | | | | ● |
| `branding/perception-of-prestige.rules.md` | | | · | | | | · | | · |
| `motion/01-direccion/direccion.md` | | | ○ | | | | | | |
| `motion/01-direccion/` (brief) | | | · | | | | | | |
| `motion/01-direccion/motion-spec.md` | | | ○ | | | · | | | |
| `motion/02-proposito/` | | ○ | | | | | | | |
| `motion/02-proposito/patrones-de-transicion.md` | | ○ | | | | ○ | | | |
| `motion/03-creativa/creativa.md` | | | ○ | | | | | | |
| `motion/03-creativa/` (resto del estrato) | | | · | | | | | | |
| `motion/03-creativa/personalidad.md` | | | ○ | | | | | | ○ |
| `motion/03-creativa/lenguaje-de-marca.md` | | | ○ | | | | | | ○ |
| `motion/04-teoria/teoria.md` | | | ○ | | | | | | |
| `motion/04-teoria/` (principios, easing, springs, timing) | | | · | | | | | | |
| `motion/05-tipografia/tipografia-cinetica.md` | | | ○ | | | | | | |
| `motion/06-sistema/mapeo-por-plataforma.md` | | | · | | | | | | |
| `motion/06-sistema/escala.md` | | | · | ○ | ○ | | | | |
| `motion/07-accesibilidad/accesibilidad.md` | | ○ | ○ | | | ○ | ○ | | |
| `motion/08-ejecucion/css/css.md` | | | ○ | | | · | | | |
| `motion/08-ejecucion/css/` (recetas, generador) | | | · | | | · | | | |
| `motion/08-ejecucion/js/` | | | ◐ | | | | | | |
| `motion/08-ejecucion/gsap/01-fundamentos/modelo-mental.md` | | | ◐ | | | | | | |
| `motion/08-ejecucion/gsap/01-fundamentos/vocabulario-base.md` | | | ◐ | | | · | | | |
| `motion/08-ejecucion/gsap/02-capacidades/index.md` | | | ◐ | | | | | | |
| `motion/08-ejecucion/gsap/03-patrones/` | | | ◐ | | | · | | | |
| `motion/08-ejecucion/gsap/04-glosario/index.md` | · | | · | | | | | | |
| `motion/08-ejecucion/rive/` | | | · | | | | | | |
| `motion/08-ejecucion/cavalry-ae/` | | | · | | | | | | |
| `motion/08-ejecucion/blender/` | | | · | | | | | | |
| `motion/09-critica/critica.md` | | | ○ | | | | · | | |
| `vendors/awesome-design/` | · | | · | | · | | | | · |

---

## Índice inverso — a quién le sirve cada módulo

La lectura que importa para el mantenimiento. **Un módulo sin ningún modo en su fila es un módulo que nadie va a abrir nunca**, por bueno que sea.

| Dominio | Módulo | Lo cargan |
|---|---|---|
| `ux/` | `laws-of-ux` | UX |
| | `nielsen-heuristics` | UX |
| | `dont-make-me-think` | UX |
| | `microinteractions` | UX |
| | `strategic-writing-for-ux` | UX |
| `ui/` | `refactoring-ui` | UI |
| | `color-theory` | CREATIVE · TOKEN · THEME · BRAND |
| | `typography-systems` | CREATIVE · UI · BRAND |
| | `motion-principles` | CREATIVE · UI · BRAND |
| | `practical-ui` | CREATIVE · BRAND |
| `front/` | `html-semantics` | UX |
| | `css-architecture` | UI |
| | `mobile-first` | SKETCH · UX · UI · AUDIT |
| | `progressive-enhancement` | UX · AUDIT |
| | `accessibility-wcag` | UX · AUDIT |
| | `javascript-patterns` | UX |
| | `size-models` | TOKEN · THEME · BRAND |
| | `size-models-checklist` | TOKEN · AUDIT |
| `syx/` | `token-system` | TOKEN · THEME · UI · AUDIT · MIGRATE · BRAND |
| | `scss-pipeline` | UI · AUDIT |
| | `component-patterns` | SKETCH · CREATIVE · UI · AUDIT · MIGRATE |
| | `theme-system` | THEME · AUDIT · BRAND |
| | `color-oklch` | TOKEN · THEME · BRAND |
| `branding/` | `perception-of-prestige-foundations` | UX · CREATIVE · BRAND |
| | `perception-of-prestige.rules` | CREATIVE · AUDIT · BRAND |
| `motion/` | `01-direccion/*` | CREATIVE · UI (`motion-spec`) |
| | `02-proposito/*` | UX · UI (`patrones-de-transicion`) |
| | `03-creativa/*` | CREATIVE · BRAND (`personalidad`, `lenguaje-de-marca`) |
| | `04-teoria/*` | CREATIVE |
| | `05-tipografia/tipografia-cinetica` | CREATIVE |
| | `06-sistema/escala` | TOKEN · THEME · CREATIVE |
| | `06-sistema/mapeo-por-plataforma` | CREATIVE |
| | `07-accesibilidad/accesibilidad` | UX · CREATIVE · UI · AUDIT |
| | `08-ejecucion/css/*` | CREATIVE · UI |
| | `08-ejecucion/js/*` | CREATIVE |
| | `08-ejecucion/gsap/01-fundamentos/*` | CREATIVE · UI |
| | `08-ejecucion/gsap/02-capacidades/index` | CREATIVE |
| | `08-ejecucion/gsap/03-patrones/*` (10 patrones) | CREATIVE · UI |
| | `08-ejecucion/gsap/04-glosario/index` | SKETCH · CREATIVE |
| | `08-ejecucion/rive/*` · `cavalry-ae/*` · `blender/*` | CREATIVE |
| | `09-critica/critica` | CREATIVE · AUDIT |
| `vendors/` | `awesome-design/*` | SKETCH · CREATIVE · THEME · BRAND |

**Sin modo, a propósito** — son navegación o andamiaje de autor, no corpus:

| Fichero | Qué es |
|---|---|
| `knowledges/index.md` | Mapa del córtex |
| `knowledges/*/index.md` | Mapa de cada dominio |
| `motion/index.md` | Mapa del dominio motion y sus estratos |
| `motion/00-indice/mapa-del-sistema.md` | Flujo de consulta del dominio motion |
| `motion/00-indice/fuentes.md` | Bibliografía comentada del dominio |
| `motion/08-ejecucion/gsap/index.md` · `gsap/00-indice/mapa-del-sistema.md` | Mapa de la capa GSAP |
| `motion/08-ejecucion/gsap/05-plantillas/plantilla-patron.md` | Schema para escribir un patrón nuevo |

Cualquier otro módulo que acabe sin modo en el índice inverso es un huérfano y hay que resolverlo: enrutarlo a un modo, o retirarlo.

---

## Dos notas de precedencia dentro del córtex

**Motion.** `ui/motion-principles.md` es el suelo físico de la UI web — easing, duración, propiedades compuestas por GPU, `prefers-reduced-motion`, escrito en tokens `--semantic-*` — y **prevalece sobre todo el dominio `motion/` para código de `scss/`**. Una receta de GSAP o de CSS que rompa un principio físico está mal, no está siendo audaz. Dentro del dominio `motion/` manda su propia escalera (accesibilidad > propósito > sistema > dirección creativa > preferencia técnica), y `07-accesibilidad/` va delante de cualquier patrón. CREATIVE carga el suelo siempre, el módulo de entrada de cada estrato cuando algo se mueve (y el resto del estrato solo si ese módulo lo pide) y la capa GSAP solo cuando hay librería, en ese orden y a propósito. Un encargo que solo toca uno o dos estratos carga bastante menos que el peor caso; cuánto, lo imprime `npm run check:conocimiento` (ver *Presupuesto de contexto*).

**Prestigio.** `branding/perception-of-prestige.rules.md` trae 18 reglas con su propio formato de informe. Cuando AUDIT las usa, lo que encuentra es **asesor**: no lleva número R, no aparece en la capa 1 del informe y no convierte por sí solo un PASS en FAIL. Mezclar una recomendación de percepción con una violación de contrato devalúa las dos.

---

## Operadores de composición

| Operador | Sintaxis | Semántica |
|---|---|---|
| `→` | `[SYX: UX → UI]:` | **Pipeline.** El output de cada modo es el input del siguiente. Un paso a la vez. |
| `+` | `[SYX: UI + AUDIT]:` | **Evaluativa.** Ambos modos operan sobre el mismo input; los dos outputs se presentan juntos. |

**Agrupación**: `+` agrupa antes que `→`. El `+` une a los modos que comparten artefacto; el `→` encadena esos grupos. `[SYX: UX → UI + AUDIT]:` se lee `UX → (UI + AUDIT)`: UX primero, y después UI implementa mientras AUDIT verifica ese mismo output. Para otra agrupación, separar en turnos.

En un pipeline, si un paso intermedio no tiene trabajo, **el pipeline no se detiene**: continúa con los recursos existentes y emite un handoff explícito.

```
[TOKEN — sin trabajo]: los tokens necesarios ya existen:
  --semantic-color-primary, --semantic-space-stack-md.
  Handoff a UI: usarlos directamente.
```

Abortar es decisión del usuario, no del modo.

### Combinaciones válidas

| Sintaxis | Cuándo |
|---|---|
| `[SYX: SKETCH → UX]:` | Validar una idea antes de formalizar accesibilidad |
| `[SYX: UX → UI]:` | Componente nuevo sin tokens propios |
| `[SYX: UX → TOKEN → UI]:` | Flujo estándar de componente nuevo |
| `[SYX: UX → TOKEN → UI + AUDIT]:` | Flujo completo con verificación |
| `[SYX: TOKEN → THEME]:` | Tema nuevo tras verificar cobertura de semánticos |
| `[SYX: TOKEN → THEME + AUDIT]:` | Tema con verificación de cobertura |
| `[SYX: AUDIT → MIGRATE]:` | Deuda técnica, si son pocas variables |
| `[SYX: CREATIVE → TOKEN → UI]:` | Llevar un experimento a producción |
| `[SYX: CREATIVE → TOKEN → UI + AUDIT]:` | Experimento a producción con verificación |
| `[SYX: UI + AUDIT]:` | Implementar y verificar en el mismo flujo |
| `[SYX: THEME + AUDIT]:` | Diseñar tema y verificar cobertura |
| `[SYX: UX + AUDIT]:` | Propuesta HTML con verificación de jerarquía y ARIA |
| `[SYX: TOKEN + AUDIT]:` | Definir tokens y verificar R05–R08 |
| `[SYX: BRAND → THEME]:` | Identidad completa: BRAND decide los siete ejes, THEME construye y contrasta la escala |
| `[SYX: BRAND → THEME → UI]:` | Identidad completa hasta el componente que la estrena |
| `[SYX: BRAND → CREATIVE]:` | Página experimental que **hereda** registro y contrato en vez de elegir carácter. La dirección de arte de CREATIVE pasa a ser una desviación declarada, no una invención |
| `[SYX: BRAND → THEME → CREATIVE]:` | Lo mismo, pero además con los tokens ya construidos: la página hereda la identidad **y** los valores que la pintan |
| `[SYX: BRAND + AUDIT]:` | Identidad verificada: que cada token nombrado exista y que ningún bloque entregado rompa R01–R04 |

### Combinaciones inválidas

| Combinación | Por qué no |
|---|---|
| `SKETCH + AUDIT` | SKETCH está exento de contratos por diseño. Auditarlo es contradictorio. |
| `SKETCH + UI` | Boceto y producción. No hay handoff útil en el mismo turno. |
| `CREATIVE + AUDIT` | CREATIVE está exento de R01–R08. Usar `CREATIVE → TOKEN → UI + AUDIT`. |
| `UI → TOKEN` | El orden es al revés. TOKEN define, UI implementa. |
| `THEME → UI` | THEME opera en `_theme.scss`. No genera componentes para que UI procese. |
| `MIGRATE + AUDIT` | AUDIT detecta, MIGRATE resuelve. Solo tiene sentido `AUDIT → MIGRATE`. |
| `UI → BRAND` | El orden es al revés. Una identidad se decide antes que lo que la viste. |
| `THEME → BRAND` | Igual de invertido, y más caro: produce una paleta sin identidad a la que responder. Es exactamente como seis de los siete temas acabaron siendo recoloreados. |
| `[ATLAS]:` sin modo | `[ATLAS]:` es un envoltorio, no un modo. Necesita al menos un `[SYX: MODE]`. |

Para las combinaciones con contexto editorial (`[ATLAS]: … utilizando [SYX: …]`), ver `governance/01-invocation.md`.

---

## Recursos auxiliares

No son modos ni conocimiento: son input estructurado y procedimientos.

| Carpeta | Qué es | Contenido |
|---|---|---|
| `_agents/prompts/` | Plantillas de invocación | `new-atom` · `new-molecule` (→ UI) · `review-component` · `theme-audit` (→ AUDIT) |
| `_agents/workflows/` | Procedimientos paso a paso | `create-component` (TOKEN+UI) · `create-theme` (TOKEN+THEME) · `audit-tokens` (AUDIT) · `update-changelog` · `export-to-figma` |

Viven en `_agents/` y no aquí: son operativos, no conceptuales.
