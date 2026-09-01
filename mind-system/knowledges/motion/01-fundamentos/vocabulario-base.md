# Vocabulario base de GSAP

## meta

| Campo | Valor |
|-------|-------|
| **Dominio** | motion — terminología atómica de GSAP |
| **Fuente** | GSAP docs (greensock.com/docs); GSAP Prompt Briefing del proyecto |
| **Objetivo** | Disponer de los términos mínimos para leer y escribir prompts de animación con precisión |
| **Agent tags** | `#gsap` `#animation` `#vocabulary` |

---

## concepts

GSAP construye animaciones combinando **tweens** (un cambio de propiedad en el tiempo), **timelines** (secuencias de tweens orquestadas) y **plugins** (capacidades extra como ScrollTrigger). Los conceptos siguientes son los ladrillos del lenguaje.

---

## rules

### Tween
La unidad mínima. Anima una o más propiedades de un elemento entre dos valores en una duración dada.

```js
gsap.to(element, { x: 100, duration: 0.6, ease: "expo.out" });
```

- `gsap.to()` — desde el estado actual al objetivo
- `gsap.from()` — desde un estado declarado al actual
- `gsap.fromTo()` — desde A explícito hasta B explícito
- `gsap.set()` — sin animación, fija valores

### Timeline
Secuencia coreografiada de tweens. Permite controlar overlap, scrub y posicionamiento relativo.

```js
gsap.timeline()
  .to(num,   { opacity: 1, y: 0, duration: 0.9 })
  .to(bg,    { clipPath: "inset(0%)", duration: 1.2 }, "-=0.6")  // overlap
  .to(title, { opacity: 1, y: 0 }, "<0.1");                       // relativo
```

- Posición absoluta: `0.5` (segundo 0.5)
- Posición relativa: `"+=0.3"` (0.3s después del anterior), `"-=0.6"` (0.6s antes)
- Posición simbólica: `"<"` (inicio del anterior), `">"` (fin del anterior)

### Stagger
Aplicar el mismo tween a múltiples elementos con desfase temporal entre ellos.

```js
gsap.to(items, {
  y: 0,
  stagger: 0.05,        // 50ms entre elementos
  // o objeto avanzado:
  stagger: { each: 0.05, from: "center", grid: "auto" }
});
```

### Easing
Curva temporal que define la sensación. Ver `02-capacidades/index.md` para el catálogo completo.

| Familia | Sensación | Cuándo |
|---|---|---|
| `linear` / `none` | Mecánico | Scrub con scroll |
| `ease`, `power1-4.out` | Frenazo natural | Entradas |
| `expo.out` | Frenazo dramático | Reveals editoriales |
| `back.out(N)` | Sobrepasamiento | "Aterrizajes" lúdicos |
| `elastic.out(amp, period)` | Rebote elástico | Magnetic, micro-interacciones |
| `ease.in` | Aceleración | Salidas |

### ScrollTrigger
Plugin oficial. Vincula un tween (o cualquier callback) al scroll.

```js
ScrollTrigger.create({
  trigger: section,
  start: "top 80%",
  end: "bottom top",
  toggleActions: "play none none reverse",  // onEnter / onLeave / onEnterBack / onLeaveBack
  // o
  scrub: 0.4,    // anima ligado al progreso del scroll
  pin: true,     // fija la sección mientras dura el trigger
  snap: 1 / 5    // snap a 5 puntos
});
```

### Disparadores típicos

| Disparador | API | Uso |
|---|---|---|
| Load | `gsap.to(...)` directo | Entrada del hero al cargar |
| Viewport | `ScrollTrigger { once: true }` | Reveals |
| Scroll progress | `ScrollTrigger { scrub }` | Parallax, scrub charts |
| Hover | `el.addEventListener("mouseenter", ...)` | Magnetic, gallery zoom |
| Pointer | `mousemove` + `gsap.quickTo` | Cursor follower |

### Helpers comunes

- `gsap.utils.toArray(selector)` — array de elementos para iterar
- `gsap.quickTo(target, prop, vars)` — setter ligero ideal para inputs continuos (cursor, magnetic)
- `gsap.set(target, vars)` — estado inmediato sin animación
- `gsap.killTweensOf(target)` — cancelar tweens en curso (importante en scramble/typewriter)
- `gsap.ticker.add(fn)` — engancha frame de GSAP (usado para Lenis)

---

## checklist

- [ ] ¿Conozco la diferencia entre `to`, `from`, `fromTo` y `set`?
- [ ] ¿Sé cuándo usar timeline frente a tweens sueltos?
- [ ] ¿Distingo `stagger: 0.05` simple del objeto `{ each, from, grid }`?
- [ ] ¿Reconozco las cuatro familias de easing y para qué sirven?
- [ ] ¿Sé qué hace `scrub` frente a `toggleActions` en ScrollTrigger?
- [ ] ¿Sé cuándo `pin: true` se justifica y cuándo rompe la lectura?
