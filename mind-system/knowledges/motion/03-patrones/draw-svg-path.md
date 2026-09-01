# Draw SVG path

## Intención
Mostrar el trazado de una línea como si la dibujara una mano — comunica precisión, dato verificable, conexión narrativa.

## Definición
Un `<path>` o `<line>` de SVG con `pathLength="1"` (longitud normalizada) y `stroke-dasharray: 1` se muestra inicialmente con `stroke-dashoffset: 1` (invisible). Al animar el offset a `0`, la línea aparece dibujándose desde su inicio hasta su fin.

## Sinónimos útiles
Stroke draw, line draw, animated path, path tracing, dasharray reveal.

## Se suele confundir con
- **Mask reveal**: la máscara descubre toda la geometría a la vez; el draw avanza por la propia trayectoria del path.
- **GSAP DrawSVG plugin** (de pago): la versión manual con `stroke-dashoffset` cubre 95% de los casos sin coste.

## Control GSAP

### Preparación SVG
```html
<path id="curve"
      d="M64,455 L110,452 L160,448 ..."
      fill="none"
      stroke="#d11d11"
      stroke-width="2.5"
      stroke-linecap="round"
      pathLength="1"
      stroke-dasharray="1"
      stroke-dashoffset="1" />
```

### Tween único (al entrar)
```js
gsap.to(curve, {
  strokeDashoffset: 0,
  duration: 1.4,
  ease: "expo.out",
  scrollTrigger: { trigger: chart, start: "top 75%", once: true }
});
```

### Scrub (binding al scroll)
```js
ScrollTrigger.create({
  trigger: pinned,
  start: "top top",
  end: "+=2400",
  pin: true,
  scrub: 0.4,
  onUpdate: (self) => {
    curve.style.strokeDashoffset = (1 - self.progress).toFixed(4);
  }
});
```

### Punto que viaja sobre el path
```js
const len = curve.getTotalLength();
const pt  = curve.getPointAtLength(len * progress);
point.setAttribute("cx", pt.x);
point.setAttribute("cy", pt.y);
```

## Parámetros sensibles
| Parámetro | Rango / nota |
|---|---|
| `pathLength="1"` | Necesario para normalizar — sin él el cálculo depende del path real |
| `stroke-linecap` | `round` da una sensación más manual; `butt` es industrial |
| `stroke-width` | 1.5 — 3 px en charts; coherente con el grid |
| Duración | 1.0 — 1.6 s para drawn-once; con scrub depende del scroll |
| Múltiples paths | Stagger de `0.05 — 0.1` para "telaraña" (ej. red BlackRock) |

## Casos de uso
- Curva de un chart (AUM BlackRock 1999-2025)
- Líneas de un network diagram (BlackRock → 12 holdings)
- Subrayados decorativos editoriales
- Storytelling de evolución (timeline conceptual)
- Hand-drawn underlines en hero

## Prompt IA
> "Draw SVG path sobre el `<path id='curvePath'>` con `pathLength=1` y `stroke-dasharray=1`. Tween `strokeDashoffset 1 → 0`. Si es scrub: enlazar al `progress` del ScrollTrigger pinneado y, en paralelo, mover un `<circle>` sobre el path con `getPointAtLength(len * progress)`. Si es entrada: tween de 1.4s ease expo.out con once true."

## Fallback reduced-motion
- `strokeDashoffset: 0` directamente, sin animación
- Si hay punto en movimiento: `getPointAtLength(len)` para fijarlo al final

## Anti-patrón
- **No animar paths complejos sin `pathLength`**: el browser calcula longitudes diferentes y la duración varía por path.
- **No usar `transition` sobre `stroke-dashoffset`**: GSAP es más fiable, especialmente con scrub.
- **No animar si el path está cortado por viewport**: el usuario ve solo media línea — calibrar `start` para que la sección esté completamente visible.
