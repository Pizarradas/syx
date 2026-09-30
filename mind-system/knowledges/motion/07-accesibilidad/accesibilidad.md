# Accesibilidad del movimiento

## meta

| Campo | Valor |
|-------|-------|
| **Dominio** | motion — accesibilidad · reduced motion, destellos, pausa y riesgo vestibular |
| **Fuente** | MDN — *prefers-reduced-motion*; Yale Usability & Accessibility — *Animated Content and Timing*; WCAG 2.2 (2.2.1, 2.2.2, 2.3.1, 2.3.3); Apple HIG; Microsoft Fluent 2 |
| **Objetivo** | Garantizar que ningún movimiento marea, provoca crisis o impide leer, y definir su variante reducida |
| **Agent tags** | `#motion` `#accessibility` `#reduced-motion` `#wcag` `#vestibular` |

---

## concepts

**Este módulo tiene la precedencia más alta del sistema.** Ninguna decisión creativa ni de sistema puede saltársela. Solo se puede ajustar *cómo* se cumple, nunca *si* se cumple.

### 1. Los tres riesgos

| Riesgo | Quién | Qué lo dispara |
|---|---|---|
| **Vestibular** (mareo, vértigo, náusea) | Personas con trastornos vestibulares, migraña, conmoción | Desplazamientos grandes, zoom, escalas grandes, parallax, rotación, scroll secuestrado, movimiento en la periferia |
| **Fotosensible** (crisis epilépticas) | Personas con epilepsia fotosensible | Destellos > 3/s, sobre todo en rojo saturado; patrones de rayas que parpadean |
| **Cognitivo o atencional** | TDAH, dificultades de lectura, personas mayores | Movimiento continuo que distrae, textos que se mueven, tiempos insuficientes |

### En SYX

Dentro del dominio motion este módulo tiene la precedencia más alta; dentro del córtex sigue en el escalón 6, y no hace falta más: la constitución ya fija WCAG AA como suelo que ninguna decisión estética cede. Dos matices de implementación:

- **En los componentes de `scss/` la estrategia por defecto es `remove`, y ya está implementada.** `@include transition()` emite `transition: none` bajo `prefers-reduced-motion: reduce`, y `_motion.scss` lleva las cuatro `--semantic-duration-*` a `0.01ms`. Un componente no repite esa guarda (R03 la detecta). `@include reduced-motion { … }` queda para `animation` y para sustituir (`replace`) cuando la spec lo pida.
- **`replace` es la estrategia completa de este módulo** y es la que aplican los prototipos de CREATIVE y cualquier pieza fuera de `scss/` (Rive, Lottie, vídeo). La exención de contratos de CREATIVE es técnica: no cubre esto.

Los bloques de código de §4 son web genérica; en un componente SYX se escriben con los mixins.

---

## rules

### 2. Reglas duras

1. **Destellos: 3 o menos por segundo**, sin excepciones en ningún medio (WCAG 2.3.1). Con especial cuidado en rojo saturado y en áreas grandes (más de ~25 % de un campo visual de 10°, ≈ 341 × 256 px a 1024 × 768).
2. **Pausa**: todo contenido que se mueve, parpadea o se desplaza solo durante **más de 5 s** y se presenta junto a otro contenido necesita un control para **pausar, detener u ocultar** (WCAG 2.2.2). Afecta a carruseles, fondos animados, loops de Rive o Lottie y vídeos de fondo.
3. **Reduced motion obligatorio**: toda animación **spatial** no esencial tiene una variante reducida que se activa con la preferencia del sistema (WCAG 2.3.3, AAA, adoptado aquí como mínimo).
4. **Nunca solo movimiento**: la información que transmite el movimiento también se transmite por texto, color, forma, háptica o sonido (Apple HIG).
5. **Tiempo suficiente**: si algo desaparece solo (toasts, textos en vídeo), el tiempo se calcula en el peor escenario y, en UI, debe poder ajustarse o extenderse (WCAG 2.2.1).
6. **Sin scrolljacking** y sin autoscroll no controlable.

### 3. Estrategia: reducir o sustituir, no necesariamente eliminar

MDN lo resume así: reducir movimiento **no significa quitar toda animación**. Significa sustituir el movimiento que marea por equivalentes que no marean. Ejemplo: un pulso de escala de 1 s pasa a ser un fundido de opacidad de 4 s.

| Movimiento original | Variante reducida |
|---|---|
| Slide, translate grande | Crossfade (`motion.reduced.crossfade`) |
| Zoom, escala > 10 % | Crossfade; o escala ≤ 5 % + fade |
| Container transform | Crossfade entre estados, sin cambio de bounds |
| Shared axis | Solo el fade |
| Parallax | Desactivado (capas estáticas) |
| Rotación, flip 3D | Crossfade o cambio instantáneo |
| Rebote, spring expresivo | Spring ζ = 1 corto, o fade |
| Autoplay de loop o vídeo de fondo | Pausado, con el primer o mejor frame como póster; se reproduce solo si el usuario lo pide |
| Scroll-driven reveal | Contenido visible desde el inicio |
| Kinetic typography | Texto completo con fade corto |
| Spinner | Se mantiene (es esencial) o se simplifica; nunca se elimina el indicador |
| Barra de progreso | Se mantiene |
| Hover o color | Se mantiene (effects) |
| Shake de error | Cambio de color + icono + mensaje, sin shake |

**Qué es esencial:** el movimiento sin el cual la función o la información se pierden (un indicador de progreso, el seguimiento del dedo al arrastrar). Se mantiene, en su forma mínima.

Modos de la spec (`accessibility.reduced_motion`):

- `replace` (por defecto): sustituir por un equivalente no espacial.
- `reduce`: el mismo movimiento con menor amplitud y duración.
- `remove`: cambio instantáneo.
- `keep`: solo para lo esencial, justificado.

### 4. Detección por plataforma

```css
/* capa: prototipo fuera de scss/ — CREATIVE, exento de R01–R08. En un componente se escribe en SYX: ver «En SYX» en motion/08-ejecucion/css/css.md */
/* CSS: estrategia "no-motion-first" (recomendada) */
.card { transition: opacity var(--duration-moderate-01) linear; }
@media (prefers-reduced-motion: no-preference) {
  .card { transition: opacity 150ms linear, translate 240ms var(--easing-enter-productive); }
}
```

```js
// JS
const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
let reduce = mq.matches; mq.addEventListener('change', e => { reduce = e.matches; });
```

```js
// GSAP
gsap.matchMedia().add({ reduce: "(prefers-reduced-motion: reduce)", ok: "(prefers-reduced-motion: no-preference)" }, ctx => {
  const { reduce } = ctx.conditions;
  gsap.from(".hero", { y: reduce ? 0 : 40, autoAlpha: 0, duration: reduce ? 0.15 : 0.6 });
});
```

```jsx
// Motion (React)
<MotionConfig reducedMotion="user">…</MotionConfig>   // desactiva transform/layout y mantiene opacity/color
const reduce = useReducedMotion();
```

- **Rive:** propiedad `reducedMotion: boolean` en el View Model. El producto la enlaza a la media query, y la state machine la usa como condición para ir a estados o timelines reducidos. Además, se pausa el loop si dura más de 5 s sin control.
- **iOS:** `UIAccessibility.isReduceMotionEnabled` / `@Environment(\.accessibilityReduceMotion)`.
- **Android:** `Settings.Global.ANIMATOR_DURATION_SCALE` (0 = animaciones desactivadas) y `Settings.Global.TRANSITION_ANIMATION_SCALE`; en Compose, se respeta de forma automática en muchos casos.
- **Vídeo, social y Lottie:** no hay preferencia en runtime. Entrega versión alternativa, controles de pausa, sin autoplay con sonido y test de destellos antes de publicar.
- **Dónde se activa en el sistema:** Windows (Configuración → Accesibilidad → Efectos visuales → Efectos de animación), macOS (Accesibilidad → Pantalla → Reducir movimiento), iOS (Accesibilidad → Movimiento), Android (Accesibilidad → Quitar animaciones), GNOME y KDE en sus ajustes de accesibilidad.

### 5. Buenas prácticas adicionales

- **Autoplay**: nada que se mueva solo con sonido. Loops decorativos, cortos, que se paran solos o tienen pausa visible.
- **Foco** (Fluent): limita el movimiento al elemento enfocado; no animes la periferia (visionOS: evita el movimiento en la periferia de la visión).
- **Amplitud**: los desplazamientos de UI rara vez necesitan más de 30–40 px. Las escalas, más de 10 %.
- **Motion sickness en 3D o cámaras**: evita las rotaciones de cámara rápidas, el horizonte inclinado continuo y la aceleración brusca de cámara.
- **Herramientas de test**: Photosensitive Epilepsy Analysis Tool (PEAT), Harding Test, activar reduce motion en el SO y revisar frame a frame los tramos de destellos.

---

## checklist

### Qué entrega

- [ ] Bloque `accessibility` de la spec completo.
- [ ] Variante reducida descrita **e implementada**.
- [ ] Checklist: destellos ✓ · pausa > 5 s ✓ · reduced motion ✓ · no solo movimiento ✓ · tiempos en el peor escenario ✓.

- [ ] Destellos ≤ 3/s en todo medio
- [ ] Contenido que se mueve solo más de 5 s tiene pausa, detención u ocultación
- [ ] Toda animación spatial no esencial tiene variante reducida, probada con la preferencia activa
- [ ] Nada se comunica solo con movimiento
- [ ] Tiempos de lectura y de toasts en el peor escenario
- [ ] Sin scrolljacking ni autoscroll no controlable
