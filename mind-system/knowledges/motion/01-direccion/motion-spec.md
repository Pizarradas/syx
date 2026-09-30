# Motion Spec — la lengua franca del movimiento

## meta

| Campo | Valor |
|-------|-------|
| **Dominio** | motion — dirección · especificación independiente de la herramienta |
| **Fuente** | Síntesis propia del sistema sobre Material 2/3, Carbon, Fluent 2, Apple HIG y UX in Motion (ver `motion/00-indice/fuentes.md`) |
| **Objetivo** | Describir qué se mueve, por qué, cómo se siente y con qué valores antes de implementarlo, para que cada herramienta traduzca la misma decisión |
| **Agent tags** | `#motion` `#spec` `#handoff` `#choreography` |

---

## concepts

La Motion Spec describe **qué** se mueve, **por qué**, **cómo se siente** y **con qué valores**, sin atarse a ninguna herramienta. Los módulos de ejecución la traducen. Si una traducción pierde fidelidad, el módulo de ejecución lo anota en `implementation_notes`.

### La spec en SYX

La spec cumple para el movimiento el papel que `_agents/decision-record.md` cumple para una decisión de diseño: deja escrito el porqué para que la siguiente persona pueda aceptarlo o rechazarlo. El bloque `exceptions` es la **desviación declarada** de CREATIVE; no autoriza nada por encima del escalón 6 de la escalera (`mind-system/README.md`). En un pipeline `[SYX: CREATIVE → TOKEN → UI]` la spec es el handoff: TOKEN la lee para ver qué duraciones y curvas existen ya en `tokens.json`, y UI la implementa con los mixins.

---

## rules

### Esquema (YAML)

```yaml
motion_spec: "1.0"
id: card-to-detail                # kebab-case, único
title: Tarjeta → detalle de artículo

intent:
  purpose: continuity             # continuity | feedback | orientation | attention | hierarchy | narrative | delight | data | brand
  message: "El detalle ES la tarjeta, ampliada; el usuario no pierde el contexto."
  if_removed: "El usuario pierde la relación entre la lista y el detalle."   # prueba de propósito

context:
  medium: ui                      # ui | web-narrative | video | social | broadcast | installation | 3d
  platform: web                   # web | ios | android | desktop | video | multi
  interaction: non-realtime       # realtime (gesto directo) | non-realtime (transición) | scroll-linked | ambient | linear (vídeo)
  frequency: high                 # high (decenas de veces por sesión) | medium | low (una vez)
  target_fps: 60

character:
  style: productive               # productive | expressive
  axes:                           # 1–5, ver motion-creative
    energy: 3
    weight: 2
    elasticity: 2
    precision: 4
    formality: 3
  keywords: [preciso, fluido, sin rebote]

choreography:
  pattern: container-transform    # ver motion/02-proposito/patrones-de-transicion.md
  sequence:
    - element: card
      role: hero                  # hero | support | background
      properties:
        bounds: [card, detail]    # posición + tamaño
        corner-radius: [12, 0]
      timing:
        token: motion.transition.expand     # preferible: token semántico
        # o valores crudos (solo si es una excepción documentada):
        # duration: 400
        # easing: [0.2, 0, 0, 1]
        # spring: { duration: 450, bounce: 0.1 }
      start: 0                    # ms relativos al inicio
    - element: detail-content
      role: support
      properties: { opacity: [0, 1], translateY: [16, 0] }
      timing: { token: motion.enter.small }
      start: "after:card@60%"     # relativo: empieza al 60 % de card
      stagger: { each: 40, from: start, max_total: 240 }
  total_duration_worst_case: 640  # ms con el nº máximo de elementos

accessibility:
  reduced_motion: replace         # replace | reduce | remove | keep
  reduced_variant: "Crossfade de 150 ms entre tarjeta y detalle, sin escala ni desplazamiento."
  flashes_per_second: 0
  autoplay_over_5s: false
  pausable: n/a
  vestibular_risk: medium         # low | medium | high (escalas grandes, zoom, parallax, rotación)

exceptions:                       # para romper un nivel de precedencia
  - rule: "tokens"
    reason: "Hero de campaña: se necesita un overshoot más marcado que el del sistema."
    scope: "solo landing de campaña"
    value: { spring: { duration: 500, bounce: 0.3 } }

targets: [web-css, web-js]        # módulos de ejecución destino
implementation_notes:             # las rellena el módulo de ejecución
  - "web-css: spring aproximado con linear() de 40 muestras; sin herencia de velocidad."

acceptance:
  - "No hay saltos de velocidad al interrumpir con 'atrás'."
  - "A 0,25x, el contenido no aparece antes de que la tarjeta cubra el 60 %."
  - "La variante reducida no contiene transform de escala."
```

### Reglas

- `timing` usa **token** siempre que exista. Los valores crudos solo aparecen en `exceptions` o si el proyecto no tiene sistema; en ese caso, se proponen como tokens nuevos.
- Los tiempos relativos (`after:X@60%`, `with:X`, `before:X-100`) se traducen a la posición de timeline de cada herramienta (GSAP `"<"`, `"-=0.1"`; AE/Cavalry: offset en frames; Rive: capas o timelines anidados).
- `total_duration_worst_case` es obligatorio si hay stagger o listas de longitud variable.
- `if_removed` es la prueba de propósito: si la respuesta es "nada", la animación sobra o debe reducirse.

### Variantes por medio

**Vídeo o motion graphics** (medium: video):

```yaml
context: { medium: video, fps: 25, resolution: [1920,1080], duration_s: 15, audio: { bpm: 120, beats_ms: 500 } }
structure:                        # ver motion/03-creativa/narrativa-y-ritmo.md
  - { beat: hook,    from: 0,     to: 2000,  goal: "romper el scroll" }
  - { beat: develop, from: 2000,  to: 11000 }
  - { beat: resolve, from: 11000, to: 13500 }
  - { beat: endcard, from: 13500, to: 15000, hold_min: 1500 }
text_holds: "motion-typography: tiempo de lectura en el peor escenario"
safe_areas: { title: 0.9, action: 0.93 }   # o las guías de la red social
```

**Rive interactivo** (targets: [rive]):

```yaml
state_machine:
  name: Button
  states: [idle, hover, pressed, disabled, success]
  data_binding:                   # view model
    viewModel: ButtonVM
    properties: { isHover: boolean, isPressed: boolean, progress: number, onSuccess: trigger, reducedMotion: boolean }
  transitions:
    - { from: idle, to: hover,   when: "isHover == true", duration: motion.feedback.hover }
    - { from: any,  to: success, when: "onSuccess",       duration: motion.feedback.success }
```

**3D** (targets: [blender]):

```yaml
camera: { move: dolly-in, lens_mm: 50, from: [0,-8,1.6], to: [0,-5,1.6] }   # dolly ≠ zoom
render: { fps: 24, motion_blur: { shutter: 0.5 } }
```

### Mini-spec (recorridos rápido y exploratorio)

```
[id] propósito · carácter · patrón · token(s) · reducida: <variante> · destino
card-hover · feedback · productive/snappy · lift · motion.feedback.hover · reducida: sin translate, solo sombra · web-css
```

---

## checklist

- [ ] `intent.if_removed` tiene respuesta; si es «nada», la animación sobra
- [ ] Cada `timing` cita un token, o su valor crudo vive en `exceptions` con motivo y alcance
- [ ] `total_duration_worst_case` calculado con el n máximo si hay stagger
- [ ] Bloque `accessibility` completo, con variante reducida descrita
- [ ] `acceptance` con criterios verificables
