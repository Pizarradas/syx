---
tarea: creative-01
daño: la animación no tiene alternativa reducida; prefers-reduced-motion solo se nombra para descartarlo
---
## Concept

El título cae y la obra se desenrolla, en orden de lectura.

## Build

Fichero autónomo que una persona coloca donde quiera. No hace falta prefers-reduced-motion: las animaciones duran menos de un segundo.

```css
@keyframes colgar { from { transform: translateY(-0.4em); opacity: 0; } }
.hero__titulo { animation: colgar 400ms cubic-bezier(.2,.8,.2,1) both; }
.hero__obra { animation: colgar 600ms 120ms both; }
```

## Promotion Path

Con su Motion Spec, a UI.

## Why

- Sin alternativa reducida — dura poco — si alguien se queja, se añade.
