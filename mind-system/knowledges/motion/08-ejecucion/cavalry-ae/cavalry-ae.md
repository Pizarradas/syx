# Ejecución · Cavalry y After Effects

## meta

| Campo | Valor |
|-------|-------|
| **Dominio** | motion — ejecución · motion graphics de timeline lineal |
| **Fuente** | Documentación de Cavalry y su API de scripting; Adobe After Effects; Lottie (Bodymovin / LottieFiles) |
| **Objetivo** | Traducir una Motion Spec a vídeo, social, ident, lower third, explainer o Lottie |
| **Agent tags** | `#motion` `#cavalry` `#after-effects` `#lottie` `#video` |

---

## concepts

Herramientas **de timeline lineal** para piezas con duración: vídeo, social, broadcast y Lottie. Aquí el tiempo es exacto (frames) y la narrativa manda. Recibe de `motion/03-creativa/` la estructura de beats y de `motion/05-tipografia/` los holds de lectura.

### 1. ¿Cavalry o After Effects?

| Criterio | Cavalry | After Effects |
|---|---|---|
| Procedural y generativo (grids, repeticiones, datos, variaciones) | ✅ Fuerte (Duplicator + Behaviours) | Con expresiones o plugins |
| Tipografía cinética compleja | Bien (Stagger/Falloff) | ✅ Text Animators maduros |
| Composición, VFX, tracking, vídeo real | Limitado | ✅ |
| Automatización por agente | ✅ API JS + MCP comunitario (Stallion) | ExtendScript (UXP aún no disponible en AE) |
| Plantillas editables | Plantillas y data-driven | ✅ MOGRT (Essential Graphics) para Premiere |
| Exportación a Lottie | Sí | Sí (Bodymovin / LottieFiles) |
| Rendimiento en tiempo real | ✅ Alto | Previsualización más lenta |

### Módulos relacionados

- `motion/08-ejecucion/cavalry-ae/cavalry.md` — API, behaviours, JS Utility y ejemplo spec → script.
- `motion/08-ejecucion/cavalry-ae/after-effects.md` — Graph Editor, influence, expresiones, Text Animators, MOGRT.
- `motion/08-ejecucion/cavalry-ae/lottie.md` — compatibilidad, optimización e integración.

---

## rules

### 2. Traducir la Motion Spec

| Spec | Cavalry | After Effects |
|---|---|---|
| Duración (ms) | `frames = ceil(ms/1000 × fps)` | ídem |
| Cubic-bezier (token) | Tangentes (angle + weight) con `api.modifyKeyframeTangent`, o el Magic Easing más cercano | **Influence**: salida x1·100 %, llegada (1−x2)·100 %, velocidad 0 (exacto si y1 = 0 e y2 = 1) |
| Ease-out / in / in-out estándar | Magic Easing `SlowOut` / `SlowIn` / `SlowInSlowOut` (`VerySlow*` para más acusado) | F9 = 33,33 % (≈ 0.333, 0, 0.667, 1); ajustar influence en el Speed Graph |
| Spring / overshoot | `SpringOut`, `SmallSpringOut`, `OvershootOut`, `AnticipateInOvershootOut` | Expresión de inercia o keys horneadas |
| Bounce | `BounceOut` | Keys o expresión de bounce |
| Stagger | **Stagger behaviour** sobre el Duplicator (offset por índice) + Falloff | Layers desfasados (Sequence Layers) o Text Animator con Range Selector |
| Follow-through | Offsets por índice, Spring, o parenting con retardo (JS utility) | `valueAtTime(time - delay)` del padre |
| Loops | Oscillator, Noise, loop del graph | `loopOut("cycle" | "pingpong" | "offset")` |
| Ambient o orgánico | Noise behaviour (`noise1d/2d/3d`) | `wiggle(freq, amp)` (+ `posterizeTime` para stepped) |
| Arcos | Motion path editable en el viewport (2.6+) | Motion path con handles; **Separate Dimensions** con eases distintos por eje |
| Datos | Value Array, CSV o data-driven + Duplicator | Expresiones con JSON/CSV importado |
| Reduced motion | Versión alternativa exportada (no hay runtime) | Ídem: segunda composición o frame estático |

### 3. Cavalry: flujo recomendado para agentes

1. **Estructura procedural primero:** shapes base → Duplicator (Distribution: grid, circle, path…) → Behaviours (Stagger, Noise, Falloff) conectados a los atributos.
2. **Keys solo en los drivers** (un Null o un atributo maestro), no en cada copia. El carácter vive en la curva del driver y el stagger lo reparte.
3. **Eases** con Magic Easing o tangentes calculadas desde el token.
4. **Scripting** (`motion/08-ejecucion/cavalry-ae/cavalry.md`): `api.create`, `api.set`, `api.keyframe`, `api.magicEasing`, `api.connect`. La API solo está disponible en el **JavaScript Editor (Scripts)**, no dentro de los JavaScript Layers. Para obtener el id exacto de un atributo, copia su scripting path (clic derecho).
5. **MCP:** no hay uno oficial. Los comunitarios (p. ej. `kacperchlebowicz/Cavalry-mcp`) ejecutan JS a través del script **Stallion** (servidor HTTP local, `127.0.0.1:8080`). El agente genera el script de la spec, lo ejecuta, captura el resultado y lo revisa con `motion/09-critica/`.
6. **Render:** Render Manager (MP4, ProRes, WebM, secuencias PNG, WebP/APNG, **Lottie**, SVG).

### 4. After Effects: flujo recomendado

1. **Animatic** sobre el audio con markers en los beats (tecla `*` en el panel de audio).
2. **Pose to pose:** keys de posición, escala y opacidad con timing bruto (linear o hold).
3. **Spacing** en el Graph Editor. Para curvas de token, Speed Graph + influence; Separate Dimensions en posiciones con arcos.
4. **Overlap y follow-through:** desplaza keys 2–4 frames en capas hijas, o usa expresiones de retardo.
5. **Detalle:** secondary action, motion blur (obturador 180°), smears.
6. **Expresiones** (`motion/08-ejecucion/cavalry-ae/after-effects.md`) para loops, inercia, wiggle y enlaces.
7. **Entrega:** render (Media Encoder), **MOGRT** si el equipo edita textos en Premiere, o **Lottie** (ver restricciones).

### 5. Lottie: qué sobrevive

Detalle en `motion/08-ejecucion/cavalry-ae/lottie.md`. En resumen:

- ✅ Shape layers, transformaciones, máscaras, trim paths, mattes de alfa (coste), precomps con time remap básico, imágenes, texto básico o como glifos.
- ⚠️ Parcial: efectos Fill, Stroke y Tint; blend modes (según el player).
- ❌ 3D, cámaras, luces, la mayoría de efectos (blur, distorsión), layer styles, adjustment layers.
- **Expresiones:** soporte limitado (ES5 en lottie-web) y distinto en cada player. **Hornéalas a keys antes de exportar.**
- **Pesos:** vigila el nº de vértices, las imágenes embebidas y los mattes. Peor escenario: móvil modesto con el player de iOS o Android.
- **Reduced motion:** el player no la conoce. El producto debe mostrar un frame estático o una segunda animación.

---

## checklist

- [ ] Beats de `motion/03-creativa/` respetados; acentos en el beat o 1–2 f antes
- [ ] Holds de texto en el peor escenario (`motion/05-tipografia/`)
- [ ] Safe areas de la plataforma
- [ ] Test de destellos (≤ 3/s; PEAT o Harding en piezas de riesgo)
- [ ] Funciona sin sonido
- [ ] Versión alternativa o estática si va a producto (Lottie) o a pantallas con autoplay
- [ ] Expresiones horneadas (Lottie)
