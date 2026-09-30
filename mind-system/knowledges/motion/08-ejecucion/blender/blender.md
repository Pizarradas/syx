# Ejecución · Blender

## meta

| Campo | Valor |
|-------|-------|
| **Dominio** | motion — ejecución · 3D y motion procedural |
| **Fuente** | Blender Manual y Python API 4.4–5.x (Slotted Actions) |
| **Objetivo** | Traducir una Motion Spec a una escena 3D o a motion graphics en Blender, y automatizarla con bpy |
| **Agent tags** | `#motion` `#blender` `#3d` `#bpy` `#camera` |

---

## concepts

Blender es un entorno 3D con un Graph Editor potente: todo lo de `motion/04-teoria/` se aplica directamente a las F-curves. Aquí se suman la **cámara**, la **luz** y la **profundidad**, y con ellas nuevas responsabilidades de accesibilidad (mareo por movimiento de cámara).

---

## rules

### 1. Traducir la Motion Spec

| Spec | Blender |
|---|---|
| Duración (ms) | `frames = ceil(ms/1000 × fps)`; `scene.render.fps` (+ `fps_base` para 23,976 o 29,97) |
| Cubic-bezier (token) | Handles **FREE** calculados (ver abajo), o la interpolación nativa más cercana |
| Familias de Penner | `interpolation = 'SINE'|'QUAD'|'CUBIC'|'QUART'|'QUINT'|'EXPO'|'CIRC'` + `easing = 'EASE_OUT'`… |
| Overshoot | `'BACK'` con `kp.back` (≈ 1,7 por defecto) |
| Spring / elastic | `'ELASTIC'` con `kp.amplitude`, `kp.period`; o F-curve horneada desde la función de spring |
| Bounce | `'BOUNCE'` |
| Hold / step | `'CONSTANT'`, o el modificador **Stepped** (animación "de 2") |
| Loop | Modificador **Cycles** |
| Ruido orgánico | Modificador **Noise** (scale, strength, phase, offset) |
| Stagger | Desplazar keys por objeto (script) o Geometry Nodes con offset por índice |
| Follow-through | Keys desfasados 2–4 f en los hijos; constraints (Damped Track, Child Of con influencia); physics (cloth, soft body) |
| Datos o procedural | Drivers (`frame`, propiedades custom) o Geometry Nodes (Scene Time, Simulation Zones) |
| Cámara | Dolly (mover la cámara) ≠ zoom (cambiar `lens`). Ver §4 |
| Reduced motion | Versión alternativa: cámara estática y movimientos de objeto reducidos (render aparte) |

**Nota de convención:** la interpolación y el easing de un key se aplican al **segmento que empieza en ese key** y llega al siguiente.

### 2. Handles para una cubic-bezier exacta

En un segmento A → B con Δt = frames y Δv = cambio de valor:

```
A.handle_right = (tA + x1·Δt, vA + y1·Δv)      handle_right_type = 'FREE'
B.handle_left  = (tA + x2·Δt, vA + y2·Δv)      handle_left_type  = 'FREE'
A.interpolation = 'BEZIER'
```

Las F-curves de Blender son cúbicas en tiempo y en valor, así que esto reproduce la curva CSS de forma exacta en ese segmento. Si hay varios segmentos seguidos, calcula cada uno por separado; los handles AUTO_CLAMPED (por defecto) no respetan tokens.

### 3. Python (bpy) en 4.4+ y 5.x: Slotted Actions

⚠️ **Cambio que rompe scripts antiguos.** Desde 4.4, una Action tiene la estructura `layers → strips → channelbag(slot) → fcurves`. En **5.0 se eliminan `Action.fcurves`, `Action.groups` e `id_root`**. Los scripts antiguos que usan `action.fcurves` fallan en 5.x.

```python
import bpy
from bpy_extras import anim_utils

def channelbag(ob):
    ad = ob.animation_data
    act, slot = ad.action, ad.action_slot
    try:
        return anim_utils.action_get_channelbag_for_slot(act, slot)   # helper 4.4+ (⚠️ verificar disponibilidad)
    except AttributeError:
        return act.layers[0].strips[0].channelbag(slot)                # ruta confirmada

def bezier_token(kpA, kpB, x1, y1, x2, y2):
    """Aplica una cubic-bezier CSS al segmento A→B."""
    tA, vA = kpA.co; tB, vB = kpB.co; dt, dv = tB - tA, vB - vA
    kpA.interpolation = 'BEZIER'
    kpA.handle_right_type = kpB.handle_left_type = 'FREE'
    kpA.handle_right = (tA + x1 * dt, vA + y1 * dv)
    kpB.handle_left  = (tA + x2 * dt, vA + y2 * dv)

fps = bpy.context.scene.render.fps
f = lambda ms: -(-ms * fps // 1000)                       # ceil(ms/1000·fps)

ob = bpy.context.object
ob.location = (0, 0, -0.5); ob.keyframe_insert(data_path="location", index=2, frame=1)
ob.location = (0, 0,  0.0); ob.keyframe_insert(data_path="location", index=2, frame=1 + f(400))

cb = channelbag(ob)
fc = next(fc for fc in cb.fcurves if fc.data_path == "location" and fc.array_index == 2)
k0, k1 = fc.keyframe_points[0], fc.keyframe_points[1]
bezier_token(k0, k1, 0.0, 0.0, 0.3, 1.0)                 # easing.enter.expressive
fc.update()

# Alternativas nativas
# k0.interpolation = 'BACK'; k0.easing = 'EASE_OUT'; k0.back = 1.7
# k0.interpolation = 'ELASTIC'; k0.easing = 'EASE_OUT'; k0.amplitude = 0.3; k0.period = 0.4
# fc.modifiers.new('CYCLES'); m = fc.modifiers.new('NOISE'); m.scale = 20; m.strength = 0.2
# Crear F-curve directamente: act.fcurve_ensure_for_datablock(ob, "rotation_euler", index=2)
```

**Drivers:**

```python
d = ob.driver_add("rotation_euler", 2).driver
d.expression = "sin(frame / 12) * 0.2"                     # 'frame' está disponible en el namespace
```

**Stagger por script** (con tope y en el peor escenario):

```python
objs = sorted(bpy.context.selected_objects, key=lambda o: o.name)
each = min(f(40), f(300) // max(len(objs) - 1, 1))
for i, o in enumerate(objs):
    for fc in channelbag(o).fcurves:
        for kp in fc.keyframe_points:
            kp.co.x += i * each; kp.handle_left.x += i * each; kp.handle_right.x += i * each
```

**Con el MCP de Blender:** ejecuta estos snippets con la herramienta de código, comprueba el resultado con un render del viewport o una captura, y consulta la API instalada (búsqueda en la documentación de Python) antes de usar funciones marcadas con ⚠️.

### 4. Cámara, luz y profundidad

- **Dolly vs zoom** (UX in Motion): el dolly acerca la cámara (la perspectiva cambia: parallax real); el zoom cambia la focal (la perspectiva no cambia, es plano). El *dolly zoom* (vértigo) combina ambos en sentidos opuestos: muy expresivo y **de alto riesgo vestibular**.
- **Movimientos de cámara:** eases largos (Sine o Quad in-out) y sin paradas bruscas. La cámara tiene "masa": nunca un spring rebotón.
- **Rotación y horizonte:** evita el roll continuo y los giros rápidos (mareo). En la variante reducida, cámara fija.
- **Profundidad de campo** para el staging (enfocar al protagonista); los cambios de foco (rack focus) van con ease in-out.
- **Motion blur:** `scene.render.use_motion_blur = True` y `motion_blur_shutter = 0.5` (180°). Disponible en EEVEE y Cycles.
- **Luz:** las animaciones de intensidad y color van en **linear** (effects). Nada de destellos por encima de 3/s.

### 5. Motion graphics procedural (Geometry Nodes)

- **Scene Time** + Math/Noise Texture para offsets por índice (stagger y ondas) sin keyframes.
- **Simulation Zones** (Simulation Input/Output) para movimiento con estado: acumulación, partículas propias, springs por punto.
- **Tipografía:** String to Curves → Instance on Points por carácter → offset por índice (ver `motion/05-tipografia/`).
- Expón los parámetros (each, tope, duración, amplitud) como inputs del modificador. Son los "tokens" de la escena.

---

## checklist

- [ ] Duraciones convertidas desde tokens; fps correcto
- [ ] Curvas: handles FREE de token, o interpolación nativa justificada
- [ ] Scripts compatibles con Slotted Actions (sin `action.fcurves`)
- [ ] Cámara sin roll ni giros bruscos; variante reducida si va a pantalla o producto
- [ ] Motion blur coherente; luz animada en lineal y ≤ 3 destellos/s
- [ ] Render de prueba revisado con `motion/09-critica/`
