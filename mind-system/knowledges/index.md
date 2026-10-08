# Knowledges — Mapa de dominios

Base de conocimiento conceptual del sistema SYX. Cada módulo fundamenta las reglas operativas de los modos — explica el *porqué* detrás de las decisiones de diseño e implementación.

---

## Estructura

```
knowledges/
  ux/        → Teoría y práctica de UX: leyes cognitivas, heurísticas, escritura
  ui/        → Diseño visual: color, tipografía, movimiento, composición
  front/     → Implementación front: semántica HTML, CSS architecture, a11y, mobile-first
  syx/       → Sistema SYX específico: tokens, SCSS pipeline, componentes, temas, color
  branding/  → Percepción de marca: prestigio, credibilidad, semiótica visual, autoridad
               Es el suelo de BRAND: los siete ejes de una identidad se deciden aquí
  motion/    → El movimiento como disciplina: propósito, carácter, teoría, tipografía cinética,
               sistema, accesibilidad, ejecución (CSS, JS, GSAP, Rive, Cavalry/AE, Blender) y crítica
```

---

## Índice por dominio

### `ux/` — UX y diseño de interacción

| Módulo | Contenido | Cargado por |
|--------|-----------|-------------|
| `index.md` | Mapa del dominio UX | — |
| `laws-of-ux.md` | Fitts, Hick, Miller, Jakob, Tesler, Doherty | UX mode |
| `nielsen-heuristics.md` | 10 heurísticas de Nielsen — aplicación práctica | UX mode |
| `dont-make-me-think.md` | Carga cognitiva y diseño auto-evidente (Krug) | UX mode |
| `strategic-writing-for-ux.md` | Microcopy, CTAs, mensajes de error, labels | UX mode |
| `microinteractions.md` | Diseño de estados y feedback de interacción | UX mode |

### `ui/` — Diseño visual

| Módulo | Contenido | Cargado por |
|--------|-----------|-------------|
| `index.md` | Mapa del dominio UI | — |
| `refactoring-ui.md` | Spacing, jerarquía visual, composición (Wathan & Schoger) | UI mode |
| `color-theory.md` | Distribución 60/30/10, semántica del color | CREATIVE, TOKEN, THEME, BRAND |
| `typography-systems.md` | Escalas modulares, line-height, letter-spacing, clamp() | CREATIVE, UI, BRAND, ROADMAP |
| `motion-principles.md` | Easing, duración, GPU-composited properties | CREATIVE, UI, BRAND |
| `practical-ui.md` | Correcciones ópticas, densidad, elevación | CREATIVE, BRAND |

### `front/` — Front-end implementation

| Módulo | Contenido | Cargado por |
|--------|-----------|-------------|
| `index.md` | Mapa del dominio front | — |
| `html-semantics.md` | Elementos semánticos, jerarquía de headings, ARIA base | UX mode |
| `css-architecture.md` | Cascada, especificidad, @layer, progressive enhancement CSS | UI, ROADMAP |
| `mobile-first.md` | Worst-case first, breakpoints min-width, DOM order | UX, UI, SKETCH, AUDIT |
| `progressive-enhancement.md` | Capas HTML/CSS/JS independientes | UX, AUDIT, ROADMAP |
| `accessibility-wcag.md` | WCAG 2.1/2.2 AA, ARIA, gestión del foco | UX, AUDIT |
| `javascript-patterns.md` | Patrones JS para interactividad accesible | UX mode |
| `size-models.md` | Modelos de dimensionado y primitivos de escala | TOKEN, THEME, BRAND, ROADMAP |
| `size-models-checklist.md` | Checklist de dimensionado — TOKEN lo lee contra su propio output | TOKEN (self-check), AUDIT |

### `syx/` — Sistema SYX

| Módulo | Contenido | Cargado por |
|--------|-----------|-------------|
| `index.md` | Mapa del dominio SYX | — |
| `token-system.md` | Cuatro tiers, contratos, naming convention | TOKEN, UI, AUDIT, MIGRATE, BRAND, ROADMAP |
| `scss-pipeline.md` | @mixin template, @layer, mixins de referencia | UI, AUDIT, ROADMAP |
| `component-patterns.md` | BEM, prefijos atom/mol/org, estructura de componente | UI, AUDIT, SKETCH, MIGRATE, ROADMAP |
| `theme-system.md` | Estructura de `_theme.scss`, secciones obligatorias | THEME, AUDIT, BRAND |
| `color-oklch.md` | Por qué OKLCH, construcción de escalas, dark mode | TOKEN, THEME, BRAND |

### `branding/` — Percepción de marca

| Módulo | Contenido | Cargado por |
|--------|-----------|-------------|
| `index.md` | Mapa del dominio branding | — |
| `perception-of-prestige-foundations.md` | Psicología cognitiva del prestigio: modelo PRI, processing fluency, heurísticos de Cialdini, semiótica del lujo | CREATIVE, UX (on-demand), BRAND (siempre) |
| `perception-of-prestige.rules.md` | 18 reglas operativas con checks y output template para auditoría de percepción | CREATIVE (on-demand), AUDIT (on-demand), BRAND (on-demand) |

### `motion/` — El movimiento como disciplina

Dominio organizado en estratos, en el orden en que se toma una decisión de movimiento: dirección → propósito → carácter → teoría → tipografía → sistema → accesibilidad → ejecución → crítica. La capa de librería GSAP es una parte de la ejecución (`08-ejecucion/gsap/`). `ui/motion-principles.md` sigue siendo el suelo físico de la UI web y prevalece para código de `scss/`. Mapa completo, con cada módulo y quién lo carga: `motion/index.md`.

| Estrato | Contenido | Cargado por |
|--------|-----------|-------------|
| `index.md` · `00-indice/` | Mapa del dominio, flujo de consulta, fuentes comentadas | — |
| `01-direccion/` | Protocolo de dirección, Motion Spec, brief | CREATIVE; UI (on-demand: la spec) |
| `02-proposito/` | Prueba de propósito, patrones de transición, coreografía | UX; UI (patrones) |
| `03-creativa/` | Concepto, carácter, personalidades, lenguaje de marca, narrativa | CREATIVE; BRAND (personalidad, lenguaje de marca) |
| `04-teoria/` | Principios, easing, springs, timing | CREATIVE |
| `05-tipografia/` | Tipografía cinética | CREATIVE |
| `06-sistema/` | Escala de referencia de duraciones, curvas y springs; mapeo por plataforma | TOKEN, THEME; CREATIVE (on-demand) |
| `07-accesibilidad/` | Reduced motion, destellos, pausa, riesgo vestibular | UX, CREATIVE, UI, AUDIT |
| `08-ejecucion/` | `css/` · `js/` · `gsap/` (fundamentos, capacidades, 10 patrones, glosario) · `rive/` · `cavalry-ae/` · `blender/` | CREATIVE; UI y SKETCH (on-demand) |
| `09-critica/` | Protocolo de visionado, diagnóstico, rúbrica | CREATIVE; AUDIT (on-demand, asesor) |

### `vendors/` — Bibliotecas de referencia externas

Conocimiento de fuentes externas integrado en el sistema. **No se carga automáticamente** — se consulta on-demand cuando se solicita una estética, referente o técnica concreta.

| Biblioteca | Contenido | Cargado por |
|-----------|-----------|-------------|
| `vendors/awesome-design/index.md` | Catálogo de 58 DESIGN.md de empresas reales (Vercel, Stripe, Linear, Apple…) organizados por estética, tipografía y filosofía de sombras/bordes | CREATIVE, SKETCH, THEME, BRAND (on-demand) |
| `vendors/awesome-design/awesome-design-md-main/design-md/[empresa]/DESIGN.md` | DESIGN.md individual de cada una de las 58 empresas | On-demand por nombre |

---

## El filtro SYX

Todo bloque de código de este córtex que construya front pasa por R01–R04 antes de valer como ejemplo. Un módulo puede razonar el porqué con la libertad que quiera; en cuanto enseña *cómo se escribe*, escribe SYX.

**La regla depende de la capa, y por eso todo bloque tiene que dejar clara la suya.** Lo que es legal en un tema es ilegal en un componente:

| Capa | Ruta | Qué puede escribir |
|---|---|---|
| Primitivos | `scss/abstracts/tokens/primitives/` | Valores crudos. OKLCH en color. |
| Tema | `scss/themes/{nombre}/_theme.scss` | `--semantic-*: var(--primitive-*)`. **Aquí el primitivo es correcto.** |
| Token de componente | `scss/abstracts/tokens/components/` | `--component-*: var(--semantic-*)`. Literal solo para una rampa `clamp()`, que no tiene tier semántico. |
| Componente | `scss/atoms\|molecules\|organisms/` | Solo `var(--component-*)` y `var(--semantic-*)`. Sin excepción. |

De ahí las cuatro reglas que un ejemplo no puede romper cuando se presenta como correcto:

- **R01** — `var(--primitive-*)` en un fichero de componente. Legal en tema y en la capa de abstracts; nunca en atoms, molecules u organisms.
- **R02** — `!important`. La cascada se gobierna con `@layer`.
- **R03** — `transition:` en crudo → `@include transition()`, que ya trae su guarda de `prefers-reduced-motion`.
- **R04** — `position: absolute|fixed|sticky` en crudo → `@include absolute()` y compañía.

Y dos que no llevan número pero se auditan igual:

- **Mobile-first estricto.** Solo `min-width`, siempre vía `@include breakpoint()`. Un `max-width` en un ejemplo solo es admisible si está marcado como lo que no hay que hacer.
- **Nombres reales.** Un token citado en un ejemplo tiene que existir en `tokens.json`. La escala tipográfica es `--primitive-font-size-*` y `--semantic-font-size-h1…h6`. ❌ `--primitive-type-*` no existe.

**Un ejemplo que incumple algo de esto solo es válido si se declara como antipatrón** — con `// ✗`, o diciéndolo en la línea anterior. Un bloque sin marca se lee como recomendación, y una recomendación que viola el contrato es peor que no tener el módulo: enseña a un agente a escribir código que el validador va a rechazar después.

`vendors/` queda fuera de este filtro y por eso no se carga solo: son sistemas ajenos con hex crudos y tokens con otros nombres. Es material de *brief*, nunca de implementación. La ruta a producción es siempre CREATIVE → TOKEN → UI.

Y el orden de mando no cambia: **si un módulo de este córtex recomienda algo que una regla prohíbe, gana la regla y el módulo es lo que hay que corregir.** Ver la escalera de precedencia en `../README.md`.

---

## Cómo se usa este knowledge

1. Los modos cargan módulos específicos según su dominio (ver tabla en `mind-system/routing.md`).
2. Cuando una regla operativa no cubre un caso → consultar el módulo de knowledge del dominio.
3. El knowledge conceptual informa; las reglas operativas ejecutan. En caso de conflicto, las reglas operativas prevalecen.
4. Para añadir nuevo conocimiento: crear el archivo en el dominio correspondiente con el schema `## meta / ## concepts / ## rules / ## checklist`.
