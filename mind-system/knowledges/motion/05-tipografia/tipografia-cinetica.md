# Tipografía cinética

## meta

| Campo | Valor |
|-------|-------|
| **Dominio** | motion — tipografía · texto en movimiento |
| **Fuente** | SVGator — *Kinetic typography*; Vertex — *Typography Animation*; GSAP SplitText docs |
| **Objetivo** | Equilibrar expresión y legibilidad cuando el texto se mueve |
| **Agent tags** | `#motion` `#typography` `#kinetic` `#split-text` `#legibility` |

---

## concepts

El texto en movimiento tiene una obligación que no tiene el resto: **tiene que leerse**. Este módulo equilibra la expresión con la legibilidad.

### 1. Dos familias

- **Motion typography:** las letras mantienen su forma y se mueven como objetos (slides, máscaras, scroll tipo Star Wars, layouts dinámicos 2D/3D). Es la más legible.
- **Fluid typography:** las letras se deforman, se transforman o se disuelven (morphing, ejes variables extremos, partículas). Es la más expresiva y la de menor legibilidad durante el movimiento.

**El timing crea el tono:** rápido y seco transmite energía o urgencia; lento y suave, calma o lujo. **Si todo se mueve, nada destaca**: anima la palabra clave y deja el resto estable.

### Relación con el resto del córtex

`ui/typography-systems.md` fija la escala, el interlineado y el tracking en reposo; este módulo decide cómo se mueve ese texto sin dejar de leerse. El patrón `motion/08-ejecucion/gsap/03-patrones/character-cascade.md` es una de las técnicas de aquí resuelta en GSAP.

---

## rules

### 2. Unidad de animación

| Unidad | Control | Cuándo |
|---|---|---|
| Capa o bloque entero | mínimo | Textos largos, UI, subtítulos |
| **Línea** | medio | Titulares de 2–4 líneas; reveals editoriales con máscara por línea |
| **Palabra** | alto | Frases cortas, lyric video, textos largos con énfasis. **Es la mejor opción por defecto para más de 5 palabras** |
| **Carácter** | máximo | Titulares de 1–3 palabras, logos, momentos firma |

Agrupar por línea permite que **cada línea tenga su propia ola** (el stagger se reinicia en cada línea).

### 3. Stagger tipográfico

**Dirección:** desde el inicio (lectura natural, por defecto), desde el final, del centro hacia fuera (simetría, logos), de los bordes hacia dentro (convergencia), aleatorio con semilla (efervescencia, siempre reproducible) o desde un índice concreto (énfasis en una palabra).

**Ventana (overlap):** cuánto se solapan las unidades.

- Ventana pequeña (poco solape) = efecto máquina de escribir, secuencial, lento.
- Ventana grande (mucho solape) = ola continua, fluida.
- Regla: `duración_unidad ≥ 2–4 × each` para que se perciba ola en lugar de secuencia.

**Doble easing (independientes y combinables):**

1. **Easing de la unidad**: cómo se mueve cada letra (p. ej. Expo out).
2. **Easing de la distribución**: cómo se reparten los desfases a lo largo del texto. Por ejemplo, `stagger: { each: 0.03, ease: "power2.in" }` en GSAP agrupa las primeras unidades (salen casi juntas) y espacia las últimas, lo que da sensación de frenada; con `power2.out` ocurre al revés (arranque escalonado y final en bloque, que se siente como aceleración).

**Valores de partida:**

| Unidad | each | duración de la unidad | Desplazamiento |
|---|---|---|---|
| Carácter | 15–40 ms | 300–600 ms | 0,3–1 em, o máscara 100 % |
| Palabra | 40–100 ms | 400–700 ms | 0,5–1 em |
| Línea | 80–150 ms | 500–900 ms | máscara 100 % de la línea |

Tope total del stagger siempre (ver `motion/04-teoria/timing.md`).

### 4. Técnicas

- **Reveal con máscara por línea**: cada línea sube desde detrás de su propia máscara (overflow hidden). Es editorial, limpio y muy legible.
- **Tracking animado**: el espaciado se abre o cierra (lujo, cine). Combínalo con opacidad.
- **Fuentes variables**: anima ejes (`wght`, `wdth`, `slnt`, `opsz`, ejes custom) para respiración, énfasis o reacciones al cursor. En CSS se usa `font-variation-settings` o `font-weight` con transición; es costoso (re-layout), así que úsalo en titulares, no en párrafos.
- **Kinetic layout**: las palabras reorganizan la composición (escala por énfasis, cambios de eje). Es típico del lyric video.
- **3D con perspectiva**: el pivote se coloca en el centro de cada unidad (o en la base, para "levantarse"). La rotación X de −90° a 0° con perspectiva produce el efecto de "pasar página".
- **Scramble/decode**: los caracteres aleatorios resuelven al texto real. Es técnico y cyber. Mantén la anchura estable con una fuente monoespaciada o números tabulares.
- **Fluid**: morphing entre glifos, partículas o dissolve. Resérvalo para momentos breves con un hold legible después.

### 5. Legibilidad: tiempo de lectura en el peor escenario

Heurística de este sistema, calculada para un **lector lento**:

```
hold_ms = max(1500, 1000 + palabras × 500, caracteres / 12 × 1000)
```

- 1000 ms de orientación (localizar el texto en pantalla), 500 ms por palabra (~120 palabras/min, lector lento) y 12 caracteres/s como tope de lectura cómoda de pantalla.
- El hold empieza cuando **el texto está completo y quieto**, no cuando empieza a entrar.
- Ejemplo: "Tu energía, más inteligente" (4 palabras, 27 caracteres) → max(1500, 3000, 2250) = **3000 ms**.
- Si el formato no permite ese hold, reduce el texto. No acortes el hold.

**Otras reglas:**

- No animes texto de cuerpo de forma continua. En UI, los párrafos entran como bloque.
- Contraste: mantén ≥ 4,5:1 (≥ 3:1 en texto grande) **durante** la mayor parte del movimiento, no solo al final.
- Safe areas de vídeo y social: el texto no debe caer en las zonas de interfaz de la plataforma.
- Durante un blur o un motion blur fuerte no hay lectura: el hold se cuenta después.

### 6. Accesibilidad del texto dividido

- Dividir el texto en `<span>` rompe los lectores de pantalla (leen letra a letra). Solución: `aria-label` con el texto completo en el contenedor y `aria-hidden="true"` en los fragmentos. GSAP SplitText 3.13+ lo hace con `aria: "auto"`.
- Con reduced motion: el texto aparece completo con un fade corto o sin animación. **Nunca** se elimina el texto ni se retrasa su aparición.
- Nada de texto que parpadee más de 3 veces/s.
- Tras cargar fuentes o cambiar el tamaño, hay que volver a dividir (SplitText `autoSplit` + animación creada en `onSplit`).

### Implementación por herramienta (resumen)

| Herramienta | Cómo |
|---|---|
| CSS | Spans + `animation-delay: calc(var(--i) * 30ms)`; máscara con `overflow: clip` por línea |
| GSAP | `SplitText.create(el, { type: "lines, words", mask: "lines", autoSplit: true, aria: "auto", onSplit(self) { return gsap.from(self.words, {...}) } })` |
| Motion | Dividir a mano + `stagger()` de `motion` |
| Rive | Text runs + modifiers (rangos por glifo, palabra o línea, con falloff); se animan offset, opacidad y transformaciones |
| Cavalry | Text Shape + Stagger/Falloff behaviours sobre sub-mesh por carácter o palabra |
| AE | Text Animators + Range Selector (by characters, words o lines; Shape: ramp up; Ease High/Low) |
| Blender | Objeto texto convertido a curvas o geometry nodes (String to Curves) con offsets por índice |

⚠️ Los modifiers de texto de Rive y los detalles de Cavalry dependen de la versión: verifícalos en el módulo de ejecución correspondiente.

---

## checklist

- [ ] Unidad de animación elegida por longitud (palabra por defecto a partir de 5)
- [ ] Stagger con tope y ventana de solape declarada
- [ ] Hold de lectura en el peor escenario, contado con el texto quieto
- [ ] Texto dividido accesible (`aria-label` + fragmentos `aria-hidden`)
- [ ] Con reduced motion el texto aparece completo, sin retraso
- [ ] Contraste ≥ 4,5:1 durante el movimiento
