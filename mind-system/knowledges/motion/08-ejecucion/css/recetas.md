# Recetas CSS de movimiento

## meta

| Campo | Valor |
|-------|-------|
| **Dominio** | motion — ejecución · recetas CSS |
| **Fuente** | Síntesis propia sobre MDN y web.dev |
| **Objetivo** | Resolver los casos frecuentes con CSS y estrategia no-motion-first |
| **Agent tags** | `#motion` `#css` `#recipes` |

---

## concepts

Todas usan tokens (`motion/06-sistema/mapeo-por-plataforma.md`) y siguen la estrategia no-motion-first.

### Los bloques de código de este módulo

Son **web genérica**: la capa de prototipo que produce CREATIVE (exenta de R01–R08) o cualquier proyecto que no sea el propio SYX. Nombres como `--duration-moderate-02` o `--easing-enter-productive` son la escala de referencia de `motion/06-sistema/escala.md`, no tokens de `tokens.json`. Dentro de `scss/` la mecánica es la misma, pero se escribe en SYX: `@include transition()` en lugar de `transition:` en crudo (R03), `@include absolute()` y compañía en lugar de `position:` (R04), `var(--semantic-duration-*)` y `var(--semantic-easing-*)` en lugar de valores sueltos, y `@include breakpoint()` con `min-width`. La ruta a producción es siempre CREATIVE → TOKEN → UI. Ver *El filtro SYX* en `index.md`.

---

## rules

### En SYX

Estas recetas son prototipo. Dentro de `scss/`, cada una se reescribe con `@include transition()`, tokens `--semantic-*` o de componente, y sin literales de tiempo ni de distancia (ver «En SYX» en `motion/08-ejecucion/css/css.md`). Una ya tiene equivalente en el repositorio: el **press** es el `:active` de `scss/atoms/_btn.scss`. El **stagger** no tiene token: mientras lo use un solo componente, su `each` y su tope son tokens de ese componente.

### Press (feedback)

```css
/* capa: prototipo fuera de scss/ — CREATIVE, exento de R01–R08. En un componente se escribe en SYX: ver «En SYX» en motion/08-ejecucion/css/css.md */
.btn { transition: background-color var(--duration-fast-02) linear; }
@media (prefers-reduced-motion: no-preference) {
  .btn { transition: background-color var(--duration-fast-02) linear, scale var(--duration-fast-01) var(--easing-standard-productive); }
  .btn:active { scale: 0.97; }
}
```

### Menú o popover (fade + escala desde el origen)

```css
/* capa: prototipo fuera de scss/ — CREATIVE, exento de R01–R08. En un componente se escribe en SYX: ver «En SYX» en motion/08-ejecucion/css/css.md */
[popover].menu {
  transform-origin: top left;           /* el punto del que brota: relación */
  opacity: 1; scale: 1;
  transition: opacity var(--duration-moderate-01) linear, scale var(--duration-moderate-01) var(--easing-enter-productive),
              display var(--duration-moderate-01) allow-discrete, overlay var(--duration-moderate-01) allow-discrete;
  @starting-style { opacity: 0; scale: 0.9; }
}
[popover].menu:not(:popover-open) { opacity: 0; scale: 1; transition-duration: var(--duration-fast-02); }
@media (prefers-reduced-motion: reduce) { [popover].menu { @starting-style { scale: 1; } } }
```

### Acordeón (height auto con fallback)

```css
/* capa: prototipo fuera de scss/ — CREATIVE, exento de R01–R08. En un componente se escribe en SYX: ver «En SYX» en motion/08-ejecucion/css/css.md */
.acc-panel { display: grid; grid-template-rows: 0fr; transition: grid-template-rows var(--duration-moderate-02) var(--easing-standard-productive); }
.acc[open] .acc-panel { grid-template-rows: 1fr; }
.acc-panel > div { overflow: hidden; }
```

### Lista con stagger y tope

```css
/* capa: prototipo fuera de scss/ — CREATIVE, exento de R01–R08. En un componente se escribe en SYX: ver «En SYX» en motion/08-ejecucion/css/css.md */
.list > li { opacity: 0; translate: 0 8px; animation: in var(--duration-moderate-02) var(--easing-enter-productive) forwards;
  animation-delay: min(calc(var(--i) * var(--stagger, 40ms)), 300ms); }
@keyframes in { to { opacity: 1; translate: 0 0; } }
@media (prefers-reduced-motion: reduce) { .list > li { translate: 0 0; animation-duration: 150ms; animation-delay: 0ms; } }
```

`--i` se asigna en el HTML (`style="--i:3"`) o con `sibling-index()` cuando haya soporte. Verifica el soporte antes de depender de él.

### Tabs con shared axis X (View Transitions)

```css
/* capa: prototipo fuera de scss/ — CREATIVE, exento de R01–R08. En un componente se escribe en SYX: ver «En SYX» en motion/08-ejecucion/css/css.md */
.tabpanel { view-transition-name: tabpanel; }
html:active-view-transition-type(forward) { &::view-transition-old(tabpanel) { animation: 110ms var(--easing-exit-productive) both out-left; }
                                            &::view-transition-new(tabpanel) { animation: 240ms var(--easing-enter-productive) 60ms both in-right; } }
@keyframes out-left { to { opacity: 0; translate: -30px 0; } }
@keyframes in-right { from { opacity: 0; translate: 30px 0; } }
```

En navegadores sin `types` (Firefox), usa una clase en `<html>` durante la transición.

### Skeleton shimmer (lento y pausable)

```css
/* capa: prototipo fuera de scss/ — CREATIVE, exento de R01–R08. En un componente se escribe en SYX: ver «En SYX» en motion/08-ejecucion/css/css.md */
.skeleton { background: linear-gradient(90deg, var(--s1) 0 40%, var(--s2) 50%, var(--s1) 60% 100%) 0 0 / 300% 100%;
  animation: shimmer var(--duration-long-02) linear infinite; }
@keyframes shimmer { to { background-position: -150% 0; } }
@media (prefers-reduced-motion: reduce) { .skeleton { animation: none; } }
```

### Contador (value change) con `@property`

```css
/* capa: prototipo fuera de scss/ — CREATIVE, exento de R01–R08. En un componente se escribe en SYX: ver «En SYX» en motion/08-ejecucion/css/css.md */
@property --n { syntax: "<integer>"; inherits: false; initial-value: 0; }
.count { --n: 0; counter-reset: n var(--n); transition: --n var(--duration-long-01) var(--easing-enter-expressive); font-variant-numeric: tabular-nums; }
.count::after { content: counter(n); }
.count.is-visible { --n: 1280; }
```

Para accesibilidad, pon el valor final en el texto real o en `aria-label`. El contador animado es decorativo.

### Texto por palabras (máscara por línea simplificada)

```css
/* capa: prototipo fuera de scss/ — CREATIVE, exento de R01–R08. En un componente se escribe en SYX: ver «En SYX» en motion/08-ejecucion/css/css.md */
.words span { display: inline-block; opacity: 0; translate: 0 0.6em; animation: w 500ms var(--easing-enter-expressive) forwards;
  animation-delay: min(calc(var(--i) * 60ms), 600ms); }
@keyframes w { to { opacity: 1; translate: 0 0; } }
```

HTML: `<h1 aria-label="Texto completo"><span aria-hidden="true" style="--i:0">Texto</span> …</h1>`.

### Marquee pausable (WCAG 2.2.2)

```css
/* capa: prototipo fuera de scss/ — CREATIVE, exento de R01–R08. En un componente se escribe en SYX: ver «En SYX» en motion/08-ejecucion/css/css.md */
.marquee-track { animation: scroll 30s linear infinite; }
.marquee:hover .marquee-track, .marquee:focus-within .marquee-track, .marquee[data-paused] .marquee-track { animation-play-state: paused; }
@keyframes scroll { to { translate: -50% 0; } }
@media (prefers-reduced-motion: reduce) { .marquee-track { animation: none; } }
```

Añade un botón visible de pausa (el hover no basta en táctil).

---

## checklist

- [ ] La receta tiene variante reducida
- [ ] Solo se animan propiedades del compositor en lo frecuente
- [ ] Stagger con tope
- [ ] En `scss/`, reescrita con mixins y tokens SYX
