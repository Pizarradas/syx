# After Effects: referencia

## meta

| Campo | Valor |
|-------|-------|
| **Dominio** | motion — ejecución · After Effects |
| **Fuente** | Documentación de Adobe After Effects |
| **Objetivo** | Aplicar tokens, expresiones y Text Animators en AE |
| **Agent tags** | `#motion` `#after-effects` `#expressions` `#graph-editor` |

---

## concepts

---

## rules

### Graph Editor

- **Value Graph:** muestra el valor en el tiempo. Es el que se lee como una curva de easing (y el que muestra el overshoot).
- **Speed Graph:** muestra la velocidad. Su área es la distancia. Aquí se ajusta la **influence** (0,1–100 %).
- **Separate Dimensions** (clic derecho en Position): curvas X, Y y Z independientes, necesarias para arcos y para tener eases distintos por eje.
- **Easy Ease** (F9): velocidad 0 y **33,33 %** de influence en entrada y salida. Shift+F9: solo easy ease in. Ctrl/Cmd+Shift+F9: solo easy ease out.
- **Keyframe Velocity:** Ctrl/Cmd+Shift+K, para introducir influence exacta.

### Token → influence

Para propiedades 1D o con Separate Dimensions, con velocidad 0 en los keys:

```
key A (sale):   outgoing influence = x1 × 100 %
key B (llega):  incoming influence = (1 − x2) × 100 %
```

| Token | A out | B in | Nota |
|---|---|---|---|
| standard.productive (0.2, 0, 0.38, 0.9) | 20 % | 62 % | y2 = 0,9: no llega con velocidad 0 exacta; aceptable |
| enter.productive (0, 0, 0.38, 0.9) | 0,1 % (salida lineal) | 62 % | |
| enter.expressive (0, 0, 0.3, 1) | 0,1 % | 70 % | |
| exit.productive (0.2, 0, 1, 0.9) | 20 % | 0,1 % | |
| standard.expressive (0.4, 0.14, 0.3, 1) | 40 % | 70 % | y1 = 0,14: arranque algo más rápido (velocidad inicial > 0) |
| Penner OutQuint (0.22, 1, 0.36, 1) | — | — | y1 = 1: no es convertible con velocidad 0; usa keys + velocidad inicial, o un plugin (Flow, Ease and Wizz) |

### Expresiones clave

```js
// Ruido orgánico
wiggle(2, 30);                               // freq (Hz), amp
posterizeTime(12); wiggle(2, 30);            // stepped "de 2"

// Loops
loopOut("cycle"); loopOut("pingpong"); loopOut("offset"); loopOut("continue"); loopIn("cycle");

// Follow-through / retardo respecto a otra capa
const d = 3 * thisComp.frameDuration;        // 3 frames
thisComp.layer("Padre").transform.position.valueAtTime(time - d);

// Stagger por índice
const each = 2 * thisComp.frameDuration;
const t = time - (index - 1) * each;
ease(t, 0, 0.4, 0, 100);                      // ease(t, tMin, tMax, v1, v2) → también linear(), easeIn(), easeOut()

// Inercia / overshoot tras el último key (patrón de Dan Ebberts)
const amp = .06, freq = 3, decay = 5;
let n = 0;
if (numKeys > 0) { n = nearestKey(time).index; if (key(n).time > time) n--; }
const t2 = n === 0 ? 0 : time - key(n).time;
if (n > 0 && t2 < 1) {
  const v = velocityAtTime(key(n).time - thisComp.frameDuration / 10);
  value + v * amp * Math.sin(freq * t2 * 2 * Math.PI) / Math.exp(decay * t2);
} else value;
```

Mapeo aproximado a los tokens de spring: **freq** ≈ 1 / duration_s (ciclos por segundo); **decay** más alto = menos bounce (bounce 0,1 → decay ≈ 8; bounce 0,3 → decay ≈ 4). Ajústalo a ojo con el Value Graph.

⚠️ El motor de expresiones de AE es JavaScript moderno, pero **Lottie no lo soporta de forma fiable**. Hornea las keys antes de exportar (Animation → Keyframe Assistant → Convert Expression to Keyframes).

### Text Animators (tipografía cinética)

- Animate → Position/Opacity/Scale…, con un **Range Selector**:
  - Based On: Characters, Words o Lines (la unidad de `motion/05-tipografia/`).
  - Shape: Ramp Up.
  - Ease High / Ease Low para la curva de la unidad.
  - Offset animado de 0 a 100 %.
- **Ventana** = rango Start–End: estrecha = secuencial; amplia = ola.
- Order: Randomize Order (con Random Seed) para un stagger aleatorio reproducible.
- Wiggly Selector para temblor tipográfico.

### Essential Graphics / MOGRT

Arrastra propiedades al panel Essential Graphics (texto, color, sliders, checkbox, dropdown) y usa **Export Motion Graphics Template** para obtener un `.mogrt` que se edita en Premiere. Diseña los textos con **responsive design – time** (Protected Regions) para que las intros y outros no se estiren.

### Scripting

- **ExtendScript** (`.jsx`/`.jsxbin`, paneles ScriptUI o CEP) sigue siendo la vía de producción en AE.
- A diferencia de Photoshop, InDesign o Premiere, **AE no tiene UXP en producción** (a abril de 2026). Revisa los anuncios de Adobe.

```js
// ExtendScript: aplicar influence de token a los keys seleccionados de una propiedad 1D
var p = app.project.activeItem.selectedProperties[0];
for (var i = 1; i <= p.numKeys; i++) {
  var easeIn  = new KeyframeEase(0, 62);   // speed, influence
  var easeOut = new KeyframeEase(0, 20);
  p.setTemporalEaseAtKey(i, [easeIn], [easeOut]);
}
```

---

## checklist

- [ ] Influence calculada desde el token (exacta solo si y1 = 0 e y2 = 1)
- [ ] Separate Dimensions en posiciones con arcos
- [ ] Expresiones horneadas si el destino es Lottie
