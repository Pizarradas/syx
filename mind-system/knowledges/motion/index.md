# Knowledge motion — Índice

El movimiento como disciplina completa: **por qué** se mueve algo, **cómo debe sentirse**, **qué física lo sostiene**, **con qué valores**, **qué no puede romper**, **cómo se construye** en cada herramienta y **cómo se revisa**. Cubre la UI web de SYX, pero también lo que CREATIVE produce fuera de `scss/`: Rive, Cavalry, After Effects, Lottie, Blender, vídeo y tipografía cinética.

Antes de este acople el dominio era solo la capa de librería GSAP. Esa capa sigue intacta, ahora como una parte del estrato de ejecución: `08-ejecucion/gsap/`.

---

## Los tres estratos

```
            CONOCIMIENTO — el porqué y el qué
  02-proposito   03-creativa   04-teoria   05-tipografia
        │             │            │             │
        └──────► 06-sistema ◄── 07-accesibilidad ◄┘
                (valores de     (restricciones:
                 referencia)     gana siempre)
                      │
             01-direccion · MOTION SPEC   ← lengua franca, independiente de la herramienta
                      │
            EJECUCIÓN — el cómo
  css · js · gsap · rive · cavalry-ae · blender
                      │
                 09-critica   ← cierra el bucle
```

La **dirección** (`01-direccion/`) clasifica el encargo, reparte el trabajo entre estratos y fija el contrato en una Motion Spec. No es un modo SYX: es un protocolo que ejecutan los modos que ya existen, cada uno en su dominio (tabla en `01-direccion/direccion.md`).

---

## Estructura

```
motion/
  00-indice/        → mapa del dominio y fuentes comentadas
  01-direccion/     → protocolo, Motion Spec, brief
  02-proposito/     → para qué se mueve: prueba de propósito, patrones de transición, coreografía
  03-creativa/      → concepto, carácter, personalidades, lenguaje de marca, narrativa y ritmo
  04-teoria/        → principios, easing, springs, timing
  05-tipografia/    → tipografía cinética
  06-sistema/       → escala de referencia (duraciones, curvas, springs) y su mapeo por plataforma
  07-accesibilidad/ → reduced motion, destellos, pausa, riesgo vestibular
  08-ejecucion/     → css · js · gsap (capa de librería) · rive · cavalry-ae · blender
  09-critica/       → protocolo de visionado, diagnóstico y rúbrica
```

---

## Módulos

### `00-indice/`

| Módulo | Contenido | Cargado por |
|--------|-----------|-------------|
| `mapa-del-sistema.md` | Flujo de consulta del dominio y precedencia interna | — |
| `fuentes.md` | Bibliografía comentada con valores (Disney, Penner, Material, Carbon, Fluent, Apple, WCAG…) | — |

### `01-direccion/`

| Módulo | Contenido | Cargado por |
|--------|-----------|-------------|
| `direccion.md` | Clasificar el encargo, recorridos rápido/completo/exploratorio, pipeline, precedencia interna, reparto entre modos | CREATIVE |
| `motion-spec.md` | Esquema YAML de la Motion Spec, variantes por medio, mini-spec | CREATIVE, UI (on-demand: si llega una spec de CREATIVE) |
| `brief.md` | Preguntas de brief y checklists de arranque y salida | CREATIVE |

### `02-proposito/`

| Módulo | Contenido | Cargado por |
|--------|-----------|-------------|
| `proposito.md` | Prueba de propósito, tiempo real vs transición, 12 principios de UX in Motion, feedback, datos | UX |
| `patrones-de-transicion.md` | Container transform, shared axis, fade through, fade, sheets, listas | UX, UI |
| `coreografia.md` | Roles, anclas, solape, direccionalidad, interrupción, n variable, scroll | UX |

### `03-creativa/`

| Módulo | Contenido | Cargado por |
|--------|-----------|-------------|
| `creativa.md` | Mensaje → verbo → material → metáfora, cinco ejes de carácter, exploración A/B/C | CREATIVE |
| `personalidad.md` | Ocho arquetipos, adjetivos y materiales traducidos a parámetros | CREATIVE, BRAND |
| `lenguaje-de-marca.md` | Plantilla de lenguaje de motion de marca | CREATIVE, BRAND |
| `narrativa-y-ritmo.md` | Estructuras por duración, beats, transiciones como puntuación, música | CREATIVE |

### `04-teoria/`

| Módulo | Contenido | Cargado por |
|--------|-----------|-------------|
| `teoria.md` | Timing → spacing → trayectoria, decisiones rápidas, curva o spring, carácter → física | CREATIVE |
| `principios.md` | 12 principios + 10 del motion design + añadidos contemporáneos, por medio | CREATIVE |
| `easing.md` | Anatomía de la cubic-bezier, Penner, catálogo, JCGT, `linear()` | CREATIVE |
| `springs.md` | Física, duration + bounce, conversiones, equivalencias por plataforma | CREATIVE |
| `timing.md` | Frames, spacing, duración por distancia, stagger con tope, ritmo, audio, fps | CREATIVE |

### `05-tipografia/`

| Módulo | Contenido | Cargado por |
|--------|-----------|-------------|
| `tipografia-cinetica.md` | Unidades, stagger y doble easing, técnicas, tiempo de lectura en el peor escenario, texto dividido accesible | CREATIVE |

### `06-sistema/`

| Módulo | Contenido | Cargado por |
|--------|-----------|-------------|
| `escala.md` | Escala de referencia en tres capas, ejes productive/expressive × spatial/effects, reglas; relación con `--semantic-duration-*` | TOKEN, THEME, CREATIVE (on-demand) |
| `escala.tokens.json` | La escala en DTCG, con la equivalencia física de cada spring | — (dato, lo cita `escala.md`) |
| `mapeo-por-plataforma.md` | Traducción a CSS/SCSS, JS, GSAP, Motion, Rive, AE, Cavalry, Blender, SwiftUI, Compose, Lottie | CREATIVE (on-demand) |

### `07-accesibilidad/`

| Módulo | Contenido | Cargado por |
|--------|-----------|-------------|
| `accesibilidad.md` | Tres riesgos, reglas duras (WCAG 2.2.1/2.2.2/2.3.1/2.3.3), reducir o sustituir, detección por plataforma | CREATIVE, UX, UI, AUDIT |

### `08-ejecucion/`

| Módulo | Contenido | Cargado por |
|--------|-----------|-------------|
| `css/css.md` | CSS o JS, individual transforms, `@starting-style`, `linear()`, `@property`, scroll-driven, View Transitions, rendimiento | CREATIVE, UI (on-demand) |
| `css/recetas.md` | Press, menú, acordeón, lista, tabs, skeleton, contador, texto, marquee | CREATIVE, UI (on-demand) |
| `css/spring-to-linear.js` | Generador de `linear()` desde springs o easings | — (herramienta) |
| `js/js.md` | WAAPI, GSAP 3.13+, Motion, FLIP, interrupción, rendimiento | CREATIVE (con GSAP o JS) |
| `js/springs-y-gestos.md` | Spring con herencia de velocidad, drag-release, snap, quickTo | CREATIVE (con GSAP o JS) |
| `gsap/` | Capa de librería: fundamentos, capacidades, 10 patrones, glosario, plantilla (índice propio en `gsap/index.md`) | CREATIVE (con GSAP), UI y SKETCH (on-demand) |
| `rive/rive.md` · `rive/state-machines.md` · `rive/runtime-web.md` | Timelines, state machines, Data Binding, Luau, runtime, MCP | CREATIVE (on-demand: si el brief nombra Rive) |
| `cavalry-ae/cavalry-ae.md` · `cavalry.md` · `after-effects.md` · `lottie.md` | Motion graphics de timeline lineal, scripting, expresiones, Lottie | CREATIVE (on-demand: si el brief nombra la herramienta) |
| `blender/blender.md` | Graph Editor, handles desde tokens, bpy con Slotted Actions, cámara | CREATIVE (on-demand: si el brief nombra Blender o 3D) |

### `09-critica/`

| Módulo | Contenido | Cargado por |
|--------|-----------|-------------|
| `critica.md` | Protocolo de visionado, vocabulario subjetivo → diagnóstico, rúbrica, informe | CREATIVE, AUDIT (on-demand; asesor, sin número R) |

---

## Precedencia

Dos escaleras distintas, y conviene no mezclarlas.

**Dentro del dominio** (`01-direccion/direccion.md`): accesibilidad > propósito > sistema > dirección creativa > preferencia técnica. Romper un nivel exige una excepción documentada en la Motion Spec.

**Dentro del repositorio** (`../../README.md`): todo este dominio es el escalón 6. Por encima siguen `contracts/trust.json`, R01–R08 y el bloque `Trust` de cada modo. Ninguna excepción de la spec alcanza a esos escalones: un `transition:` en crudo en un componente es R03 aunque la spec lo justifique.

Y una precedencia dentro del córtex que se mantiene: **`ui/motion-principles.md` es el suelo físico de la UI web de SYX y prevalece sobre este dominio para código de `scss/`**. `04-teoria/` es la teoría completa de la que ese suelo es el resumen aplicado; están reconciliados, y si vuelven a divergir es un error que se corrige, no una opción a elegir.

---

## El filtro SYX en este dominio

Los bloques de código de `08-ejecucion/`, `06-sistema/mapeo-por-plataforma.md` y `07-accesibilidad/` son **web genérica o de otras herramientas**: la capa de prototipo de CREATIVE, exenta de R01–R08, y cada módulo lo dice en su `concepts`. Nombres como `--duration-moderate-02` pertenecen a la escala de referencia de `06-sistema/`, no a `tokens.json`. Dentro de `scss/` la mecánica es la misma y se escribe en SYX: `@include transition()`, `var(--semantic-duration-*)`, `var(--semantic-easing-*)`. La ruta a producción es siempre CREATIVE → TOKEN → UI. Ver *El filtro SYX* en `../index.md`.

---

## Cómo se usa

1. **Encargo de movimiento no trivial** → empezar por `01-direccion/direccion.md`: clasificar, elegir recorrido, repartir.
2. **Un efecto con nombre de GSAP** → directamente `08-ejecucion/gsap/03-patrones/` o `04-glosario/`, sabiendo que el propósito y la accesibilidad siguen aplicando.
3. **«No se siente bien»** → `09-critica/critica.md`, y desde ahí al estrato responsable.
4. **El conocimiento informa, no obliga.** Los valores de SYX viven en `tokens.json`; los contratos, en `contracts/`.

---

## Relación con otros knowledges

- **`ui/motion-principles.md`** → suelo físico de la UI web. Prevalece para `scss/`.
- **`ux/microinteractions.md`** → la anatomía de una microinteracción; `02-proposito/` decide cómo se mueve.
- **`ui/typography-systems.md`** → el texto en reposo; `05-tipografia/` lo mueve sin dejar de leerse.
- **`front/accessibility-wcag.md`** → WCAG en general; `07-accesibilidad/` es su parte de movimiento.
- **`branding/perception-of-prestige.rules.md`** R-DET-02 y R-ESC-01 → las microinteracciones como señal de cuidado, y la contención: un solo patrón animado por viewport.
