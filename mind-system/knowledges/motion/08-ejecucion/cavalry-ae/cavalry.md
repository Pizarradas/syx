# Cavalry: referencia para agentes

## meta

| Campo | Valor |
|-------|-------|
| **Dominio** | motion — ejecución · Cavalry |
| **Fuente** | Documentación de Cavalry y de su API de scripting |
| **Objetivo** | Construir piezas procedurales en Cavalry desde una spec, a mano o por script |
| **Agent tags** | `#motion` `#cavalry` `#scripting` `#procedural` |

---

## concepts

Versión de referencia: **Cavalry 2.6** (febrero de 2026). Novedades de esa versión: edición de motion paths en el viewport, Pivot tool, deformadores Lattice y Four Point Warp (Pro), Mesh Solver (Pro) y physics fields (Path, Vortex, Buoyancy). Documentación: docs.cavalry.scenegroup.co · cavalry.studio/docs.

### Conceptos

- **Todo es un nodo.** Las capas se conectan por atributos; la salida de una capa es su atributo `"id"`.
- **Duplicator:** copia shapes sobre una *Distribution* (grid, circle, path, random…).
- **Behaviours:** controlan atributos por copia o a lo largo del tiempo. Stagger, Oscillator, Noise, Falloff, Value Array, Math, JavaScript Utility…
  - ⚠️ Verifica en tu versión el nombre exacto de cada behaviour (y si existe un Spring behaviour).
- **Deformers:** se enchufan al array `deformers` de un shape.
- **Graph Editor:** tipos de key `0` = Bezier, `1` = Linear, `2` = Step. Tangentes con angle y weight.
- **Magic Easing** (presets):
  - `SlowIn`, `SlowOut`, `SlowInSlowOut`
  - `VerySlowIn`, `VerySlowOut`, `VerySlowInVerySlowOut`
  - `SpringIn`, `SpringOut`, `SpringInSpringOut`
  - `SmallSpringIn`, `SmallSpringOut`, `SmallSpringInSmallSpringOut`
  - `AnticipateIn`, `OvershootOut`, `AnticipateInOvershootOut`
  - `BounceIn`, `BounceOut`, `BounceInBounceOut`

---

## rules

### Mapa de tokens → Magic Easing (aproximado)

| Token o intención | Magic Easing |
|---|---|
| enter (ease-out) | `SlowOut`; expresivo: `VerySlowOut` |
| exit (ease-in) | `SlowIn` |
| standard (in-out) | `SlowInSlowOut` |
| overshoot | `OvershootOut` |
| spring bounce ≤ 0,15 | `SmallSpringOut` |
| spring bounce 0,25–0,35 | `SpringOut` |
| anticipación + overshoot | `AnticipateInOvershootOut` |
| bounce físico | `BounceOut` |

Para una cubic-bezier exacta, calcula las tangentes (abajo).

### API de scripting (`api`, solo en el JavaScript Editor)

```js
// Crear
const nul  = api.create("null", "Driver", true);           // (layerType, name, allowDefaultPreset)
const rect = api.primitive("rectangle", "Card");            // (type, name)
api.set(rect, { "generator.dimensions": [320, 200], "position": [0, 0] });
api.parent(rect, nul);

// Keys (frame, {atributo: valor})
api.keyframe(rect, 0,  { "position.y": 40, "opacity": 0 });
api.keyframe(rect, 12, { "position.y": 0,  "opacity": 100 });

// Easing
api.magicEasing(rect, "position.y", 0, "SlowOut");          // (layerId, attrId, frame, easingName)
api.modifyKeyframeTangent(rect, { "position.y": { frame: 0, angle: 0, weight: 20 } });  // también inHandle/outHandle/angleLocked/weightLocked
api.modifyKeyframe(rect, { "position.y": { frame: 12, newValue: 0, type: 0 } });       // 0 Bezier · 1 Linear · 2 Step
api.graphPreset(rect, "opacity", 2);                        // 0 s-curve · 1 ramp · 2 linear · 3 flat

// Conectar behaviours, deformers y materiales
api.connect(oscId, "id", rect, "rotation");
api.connect(deformerId, "id", rect, "deformers");
api.setGenerator(dupId, "generator", "circleDistribution");
api.setAttributeExpression(rect, "position.y", "*2");

// Utilidades
api.getSelection(); api.getCompLayers(); api.getKeyframeIdsForAttribute(rect, "position.y");
api.deleteKeyframe(...); api.addArrayIndex(layerId, attrId); api.setFrame(0); api.duplicate(...); api.deleteLayer(...);
```

⚠️ Confirma los strings de tipo de capa (`"duplicator"`, `"stagger"`, `"noise"`…) copiando el scripting path en la app.

### JavaScript Utility / Layer / Deformer (expresiones por copia)

- Las entradas se añaden con `+` (la primera es `n0`). **La última expresión es el valor devuelto.**
- Contexto: `ctx.index`, `ctx.count`, `ctx.positionX`, `ctx.positionY`, más `ctx.saveObject`/`loadObject`/`hasObject`.
- Helpers del módulo `cavalry`: `random(min,max,seed)`, `uniform(min,max,seed)`, `noise1d/2d/3d(…, seed, freq)`, `map`, `norm`, `clamp`, `lerp`, `dist`. **No hay easings**: impleméntalos tú.

```js
// Stagger con tope y easing de distribución (motion-typography), dentro de un JS Utility
// n0 = frame actual, n1 = each (frames), n2 = maxTotal (frames), n3 = duración unidad (frames)
const each = Math.min(n1, n2 / Math.max(ctx.count - 1, 1));
const t = cavalry.clamp((n0 - ctx.index * each) / n3, 0, 1);
const easeOutCubic = 1 - Math.pow(1 - t, 3);
easeOutCubic * 100   // → p. ej. opacidad
```

### Cubic-bezier → tangentes (aproximación)

En un segmento A (frame fA, valor vA) → B (fB, vB), con Δf = fB − fA y Δv = vB − vA:

```
out handle de A: (x1·Δf, y1·Δv)    → angle = atan2(y1·Δv, x1·Δf) en unidades de la gráfica; weight ∝ longitud
in  handle de B: (−(1−x2)·Δf, −(1−y2)·Δv)
```

⚠️ Cavalry expresa el angle y el weight en su propio espacio de gráfica. Valida visualmente un caso (p. ej. Easy Ease) antes de automatizar la conversión.

### Ejemplo: spec → script (entrada de tarjetas en grid con stagger)

```js
// motion.enter.medium (240 ms → 6 f @25) · stagger 40 ms (1 f) · tope 300 ms (8 f)
const fps = 25, dur = Math.ceil(0.24 * fps);
const card = api.primitive("rectangle", "Card");
api.set(card, { "generator.dimensions": [160, 100] });
const dup = api.create("duplicator", "Grid");
api.connect(card, "id", dup, "shapes");                // ⚠️ verificar el nombre del atributo de entrada
api.setGenerator(dup, "generator", "gridDistribution");
// Driver maestro: 0 → 100 con ease-out; el Stagger behaviour lo reparte por índice
const drv = api.create("null", "Driver");
api.keyframe(drv, 0, { "position.x": 0 });
api.keyframe(drv, dur, { "position.x": 100 });
api.magicEasing(drv, "position.x", 0, "SlowOut");
// Conectar el driver a opacity/position.y de las copias vía Stagger behaviour (offset = 1 f, tope = 8 f)
```

Termina siempre con una captura o render de prueba y pásalo por `motion/09-critica/` (a 0,25x).

---

## checklist

- [ ] Keys en los drivers, no en cada copia
- [ ] Eases desde el token (Magic Easing o tangentes)
- [ ] Script ejecutado desde el JavaScript Editor
- [ ] Resultado revisado con `motion/09-critica/critica.md`
