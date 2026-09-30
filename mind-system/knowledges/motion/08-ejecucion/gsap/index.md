# Capa GSAP — Índice

Vocabulario operativo de GSAP entendido como **lenguaje narrativo y de prompting**: cómo se nombran los efectos, cómo se controlan y qué función narrativa cumplen. Es la capa de librería del estrato de ejecución del dominio motion (`motion/index.md`), y se lee junto a `motion/08-ejecucion/js/js.md`, que traduce una Motion Spec a GSAP, WAAPI o Motion.

---

## Por qué una capa propia

El resto del dominio responde a *para qué* se mueve algo (propósito), *cómo se siente* (creativa), *qué física lo sostiene* (teoría) y *con qué valores* (sistema). Esta capa responde a *cómo se llama eso en GSAP, cómo se construye y cómo pedírselo a una IA*.

| Capa | Pregunta | Vive en |
|---|---|---|
| Suelo físico de la UI web | ¿Qué no se puede romper? | `ui/motion-principles.md` |
| Teoría | ¿Por qué este easing y no otro? | `motion/04-teoria/` |
| Mecánica GSAP | ¿Qué control de la librería usa? | `02-capacidades/` |
| Patrón visual | ¿Qué efecto perceptivo produce? | `03-patrones/` |
| Vocabulario | ¿Cómo se nombra para prompt? | `04-glosario/` |

---

## Estructura

```
motion/08-ejecucion/gsap/
  00-indice/        → mapas de lectura y navegación
  01-fundamentos/   → modelo mental, capas conceptuales, vocabulario base
  02-capacidades/   → tween, timeline, stagger, scrolltrigger, scrub, pin, snap, easing
  03-patrones/      → catálogo de efectos reusables (un microdoc por patrón)
  04-glosario/      → términos cortos para briefing y prompts IA
  05-plantillas/    → formato para documentar nuevos patrones
```

---

## Módulos

### `00-indice/`

| Módulo | Contenido | Cargado por |
|--------|-----------|-------------|
| `mapa-del-sistema.md` | Flujo de consulta del sistema (de fundamentos a patrones) | — |

### `01-fundamentos/`

| Módulo | Contenido | Cargado por |
|--------|-----------|-------------|
| `modelo-mental.md` | GSAP como qué/cuándo/qué activa/función narrativa — las cuatro capas | UI, CREATIVE |
| `vocabulario-base.md` | Tweens, timelines, stagger, scroll, ease — términos atómicos del lenguaje | UI, CREATIVE |

### `02-capacidades/`

| Módulo | Contenido | Cargado por |
|--------|-----------|-------------|
| `index.md` | Catálogo de capacidades GSAP con cuándo se usa cada una | CREATIVE (siempre cuando hay GSAP); UI (on-demand: si el componente requiere animación compleja) |

### `03-patrones/`

| Módulo | Contenido | Cargado por |
|--------|-----------|-------------|
| `index.md` | Mapa del catálogo de patrones | CREATIVE (siempre); UI (on-demand) |
| `character-cascade.md` | Reveal de título letra por letra | CREATIVE, UI |
| `parallax.md` | Capas con velocidades distintas en scroll | CREATIVE, UI |
| `pinned-scrub.md` | Sección fijada que avanza con el scroll | CREATIVE |
| `mask-reveal.md` | Contenido que se descubre tras una máscara | CREATIVE, UI |
| `magnetic-button.md` | Botón que se atrae al cursor | CREATIVE, UI |
| `cursor-follower.md` | Cursor personalizado que sigue al ratón | CREATIVE |
| `scramble-text.md` | Texto que se descifra con caracteres aleatorios | CREATIVE |
| `typewriter.md` | Texto que aparece como si se escribiera | CREATIVE, UI |
| `draw-svg-path.md` | Trazo de path SVG dibujándose | CREATIVE |
| `horizontal-scroll.md` | Sección lateral pinneada con scroll vertical | CREATIVE |

### `04-glosario/`

| Módulo | Contenido | Cargado por |
|--------|-----------|-------------|
| `index.md` | Vocabulario corto y accionable para prompts | CREATIVE, SKETCH (on-demand: si el brief usa términos de motion) |

### `05-plantillas/`

| Módulo | Contenido | Cargado por |
|--------|-----------|-------------|
| `plantilla-patron.md` | Schema para nuevos patrones (intención, control, prompt) | — (referencia para autores) |

---

## Cómo se usa

1. **Antes de pedirle a un modo CREATIVE/UI un efecto de movimiento**: nombrarlo desde `03-patrones/` o desde `04-glosario/` para que la solicitud sea precisa.
2. **Cuando el brief exige espectacularidad** (long-form, hero, transición editorial): cargar este índice + el patrón concreto en lugar de describir el efecto con palabras vagas.
3. **Antes de implementar un patrón en un encargo completo**: describirlo en una Motion Spec (`motion/01-direccion/motion-spec.md`) y traducirla con `motion/08-ejecucion/js/js.md`.
4. **Cuando se documenta un patrón nuevo**: copiar `05-plantillas/plantilla-patron.md` y rellenar las 8 secciones.
5. **El conocimiento informa, no obliga**: las reglas físicas de `ui/motion-principles.md` siguen siendo prioritarias (reduced-motion, GPU, no `transition: all`). Este dominio aporta nombres y mecánicas, no excepciones a esos principios.

---

## Relación con otros knowledges

- **`ui/motion-principles.md`** → easing, duraciones, propiedades GPU, reduced-motion. Prevalece.
- **`motion/07-accesibilidad/accesibilidad.md`** → la variante reducida de cada patrón se define ahí (`gsap.matchMedia()` es la mecánica, no la decisión). Prevalece sobre cualquier patrón.
- **`motion/02-proposito/`** y **`motion/03-creativa/`** → antes de elegir un patrón, el propósito y el carácter. Un patrón sin propósito es decoración.
- **`motion/05-tipografia/tipografia-cinetica.md`** → `character-cascade`, `typewriter` y `scramble-text` son técnicas de tipografía cinética: sus reglas de legibilidad y tiempo de lectura aplican.
- **`branding/perception-of-prestige.rules.md`** R-DET-02 → microinteracciones como señal de cuidado. La motion sirve a esa señal — no la sustituye con espectáculo.
- **`branding/perception-of-prestige.rules.md`** R-ESC-01 → contención. El catálogo aquí es amplio, pero cada documento debe usarse selectivamente: un solo patrón animado por viewport.
