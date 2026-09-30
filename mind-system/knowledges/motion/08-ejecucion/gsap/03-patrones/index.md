# Patrones GSAP — Catálogo

## meta

| Campo | Valor |
|-------|-------|
| **Dominio** | motion — patrones reusables con nombre operativo |
| **Fuente** | GSAP Prompt Briefing del proyecto; biblioteca de patrones internos ATLAS |
| **Objetivo** | Disponer de un nombre y una receta para cada efecto que aparece con frecuencia |
| **Agent tags** | `#gsap` `#patterns` `#storytelling` |

---

## concepts

Cada patrón tiene un nombre operativo (no decorativo). Decir *"character cascade"* en lugar de *"que las letras aparezcan una a una"* alinea inmediatamente al equipo y a la IA con la mecánica concreta. Cada documento sigue la plantilla de `05-plantillas/plantilla-patron.md`.

---

## Catálogo

### Reveals de texto y elementos

| Patrón | Archivo | Intención |
|---|---|---|
| Character cascade | `character-cascade.md` | Hero / título — tensión narrativa al cargar |
| Typewriter | `typewriter.md` | Presentar texto con la sensación de tipearse |
| Mask reveal | `mask-reveal.md` | Descubrir contenido detrás de una máscara |

### Storytelling con scroll

| Patrón | Archivo | Intención |
|---|---|---|
| Parallax | `parallax.md` | Profundidad — capas que se mueven a velocidades distintas |
| Pinned scrub | `pinned-scrub.md` | Capítulo fijado que avanza con el scroll |
| Horizontal scroll | `horizontal-scroll.md` | Recorrido lateral en una sección pinneada |
| Scrub progress | `pinned-scrub.md` | Datos/gráficas que avanzan con el scroll |

### Imagen y composición

| Patrón | Archivo | Intención |
|---|---|---|
| Ken Burns | (ver `parallax.md` § Ken Burns) | Foto que respira con leve zoom + drift |
| Draw SVG path | `draw-svg-path.md` | Trazado animado de líneas (charts, network) |

### Cursor e interacción

| Patrón | Archivo | Intención |
|---|---|---|
| Magnetic button | `magnetic-button.md` | Botón que se atrae al cursor |
| Cursor follower | `cursor-follower.md` | Cursor personalizado que sigue al ratón |

### Texto especializado

| Patrón | Archivo | Intención |
|---|---|---|
| Scramble text | `scramble-text.md` | Cifrado/decifrado con caracteres aleatorios |

---

## rules

### Cuándo usar qué

| Brief | Patrones recomendados |
|---|---|
| Hero editorial cinematográfico | character-cascade + parallax + Ken Burns |
| Long-form de investigación | pinned-scrub + draw-svg-path + scramble-text |
| Galería de fotos premium | mask-reveal + Ken Burns en hover |
| Página corporativa con identidad fuerte | magnetic-button + cursor-follower (selectivo) |
| Dashboard con datos en tiempo real | scramble-text en counters, draw-svg-path en charts |

### Reglas de combinación

1. **Un solo patrón por viewport** — apilar reveals/parallax/scrubs en el mismo bloque genera caos cognitivo. Si el bloque es complejo, jerarquizar: *uno principal, los demás soporte*.
2. **Reduced-motion siempre cubre el patrón** — todos los archivos del catálogo declaran su fallback. No hay excepción.
3. **El patrón tiene que servir a la narración**, no decorarla. Si quitarlo no cambia el mensaje, sobra.

---

## checklist

- [ ] ¿He nombrado el patrón con su término operativo (no descripción)?
- [ ] ¿Sé qué patrón concreto pedirle al modo CREATIVE/UI?
- [ ] ¿La combinación de patrones por viewport es ≤ 1 principal + 1 soporte?
- [ ] ¿El fallback `prefers-reduced-motion` está cubierto?
