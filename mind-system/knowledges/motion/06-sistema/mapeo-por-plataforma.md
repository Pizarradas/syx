# Mapeo de la escala por plataforma

## meta

| Campo | Valor |
|-------|-------|
| **Dominio** | motion — sistema · exportación a cada destino |
| **Fuente** | Documentación de CSS, GSAP, Motion, Rive, After Effects, Cavalry, Blender, SwiftUI, Jetpack Compose y Lottie |
| **Objetivo** | Traducir la escala de referencia a las unidades y formatos de cada herramienta |
| **Agent tags** | `#motion` `#tokens` `#export` `#platforms` |

---

## concepts

La fuente es `tokens.json` (DTCG). Estas tablas explican cómo se traduce cada tipo. Para exportaciones automáticas se puede usar Style Dictionary con transforms propios.

### El bloque CSS/SCSS de este módulo

Es **web genérica**: la capa de prototipo que produce CREATIVE (exenta de R01–R08) o cualquier proyecto que no sea el propio SYX. Nombres como `--duration-moderate-02` o `--easing-enter-productive` son la escala de referencia de `motion/06-sistema/escala.md`, no tokens de `tokens.json`. Dentro de `scss/` la mecánica es la misma, pero se escribe en SYX: `@include transition()` en lugar de `transition:` en crudo (R03), `@include absolute()` y compañía en lugar de `position:` (R04), `var(--semantic-duration-*)` y `var(--semantic-easing-*)` en lugar de valores sueltos, y `@include breakpoint()` con `min-width`. La ruta a producción es siempre CREATIVE → TOKEN → UI. Ver *El filtro SYX* en `index.md`.

---

## rules

### CSS custom properties

```css
/* capa: prototipo fuera de scss/ — CREATIVE, exento de R01–R08. En un componente se escribe en SYX: ver «En SYX» en motion/08-ejecucion/css/css.md */
:root {
  /* primitivos */
  --duration-fast-01: 70ms;  --duration-fast-02: 110ms;
  --duration-moderate-01: 150ms; --duration-moderate-02: 240ms;
  --duration-slow-01: 400ms; --duration-slow-02: 700ms;
  --duration-long-01: 1000ms; --duration-long-02: 1500ms;
  --easing-standard-productive: cubic-bezier(0.2, 0, 0.38, 0.9);
  --easing-enter-productive: cubic-bezier(0, 0, 0.38, 0.9);
  --easing-exit-productive: cubic-bezier(0.2, 0, 1, 0.9);
  --easing-standard-expressive: cubic-bezier(0.4, 0.14, 0.3, 1);
  --easing-enter-expressive: cubic-bezier(0, 0, 0.3, 1);
  --easing-exit-expressive: cubic-bezier(0.4, 0.14, 1, 1);
  --easing-emphasized-enter: cubic-bezier(0.05, 0.7, 0.1, 1);
  --easing-emphasized-exit: cubic-bezier(0.3, 0, 0.8, 0.15);
  --easing-overshoot: cubic-bezier(0.34, 1.56, 0.64, 1);
  /* springs → linear() generado (duración = settleMs del token) */
  --spring-spatial-default: linear(/* generar con motion/08-ejecucion/css/spring-to-linear.js */);
  --spring-spatial-default-duration: 348ms;

  /* semánticos */
  --motion-enter-medium: var(--duration-moderate-02) var(--easing-enter-productive);
  --motion-exit-medium:  var(--duration-moderate-01) var(--easing-exit-productive);
}
@media (prefers-reduced-motion: reduce) {
  :root { --motion-enter-medium: var(--duration-moderate-01) linear; /* + quitar transforms en el componente */ }
}
```

**SCSS** (arquitectura primitivos → semánticos → componentes): primitivos en un mapa `$motion-primitives`, semánticos que referencian primitivos, y un mixin `@include motion(enter-medium, transform opacity)` que emite `transition` y el bloque `prefers-reduced-motion`. Los tokens se publican como custom properties para que JS pueda leerlos.

### JS / TS

```ts
export const duration = { fast01: 70, fast02: 110, moderate01: 150, moderate02: 240, slow01: 400, slow02: 700, long01: 1000, long02: 1500 } as const;
export const easing = { enterProductive: [0, 0, 0.38, 0.9], /* … */ } as const;
export const spring = { spatialDefault: { duration: 400, bounce: 0.1, stiffness: 246.7, damping: 28.27, mass: 1 } } as const;
// Leer desde CSS para no duplicar: getComputedStyle(document.documentElement).getPropertyValue('--duration-moderate-02')
```

### GSAP

- Duración en **segundos**: `ms / 1000`.
- Curvas: `CustomEase.create("enterProductive", "0,0,0.38,0.9")` (acepta los 4 valores de la cubic-bezier) y después `ease: "enterProductive"`.
- Springs: GSAP no tiene spring. Usa CustomEase con el SVG path de la curva muestreada, o `elastic.out(1, 0.4)` como aproximación (documenta la pérdida).
- Defaults: `gsap.defaults({ duration: 0.24, ease: "enterProductive" })`.

### Motion (motion.dev)

- Tween: `{ duration: 0.24, ease: [0, 0, 0.38, 0.9] }` (segundos + array bezier).
- Spring perceptual: `{ type: "spring", visualDuration: 0.4, bounce: 0.1 }`.
- Spring físico: `{ type: "spring", stiffness: 246.7, damping: 28.27, mass: 1 }`.
- Global: `<MotionConfig transition={{...}} reducedMotion="user">`.

### Rive

- Interpolación **Cubic** en keys o transiciones: introduce los 4 valores de la cubic-bezier.
- Duración de las transiciones de la state machine: en ms (o en % de la animación).
- Springs: interpolación **Elastic** (amplitude y period), keys horneadas o scripting (Luau). Documenta la aproximación.
- Tokens en runtime: expón duraciones o factores como propiedades number de un **View Model** (p. ej. `speedMultiplier`, `reducedMotion: boolean`) para que el producto los controle mediante data binding.

### After Effects

- Duración: `frames = ceil(ms/1000 × fps)`.
- Cubic-bezier → influence, válido para propiedades 1D o con **Separate Dimensions**, con velocidad 0 en los keys:
  - Key de salida: **outgoing influence = x1 × 100 %** (velocidad 0).
  - Key de llegada: **incoming influence = (1 − x2) × 100 %** (velocidad 0).
  - Solo es exacto si y1 = 0 e y2 = 1. Con otros valores (overshoot, curvas de Carbon con y2 = 0,9) hace falta ajustar la velocidad o añadir keys; es más fácil usar un plugin (Flow, Ease and Wizz) o una expresión.
  - Ejemplos: Easy Ease (F9) = 33,33 % / 33,33 % ≈ cubic-bezier(0.333, 0, 0.667, 1). `enter.expressive` (0, 0, 0.3, 1) → outgoing 0 % (el mínimo real es 0,1 %; en la práctica, una salida lineal), incoming 70 %.
- Springs: expresión de inercia (ver `motion/08-ejecucion/cavalry-ae/`).

### Cavalry

- Frames igual que en AE. Tangentes: angle + weight, a través de `api.modifyKeyframeTangent`. Para curvas estándar, Magic Easing (`SlowOut` ≈ ease-out, `SpringOut` ≈ spring).
- Para una cubic-bezier exacta: calcula los handles como en Blender (abajo) y conviértelos a angle/weight en unidades de frames y valor.

### Blender

Handles FREE para cubic-bezier exacta en un segmento A→B (Δt = frames, Δv = cambio de valor):

```
A.handle_right = (tA + x1·Δt, vA + y1·Δv)
B.handle_left  = (tA + x2·Δt, vA + y2·Δv)
```

Alternativa: interpolación nativa (`SINE`, `QUAD`, `CUBIC`, `QUART`, `QUINT`, `EXPO`, `CIRC`, `BACK`, `BOUNCE`, `ELASTIC`) con easing `EASE_IN`/`EASE_OUT`/`EASE_IN_OUT`. Ver `motion/08-ejecucion/blender/`.

### SwiftUI

```swift
.animation(.timingCurve(0, 0, 0.38, 0.9, duration: 0.24), value: x)
.animation(.spring(duration: 0.4, bounce: 0.1), value: x)
// reduced: @Environment(\.accessibilityReduceMotion) var reduceMotion
```

### Jetpack Compose

```kotlin
tween(durationMillis = 240, easing = CubicBezierEasing(0f, 0f, 0.38f, 0.9f))
spring(dampingRatio = 0.9f, stiffness = 246.7f)
// M3 Expressive: MaterialTheme.motionScheme.defaultSpatialSpec()
```

### Lottie

Las curvas se hornean desde AE o Cavalry. No hay tokens en runtime. Para la variante reducida, exporta un segundo JSON o usa un frame estático.

---

## checklist

- [ ] Duraciones convertidas a la unidad del destino (s, ms, frames)
- [ ] Curvas exactas o aproximación anotada
- [ ] Springs sin equivalente nativo aproximados y documentados
- [ ] Variante reducida prevista también donde no hay runtime (Lottie, vídeo)
