# Easing y curvas

## meta

| Campo | Valor |
|-------|-------|
| **Dominio** | motion — teoría · curvas de tiempo |
| **Fuente** | Robert Penner — *Tweening*; easings.net; Carmen Ansio — *CSS Easing Explained*; Drew Powers — *A handbook to animation easings*; JCGT 2022 — *Kinematic Timing Curves*; Figma Learn |
| **Objetivo** | Leer, elegir, construir y portar curvas de easing entre herramientas |
| **Agent tags** | `#motion` `#easing` `#cubic-bezier` `#penner` |

---

## concepts

### Anatomía

- Una curva de easing es una gráfica con el **tiempo en X** y el **progreso en Y**. En una curva lineal, al 25 % del tiempo se ha recorrido el 25 % de la distancia.
- `cubic-bezier(x1, y1, x2, y2)` define dos manejadores. **X** (tiempo) está siempre entre 0 y 1. **Y** (progreso) puede salirse de 0–1: si y > 1 hay **overshoot**; si y < 0 hay **wind-up** (anticipación).
- El easing decide **dónde caen los frames**: frames apiñados se ven lentos; frames separados, rápidos.
- **Cómo leer la gráfica de valor:** la diagonal es lineal. Si la curva sube rápido a la izquierda, es ease-out; si sube tarde a la derecha, es ease-in. La **pendiente** es la velocidad.
- **Gráfica de velocidad** (AE Speed Graph): su área es la distancia. Un buen ease-out empieza alto y cae suavemente a 0. Si hay picos o escalones, hay saltos de velocidad.

---

## rules

### Penner: la base matemática

Un tween depende de `t` (tiempo), `b` (valor inicial), `c` (cambio) y `d` (duración).

- Lineal: `p(t) = c·t/d + b`. Por ejemplo, 120 px en 30 frames son 4 px/frame.
- Familias: Quad (t²), Cubic (t³), Quart (t⁴), Quint (t⁵), Sine, Expo, Circ, cada una en in, out e in-out. Además, Back, Elastic y Bounce.
- **Slide exponencial**: cada frame recorre la mitad de lo que falta (`x += (target − x) · k`). Da un ease-out dinámico sin duración fija; útil para seguir el cursor con suavizado, pero depende del frame rate (corrígelo con `k = 1 − (1−k₆₀)^(dt·60)`).
- Cualquier propiedad numérica se puede tweenear: posición, escala, alfa, volumen, color en un espacio perceptual…

Funciones normalizadas (t ∈ [0,1]):

```js
const easeOutCubic  = t => 1 - Math.pow(1 - t, 3);
const easeInOutQuad = t => t < .5 ? 2*t*t : 1 - Math.pow(-2*t + 2, 2) / 2;
const easeOutBack   = (t, s = 1.70158) => 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2);
const easeOutElastic = t => t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10*t) * Math.sin((t*10 - .75) * (2*Math.PI/3)) + 1;
const easeOutBounce = t => { const n=7.5625, d=2.75;
  if (t < 1/d) return n*t*t; if (t < 2/d) return n*(t-=1.5/d)*t+.75;
  if (t < 2.5/d) return n*(t-=2.25/d)*t+.9375; return n*(t-=2.625/d)*t+.984375; };
```

### Catálogo cubic-bezier

#### Palabras clave de CSS

| Nombre | Valor |
|---|---|
| `ease` | (0.25, 0.1, 0.25, 1) |
| `ease-in` | (0.42, 0, 1, 1) |
| `ease-out` | (0, 0, 0.58, 1) |
| `ease-in-out` | (0.42, 0, 0.58, 1) |

#### Aproximaciones de Penner (easings.net)

| Familia | in | out | in-out |
|---|---|---|---|
| Sine | (0.12, 0, 0.39, 0) | (0.61, 1, 0.88, 1) | (0.37, 0, 0.63, 1) |
| Quad | (0.11, 0, 0.5, 0) | (0.5, 1, 0.89, 1) | (0.45, 0, 0.55, 1) |
| Cubic | (0.32, 0, 0.67, 0) | (0.33, 1, 0.68, 1) | (0.65, 0, 0.35, 1) |
| Quart | (0.5, 0, 0.75, 0) | (0.25, 1, 0.5, 1) | (0.76, 0, 0.24, 1) |
| Quint | (0.64, 0, 0.78, 0) | (0.22, 1, 0.36, 1) | (0.83, 0, 0.17, 1) |
| Expo | (0.7, 0, 0.84, 0) | (0.16, 1, 0.3, 1) | (0.87, 0, 0.13, 1) |
| Circ | (0.55, 0, 1, 0.45) | (0, 0.55, 0.45, 1) | (0.85, 0, 0.15, 1) |
| Back | (0.36, 0, 0.66, -0.56) | (0.34, 1.56, 0.64, 1) | (0.68, -0.6, 0.32, 1.6) |

Elastic y Bounce **no** se pueden representar con una cubic-bezier. Usa `linear()` en CSS, funciones en JS, presets de la herramienta o keys horneadas.

**Equivalencias en GSAP:** power1 = Quad, power2 = Cubic, power3 = Quart, power4 = Quint; además `sine`, `expo`, `circ`, `back(1.7)`, `elastic(1, 0.3)`, `bounce`.

#### Curvas de sistemas de diseño

| Sistema | Nombre | Valor | Uso |
|---|---|---|---|
| Material 1 | Standard | (0.4, 0, 0.2, 1) | mover entre posiciones visibles |
| Material 1 | Deceleration | (0, 0, 0.2, 1) | entrar |
| Material 1 | Acceleration | (0.4, 0, 1, 1) | salir |
| Material 1 | Sharp | (0.4, 0, 0.6, 1) | salir, con posible regreso |
| Material 3 | Emphasized decelerate | (0.05, 0.7, 0.1, 1) | entradas expresivas |
| Material 3 | Emphasized accelerate | (0.3, 0, 0.8, 0.15) | salidas expresivas |
| Carbon | Standard productive | (0.2, 0, 0.38, 0.9) | UI de tarea |
| Carbon | Entrance productive | (0, 0, 0.38, 0.9) | |
| Carbon | Exit productive | (0.2, 0, 1, 0.9) | |
| Carbon | Standard expressive | (0.4, 0.14, 0.3, 1) | momentos importantes |
| Carbon | Entrance expressive | (0, 0, 0.3, 1) | |
| Carbon | Exit expressive | (0.4, 0.14, 1, 1) | |

Ejemplo de overshoot o windup de Carmen Ansio: `(0.34, 1.56, 0.64, 1)`.

### Reglas prácticas (Powers, Ansio, Figma)

- Entrar: ease-out. Salir: ease-in. Moverse entre posiciones visibles: ease-in-out.
- Color, luz, brillo y opacidad: linear. Spinners y progreso: linear.
- Por debajo de ~100 ms se percibe como instantáneo; no gastes easing ahí.
- Al arrastrar: sin easing (1:1). **No animes mientras el usuario arrastra, hace zoom o scroll**: añade lag.
- Hold (step): salto inmediato, para pausas y ritmos deliberados.
- **Curvas por eje:** si un objeto va en diagonal, usar el mismo ease en X e Y da una recta; desfasarlos (X ease-out, Y ease-in) da un arco.
- Vocabulario de equipo (Figma): *zippy, dreamy, chunky, snappier, floaty, too linear, dead on arrival*. Su traducción a parámetros está en `motion/09-critica/`.

### Modelo cinemático parametrizable (JCGT 2022)

Es una curva normalizada x(t) ∈ [0,1] con tres parámetros intuitivos. Sirve para diseñar easings propios con carácter:

- **tₐ**: tiempo de anticipación (0 = sin anticipación).
- **t_mid**: punto donde se pasa de acelerar a frenar. Si baja, enfatiza el ease-out; si sube, el ease-in.
- **B**: número de rebotes (0 = parada suave).

Usa aceleración constante y después frenado constante o una fuerza tipo muelle, con continuidad C¹. La amortiguación recomendada es k = 1/4, que supone perder ~22 % de altura en cada rebote. Al estar normalizada, el mismo carácter sirve para cualquier duración, propiedad o transformación 3D.

Implementación orientativa en JS, para exportar después a `linear()`, keys o una tabla:

```js
// x(t) normalizada. ta: fracción de tiempo de anticipación; antAmp: profundidad del wind-up;
// tmid: punto de cambio acelerar→frenar (solo sin rebotes); B: nº de rebotes; r: altura relativa de cada rebote.
function kinematic(t, { ta = 0, antAmp = 0.1, tmid = 0.5, B = 0, r = 0.25 } = {}) {
  if (ta > 0 && t < ta) {                       // wind-up: retrocede y vuelve a 0 con velocidad 0 (C¹)
    const u = t / ta; return -antAmp * (1 - Math.cos(2 * Math.PI * u)) / 2;
  }
  const u = ta > 0 ? (t - ta) / (1 - ta) : t;
  if (B === 0) {                                // aceleración constante hasta tmid, frenado constante después
    const m = tmid;
    return u < m ? (u * u) / m : 1 - Math.pow(1 - u, 2) / (1 - m);
  }
  // Caída acelerada + B rebotes parabólicos. Altura_i = r^i; duración_i = 2·sqrt(r^i) (misma gravedad)
  const durs = [1]; for (let i = 1; i <= B; i++) durs.push(2 * Math.sqrt(Math.pow(r, i)));
  const total = durs.reduce((a, b) => a + b, 0);
  let T = u * total;
  if (T < durs[0]) return T * T;                // caída: x = s²
  T -= durs[0];
  for (let i = 1; i <= B; i++) {
    if (T < durs[i] || i === B) {
      const s = Math.min(T / durs[i], 1) * 2 - 1;   // -1..1
      return 1 - Math.pow(r, i) * (1 - s * s);      // parábola: 1 → 1−h → 1
    }
    T -= durs[i];
  }
  return 1;
}
```

⚠️ Es una aproximación del espíritu del paper (fases de aceleración constante, continuidad C¹ y rebotes con pérdida), no su formulación exacta. En el modo con rebotes, `tmid` no se usa (la caída es un ease-in puro). Con r = 0,25, cada rebote alcanza un 25 % de la altura anterior. Para producción, muestrea, revisa visualmente y convierte en `linear()` o keys.

### `linear()`: la puerta a cualquier curva en CSS

`linear(0, 0.25 25%, 1.1 60%, 0.97 80%, 1)` interpola en línea recta entre paradas. Con 30–60 muestras reproduce springs, bounce y elastic. Ver `motion/08-ejecucion/css/`.

---

## checklist

- [ ] Entradas en ease-out, salidas en ease-in, desplazamientos en in-out
- [ ] Color, opacidad y rotación continua en lineal
- [ ] Elastic y bounce no se fingen con cubic-bezier
- [ ] Por debajo de ~100 ms no se gasta easing
