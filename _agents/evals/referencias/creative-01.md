## Concept

Las obras entran como si se colgaran: el título cae con peso y se asienta, la imagen se revela de abajo arriba como un lienzo que se desenrolla. Primero el nombre de la exposición, después la obra: el orden del movimiento es el orden de lectura.

## Build

Un fichero autónomo que una persona coloca donde decida. Duraciones de la escala de `motion/06-sistema/escala.md` (título 400 ms, revelado 600 ms con 120 ms de desfase).

```css
@keyframes colgar { from { transform: translateY(-0.4em); opacity: 0; } }
@keyframes desenrollar { from { clip-path: inset(100% 0 0 0); } }
.hero__titulo { animation: colgar 400ms cubic-bezier(.2,.8,.2,1) both; }
.hero__obra { animation: desenrollar 600ms 120ms cubic-bezier(.2,.8,.2,1) both; }
@media (prefers-reduced-motion: reduce) {
  .hero__titulo, .hero__obra { animation: none; }
}
```

Con movimiento reducido, todo aparece en su sitio desde el principio; nada queda oculto.

## Technique Log

- `clip-path: inset()` animado para el revelado: no mueve el layout ni la imagen.
- `animation-fill-mode: both` para que nada parpadee antes de empezar.

## Promotion Path

Si pasa a UI, con su Motion Spec: dos elementos, dos curvas de la escala, 120 ms de desfase, alternativa estática. En SYX se escribe con `@include transition()` y los tokens de duración (`--semantic-duration-base`, `--semantic-duration-slow`), siguiendo `motion/01-direccion/motion-spec.md`.

## Why

- Dirección de arte sobria y tipográfica: un solo elemento en movimiento a la vez, acento nulo, ritmo lento — una galería vende la obra, no la web — una feria o un festival pediría simultaneidad y contraste alto.
- `clip-path` en vez de animar `height` — no provoca reflujo en cada fotograma — si hubiera que soportar navegadores sin `clip-path`, bastaría un fundido.
