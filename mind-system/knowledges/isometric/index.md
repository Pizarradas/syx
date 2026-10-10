# Knowledge isometric — Índice

La ilustración **flat isométrica** para web y apps como disciplina: proyección exacta, tres tonos por material, orden de profundidad y una estructura que se puede animar sin redibujar. Cubre los heros, infografías, iconos y diagramas en volumen que produce CREATIVE, y el SVG que UI acaba incrustando en una página.

El principio del dominio es uno: **no se dibuja a ojo, se calcula.** La escena se describe como datos (JSON) o se modela en Blender, y las herramientas de este dominio la proyectan. Las tres vías comparten la misma proyección y la misma fórmula de tres tonos: un color da los mismos hex en Blender, en el SVG y en la web.

Origen: kit *iso-flat* (ISOMETRIC-P), de José Luis Pizarro Feo, incorporado en octubre de 2026. Sus cinco skills son aquí cinco estratos; su rol de ilustrador está repartido entre `01-fundamentos/fundamentos.md` (especificación y control de calidad) y la entrega de cada motor.

---

## Los estratos

```
                 01-fundamentos   ← siempre primero: especificación, geometría, luz, control de calidad
                        │
     ┌──────────────────┼──────────────────┬──────────────────────┐
02-svg-web          04-blender        05-prompts-imagen
(código → SVG)   (3D → SVG o capas)   (modelo ráster)
     └──────────────────┬──────────────────┘
                 03-animacion     ← si algo se mueve; manda motion/07-accesibilidad
                        │
                  verificación    ← iso-check.py + render mirado (fundamentos §5)
```

Recorrido típico: fundamentos → (svg-web | blender | prompts-imagen) → animación → verificación.

---

## Estructura

```
isometric/
  index.md                 → este mapa
  00-indice/               → fuentes y contradicciones resueltas · prompt universal (versión exportable)
  01-fundamentos/          → especificación, ejes, geometría, composición, control de calidad · matemáticas · color y luz
  02-svg-web/              → escena como datos, estructura animable, reglas de código, escáner · CSS 3D · a11y y SVGO
     herramientas/         → iso.mjs (generador) · iso-check.py (escáner) · iso-render.py (revisión)
     ejemplos/             → escena-servidor.json/.svg · ejemplo-animable.svg · demos
  03-animacion/            → animar en espacio de mundo, destino, guion · recetas GSAP/CSS · Lottie y Rive
  04-blender/              → cámara exacta, shader de tres tonos, exportación a SVG por piezas o a capas PNG
     herramientas/         → iso_setup.py · iso_export_svg.py · iso_export_capas.py · iso_comun.py · con_bpy.py
     ejemplos/             → scripts que crean, animan y preparan la escena de ejemplo
  05-prompts-imagen/       → prompts para Midjourney, GPT Image, Flux… · plantilla
```

---

## Módulos

| Módulo | Contenido | Cargado por |
|--------|-----------|-------------|
| `00-indice/fuentes.md` | Bibliografía comentada y tabla de contradicciones (86.602 %, 54.7356° vs 60°…) | — |
| `00-indice/prompt-universal.md` | Todo el dominio en un bloque para IAs de chat sin archivos. Derivado: no se carga | — |
| `01-fundamentos/fundamentos.md` | Las cinco decisiones, ejes comunes, geometría, composición, control de calidad, puente con SYX | CREATIVE · AUDIT (on-demand) |
| `01-fundamentos/matematicas.md` | Constantes, mundo↔pantalla, matrices por plano, SSR, CSS 3D, orientaciones | CREATIVE (on-demand, vía fundamentos) |
| `01-fundamentos/color-luz.md` | Tres tonos, una luz, sombras proyectadas, degradados, contornos, contraste | CREATIVE (on-demand, vía fundamentos) |
| `02-svg-web/svg-web.md` | Técnica, escena JSON, flujo, estructura de tres capas, reglas de código, escáner | CREATIVE · UI (on-demand) |
| `02-svg-web/css-3d.md` | Plano isométrico en CSS 3D, alturas, bloques, hover, límites | CREATIVE (on-demand) |
| `02-svg-web/accesibilidad-rendimiento.md` | ARIA del SVG, SVGO sin romper la animación, rendimiento, entrega | CREATIVE · UI (on-demand) |
| `03-animacion/animacion.md` | Animar en el mundo, elegir destino, guion, tiempos de partida | CREATIVE (on-demand) |
| `03-animacion/recetas.md` | Vectores de eje, construcción por capas, crecimiento, trazado, recorrido, scroll | CREATIVE (on-demand) |
| `03-animacion/lottie-rive.md` | Flujo AE/Bodymovin, qué no exporta, state machines de Rive | CREATIVE (on-demand) |
| `04-blender/blender.md` | Salidas, flujo, conexión IA↔Blender, los tres scripts, límites | CREATIVE (on-demand) |
| `05-prompts-imagen/prompts-imagen.md` | Estructura del prompt, reglas por herramienta, series, Blender como estructura, revisión | CREATIVE (on-demand) |
| `05-prompts-imagen/plantilla-prompt.md` | Plantilla rellenable y dos ejemplos | CREATIVE (on-demand, vía prompts-imagen) |

---

## Relación con el resto del córtex

| Este dominio | Se apoya en | Quién manda |
|---|---|---|
| `03-animacion/` | `ui/motion-principles.md` · `motion/07-accesibilidad/accesibilidad.md` · `motion/08-ejecucion/gsap/` | El suelo físico y la accesibilidad. Las recetas de aquí solo añaden lo propio de la proyección paralela |
| `04-blender/` | `motion/08-ejecucion/blender/blender.md` | Complementarios: aquel traduce curvas y Slotted Actions; este pone la cámara isométrica y exporta a web |
| `01-fundamentos/color-luz.md` | `ui/color-theory.md` · `syx/color-oklch.md` · `front/accessibility-wcag.md` | Los tokens del tema. La paleta de una ilustración sale de los roles semánticos, no se inventa |
| `02-svg-web/` | `front/html-semantics.md` · `front/progressive-enhancement.md` | El SVG es contenido: `role`, `title` y lectura sin animación |

Tres reglas de convivencia:

1. **El código de este dominio es prototipo.** Lo que aquí se escribe en CSS vive fuera de `scss/` (CREATIVE, o la capa `@layer syx.app` de una app consumidora). Si una ilustración entra en un componente de SYX, se reescribe con el sistema: `@include transition()` (R03), tokens semánticos o de componente, y sin `position` en crudo (R04). Ver *En SYX* en `01-fundamentos/fundamentos.md` y `02-svg-web/svg-web.md`.
2. **Los tokens de la ilustración son del proyecto.** `--<proyecto>-<material>-top|left|right`, con `/* syx-reuse: … */`, nunca con un prefijo de SYX.
3. **Un valor de este dominio no crea un token de SYX.** Si una serie de ilustraciones necesita tokens compartidos en el sistema, se proponen por la vía de TOKEN.
