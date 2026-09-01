# Parallax

## Intención
Crear sensación de profundidad — el fondo se mueve más lento que el primer plano, dando la ilusión de que está más lejos.

## Definición
Una capa de fondo (imagen, vídeo, gradiente) que se desplaza en `yPercent` a una velocidad menor que el scroll de la sección que la contiene. Implementación: `yPercent: -speed * 100` con `scrub: true` ligado a un ScrollTrigger sobre el contenedor padre.

## Sinónimos útiles
Layered depth, parallax scroll, capa de fondo lenta, depth scroll, scroll-coupled motion.

## Se suele confundir con
- **Pinned scrub**: el parallax fluye con el scroll; el pinned-scrub fija la sección.
- **Ken Burns**: el Ken Burns hace zoom + drift sobre la propia imagen; el parallax desplaza la capa entera.

Pueden combinarse: una imagen con Ken Burns dentro de un contenedor con parallax.

## Control GSAP
```js
gsap.to(layer, {
  yPercent: -speed * 100,
  ease: "none",
  scrollTrigger: {
    trigger: container,
    start: "top bottom",
    end: "bottom top",
    scrub: true
  }
});
```

## Parámetros sensibles
| Parámetro | Rango |
|---|---|
| `speed` | 0.2 (sutil) — 0.6 (notorio). Más > marea. |
| `start/end` | `"top bottom"` → `"bottom top"` cubre todo el viewport |
| `scrub` | `true` (1:1) o número (0.3-0.6 = inercia natural) |
| Capa visible | `inset: -10%` evita ver el borde al desplazarse |

### Variante: Ken Burns
Aplicar a la misma capa un `scale 1.05 → 1.18` con `xPercent`/`yPercent` pequeños:

```js
gsap.fromTo(layer,
  { scale: 1.05, xPercent: 0, yPercent: 0 },
  { scale: 1.18, xPercent: -3, yPercent: -4,
    ease: "none",
    scrollTrigger: { trigger: parent, start: "top bottom", end: "bottom top", scrub: 0.8 }
  }
);
```

Resultado: la imagen "respira" mientras avanza el scroll. Sensación cinematográfica.

## Parámetros sensibles — Ken Burns
| Parámetro | Rango |
|---|---|
| `scale` inicio → fin | `1.05 → 1.18` (10-15 % máx) |
| `xPercent`/`yPercent` deriva | -2 a -5 |
| `scrub` | 0.6 — 1.0 (suavidad notable) |

## Casos de uso
- Hero de long-form con foto/vídeo de fondo
- Spread editorial entre capítulos (cinematic-quote)
- Secciones con cita destacada y fondo atmosférico
- Coda final con identidad de marca

## Prompt IA
> "Parallax sobre la capa de fondo del hero: speed 0.32, ease none, scrub true, sobre ScrollTrigger del contenedor. Si es spread cinematográfico, añadir Ken Burns con scale 1.05→1.18 y deriva xPercent -3, yPercent -4 con scrub 0.8."

## Fallback reduced-motion
La capa queda en su estado base (sin tween activo). El usuario sigue viendo la imagen, sin movimiento.
