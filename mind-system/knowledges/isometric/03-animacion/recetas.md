# Isométrico · Recetas GSAP y CSS

## meta

| Campo | Valor |
|-------|-------|
| **Dominio** | isometric — movimiento · implementación |
| **Fuente** | GSAP (SVG, MotionPathPlugin, ScrollTrigger tips & mistakes, a11y), CSS-Tricks (SVG line animation) |
| **Objetivo** | Recetas de movimiento propias de la proyección isométrica, en GSAP y en CSS |
| **Agent tags** | `#isometric` `#gsap` `#css` `#svg` `#recipes` |

Se abre cuando `animacion.md` elige GSAP o CSS. Lo genérico de la librería —modelo mental, ScrollTrigger, glosario— está en `motion/08-ejecucion/gsap/`; aquí solo lo que cambia por ser isométrico. Los patrones con nombre que más se cruzan: `motion/08-ejecucion/gsap/03-patrones/draw-svg-path.md` (flujos de datos) y `pinned-scrub.md` (montar una escena con el scroll).

---

## concepts

Todas las recetas comparten dos ideas: el desplazamiento se expresa por **ejes del mundo** (no en px de pantalla), y el orden del DOM ya es el orden de profundidad, así que escalonar por índice es escalonar de atrás hacia delante.

---

## rules

### 1. Base: movimiento reducido con matchMedia

```js
const mm = gsap.matchMedia();
mm.add("(prefers-reduced-motion: no-preference)", () => { buildFull(); });
mm.add("(prefers-reduced-motion: reduce)", () => {
  gsap.from(".iso-obj", { opacity: 0, duration: 0.4, stagger: 0.05 });
});
```

### 2. Vectores de eje (isométrica real)

```js
const U = 40, C = 0.8660254;
const iso = { x: [C * U, .5 * U], y: [-C * U, .5 * U], z: [0, -U] };
const along = (axis, n) => ({ x: `+=${iso[axis][0] * n}`, y: `+=${iso[axis][1] * n}` });
gsap.to("#carro", { ...along("x", 3), duration: 1.2, ease: "power2.inOut" });
```

Valores relativos (`"+=…"`): la animación sobrevive a un cambio de geometría.

### 3. Construcción por capas (caída en z)

```js
gsap.from(".iso-obj", { y: -60, opacity: 0, duration: .6, ease: "back.out(1.4)", stagger: .12 }); // ya ordenados por profundidad
gsap.from(".iso-shadow", { opacity: 0, duration: .4, stagger: .12, delay: .2 });
```

### 4. Crecimiento de un bloque (altura desde datos)

```js
import { prism } from "./iso.mjs";
const el = document.querySelector("#barra-1");
const s = { h: 0 };
gsap.to(s, { h: 3, duration: 1, ease: "power3.out",
  onUpdate: () => { el.outerHTML = prism({ id: "barra-1", x: 0, y: 0, z: 0, w: 1, d: 1, h: s.h, color: "#5b8def" }); }
});
// En producción, actualiza solo el atributo points de cada cara en vez de reemplazar outerHTML.
```

Nunca `scaleY`: deforma las aristas inclinadas.

### 5. Trazado de líneas (conexiones, flujos de datos)

```html
<path class="flow" pathLength="1" d="…" fill="none" style="stroke:var(--umbra-flow)" stroke-width="3"/>
```
```js
gsap.fromTo(".flow", { strokeDasharray: 1, strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1.2, ease: "none" });
```

Con `pathLength="1"` no hace falta `getTotalLength()`. La ruta se dibuja sobre aristas o planos isométricos.

### 6. Recorrido por un camino y scroll

```js
gsap.registerPlugin(MotionPathPlugin, ScrollTrigger);
gsap.to("#paquete", { duration: 3, ease: "none", repeat: -1,
  motionPath: { path: "#ruta", align: "#ruta", alignOrigin: [0.5, 0.5], autoRotate: false } });

const tl = gsap.timeline({ scrollTrigger: { trigger: "#hero-iso", start: "top 70%", end: "bottom 30%", scrub: true } });
tl.from(".capa", { y: -40, opacity: 0, stagger: .1 });
```

- `autoRotate: false`: un objeto isométrico conserva sus caras. `align` se calcula una vez; si la página cambia de tamaño, se recrea el tween.
- ScrollTrigger en la timeline padre, no en sus tweens; la animación funciona sin scroll antes de conectarla; sin `scroll-behavior: smooth` en `html`; `ScrollTrigger.refresh()` si cargan imágenes sin tamaño.
- Transformaciones iniciales con `gsap.set`, no en CSS. `transformOrigin` es relativo al elemento; `svgOrigin` usa coordenadas globales del SVG y solo admite px. Si Chrome pinta mal un elemento, `rotation: 0.01`.

### 7. Solo CSS

```css
/* capa: prototipo fuera de scss/ — CREATIVE o @layer syx.app; en scss/ el movimiento va con mixins y tokens */
@media (prefers-reduced-motion: no-preference) {
  .iso-float { animation: iso-flotar 4s ease-in-out infinite; }
  .iso-float + .iso-shadow { animation: iso-sombra 4s ease-in-out infinite; }
}
@keyframes iso-flotar { 50% { transform: translateY(-6px); } }
@keyframes iso-sombra { 50% { transform: scale(.9); opacity: .7; } }
```

La sombra del suelo sí puede escalar: es una figura del plano, no un volumen. Solo `transform` y `opacity`; mover con `top` o `left` es más lento.

---

## checklist

- [ ] `matchMedia` con rama reducida antes que la completa
- [ ] Desplazamientos por vectores de eje y en valores relativos
- [ ] Altura por datos (`onUpdate`), nunca `scaleY`
- [ ] `autoRotate: false` en recorridos
- [ ] ScrollTrigger en la timeline padre, probado antes sin scroll
- [ ] CSS solo `transform`/`opacity`, dentro de `prefers-reduced-motion: no-preference`
