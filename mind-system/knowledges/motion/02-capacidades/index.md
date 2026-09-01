# Capacidades de GSAP

## meta

| Campo | Valor |
|-------|-------|
| **Dominio** | motion — qué puede hacer GSAP a nivel técnico y expresivo |
| **Fuente** | GSAP docs; ScrollTrigger docs; Lenis docs |
| **Objetivo** | Catalogar las herramientas de la librería para que el modo CREATIVE/UI elija con criterio |
| **Agent tags** | `#gsap` `#scrolltrigger` `#capabilities` |

---

## concepts

Las capacidades de GSAP se agrupan en cinco familias: **temporales** (tween, timeline), **de orquestación** (stagger, callbacks), **de scroll** (ScrollTrigger), **de movimiento físico** (easing), y **plugins**. Conocer la familia correcta ahorra trabajo y produce un efecto más coherente.

---

## rules

### 1. Tween — animar una propiedad

| Variante | Cuándo |
|---|---|
| `gsap.to()` | Desde el estado actual a un objetivo (95 % de los casos) |
| `gsap.from()` | Desde un estado declarado hasta el actual (útil en reveals donde el estado final es CSS) |
| `gsap.fromTo()` | Cuando estado A y B son ambos explícitos (típico en seek/replay) |
| `gsap.set()` | Sin animación — fija valores; útil al preparar estados iniciales antes de revelar |

**Anti-patrón:** encadenar `.to()` consecutivos en el mismo objeto sin timeline. La timeline gana legibilidad y permite scrub.

### 2. Timeline — coreografía de varios tweens

```js
const tl = gsap.timeline({ defaults: { ease: "expo.out", duration: 0.9 } });
tl.to(a, { opacity: 1 })
  .to(b, { y: 0 }, "-=0.5")    // overlap 0.5s con el anterior
  .to(c, { scale: 1 }, "<");   // empieza a la vez que el anterior
```

**Cuándo usarla:**
- Más de un elemento que entra en una secuencia coreografiada
- Necesidad de scrub o seek programático
- `defaults` evita repetir `ease` y `duration`

**Posicionamiento:**
- Absoluto: `0.5`
- Relativo al final del anterior: `"+=0.3"`, `"-=0.6"`
- Relativo al inicio del anterior: `"<"`, `"<0.1"`, `">"`

### 3. Stagger — múltiples elementos desfasados

```js
gsap.to(items, { y: 0, opacity: 1, stagger: 0.05 });               // simple
gsap.to(items, {
  y: 0,
  stagger: { each: 0.04, from: "start" }                           // avanzado
});
gsap.to(grid, {
  y: 0,
  stagger: { each: 0.03, from: "center", grid: [10, 10], axis: "y" }
});
```

| Parámetro | Efecto |
|---|---|
| `each` | Tiempo entre elementos consecutivos |
| `amount` | Tiempo total para que todos hayan empezado (alternativa a `each`) |
| `from` | `"start"`, `"end"`, `"center"`, índice numérico |
| `grid` | Para staggers en 2D — define columnas × filas |
| `axis` | `"x"` o `"y"` — limita la dirección del cálculo |

### 4. Easing — curvas de tiempo

```js
gsap.to(el, { x: 100, ease: "expo.out" });
gsap.to(el, { x: 100, ease: "elastic.out(1, 0.4)" });   // amp, period
gsap.to(el, { x: 100, ease: CustomEase.create("...") }); // requiere plugin
```

| Familia | Sensación | Caso típico |
|---|---|---|
| `none` / `linear` | Mecánico, sin inercia | Scrub con scroll, video frames |
| `power1-4.out` / `expo.out` | Frenazo controlado | Reveal de texto, entrada de elementos |
| `back.out(1.4-1.7)` | Pequeño sobrepaso | Notificaciones, "aterrizajes" lúdicos |
| `elastic.out(1, 0.3-0.5)` | Rebote elástico | Magnetic button, switches |
| `expo.in` / `power3.in` | Aceleración | Salidas (75% de la duración de entrada) |

**Por qué la asimetría** entrada/salida: la entrada usa `*.out` porque el ojo procesa contenido nuevo; la salida usa `*.in` porque el contenido ya está procesado y la rapidez reduce el tiempo de espera percibido.

### 5. ScrollTrigger — vincular animación al scroll

```js
gsap.registerPlugin(ScrollTrigger);

// Modo trigger (con play/reverse según viewport)
ScrollTrigger.create({
  trigger: section,
  start: "top 80%",
  end: "bottom 20%",
  toggleActions: "play none none reverse",
  onEnter: () => ...,
  onLeave: () => ...
});

// Modo scrub (animación atada al progreso del scroll)
gsap.to(layer, {
  yPercent: -30,
  ease: "none",
  scrollTrigger: {
    trigger: container,
    start: "top bottom",
    end: "bottom top",
    scrub: true     // o un número: smoothing (0.4 es buen punto)
  }
});

// Modo pin (fijar mientras dura el trigger)
ScrollTrigger.create({
  trigger: pinned,
  start: "top top",
  end: "+=2400",      // duración en pixels de scroll
  pin: true,
  scrub: 0.4,
  anticipatePin: 1    // mejora UX al entrar
});
```

| Capacidad | API | Cuándo |
|---|---|---|
| Reveal en viewport | `toggleActions` o `onEnter+once` | Entrada de bloque al hacer scroll |
| Parallax | `scrub: true` + `yPercent` | Hero, capa de fondo |
| Pinned section | `pin: true` + `end: "+=Npx"` | Capítulos, story sections |
| Scrub progress | `scrub: 0.x` + `onUpdate(self => ...)` | Charts animados, scrub readouts |
| Snap to sections | `snap: { snapTo: "labels" }` | Menos común; rompe la lectura libre |

### 6. Lenis — smooth scroll (no es GSAP, pero se integra)

```js
import Lenis from "lenis";
const lenis = new Lenis({ duration: 1.1, smoothWheel: true });
lenis.on("scroll", ScrollTrigger.update);
gsap.ticker.add((time) => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);
```

Beneficio: scroll suave de premium feel. Coste: añade una capa de control que puede romper accesibilidad si se mal-configura. **Desactivar siempre con `prefers-reduced-motion: reduce`**.

### 7. Plugins relevantes (gratuitos)

| Plugin | Para qué |
|---|---|
| `ScrollTrigger` | Vinculación con scroll. Imprescindible. |
| `Observer` | Detección unificada de scroll/wheel/touch. Para gestos. |
| `Flip` | Animaciones FLIP — el elemento "vuela" entre dos estados de layout |
| `Draggable` | Arrastrar elementos con física |

Plugins de pago (Club GSAP) — `SplitText`, `MorphSVG`, `DrawSVG`, `MotionPath`, `Inertia`, `ScrollSmoother`. Sus efectos pueden replicarse manualmente en muchos casos (ver `03-patrones/character-cascade.md` para SplitText manual).

---

## checklist

- [ ] ¿Estoy usando timeline cuando hay 2+ tweens encadenados?
- [ ] ¿He elegido el easing por sensación, no por costumbre?
- [ ] ¿La salida es 75 % de la entrada (asimetría)?
- [ ] ¿`scrub` usa un número (0.3-0.6) en lugar de `true` para suavidad?
- [ ] ¿`pin: true` está justificado por la narración?
- [ ] ¿El `start`/`end` de ScrollTrigger está en porcentaje de viewport (`"top 80%"`)?
- [ ] ¿Lenis se desactiva con `prefers-reduced-motion`?
