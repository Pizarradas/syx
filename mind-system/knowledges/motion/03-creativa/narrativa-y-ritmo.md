# Narrativa y ritmo

## meta

| Campo | Valor |
|-------|-------|
| **Dominio** | motion — creativa · estructura temporal, beats y música |
| **Fuente** | Austin Shaw — *Design for Motion*; Figma — *Principles in Motion* (match cuts); práctica de montaje |
| **Objetivo** | Estructurar piezas con duración en beats y sincronizarlas con la música y la lectura |
| **Agent tags** | `#motion` `#narrative` `#rhythm` `#video` `#music` |

---

## concepts

En una pieza con duración el tiempo es el material: una idea por beat, holds para leer, transiciones que puntúan y un ritmo que alterna tensión y respiro. En scroll storytelling el usuario controla el tempo, así que se anima el progreso, no el reloj.

---

## rules

### Estructuras por duración

| Duración | Estructura | Notas |
|---|---|---|
| **1–3 s** (logo, ident, sticker) | construcción → resolución → hold | El hold final ≥ 1/3 de la duración |
| **6 s** (bumper) | hook (0–1,5) → mensaje (1,5–4,5) → marca (4,5–6) | Una sola idea |
| **15 s** (social) | hook (0–2) → desarrollo (2–11) → resolución (11–13,5) → end card (13,5–15) | El hook decide si se sigue viendo; debe entenderse sin sonido |
| **30 s** | hook → problema → giro → solución → prueba → CTA/end card | 5–7 beats |
| **60–120 s** (explainer) | contexto → problema → solución (3 pasos) → beneficio → CTA | Un beat cada 5–10 s; dejar respirar |
| **Scroll storytelling** | una sección = un beat | El usuario controla el tempo; anima el progreso, no el tiempo |
| **Onboarding** | 3–5 pantallas, un concepto por pantalla | Saltable siempre |

### Plantilla de beats

```yaml
- beat: hook
  from_ms: 0
  to_ms: 2000
  idea: "Una sola frase"
  visual: "Qué se ve"
  motion: "Verbo + material; token o spec"
  audio: "Acento en 0 y en 1500"
  text: { words: 4, hold_worst_case_ms: 2200 }   # ver motion-typography
  transition_out: match-cut | cut | fade | wipe | mask
```

### Transiciones como puntuación

| Transición | Equivale a | Uso |
|---|---|---|
| Corte seco | punto | Cambio de idea; ritmo |
| Match cut (por forma, movimiento o color) | "y entonces…" | Continuidad entre ideas; se corta en el punto de máxima velocidad |
| Fundido cruzado | coma larga | Paso del tiempo, suavidad |
| Fundido a negro o color | punto y aparte | Cierre de capítulo |
| Wipe / máscara | "mientras tanto", "por otro lado" | Comparación, cambio de tema |
| Zoom a través (dolly-through) | "dentro de esto…" | Ir al detalle |
| Smash cut | contraste brusco | Humor, sorpresa |

### Música y sincronía

- Beat: `60000 / BPM` ms. Tabla rápida:

  | BPM | ms/beat | frames @25 | frames @30 |
  |---|---|---|---|
  | 90 | 667 | 16,7 | 20 |
  | 100 | 600 | 15 | 18 |
  | 120 | 500 | 12,5 | 15 |
  | 128 | 469 | 11,7 | 14 |
  | 140 | 429 | 10,7 | 12,9 |

- **Jerarquía de sincronía**: los cambios de escena, en el downbeat (cada 4 u 8 beats); los acentos visuales, en el beat; los detalles, en subdivisiones.
- No sincronices **todo**: si todo cae en el beat, se vuelve mecánico. Deja movimientos "libres" entre acentos.
- Impactos 1–2 frames antes del beat (práctica común).
- **Sin sonido**: en social, gran parte de las reproducciones son sin audio. El ritmo debe funcionar visualmente, y el texto lleva el mensaje.

### Ritmo visual

- **Tensión y relajación**: alterna secuencias densas y rápidas con holds limpios.
- **Regla del contraste**: un momento solo es rápido si hay lentos alrededor.
- **Aceleración narrativa**: acorta los beats progresivamente hacia el clímax y deja un hold largo en la resolución.
- **Respiración**: tras un movimiento grande, 6–12 frames de hold para que se registre (principio *hold*).

---

## checklist

- [ ] Una idea por beat
- [ ] Holds de texto calculados en el peor escenario
- [ ] Hook comprensible sin sonido
- [ ] Acentos en el beat o 1–2 frames antes, sin sincronizarlo todo
- [ ] Hold final ≥ 1/3 en logos e idents
