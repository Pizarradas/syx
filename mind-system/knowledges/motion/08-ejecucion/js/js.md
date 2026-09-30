# Ejecución · JavaScript

## meta

| Campo | Valor |
|-------|-------|
| **Dominio** | motion — ejecución · WAAPI, GSAP, Motion y springs propios |
| **Fuente** | MDN (Web Animations API); GSAP 3.13+ docs; motion.dev docs |
| **Objetivo** | Traducir una Motion Spec a JS cuando CSS no basta: gestos, springs interrumpibles, coreografías y scroll avanzado |
| **Agent tags** | `#motion` `#javascript` `#waapi` `#gsap` `#motion-dev` `#flip` |

---

## concepts

Traduce la Motion Spec a JS. Los valores llegan como tokens (`motion/06-sistema/`); se leen desde las custom properties de CSS o desde un módulo de tokens, **nunca se duplican a mano**.

### 1. Elegir herramienta

| Necesidad | Herramienta |
|---|---|
| Animación puntual, sin dependencias, ligada al DOM | **WAAPI** (`element.animate`) |
| Timelines coreografiados, scroll complejo, SplitText, SVG (morph, draw), control fino | **GSAP** |
| React con layout animations, shared elements, exit animations, springs perceptuales | **Motion** (`motion/react`) |
| Gestos con física propia, canvas o WebGL, valores arbitrarios | **Spring propio** (`motion/08-ejecucion/js/springs-y-gestos.md`) |

Regla: **una sola librería de animación por proyecto** salvo motivo claro. WAAPI siempre está disponible como base.

### Relación con la capa GSAP

`motion/08-ejecucion/gsap/` es el vocabulario operativo de GSAP del proyecto: modelo mental, capacidades, patrones con nombre y glosario para prompts. Este módulo es la mecánica de implementación y la traducción desde la spec; los dos se leen juntos cuando hay GSAP. En SYX, el JS de motion vive en prototipos de CREATIVE o en `js/`; nunca sustituye a una transición que `scss/` puede resolver con `@include transition()`.

### Módulos relacionados

- `motion/08-ejecucion/js/springs-y-gestos.md` — spring con herencia de velocidad, drag-release, snap y quickTo.
- `motion/08-ejecucion/gsap/index.md` — la capa de librería GSAP.

---

## rules

### 2. Web Animations API

```js
const a = el.animate(
  [{ opacity: 0, translate: '0 16px' }, { opacity: 1, translate: '0 0' }],
  { duration: tokens.duration.moderate02, easing: 'cubic-bezier(0, 0, 0.38, 0.9)', fill: 'both', delay: i * 40 }
);
await a.finished;
a.commitStyles(); a.cancel();          // persiste el estado final sin mantener fill
```

- `composite: 'add' | 'accumulate'` para sumar animaciones (por ejemplo, un shake sobre la posición actual).
- Control: `a.playbackRate`, `a.currentTime`, `a.reverse()`, `a.updatePlaybackRate()`, `el.getAnimations()`.
- **Interrupción:** lee el valor actual (`getComputedStyle`) antes de `cancel()` y anima desde ahí.
- Scroll desde JS: `new ViewTimeline({ subject: el })` o `new ScrollTimeline({ source, axis })` como opción `timeline:`. El soporte es el mismo que el de CSS scroll-driven.
- `easing` acepta `linear(...)`, así que los springs se generan con `motion/08-ejecucion/css/spring-to-linear.js`.

### 3. GSAP (3.13+)

Desde la versión 3.13 (abril de 2025) es **100 % gratuito**, con todos los plugins (SplitText, MorphSVG, DrawSVG, ScrollSmoother…) en el paquete `gsap`.

```js
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { CustomEase } from "gsap/CustomEase";
gsap.registerPlugin(ScrollTrigger, SplitText, CustomEase);

// Tokens → eases con nombre
CustomEase.create("enterProductive", "0,0,0.38,0.9");
CustomEase.create("standardExpressive", "0.4,0.14,0.3,1");
gsap.defaults({ duration: 0.24, ease: "enterProductive" });
```

**Timeline y position parameter** (traducción directa de `start` en la spec):

| Spec | GSAP |
|---|---|
| `start: 0` | `0` o `"<"` si va con el anterior |
| `with:X` | `"<"` |
| `after:X` | `">"` (por defecto) |
| `after:X@60%` | `"<" + dur*0.6`, por ejemplo `"<0.24"` |
| `before:X-100` | `"-=0.1"` |
| etiqueta | `tl.addLabel("reveal")` → `"reveal+=0.1"` |

```js
const tl = gsap.timeline({ defaults: { ease: "enterProductive" } });
tl.to(card, { scale: 1, duration: 0.4, ease: "standardExpressive" })
  .from(".detail > *", { autoAlpha: 0, y: 16, duration: 0.24,
      stagger: { each: 0.04, from: "start" } }, "<0.24");
```

- **Stagger:** `{ each | amount, from: "start"|"end"|"center"|"edges"|"random"|index, grid: "auto", axis, ease }`. Para respetar el tope: `amount: Math.min(0.04 * (n - 1), 0.3)`.
- **Reduced motion:** `gsap.matchMedia()` (ver `motion/07-accesibilidad/`). Las animaciones creadas dentro se revierten solas al cambiar la condición.
- **ScrollTrigger:** `scrollTrigger: { trigger, start: "top 80%", end: "bottom top", scrub: true | 0.5, pin, once: true }`. `scrub` numérico = suavizado en segundos. Los reveals disparados llevan `once: true`.
- **SplitText:** ver `motion/05-tipografia/`. Crea las animaciones **dentro de `onSplit` y devuélvelas**, con `autoSplit: true`, `mask: "lines"` y `aria: "auto"`.
- **Springs:** GSAP no tiene spring. Usa `CustomEase.create("spring", svgPath)` con la curva muestreada (la duración es la de asentamiento) o `elastic.out(1, 0.4)`, y anótalo en la spec. Para springs interrumpibles, usa `gsap.quickTo` con duración corta (suavizado) o un spring propio.
- **Rendimiento:** anima `x`, `y`, `scale`, `rotation`, `autoAlpha`. `force3D` está en auto. Usa `gsap.context()` o `useGSAP()` (React) para limpiar.

### 4. Motion (motion.dev, antes Framer Motion)

```bash
npm i motion
```

```jsx
import { motion, AnimatePresence, MotionConfig, useReducedMotion, stagger } from "motion/react";

<MotionConfig reducedMotion="user" transition={{ type: "spring", visualDuration: 0.4, bounce: 0.1 }}>
  <AnimatePresence mode="popLayout">
    {open && (
      <motion.div key="panel" layoutId="card-42"          // container transform
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.11 } }} />
    )}
  </AnimatePresence>
</MotionConfig>
```

- **Springs:** perceptual `{ type: "spring", visualDuration, bounce }` (recomendado, mapea 1:1 con los tokens) o físico `{ stiffness, damping, mass }`. Si se da stiffness, damping o mass, **anulan** duration y bounce. Defaults: damping 10, mass 1, bounce 0,25.
- **Tween:** `{ duration: 0.24, ease: [0, 0, 0.38, 0.9] }`.
- **Por propiedad:** `transition={{ default: springSpatial, opacity: { duration: 0.15, ease: "linear" } }}`, que respeta la regla spatial/effects.
- **Layout:** la prop `layout` (o `"position"` / `"size"`), `layoutId` para shared elements y `<LayoutGroup>` para hermanos.
- **Gestos:** `whileHover`, `whileTap`, `drag` con `dragTransition` (inercia) y `dragElastic`. Heredan velocidad.
- **Vanilla:** `import { animate, scroll, inView, stagger } from "motion"` y `animate(el, { x: 100 }, { type: "spring", bounce: 0.2, visualDuration: 0.3 })`.
- **Reduced:** `MotionConfig reducedMotion="user"` desactiva transform y layout y mantiene opacity y color. Para variantes a medida, `useReducedMotion()`.

### 5. Interrupción y FLIP

- **FLIP** (First, Last, Invert, Play): mide el estado inicial, aplica el final, invierte con transform y anima a identity. Es la base de container transform y de reordenar listas sin animar layout. Motion (`layout`) y GSAP (plugin Flip) lo resuelven.
- **Redirigir:** con springs, cambia el target y conserva la velocidad. Con tweens, parte del valor actual y usa una duración proporcional a lo que queda (`motion/02-proposito/coreografia.md`).

### 6. Rendimiento y peor escenario

- Anima transform y opacity; lee el layout **antes** de escribir (evita el layout thrashing); agrupa las lecturas.
- Un solo bucle de `requestAnimationFrame` para springs propios; `dt` real y acotado (`Math.min(dt, 1/30)`) para que un frame lento no dispare el integrador.
- Prueba con el throttling de CPU ×4–×6 de DevTools y a 120 Hz.
- Carga diferida: importa GSAP o Motion solo donde haga falta; `LazyMotion` + `domAnimation` en Motion.

---

## checklist

- [ ] Tokens leídos de su fuente única
- [ ] Coreografía traducida con el position parameter o delays relativos (no absolutos sueltos)
- [ ] Reduced motion (`matchMedia`, `gsap.matchMedia`, `MotionConfig`)
- [ ] Interrupción probada (doble clic, atrás)
- [ ] Limpieza (context, revert, cleanup de listeners)
- [ ] `implementation_notes` con las aproximaciones
