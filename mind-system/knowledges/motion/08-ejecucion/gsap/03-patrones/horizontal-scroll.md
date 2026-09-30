# Horizontal scroll

## Intención
Convertir el scroll vertical en un recorrido lateral — usado para timelines, carruseles narrativos, "panels" de storytelling.

## Definición
Una sección pinneada cuya pista interna (`__track`) tiene `display: flex` y desplaza su `x` en negativo proporcional al progreso del scroll. La distancia de scroll vertical equivale al ancho excedente de la pista (`scrollWidth - innerWidth`).

## Sinónimos útiles
Sideways panels, horizontal storytelling, lateral scroll section, panel scrubbing.

## Se suele confundir con
- **Carousel infinito**: aquí no hay loop; es lineal.
- **Snap scroll horizontal**: la mayoría de implementaciones del horizontal-scroll-pinned son scrub continuo, no snap.

## Control GSAP
```js
const track = section.querySelector(".track");
const distance = () => track.scrollWidth - window.innerWidth + 80;

gsap.to(track, {
  x: () => -distance(),
  ease: "none",
  scrollTrigger: {
    trigger: section,
    start: "top top",
    end: () => "+=" + distance(),
    pin: true,
    scrub: 0.8,
    invalidateOnRefresh: true,
    anticipatePin: 1
  }
});
```

## Parámetros sensibles
| Parámetro | Rango / nota |
|---|---|
| `end: "+="` | igual al ancho excedente — esto vincula 1px scroll = 1px desplazamiento horizontal |
| `scrub` | `0.6 — 1.0` (un poco más alto que pinned-scrub vertical, da más sensación de "deriva") |
| `pin-spacing` | Por defecto activado; útil para que el resto del contenido recupere su posición |
| Mobile fallback | Activar `flex-direction: column` y desactivar pin — vertical "natural" |

## Casos de uso
- Cronología (timeline) horizontal — perfecto para vidas, evoluciones
- Galería de "panels" narrativos
- Comparativa visual (antes/después/etapa)
- Catálogo de proyectos en presentación corporativa

## Prompt IA
> "Horizontal scroll pinneado: track flex con N items, distance = trackWidth - viewportWidth, x: -distance al scrollear, pin true, scrub 0.8, end: +=distance. Mobile: flex-direction column sin pin (fallback vertical). Reduced-motion: igual que mobile."

## Fallback mobile y reduced-motion
- **Base (sin media query)**: `flex-direction: column`, padding vertical, sin pin. Es el estado por defecto, no el fallback — el recorrido lateral es la mejora.
- **`@include breakpoint(lg)`**: a partir de ahí, `flex-direction: row` y se activa el ScrollTrigger con el pin.
- `prefers-reduced-motion: reduce`: ignorar el ScrollTrigger y quedarse en el estado base.

> SYX es mobile-first estricto: solo `min-width`, siempre vía `@include breakpoint()`. Escribir esto como `max-width: 1023px` invierte la dirección de la cascada y AUDIT lo marca. La diferencia no es cosmética: con `min-width` el estado columna es lo que se pinta si el JS nunca llega, que es justo lo que quieres en un patrón que depende de GSAP.

## Anti-patrones
- **No usar para más de ~8 items**. El usuario pierde la pista del avance.
- **No mezclar con parallax interno**. Demasiado movimiento simultáneo marea.
- **Indicar progreso siempre** (puntos, números, porcentaje) — sin él el usuario no sabe cuánto le queda.
