# Ejecución · CSS

## meta

| Campo | Valor |
|-------|-------|
| **Dominio** | motion — ejecución · motion en CSS moderno |
| **Fuente** | MDN; web.dev; CSS Working Group (View Transitions, Scroll-driven Animations, `linear()`); datos de soporte a septiembre de 2026 |
| **Objetivo** | Traducir una Motion Spec a CSS y saber cuándo CSS no basta |
| **Agent tags** | `#motion` `#css` `#view-transitions` `#scroll-driven` `#starting-style` |

---

## concepts

Traduce la Motion Spec a CSS. **No reinterpreta valores**: usa los tokens de `motion/06-sistema/` como custom properties. Si CSS no puede reproducir algo (springs con herencia de velocidad, interrupción física), lo anota en `implementation_notes` y propone `motion/08-ejecucion/js/`.

### 1. ¿CSS o JS?

**CSS es suficiente para:**

- Transiciones de estado (hover, focus, open/closed).
- Entradas y salidas con `@starting-style`.
- Loops.
- Scroll-driven (con fallback).
- View Transitions.
- Springs *no interrumpibles* con `linear()`.

**Pasa a JS (`motion/08-ejecucion/js/`) si hay:**

- Gestos o drag con herencia de velocidad.
- Springs interrumpibles.
- Timelines complejos con muchas dependencias.
- SplitText robusto.
- Secuencias condicionadas por lógica.
- Valores calculados en runtime (FLIP a medida).

### Los bloques de código de este módulo

Son **web genérica**: la capa de prototipo que produce CREATIVE (exenta de R01–R08) o cualquier proyecto que no sea el propio SYX. Nombres como `--duration-moderate-02` o `--easing-enter-productive` son la escala de referencia de `motion/06-sistema/escala.md`, no tokens de `tokens.json`. Dentro de `scss/` la mecánica es la misma, pero se escribe en SYX: `@include transition()` en lugar de `transition:` en crudo (R03), `@include absolute()` y compañía en lugar de `position:` (R04), `var(--semantic-duration-*)` y `var(--semantic-easing-*)` en lugar de valores sueltos, y `@include breakpoint()` con `min-width`. La ruta a producción es siempre CREATIVE → TOKEN → UI. Ver *El filtro SYX* en `index.md`.

### Módulos relacionados

- `motion/08-ejecucion/css/recetas.md` — press, menú, acordeón, lista, tabs, skeleton, contador, texto, marquee.
- `motion/08-ejecucion/css/spring-to-linear.js` — generador de `linear()` desde springs o easings.
- `ui/motion-principles.md` — el suelo físico que cualquier CSS de SYX respeta.

---

## rules

### 2. Fundamentos

```css
/* capa: prototipo fuera de scss/ — CREATIVE, exento de R01–R08. En un componente se escribe en SYX: ver «En SYX» en motion/08-ejecucion/css/css.md */
.card {
  /* estrategia no-motion-first: por defecto solo effects */
  transition: opacity var(--duration-moderate-01) linear, background-color var(--duration-fast-02) linear;
}
@media (prefers-reduced-motion: no-preference) {
  .card {
    transition:
      opacity var(--duration-moderate-01) linear,
      translate var(--duration-moderate-02) var(--easing-enter-productive),
      scale var(--duration-moderate-02) var(--easing-enter-productive);
  }
}
```

- **Individual transforms** (`translate`, `rotate`, `scale`), Baseline desde 2022: se aplican en ese orden y antes de `transform`. Permiten animar cada una con su propio timing, que es justo lo que pide el follow-through por propiedad.
- **Transition por propiedad**: nunca `transition: all`. Cada propiedad lleva su token (spatial o effects).
- `transition-delay` para offsets. Stagger con custom properties: `transition-delay: calc(var(--i) * var(--stagger-default))`, con `--i` puesto en cada ítem (y un tope: `min(calc(var(--i) * 40ms), 300ms)`).
- `steps(n, jump-none)` para ritmos en "2s", step o sprites.

### En SYX — la misma mecánica, escrita con el sistema

Todo lo de este módulo vale dentro de `scss/`, con tres traducciones: `transition:` pasa a `@include transition()` (R03), los valores salen de `--semantic-duration-*` / `--semantic-easing-*` (o de un token de componente que los referencia) y el bloque va dentro del `@mixin` y el `@layer` del componente. La guarda de reduced motion la pone el mixin: no se repite.

Entrada y salida de una superficie con `@starting-style` (la receta del toast de §3):

```scss
// capa: scss/molecules/_toast.scss — traducción SYX, ilustrativa (el componente no existe)
.mol-toast {
  opacity: 1;
  translate: 0 0;
  @include transition(
    opacity var(--semantic-duration-fast) var(--semantic-easing-linear),
    translate var(--semantic-duration-base) var(--semantic-easing-out),
    display var(--semantic-duration-base) allow-discrete,
    overlay var(--semantic-duration-base) allow-discrete
  );

  @starting-style {
    opacity: 0;
    translate: 0 var(--semantic-space-stack-sm);
  }
}
```

Lo que se pierde respecto al prototipo, y conviene saberlo: bajo `prefers-reduced-motion: reduce` el mixin elimina **toda** la transición, también la opacidad (estrategia `remove`, ver `motion/06-sistema/escala.md` §6); y la salida usa la misma curva que la entrada porque SYX aún no tiene curva de salida. Un caso real, ya en el repositorio, es el press de `scss/atoms/_btn.scss`: `transform` con `--component-button-transition-duration-active` y un `translate` por tokens de componente en `:active`.

### 3. Entradas y salidas sin JS

Baseline 2024:

```css
/* capa: prototipo fuera de scss/ — CREATIVE, exento de R01–R08. En un componente se escribe en SYX: ver «En SYX» en motion/08-ejecucion/css/css.md */
.toast {
  opacity: 1; translate: 0 0;
  transition: opacity 150ms linear, translate 240ms var(--easing-enter-productive),
              display 240ms allow-discrete, overlay 240ms allow-discrete;
  @starting-style { opacity: 0; translate: 0 12px; }
}
.toast[hidden] { display: none; opacity: 0; translate: 0 8px;
  transition-timing-function: linear, var(--easing-exit-productive); transition-duration: 110ms, 150ms; }
```

`dialog` y `[popover]` se animan igual, añadiendo `overlay` con `allow-discrete`.

### 4. height: auto

- Chromium 129+: `:root { interpolate-size: allow-keywords; }` y a partir de ahí `height: 0 → auto` se anima. Alternativa por propiedad: `height: calc-size(auto, size)`.
- **Fallback universal:** grid `grid-template-rows: 0fr → 1fr` con un hijo `overflow: hidden`. En `<details>`, el pseudo-elemento `::details-content`.

### 5. Springs, bounce y elastic con `linear()`

Baseline desde diciembre de 2023. Genera las paradas muestreando la función (`motion/08-ejecucion/css/spring-to-linear.js`):

```css
/* capa: prototipo fuera de scss/ — CREATIVE, exento de R01–R08. En un componente se escribe en SYX: ver «En SYX» en motion/08-ejecucion/css/css.md */
:root {
  --spring-spatial-default: linear(0, 0.0417, 0.1471 …, 1); /* generado */
  --spring-spatial-default-duration: 348ms;                  /* = settleMs del token */
}
@supports not (transition-timing-function: linear(0, 1)) {
  :root { --spring-spatial-default: var(--easing-enter-expressive); }
}
.sheet { transition: translate var(--spring-spatial-default-duration) var(--spring-spatial-default); }
```

**Limitaciones que hay que anotar en la spec:** la duración es fija (el tiempo de asentamiento) y no hereda velocidad. Si se interrumpe, CSS reinicia la transición desde el valor actual, pero con la curva completa.

### 6. `@property` (animar custom properties)

```css
/* capa: prototipo fuera de scss/ — CREATIVE, exento de R01–R08. En un componente se escribe en SYX: ver «En SYX» en motion/08-ejecucion/css/css.md */
@property --angle { syntax: "<angle>"; inherits: false; initial-value: 0deg; }
.ring { background: conic-gradient(var(--c) var(--angle), transparent 0); transition: --angle 1000ms var(--easing-enter-expressive); }
```

Sirve para gradientes, contadores con `counter()` y `@property <integer>`, máscaras y progreso.

### 7. Scroll-driven animations

```css
/* capa: prototipo fuera de scss/ — CREATIVE, exento de R01–R08. En un componente se escribe en SYX: ver «En SYX» en motion/08-ejecucion/css/css.md */
@supports (animation-timeline: view()) {
  @media (prefers-reduced-motion: no-preference) {
    .reveal {
      animation: reveal linear both;          /* el shorthand va ANTES que animation-timeline */
      animation-timeline: view();
      animation-range: entry 0% cover 30%;
    }
  }
}
@keyframes reveal { from { opacity: 0; translate: 0 24px; } }
.progress { animation: grow linear; animation-timeline: scroll(root block); transform-origin: left; }
@keyframes grow { from { scale: 0 1; } }
```

- Soporte: Chrome/Edge 115+ y **Safari 26+**. **Firefox, detrás de un flag (sin fecha confirmada)**: úsalo siempre con `@supports` y con el contenido visible por defecto.
- Rangos: `cover | contain | entry | exit | entry-crossing | exit-crossing`. Timelines con nombre: `view-timeline: --v;` y `timeline-scope`.
- No uses duraciones en segundos (se omite o `auto`). El easing es respecto al scroll: casi siempre `linear`, y el carácter se pone en los keyframes.

### 8. View Transitions

```js
if (!document.startViewTransition || matchMedia('(prefers-reduced-motion: reduce)').matches) update();
else document.startViewTransition({ update, types: ['forward'] });
```

```css
/* capa: prototipo fuera de scss/ — CREATIVE, exento de R01–R08. En un componente se escribe en SYX: ver «En SYX» en motion/08-ejecucion/css/css.md */
.card-img { view-transition-name: hero; }           /* único por página */
.list-item { view-transition-class: item; }          /* estilo compartido */
::view-transition-group(hero) { animation-duration: var(--duration-slow-01); animation-timing-function: var(--easing-standard-expressive); }
::view-transition-old(root) { animation: 110ms var(--easing-exit-productive) both fade-out; }
::view-transition-new(root) { animation: 240ms var(--easing-enter-productive) 60ms both fade-in; }
@view-transition { navigation: auto; }                /* MPA, en ambas páginas */
```

- Same-document: Baseline desde octubre de 2025 (Chrome 111, Safari 18, Firefox 144). Cross-document: Chrome 126+ y Safari 18.2+; **Firefox aún no**.
- `types` y `:active-view-transition-type()`: aún no en Firefox, así que hay que tener fallback.
- Container transform = `view-transition-name` compartido entre la tarjeta y el detalle.

### 9. Rendimiento

- **Compositor:** `transform` (y las individual transforms), `opacity` y, en general, `filter`. Anima solo esto en lo que sea frecuente.
- **Evita** animar `width`, `height`, `top`, `left`, `margin` o `box-shadow` grandes. Para las sombras, anima la `opacity` de un pseudo-elemento con la sombra final.
- `will-change` justo antes de la animación y retirado después. Nunca en muchos elementos ni de forma permanente (consume memoria, crea stacking contexts y puede emborronar el texto).
- Presupuesto en el peor escenario: 8,3 ms/frame (120 Hz). `blur()` grande y `backdrop-filter` son caros: pruébalos en un dispositivo modesto.
- `content-visibility` y `contain` ayudan en listas largas animadas.

---

## checklist

- [ ] Valores vía custom properties de tokens (ningún número suelto sin excepción)
- [ ] Transition por propiedad, con effects en linear
- [ ] `prefers-reduced-motion` con la variante de la spec (no-motion-first)
- [ ] `@supports` en features no Baseline (scroll-driven, interpolate-size, cross-document VT)
- [ ] Solo propiedades del compositor en animaciones frecuentes
- [ ] `implementation_notes` si se aproximó un spring
