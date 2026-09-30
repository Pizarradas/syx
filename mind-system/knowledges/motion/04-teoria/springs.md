# Springs y física

## meta

| Campo | Valor |
|-------|-------|
| **Dominio** | motion — teoría · osciladores amortiguados |
| **Fuente** | Maxime Heckel — *The physics behind spring animations*; Apple WWDC23 — *Animate with springs*; Android Developers — *Spring animation*; Material 3 (MotionScheme) |
| **Objetivo** | Entender, parametrizar y convertir springs entre física, parámetros perceptuales y plataformas |
| **Agent tags** | `#motion` `#springs` `#physics` `#bounce` |

---

## concepts

### Física básica (Maxime Heckel)

Un spring es un oscilador armónico amortiguado.

- Fuerza del muelle (ley de Hooke): `Fs = −k·x`, donde k es la rigidez (stiffness) y x la distancia al destino.
- Amortiguación: `Fd = −c·v`, donde c es el damping.
- Aceleración: `a = (Fs + Fd) / m`. Más rigidez da más aceleración; más masa, menos.
- Integración frame a frame (a 60 fps, dt ≈ 0,0167 s):

```js
function springStep(state, target, { stiffness: k = 170, damping: c = 26, mass: m = 1 }, dt) {
  const Fs = -k * (state.x - target), Fd = -c * state.v;
  const a = (Fs + Fd) / m;
  state.v += a * dt;              // Euler semi-implícito: estable para UI
  state.x += state.v * dt;
  return state;
}
// Parar cuando |v| < restSpeed (p. ej. 0.01) y |x - target| < restDelta (p. ej. 0.01)
```

Para dt variable o springs muy rígidos, usa substeps (dt ≤ 1/240 s) o la solución analítica de más abajo.

### Magnitudes clave

- Frecuencia natural: `ω₀ = √(k/m)` (rad/s).
- Damping ratio: `ζ = c / (2·√(k·m))`.
  - ζ > 1: sobreamortiguado (vuelve suave y lento).
  - ζ = 1: crítico (lo más rápido sin oscilar).
  - ζ < 1: subamortiguado (overshoot).
  - ζ = 0: oscila para siempre.
- Tiempo de asentamiento aproximado (banda del 2 %): `t_s ≈ 4 / (ζ·ω₀)` para ζ < 1.
- Overshoot máximo (partiendo del reposo): `OS = exp(−π·ζ / √(1−ζ²))`.

---

## rules

### Solución analítica (subamortiguado, desde el reposo, destino 1)

```js
function springCurve(t, { stiffness: k, damping: c, mass: m = 1, v0 = 0 }) {
  const w0 = Math.sqrt(k / m), z = c / (2 * Math.sqrt(k * m));
  if (z < 1) { const wd = w0 * Math.sqrt(1 - z * z);
    return 1 - Math.exp(-z * w0 * t) * (Math.cos(wd * t) + ((z * w0 - v0) / wd) * Math.sin(wd * t)); }
  if (z === 1) return 1 - Math.exp(-w0 * t) * (1 + (w0 - v0) * t);
  const r1 = -w0 * (z - Math.sqrt(z*z - 1)), r2 = -w0 * (z + Math.sqrt(z*z - 1));
  const C1 = (v0 + r2) / (r1 - r2), C2 = -1 - C1;    // x(0)=0, x'(0)=v0
  return 1 + C1 * Math.exp(r1 * t) + C2 * Math.exp(r2 * t);
}
```

Muestrea esta función para generar `linear()` en CSS, keys en AE, Cavalry o Blender, o tablas para Rive.

### Parámetros perceptuales (Apple, Motion): duration + bounce

En lugar de masa, rigidez y amortiguación, se usan dos parámetros que se entienden sin física:

- **duration** (perceptual): el ritmo, lo que tarda en "llegar". El asentamiento real puede ser posterior y **no debe bloquear la UI**.
- **bounce**, entre −1 y 1: 0 es suave, sin rebote; por encima de 0 hay rebote; por debajo, sobreamortiguado.
- Referencias de Apple: **0,15** ágil; **0,3** claramente rebotante; **más de 0,4**, exagerado.
- **Primero se elige la duración y después el bounce.**

#### Conversión duration + bounce ↔ física (masa = 1)

```
k (stiffness) = (2π / duration_s)²
ζ = 1 − bounce          si bounce ≥ 0
ζ = 1 / (1 + bounce)    si bounce < 0
c (damping)   = 4π·ζ / duration_s
```

Inversa:

```
duration_s = 2π / √(k/m)
bounce = 1 − ζ   (si ζ ≤ 1)   ·   bounce = 1/ζ − 1   (si ζ > 1)
```

Ejemplos:

| duration | bounce | stiffness | damping | ζ |
|---|---|---|---|---|
| 0,5 s | 0 | 157,9 | 25,1 | 1,0 |
| 0,4 s | 0,15 | 246,7 | 26,7 | 0,85 |
| 0,35 s | 0,3 | 322,3 | 25,1 | 0,7 |
| 0,628 s | 0,5 | 100 | 10 | 0,5 ← valores por defecto de Framer Motion |

### Equivalencias entre plataformas

| Plataforma | Parámetros | Notas |
|---|---|---|
| **SwiftUI** | `.spring(duration:bounce:)`, `.snappy`, `.smooth`, `.bouncy` | Hereda velocidad y admite cambiar el destino en marcha |
| **Android (SpringForce)** | `dampingRatio` (= ζ), `stiffness` | Constantes: stiffness HIGH 10000, MEDIUM 1500, LOW 200, VERY_LOW 50; damping HIGH_BOUNCY 0,2, MEDIUM_BOUNCY 0,5, LOW_BOUNCY 0,75, NO_BOUNCY 1. Velocidad inicial del gesto; destino modificable |
| **Material 3 (Expressive)** | dampingRatio + stiffness por token | Ver abajo |
| **Motion (web)** | `type:"spring"` + `stiffness/damping/mass` **o** `visualDuration/duration + bounce` | Si se da stiffness, damping o mass, **anulan** duration y bounce. Defaults: damping 10, mass 1, bounce 0,25 |
| **GSAP** | Sin spring nativo | `elastic.out(amp, period)`, CustomEase con curva muestreada, o `gsap.ticker` + integrador |
| **CSS** | Sin spring nativo | `linear()` con 30–60 muestras; la duración = tiempo de asentamiento; no hereda velocidad |
| **Rive** | Sin spring genérico en timelines | Interpolación **Elastic** (amplitude, period), keys horneadas, o scripting (Luau) |
| **AE** | Sin spring nativo | Expresión de inercia (bounce/overshoot) o keys horneadas |
| **Cavalry** | Magic Easing `SpringOut`/`SmallSpringOut`, JS utility | |
| **Blender** | Interpolación `ELASTIC`/`BACK`, o F-curve horneada con Python | |

#### Tokens de spring de Material 3 Expressive (dampingRatio / stiffness)

| Esquema | Tipo | fast | default | slow |
|---|---|---|---|---|
| Standard | spatial | 0,9 / 1400 | 0,9 / 700 | 0,9 / 300 |
| Standard | effects | 1 / 3800 | 1 / 1600 | 1 / 800 |
| Expressive | spatial | 0,6 / 800 | 0,8 / 380 | 0,8 / 200 |
| Expressive | effects | 1 / 3800 | 1 / 1600 | 1 / 800 |

⚠️ Valores tomados de la implementación de Compose (`MotionScheme`). Contrástalos con m3.material.io antes de congelarlos como tokens. Regla: **effects nunca rebota** (ζ = 1).

### Cuándo un spring y cuándo no

- **Sí:** gestos, drag-release, elementos que se pueden interrumpir, toggles, sheets, UI física, personajes interactivos.
- **No:** color y opacidad (usa effects con ζ = 1, o linear), vídeo con sincronía exacta, loaders, UI de alta frecuencia en la que el rebote cansa.
- **Continuidad:** un spring mantiene continuas posición y velocidad aunque cambie el destino a mitad de camino. Esa es su ventaja sobre las curvas.

---

## checklist

- [ ] Primero la duración, después el bounce
- [ ] Effects nunca rebotan (ζ = 1)
- [ ] El asentamiento no bloquea la interfaz
- [ ] Donde no hay spring nativo, la aproximación está anotada
