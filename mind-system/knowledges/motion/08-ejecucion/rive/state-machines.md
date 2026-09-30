# Patrones de state machine en Rive

## meta

| Campo | Valor |
|-------|-------|
| **Dominio** | motion — ejecución · Rive |
| **Fuente** | Documentación de Rive; práctica propia |
| **Objetivo** | Partir de estructuras probadas de View Model, capas y transiciones |
| **Agent tags** | `#motion` `#rive` `#state-machine` `#patterns` |

---

## concepts

La notación de este documento es:

- `VM{…}`: propiedades del View Model.
- `L:` capa.
- `A → B [condición | mezcla | interpolación]`: transición.

---

## rules

### 1. Botón

```
VM ButtonVM { isHover: bool, isPressed: bool, isDisabled: bool, onSuccess: trigger, reducedMotion: bool (global) }
Timelines: idle, hover, pressed, disabled, success (one-shot), idle_reduced, success_reduced
L: interaction
  Entry → idle
  idle    → hover    [isHover == true   | 110 ms (fast-02) | cubic 0.2,0,0.38,0.9]
  hover   → idle     [isHover == false  | 110 ms]
  hover   → pressed  [isPressed == true | 70 ms (fast-01)]
  pressed → hover    [isPressed == false| 150 ms]
  Any     → disabled [isDisabled == true| 150 ms]
L: feedback
  Entry → empty
  empty → success         [onSuccess && reducedMotion == false | 0 | —]
  empty → success_reduced [onSuccess && reducedMotion == true  | 0 | —]
  success → empty [exit time 100 %]
Listeners: pointer enter/exit sobre el hit area → isHover; down/up → isPressed
```

El hover y el press van por la capa de interacción; el éxito, por la de feedback, así que se pueden combinar.

### 2. Toggle / switch

```
VM ToggleVM { isOn: bool, reducedMotion: bool }
Timelines: off, on (pose)  |  el knob usa Elastic suave (amplitude baja) o Cubic enter.expressive
L: state   off ⇄ on [isOn | 250 ms (spring.spatial.fast aprox.) | cubic 0,0,0.3,1]
L: color   off_color ⇄ on_color [isOn | 110 ms | linear]      ← effects: sin rebote
Reduced: la transición de posición pasa a 0–70 ms; el color se mantiene
```

### 3. Loader → éxito / error

```
VM TaskVM { status: enum(idle, loading, success, error), progress: number 0–1, reducedMotion: bool }
L: main
  idle → loading   [status == loading]
  loading: Blend 1D por progress (determinado) o loop lineal (indeterminado)
  loading → success [status == success | 240 ms] → success (one-shot, check con overshoot) → hold 600 ms
  loading → error   [status == error   | 150 ms] → error (sin shake si reducedMotion)
```

- El loop indeterminado es **lineal** y continuo; no pasa de 3 destellos/s.
- Éxito: transformación (loader → check) + hold (motion.feedback.success).

### 4. Personaje con mirada, parpadeo y reacciones

```
VM CharacterVM { lookX: number -1..1, lookY: number -1..1, mood: enum(neutral, happy, sad, surprised), onWave: trigger, reducedMotion: bool }
L: body     idle_breath (loop 3–4 s, amplitud mínima) ; Any → wave [onWave] → idle
L: gaze     Blend Additive (lookX → look_left/right, lookY → look_up/down)
L: blink    loop con intervalos irregulares (2–6 s) — timeline largo con parpadeos a distinta distancia
L: face     Blend Direct o estados por mood [mood | 200 ms]
Listeners: pointer move sobre el artboard → lookX, lookY (converter: posición → -1..1)
Reduced: la respiración se detiene; el parpadeo se mantiene (es pequeño); el wave pasa a un cambio de pose sin oscilación
```

Principios: follow-through en pelo o accesorios (bones con constraint a strength 0,6–0,8), anticipación antes del wave (retroceso de 2–3 frames) y arcos en la mano (Follow Path o rotaciones encadenadas).

### 5. Icono animado (tab bar, menú)

```
VM IconVM { isActive: bool }
inactive → active [isActive | 240 ms | cubic 0.4,0.14,0.3,1]  (transformación: hamburguesa → X, contorno → relleno)
active → inactive [!isActive | 150 ms | cubic 0.2,0,1,0.9]
```

La salida es más corta que la entrada. En reduced: la misma transformación en 70 ms o un crossfade.

### 6. Onboarding o escena narrativa

```
VM StoryVM { step: number 0..n, playing: bool, reducedMotion: bool }
L: scene  step_0 → step_1 → … [step == i | 400 ms]
L: ambient loops decorativos [playing == true] ; se detienen si playing == false (pausa WCAG)
```

El producto controla `step` (botones HTML accesibles) y `playing` (control de pausa visible).

### 7. Heurísticas generales

- Si una SM tiene más de ~8 estados en una capa, **divídela en capas**.
- Las transiciones sin mezcla (0 ms) solo se usan en cortes intencionados o cuando reducedMotion está activo.
- Los timelines de pose deben ser **cortos (1 frame)** si solo representan un estado; el movimiento lo pone la transición.
- Documenta la SM con esta notación dentro de la Motion Spec (`state_machine`).

---

## checklist

- [ ] Una capa por dimensión independiente
- [ ] Estados = poses estables; las transiciones llevan el movimiento
- [ ] Any State solo para interrupciones globales
- [ ] `reducedMotion` y `paused` en el View Model
