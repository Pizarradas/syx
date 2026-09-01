# routing — Las sinapsis

Qué módulo del córtex entra en qué modo, y cuándo. Es el cableado entre `mind-system/knowledges/` y `_agents/modes/`.

**La fuente son los modos, no este fichero.** Cada modo declara su carga en el bloque `Knowledge` de su cabecera, junto al bloque `Trust`. Esta página es el mismo cableado visto de lado y en dos direcciones, para poder responder a dos preguntas que un modo por sí solo no contesta: *¿qué carga cada uno?* y sobre todo *¿a quién le sirve este módulo?* — que es la pregunta con la que se detectan los huérfanos.

---

## Las cuatro formas de cargar

| Etiqueta | Significado |
|---|---|
| **Always** | Entra siempre. Es el suelo del modo. |
| **When relevant** | Entra cuando la tarea toca su materia. El disparador está escrito en la propia línea. |
| **With GSAP** | Solo CREATIVE. Entra en bloque cuando hay animación de librería. |
| **On request** | Solo si el brief lo pide o lo nombra. Nunca por iniciativa propia. |
| **Self-check** | Solo TOKEN. Se lee al final, contra el propio output, no al principio. |

Ninguna de las cuatro autoriza nada. El conocimiento informa; la regla ejecuta.

---

## Matriz directa — qué carga cada modo

`●` Always · `○` When relevant · `◐` With GSAP · `·` On request · `✓` Self-check

| Módulo | SKETCH | UX | CREATIVE | TOKEN | THEME | UI | AUDIT | MIGRATE |
|---|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| `ux/laws-of-ux.md` | | ● | | | | | | |
| `ux/nielsen-heuristics.md` | | ● | | | | | | |
| `ux/dont-make-me-think.md` | | ○ | | | | | | |
| `ux/microinteractions.md` | | ○ | | | | | | |
| `ux/strategic-writing-for-ux.md` | | ○ | | | | | | |
| `ui/refactoring-ui.md` | | | | | | ○ | | |
| `ui/color-theory.md` | | | ○ | ○ | ○ | | | |
| `ui/typography-systems.md` | | | ○ | | | ○ | | |
| `ui/motion-principles.md` | | | ● | | | ○ | | |
| `ui/practical-ui.md` | | | ○ | | | | | |
| `front/html-semantics.md` | | ● | | | | | | |
| `front/mobile-first.md` | · | ● | | | | ● | ○ | |
| `front/accessibility-wcag.md` | | ● | | | | | ○ | |
| `front/progressive-enhancement.md` | | ● | | | | | ○ | |
| `front/javascript-patterns.md` | | ○ | | | | | | |
| `front/css-architecture.md` | | | | | | ○ | | |
| `front/size-models.md` | | | | ○ | ○ | | | |
| `front/size-models-checklist.md` | | | | ✓ | | | ○ | |
| `syx/token-system.md` | | | | ● | ● | ● | ● | ● |
| `syx/scss-pipeline.md` | | | | | | ● | ● | |
| `syx/component-patterns.md` | · | | ○ | | | ● | ● | ○ |
| `syx/theme-system.md` | | | | | ● | | ○ | |
| `syx/color-oklch.md` | | | | ○ | ● | | | |
| `branding/perception-of-prestige-foundations.md` | | · | ● | | | | | |
| `branding/perception-of-prestige.rules.md` | | | · | | | | · | |
| `motion/01-fundamentos/modelo-mental.md` | | | ◐ | | | | | |
| `motion/01-fundamentos/vocabulario-base.md` | | | ◐ | | | · | | |
| `motion/02-capacidades/index.md` | | | ◐ | | | | | |
| `motion/03-patrones/` | | | ◐ | | | · | | |
| `motion/04-glosario/index.md` | · | | · | | | | | |
| `vendors/awesome-design/` | · | | · | | ○ | | | |

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
| | `color-theory` | CREATIVE · TOKEN · THEME |
| | `typography-systems` | CREATIVE · UI |
| | `motion-principles` | CREATIVE · UI |
| | `practical-ui` | CREATIVE |
| `front/` | `html-semantics` | UX |
| | `css-architecture` | UI |
| | `mobile-first` | SKETCH · UX · UI · AUDIT |
| | `progressive-enhancement` | UX · AUDIT |
| | `accessibility-wcag` | UX · AUDIT |
| | `javascript-patterns` | UX |
| | `size-models` | TOKEN · THEME |
| | `size-models-checklist` | TOKEN · AUDIT |
| `syx/` | `token-system` | TOKEN · THEME · UI · AUDIT · MIGRATE |
| | `scss-pipeline` | UI · AUDIT |
| | `component-patterns` | SKETCH · CREATIVE · UI · AUDIT · MIGRATE |
| | `theme-system` | THEME · AUDIT |
| | `color-oklch` | TOKEN · THEME |
| `branding/` | `perception-of-prestige-foundations` | UX · CREATIVE |
| | `perception-of-prestige.rules` | CREATIVE · AUDIT |
| `motion/` | `01-fundamentos/*` | CREATIVE · UI |
| | `02-capacidades/index` | CREATIVE |
| | `03-patrones/*` (10 patrones) | CREATIVE · UI |
| | `04-glosario/index` | SKETCH · CREATIVE |
| `vendors/` | `awesome-design/*` | SKETCH · CREATIVE · THEME |

**Sin modo, a propósito** — son navegación o andamiaje de autor, no corpus:

| Fichero | Qué es |
|---|---|
| `knowledges/index.md` | Mapa del córtex |
| `knowledges/*/index.md` | Mapa de cada dominio |
| `motion/00-indice/mapa-del-sistema.md` | Flujo de consulta del dominio motion |
| `motion/05-plantillas/plantilla-patron.md` | Schema para escribir un patrón nuevo |

Cualquier otro módulo que acabe sin modo en el índice inverso es un huérfano y hay que resolverlo: enrutarlo a un modo, o retirarlo.

---

## Dos notas de precedencia dentro del córtex

**Motion.** `ui/motion-principles.md` es la capa física — easing, duración, propiedades compuestas por GPU, `prefers-reduced-motion` — y **prevalece sobre todo el dominio `motion/`**, que es la capa de librería. Una receta de GSAP que rompa un principio físico está mal, no está siendo audaz. CREATIVE carga la primera siempre y la segunda solo cuando hay GSAP, en ese orden y a propósito.

**Prestigio.** `branding/perception-of-prestige.rules.md` trae 17 reglas con su propio formato de informe. Cuando AUDIT las usa, lo que encuentra es **asesor**: no lleva número R, no aparece en la capa 1 del informe y no convierte por sí solo un PASS en FAIL. Mezclar una recomendación de percepción con una violación de contrato devalúa las dos.

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

### Combinaciones inválidas

| Combinación | Por qué no |
|---|---|
| `SKETCH + AUDIT` | SKETCH está exento de contratos por diseño. Auditarlo es contradictorio. |
| `SKETCH + UI` | Boceto y producción. No hay handoff útil en el mismo turno. |
| `CREATIVE + AUDIT` | CREATIVE está exento de R01–R08. Usar `CREATIVE → TOKEN → UI + AUDIT`. |
| `UI → TOKEN` | El orden es al revés. TOKEN define, UI implementa. |
| `THEME → UI` | THEME opera en `_theme.scss`. No genera componentes para que UI procese. |
| `MIGRATE + AUDIT` | AUDIT detecta, MIGRATE resuelve. Solo tiene sentido `AUDIT → MIGRATE`. |
| `[ATLAS]:` sin modo | `[ATLAS]:` es un envoltorio, no un modo. Necesita al menos un `[SYX: MODE]`. |

Para las combinaciones con contexto editorial (`[ATLAS]: … utilizando [SYX: …]`), ver `governance/01-invocation.md`.

---

## Recursos auxiliares

No son modos ni conocimiento: son input estructurado y procedimientos.

| Carpeta | Qué es | Contenido |
|---|---|---|
| `_agents/prompts/` | Plantillas de invocación | `new-atom` · `new-molecule` (→ UI) · `review-component` · `theme-audit` (→ AUDIT) |
| `_agents/workflows/` | Procedimientos paso a paso | `create-component` (TOKEN+UI) · `create-theme` (TOKEN+THEME) · `audit-tokens` (AUDIT) · `update-changelog` |

Viven en `_agents/` y no aquí: son operativos, no conceptuales.
