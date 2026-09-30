# Teoría del movimiento

## meta

| Campo | Valor |
|-------|-------|
| **Dominio** | motion — teoría · física y oficio, independiente de la herramienta |
| **Fuente** | Johnston & Thomas — *The Illusion of Life*; Richard Williams — *The Animator's Survival Kit*; Robert Penner — *Tweening*; Apple WWDC23 — *Animate with springs*; Material Design 1/3 |
| **Objetivo** | Elegir y justificar curvas, duraciones y springs, y traducir un carácter a parámetros físicos |
| **Agent tags** | `#motion` `#easing` `#springs` `#timing` `#principles` `#physics` |

---

## concepts

La física y el oficio del movimiento. Este módulo no decide **para qué** se mueve algo (eso es `motion/02-proposito/` o `motion/03-creativa/`), ni **qué valores exactos** usa el sistema (eso es `motion/06-sistema/`). Decide **qué comportamiento físico** comunica mejor la intención y el carácter.

### Modelo mental

El movimiento tiene tres capas y conviene razonarlas en este orden:

1. **Timing:** cuánto dura. Comunica peso, importancia y urgencia.
2. **Spacing:** cómo se reparten los frames dentro de esa duración (el easing). Comunica fuerza, fricción e intención.
3. **Forma o trayectoria:** por dónde va (arcos, deformación, follow-through). Comunica naturaleza, organicidad y vida.

Un mismo desplazamiento de 300 ms puede transmitir torpeza, prisa o elegancia solo cambiando el spacing.

### Relación con `ui/motion-principles.md`

`ui/motion-principles.md` es el **suelo físico** de la interfaz web en SYX: propiedades del compositor, nada de `transition: all`, reduced motion por mixin, salidas más cortas. Este estrato es la teoría completa de la que ese suelo es un resumen aplicado. Si algún día dicen cosas distintas, es un error de uno de los dos y se corrige; mientras tanto, para código de `scss/` manda el suelo.

### Módulos relacionados

- `motion/04-teoria/principios.md` — los 12 principios + los 10 del motion design, por medio.
- `motion/04-teoria/easing.md` — anatomía, catálogo cubic-bezier, Penner, JCGT y `linear()`.
- `motion/04-teoria/springs.md` — física, duration + bounce y equivalencias.
- `motion/04-teoria/timing.md` — timing, spacing, stagger, ritmo, audio y frame rate.

---

## rules

### Decisiones rápidas

**Easing según qué ocurre**

| Situación | Curva | Por qué |
|---|---|---|
| Algo **entra** y se asienta | ease-out (decelerate) | Llega con energía y frena. Se percibe rápido. |
| Algo **sale** de escena | ease-in (accelerate) | Arranca despacio y se va. No compite con lo que entra. |
| Algo **se mueve** entre dos posiciones visibles | ease-in-out (standard) | Arranque y llegada naturales. |
| Respuesta a una interacción | ease-out o spring | La respuesta inmediata se siente ágil. |
| Color, opacidad, luz, brillo | **linear** o casi lineal | Con easing, la mezcla resulta desigual. |
| Rotación continua, spinners, barras indeterminadas | linear | Ritmo constante. |
| Arrastre o gesto directo | **sin easing**, 1:1 con el dedo o cursor; al soltar, spring con la velocidad heredada | Manipulación directa. |
| Pausas deliberadas, ritmo stop-motion | hold / step | Ritmo intencionado. |

**¿Curva o spring?**

- Usa **spring** si la animación puede interrumpirse o redirigirse, hereda velocidad de un gesto, o debe sentirse física (UI moderna, Rive interactivo, Motion, SwiftUI, Compose).
- Usa **curva** si la duración tiene que ser exacta y predecible (vídeo, sincronía con audio, timelines coreografiados, CSS puro, Lottie), o si se trata de propiedades de efecto (color, opacidad).
- Regla de Material 3: los springs **spatial** (posición, tamaño, rotación, radio) pueden rebotar; los **effects** (color, opacidad) nunca.

**Duraciones de referencia** (los valores concretos están en `motion/06-sistema/`):

- < 100 ms: se percibe como instantáneo.
- 70–150 ms: micro (press, toggle, fades pequeños).
- 150–300 ms: UI estándar. Las interacciones, idealmente < 300 ms.
- 300–400 ms: transiciones grandes. Más de 400 ms en UI de uso frecuente empieza a sentirse lento.
- 400–700 ms o más: elementos muy grandes, fondos y momentos expresivos.
- En vídeo o narrativa no hay techo: el timing sirve al ritmo y a la lectura.

La duración **crece con la distancia y el tamaño** (Material, Fluent). Las entradas suelen durar un poco más que las salidas (Material 1: entrar 225 ms, salir 195 ms). Por dispositivo: tablet +30 %, wearable −30 %, escritorio 150–200 ms.

### Los principios como herramientas de decisión

Cuando algo "no funciona", repasa esta lista y pregúntate cuál falta o sobra (el detalle, con valores, está en `motion/04-teoria/principios.md`):

- **Squash & stretch**: peso y materialidad; conserva el volumen.
- **Anticipation**: prepara al ojo; un pequeño movimiento en sentido contrario, o un wind-up (Y < 0 en la bezier).
- **Staging**: una cosa importante a la vez; lo demás se calma.
- **Straight ahead vs pose to pose**: en UI casi siempre pose to pose (estados clave e interpolación).
- **Follow through & overlapping**: las partes no empiezan ni acaban a la vez. Genera jerarquía.
- **Slow in / slow out**: el easing.
- **Arcs**: las trayectorias naturales curvan.
- **Secondary action**: refuerza sin robar protagonismo (confeti, destello, partícula).
- **Timing**: nº de frames = peso, velocidad y tono.
- **Exaggeration**: amplifica la idea sin romper la credibilidad del medio.
- **Solid drawing**: volumen, sombras, perspectiva; en UI, capas y elevación.
- **Appeal**: carisma y claridad de lectura.

Añadidos del motion design contemporáneo: **hold** (pausa para registrar lo que ha pasado), **settle** (el pequeño asentamiento final), **overshoot**, **masa y peso**, **smears**, **match cuts**.

### Traducir carácter a física

`motion/03-creativa/` entrega unos ejes de 1 a 5. Esta tabla los convierte en parámetros iniciales, que después se ajustan con tokens:

| Eje | 1 | 5 | Parámetro afectado |
|---|---|---|---|
| Energía | calmada | enérgica | duración ↓, curva más agresiva (sine → quint → expo) |
| Peso | ligera | pesada | inercia ↑: ease-in más largo al arrancar, anticipación, masa ↑ |
| Elasticidad | rígida | elástica | bounce 0 → 0,3 (0,4 o más es exagerado); overshoot |
| Precisión | orgánica | mecánica | orgánica: arcos, overlap, variación; mecánica: rectas, sincronía, curvas simétricas |
| Formalidad | lúdica | formal | lúdica: squash, secondary, exageración; formal: contención y *productive* |

---

## checklist

### Qué entrega

Para cada elemento de la spec:

```
curva/spring elegido + justificación en una línea + principio(s) aplicados
p. ej.: spring {duration: 350, bounce: 0.15} — entra por gesto (hereda velocidad); bounce ágil y no infantil; follow-through en icono (+40 ms)
```

Después, `motion/06-sistema/` confirma o mapea a un token.
