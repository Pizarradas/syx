# Springs propios y gestos

## meta

| Campo | Valor |
|-------|-------|
| **Dominio** | motion — ejecución · física interrumpible en JS |
| **Fuente** | Apple WWDC18 — *Designing Fluid Interfaces*; Maxime Heckel; GSAP docs (quickTo) |
| **Objetivo** | Implementar manipulación directa y springs que heredan velocidad |
| **Agent tags** | `#motion` `#javascript` `#springs` `#gestures` `#drag` |

---

## concepts

---

## rules

### Spring interrumpible con herencia de velocidad (vanilla)

```js
// tokens: { duration: 400, bounce: 0.1 } → física
function toPhysics({ duration, bounce }) {
  const d = duration / 1000, k = (2 * Math.PI / d) ** 2;
  const z = bounce >= 0 ? 1 - bounce : 1 / (1 + bounce);
  return { k, c: 4 * Math.PI * z / d, m: 1 };
}

export function createSpring(initial, token, onUpdate) {
  const { k, c, m } = toPhysics(token);
  let x = initial, v = 0, target = initial, raf = 0, last = 0;
  const step = (now) => {
    const dt = Math.min((now - last) / 1000, 1 / 30); last = now;
    const substeps = Math.ceil(dt / (1 / 240));          // estabilidad con springs rígidos
    for (let i = 0; i < substeps; i++) {
      const h = dt / substeps, a = (-k * (x - target) - c * v) / m;
      v += a * h; x += v * h;
    }
    onUpdate(x);
    if (Math.abs(v) < 0.01 && Math.abs(x - target) < 0.01) { x = target; v = 0; onUpdate(x); raf = 0; return; }
    raf = requestAnimationFrame(step);
  };
  return {
    set(to, velocity) {                                    // cambiar de destino en marcha
      target = to; if (velocity !== undefined) v = velocity;
      if (!raf) { last = performance.now(); raf = requestAnimationFrame(step); }
    },
    jump(to) { x = target = to; v = 0; onUpdate(x); },     // modo reducido: sin animación
    get value() { return x; }, get velocity() { return v; },
  };
}
```

Umbrales de reposo (restSpeed y restDelta) en las unidades de la propiedad: px → 0,01–0,5; escala → 0,001.

### Drag → release

1. **Durante el drag:** posición 1:1 con el puntero, sin spring ni easing. Registra la velocidad con una media de los últimos ~50–100 ms (no solo del último evento).
2. **Al soltar:** elige el destino por **posición proyectada**, no solo por la posición actual:
   ```js
   // proyección con desaceleración constante (Apple WWDC "Designing fluid interfaces")
   const project = (v, decel = 0.998) => (v / 1000) * decel / (1 - decel);   // v en px/s
   const projected = x + project(vx);
   const targetX = nearestSnapPoint(projected);
   ```
3. Lanza el spring hacia `targetX` con `velocity = vx` (herencia de velocidad).
4. **Rubber-banding** fuera de los límites: `offset = limit + (1 − 1/(overshoot·c/dim + 1))·dim` con c ≈ 0,55, que da una resistencia creciente.

### Snap por velocidad (sheets, carruseles)

- Un flick rápido (|v| > ~500 px/s) decide la dirección aunque no se haya pasado la mitad.
- Un gesto lento decide por la posición (más de la mitad).

### `gsap.quickTo` (seguimiento suave sin spring)

```js
const xTo = gsap.quickTo(el, "x", { duration: 0.4, ease: "power3" });
window.addEventListener("pointermove", e => xTo(e.clientX));
```

Suaviza el seguimiento del cursor (efecto imán, cursores custom). No es manipulación directa: no lo uses en drag de UI.

### Suavizado independiente del frame rate

```js
// x += (target - x) * k  → corregido por dt (k pensado para 60 fps)
x += (target - x) * (1 - Math.pow(1 - k, dt * 60));
```

---

## checklist

- [ ] Durante el drag, 1:1 sin easing
- [ ] Velocidad promediada en los últimos 50–100 ms
- [ ] Destino por posición proyectada, no solo actual
- [ ] dt acotado y substeps en springs rígidos
- [ ] `jump()` para la variante reducida
