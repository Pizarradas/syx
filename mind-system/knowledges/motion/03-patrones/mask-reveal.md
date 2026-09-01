# Mask reveal

## Intención
Descubrir contenido como si una persiana o paño se retirara — efecto editorial elegante que sustituye al simple fade-in y aporta dirección visual (de arriba abajo, izquierda a derecha, etc.).

## Definición
Sobre un contenedor con `overflow: hidden`, una capa máscara (`<span class="mask">`) cubre el contenido al 100 %. Un tween anima `transform: scaleY(1) → scaleY(0)` (con `transform-origin: top`) o `scaleX` para la variante horizontal. Simultáneamente, el `<img>` interno escala de `1.18 → 1.0` para añadir el "Ken Burns" del descubrimiento.

## Sinónimos útiles
Wipe reveal, curtain reveal, slide-up mask, máscara editorial, panel reveal, clip reveal.

## Se suele confundir con
- **Fade-in**: el fade es escalar `opacity`. La máscara es geometría — más sofisticada.
- **Clip-path reveal**: similar pero usa `clip-path: inset(50%)` → `inset(0%)`. Se prefiere para reveals desde el centro o esquinas; la máscara con scale se prefiere para direcciones lineales.

## Control GSAP
```js
gsap.set(mask, { scaleY: 1, transformOrigin: "top" });
gsap.set(img,  { scale: 1.18 });

const tl = gsap.timeline({
  scrollTrigger: { trigger: figure, start: "top 80%", once: true }
});
tl.to(mask, { scaleY: 0, duration: 1.1, ease: "expo.inOut" })
  .to(img,  { scale: 1.0, duration: 1.6, ease: "expo.out" }, "-=0.8");
```

## Parámetros sensibles
| Parámetro | Rango |
|---|---|
| `mask scaleY` | `1 → 0` con `transform-origin: top` (de arriba) o `bottom` |
| `mask scaleX` | variante horizontal — `transform-origin: left` |
| `mask` duration | `1.0 — 1.3 s` |
| `mask` ease | `expo.inOut` (lo que comunica "panel deslizándose") |
| `img scale` inicio | 1.10 — 1.20 |
| Overlap timeline | `"-=0.8"` — el img empieza a escalar antes de que la máscara termine |
| Trigger | `once: true` siempre — repetir destruye el efecto |

## Casos de uso
- Galería editorial (4 fotos asimétricas) — un mask por foto, stagger entre ellas
- Reveal de imagen hero al llegar al fold
- Cards de "destacados" que descubren foto al entrar en viewport
- Forensic evidence gallery (variante horizontal `scaleX`)

## Prompt IA
> "Mask reveal sobre la galería: cada figure tiene un `.mask` y un `<img>`. Timeline: mask `scaleY 1 → 0` (origin top, expo.inOut, 1.1s) + img `scale 1.18 → 1.0` (expo.out, 1.6s, overlap -0.8s). Trigger ScrollTrigger top 80%, once true. Hover Ken Burns extra: img a `scale 1.06`."

## Fallback reduced-motion
```js
if (reduced) {
  gsap.set(mask, { scaleY: 0 });
  gsap.set(img, { scale: 1 });
  return;
}
```
