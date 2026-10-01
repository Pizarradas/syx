# Escala de motion — tokens de referencia

## meta

| Campo | Valor |
|-------|-------|
| **Dominio** | motion — sistema · duraciones, curvas y springs canónicos |
| **Fuente** | IBM Carbon (motion tokens); Material Design 1 y 3 Expressive; W3C Design Tokens (DTCG) |
| **Objetivo** | Dar una escala razonada de duraciones, curvas y springs para argumentar decisiones y tokens nuevos, y traducirla a cada plataforma |
| **Agent tags** | `#motion` `#tokens` `#duration` `#easing` `#springs` `#dtcg` |

---

## concepts

Todas los demás módulos citan valores **por nombre de token**. Aquí viven los números. Si un valor no existe, se propone como token nuevo; nunca se escribe un valor suelto en la implementación sin dejarlo documentado.

### 1. Arquitectura en tres capas

```
Primitivos                  →  Semánticos               →  Componente
duration.moderate-02           motion.enter.medium          dialog.enter
easing.enter.productive        motion.move.within           tabs.indicator
spring.spatial.default         motion.transition.expand     sheet.drag-release
```

- **Primitivos:** la escala numérica pura, sin intención. No se usan directamente en componentes.
- **Semánticos:** una **intención** (entrar, salir, mover, feedback, expandir, énfasis) + tamaño o contexto. Combinan duración, easing o spring y retardo. **Es la capa que citan las specs.**
- **Componente:** un alias semántico para un componente concreto, solo cuando se desvía o necesita su propio nombre.

### 2. Ejes de clasificación (Carbon × Material 3)

- **Estilo:** `productive` (tarea, discreto) · `expressive` (momentos importantes).
- **Tipo:** `spatial` (posición, tamaño, rotación, radio; **puede** rebotar) · `effects` (color, opacidad, blur; **nunca** rebota, curva lineal o ζ = 1).
- **Velocidad o tamaño:** `fast` · `default` · `slow`, según el tamaño del elemento y la distancia.

Nombre semántico: `motion.<intención>.<tamaño|contexto>[.<estilo>]`, por ejemplo `motion.enter.large.expressive`.

### Relación con los tokens de SYX

Esta escala es **de referencia**. En SYX los valores que se compilan viven en `tokens.json` y en `scss/abstracts/tokens/semantic/_motion.scss` (`--semantic-duration-instant|fast|base|slow`, `--semantic-easing-standard|out|in-out|linear`), y la escalera de precedencia (`mind-system/README.md`) los pone por encima de cualquier módulo del córtex. Por tanto:

- Donde este módulo dice «fuente única de verdad», en SYX se lee: fuente del **razonamiento**. La del **valor** es `tokens.json`.
- Un valor de esta escala que no exista en SYX no se escribe en un componente: se propone a TOKEN (de componente, vía `pr`; semántico o primitivo, lo añade una persona, según `contracts/trust.json`).
- Los nombres `motion.enter.small`, `duration.moderate-02`… son el vocabulario de la Motion Spec y de las herramientas que viven fuera del repositorio (Rive, AE, Cavalry, Blender). No son nombres SYX y no aparecen como custom properties en `scss/`.
- La regla 6 (una excepción repetida tres veces se convierte en token) es, en SYX, una propuesta a TOKEN, nunca un alta directa.
- La correspondencia valor a valor, con sus huecos, está en §6 (*Mapeo a los tokens de SYX*).

### Módulos relacionados

- `motion/06-sistema/escala.tokens.json` — la escala completa en formato DTCG, con la equivalencia física de cada spring.
- `motion/06-sistema/mapeo-por-plataforma.md` — traducción a CSS/SCSS, JS, GSAP, Motion, Rive, AE, Cavalry, Blender, SwiftUI, Compose y Lottie.

---

## rules

### 3. Valores canónicos (resumen)

El set completo en formato DTCG está en `motion/06-sistema/escala.tokens.json`.

**Duraciones (primitivos):**

| Token | ms | Uso típico |
|---|---|---|
| `duration.instant` | 0 | Cambios sin transición; modo reducido |
| `duration.fast-01` | 70 | Press, toggles, micro-feedback |
| `duration.fast-02` | 110 | Fades pequeños, hover |
| `duration.moderate-01` | 150 | Expansiones pequeñas, tooltips |
| `duration.moderate-02` | 240 | Toasts, expansiones, entradas estándar |
| `duration.slow-01` | 400 | Expansiones grandes, transiciones de pantalla |
| `duration.slow-02` | 700 | Scrims, fondos, momentos expresivos |
| `duration.long-01` | 1000 | Narrativo/marca, value change grande |
| `duration.long-02` | 1500 | Loops lentos, shimmer, respiración |

**Curvas (primitivos):**

| Token | cubic-bezier |
|---|---|
| `easing.linear` | (0, 0, 1, 1) |
| `easing.standard.productive` | (0.2, 0, 0.38, 0.9) |
| `easing.enter.productive` | (0, 0, 0.38, 0.9) |
| `easing.exit.productive` | (0.2, 0, 1, 0.9) |
| `easing.standard.expressive` | (0.4, 0.14, 0.3, 1) |
| `easing.enter.expressive` | (0, 0, 0.3, 1) |
| `easing.exit.expressive` | (0.4, 0.14, 1, 1) |
| `easing.emphasized.enter` | (0.05, 0.7, 0.1, 1) |
| `easing.emphasized.exit` | (0.3, 0, 0.8, 0.15) |
| `easing.overshoot` | (0.34, 1.56, 0.64, 1) |

**Springs (primitivos, perceptuales, con su equivalente físico en tokens.json):**

| Token | duration | bounce | Uso |
|---|---|---|---|
| `spring.effects` | 200 ms | 0 | Color y opacidad cuando se usa spring |
| `spring.spatial.fast` | 250 ms | 0 | Toggles, controles pequeños |
| `spring.spatial.default` | 400 ms | 0,1 | Sheets, tarjetas, reordenar |
| `spring.spatial.slow` | 600 ms | 0,1 | Superficies grandes |
| `spring.expressive.default` | 450 ms | 0,25 | Momentos de marca y éxito |
| `spring.expressive.bouncy` | 500 ms | 0,35 | Lúdico; nunca en UI de alta frecuencia |

**Stagger:** `stagger.tight` 20 ms · `stagger.default` 40 ms · `stagger.loose` 80 ms · `stagger.max-total.productive` 300 ms · `stagger.max-total.expressive` 600 ms.

**Semánticos principales:**

| Token | Composición |
|---|---|
| `motion.feedback.press` | fast-01 + standard.productive |
| `motion.feedback.hover` | fast-02 + standard.productive (color: linear) |
| `motion.enter.small` | moderate-01 + enter.productive |
| `motion.exit.small` | fast-02 + exit.productive |
| `motion.enter.medium` | moderate-02 + enter.productive |
| `motion.exit.medium` | moderate-01 + exit.productive |
| `motion.move.within` | moderate-02 + standard.productive |
| `motion.transition.expand` | slow-01 + standard.expressive (o spring.spatial.default) |
| `motion.transition.page` | slow-01 + emphasized.enter / emphasized.exit |
| `motion.overlay.scrim` | slow-02 + linear |
| `motion.feedback.success` | spring.expressive.default + hold 600 ms |
| `motion.loop.spinner` | long-01 + linear, infinito |
| `motion.loop.shimmer` | long-02 + linear, infinito |
| `motion.value.change` | long-01 + enter.expressive |
| `motion.reduced.crossfade` | moderate-01 + linear, solo opacidad |

### 4. Reglas del sistema

1. Las **salidas** son más cortas que las entradas (≈ 75–85 %) y usan la curva `exit`.
2. **Effects nunca rebotan.** Si un componente mezcla spatial y effects, cada propiedad lleva su token.
3. **Expressive**: como mucho un momento expressive simultáneo por pantalla.
4. **Escalado por plataforma:** multiplicadores globales, no tokens nuevos. Tablet ×1,3; wearable ×0,7; escritorio ×0,8 en micro y transiciones. Vídeo y narrativa no escalan: usan su propio timing.
5. **Modo reducido:** cada semántico spatial tiene su pareja `reduced` (normalmente `motion.reduced.crossfade` o `duration.instant`). Lo define `motion/07-accesibilidad/`.
6. **Excepciones:** una spec puede usar valores fuera de tokens solo en su bloque `exceptions`, con motivo y alcance. Si la misma excepción aparece tres veces, se convierte en token.
7. **Tokens de marca:** `motion/03-creativa/` puede redefinir las curvas `brand.*` y aplicar un multiplicador de tiempos. No se toca la estructura.

### 5. Exportación

`motion/06-sistema/mapeo-por-plataforma.md` tiene la traducción de los tokens a cada destino: CSS custom properties y SCSS (compatible con arquitecturas primitivos → semánticos → componentes), JS/TS, GSAP (CustomEase), Motion, Rive (valores Cubic y data binding), Cavalry, AE (influence), Blender (handles), SwiftUI y Compose.

### 6. Mapeo a los tokens de SYX

Lo que hoy compila SYX es una escala corta: cuatro duraciones y cuatro curvas, todas semánticas, sin tier primitivo de motion. Un tema puede redefinirlas en su `_theme.scss` y `prefers-reduced-motion` las lleva a `0.01ms`. La escala de referencia es más fina; esta tabla dice qué token SYX usar para cada valor de referencia y dónde no hay ninguno. Valores de SYX a fecha de este acople: compruébalos con `get_token` antes de razonar con ellos.

**Duraciones**

| Referencia | ms | Token SYX | ms SYX | Correspondencia |
|---|---|---|---|---|
| `duration.instant` | 0 | — | — | Sin token. El modo reducido ya lleva las cuatro duraciones a `0.01ms` |
| `duration.fast-01` | 70 | `--semantic-duration-instant` | 80 | Equivalente (+10 ms, imperceptible) |
| `duration.fast-02` | 110 | — | — | **Hueco.** Se resuelve con `-instant` (hover muy seco) o `-fast` (el caso común) |
| `duration.moderate-01` | 150 | `--semantic-duration-fast` | 150 | Exacto |
| `duration.moderate-02` | 240 | `--semantic-duration-base` | 250 | Equivalente |
| `duration.slow-01` | 400 | `--semantic-duration-slow` | 400 | Exacto |
| `duration.slow-02` | 700 | — | — | **Hueco.** Scrims y momentos *expressive* |
| `duration.long-01` / `long-02` | 1000 / 1500 | — | — | **Hueco.** Value change, spinners, shimmer. Hoy se resuelven con tokens de componente (p. ej. `--component-hero-figure-build-duration`) |

**Curvas**

| Referencia | cubic-bezier | Token SYX | Correspondencia |
|---|---|---|---|
| `easing.linear` | (0, 0, 1, 1) | `--semantic-easing-linear` | Exacto |
| `easing.enter.productive` · `enter.expressive` · `emphasized.enter` | (0, 0, 0.38, 0.9) · (0, 0, 0.3, 1) · (0.05, 0.7, 0.1, 1) | `--semantic-easing-out` = (0.16, 1, 0.3, 1) | Misma función (entrar y asentarse), **más agresiva** que las productive: es un expo-out, cercano a `emphasized.enter`. En UI de alta frecuencia se nota como «llega de golpe y frena» |
| `easing.standard.productive` · `standard.expressive` | (0.2, 0, 0.38, 0.9) · (0.4, 0.14, 0.3, 1) | `--semantic-easing-in-out` = `ease-in-out` (0.42, 0, 0.58, 1) | Aproximada: simétrica donde la referencia es asimétrica |
| — | — | `--semantic-easing-standard` = `ease` (0.25, 0.1, 0.25, 1) | Sin par en la referencia. Es el valor por defecto de SYX y el que usan hoy las salidas y buena parte de los colores |
| `easing.exit.productive` · `exit.expressive` · `emphasized.exit` | (0.2, 0, 1, 0.9) · (0.4, 0.14, 1, 1) · (0.3, 0, 0.8, 0.15) | — | **Hueco.** No hay curva de salida (ease-in). Se usa `--semantic-easing-standard` |
| `easing.overshoot` | (0.34, 1.56, 0.64, 1) | — | Sin token, **a propósito**: es *expressive*, no un valor de producción por defecto |

**Springs y stagger.** SYX es CSS puro y no tiene ninguno de los dos. Un spring en CSS es un `linear()` con duración fija de asentamiento (`motion/08-ejecucion/css/css.md`, §5); un stagger es un `transition-delay` por índice con tope. Mientras solo los use un componente, son tokens de ese componente.

**Intenciones semánticas → composición con tokens SYX**

| Intención (referencia) | Duración SYX | Curva SYX |
|---|---|---|
| `motion.feedback.press` | `-instant` | `-standard` |
| `motion.feedback.hover` | `-fast` | `-linear` en color · `-standard` en transform |
| `motion.enter.small` · `enter.medium` | `-fast` · `-base` | `-out` |
| `motion.exit.small` · `exit.medium` | `-instant` · `-fast` | `-standard` (hueco de curva de salida) |
| `motion.move.within` | `-base` | `-in-out` |
| `motion.transition.expand` · `transition.page` | `-slow` | `-out` al entrar · `-in-out` al desplazarse |
| `motion.overlay.scrim` · `feedback.success` · `loop.*` · `value.change` | — | — (huecos de duración larga) |
| `motion.reduced.crossfade` | `-fast` | `-linear` — ver la nota sobre el mixin, abajo |

**Huecos, por prioridad.** Son recomendaciones para TOKEN; los tokens semánticos los añade una persona (`contracts/trust.json`), y el principio de TOKEN es no crear tokens especulativos:

<!-- syx: ejemplo-nuevo -->
1. **`--semantic-easing-in`** (curva de salida, p. ej. `cubic-bezier(0.4, 0, 1, 1)`). Es el único hueco que ya citan una regla operativa (tabla §5 de `_agents/modes/ui.md`) y el suelo `ui/motion-principles.md`. Todas las salidas del sistema usan hoy una curva que no es de salida.
2. **Una duración larga** (≈ 700 ms) **cuando un segundo componente la pida.** Hasta entonces, token de componente.
3. **Overshoot y springs:** no hacen falta como semánticos. Si una marca los adopta, entran como redefinición de tema (BRAND → THEME), no como tier nuevo.

**Nota sobre el mixin.** `@include transition()` emite `transition: none` bajo `prefers-reduced-motion: reduce`: elimina también los cambios de color y opacidad, que `motion/07-accesibilidad/` considera *effects* y mantendría. Es decir, en componentes SYX la estrategia reducida es siempre `remove`. Si alguna vez se quiere `replace` (conservar los effects y quitar solo lo espacial), el cambio es del mixin, en `scss/abstracts/mixins/`, que es tier `human`.

---

## checklist

### Qué entrega

- [ ] Token(s) asignado(s) a cada propiedad de la spec.
- [ ] Nuevos tokens propuestos (con nombre, valor y justificación).
- [ ] Excepciones aceptadas o rechazadas.

- [ ] Cada propiedad de la spec tiene token asignado (o excepción documentada)
- [ ] Spatial y effects llevan cada uno su token; effects no rebota
- [ ] Salidas ≈ 75–85 % de las entradas
- [ ] Como mucho un momento expressive simultáneo por pantalla
- [ ] En código SYX, el valor sale de `tokens.json`, no de esta escala
