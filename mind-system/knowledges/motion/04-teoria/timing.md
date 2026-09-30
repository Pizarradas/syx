# Timing, spacing y ritmo

## meta

| Campo | Valor |
|-------|-------|
| **Dominio** | motion — teoría · tiempo y reparto de frames |
| **Fuente** | Richard Williams — *The Animator's Survival Kit*; Material Design 1; Microsoft Fluent 2; Apple HIG |
| **Objetivo** | Convertir duraciones, repartir frames, acotar staggers y sincronizar con audio y frame rate |
| **Agent tags** | `#motion` `#timing` `#spacing` `#stagger` `#fps` |

---

## concepts

### Timing

- **Más frames significa movimiento más lento.** El nº de frames controla la velocidad, el peso y el tono: rápido transmite urgencia; lento, peso o drama.
- Conversión: `frames = ceil(ms/1000 × fps)` y `ms = frames/fps × 1000`.

| ms | 24 fps | 25 fps | 30 fps | 60 fps |
|---|---|---|---|---|
| 100 | 3 | 3 | 3 | 6 |
| 150 | 4 | 4 | 5 | 9 |
| 200 | 5 | 5 | 6 | 12 |
| 300 | 8 | 8 | 9 | 18 |
| 400 | 10 | 10 | 12 | 24 |
| 500 | 12 | 13 | 15 | 30 |
| 1000 | 24 | 25 | 30 | 60 |

- **Animar "de 1" o "de 2"**: en animación clásica, un dibujo por frame (1s) o cada dos (2s). Los 2s dan un carácter más gráfico y artesanal; en digital se imitan con hold, step o posterize (AE `posterizeTime(12)`, Blender modificador Stepped, CSS `steps()`).

### Spacing

La distancia entre posiciones consecutivas. Posiciones juntas = lento; separadas = rápido.

- **Carta de spacing** (Williams): dibuja el trayecto y marca dónde cae cada frame. Es la forma más honesta de diseñar un ease.
- **Breakdown**: el frame intermedio entre dos keys. Si se desplaza hacia un extremo, el movimiento cobra carácter ("favor" del key A o del B).
- **Ley de la inercia**: los objetos pesados tardan en arrancar y en frenar (spacing apretado en los extremos); los ligeros cambian rápido.

---

## rules

### Duración según distancia y tamaño

Material y Fluent coinciden en que la duración crece con la distancia recorrida y con el tamaño del elemento.

Heurística de este sistema (propia, a validar con la vista):

```
duración ≈ base × (distancia / distancia_ref) ^ 0.5, acotada a [min, max] del nivel de token
p. ej. base = 240 ms, distancia_ref = 200 px → 800 px da ≈ 480 ms → se acota a 400 ms (slow-01)
```

Motivo de la raíz: al doblar la distancia no conviene doblar el tiempo. Lo que se busca es que la velocidad percibida sea parecida.

### Ajustes por dispositivo (Material 1)

- Móvil: base 300 ms; pantalla completa 375 ms; entrada 225 ms; salida 195 ms.
- Tablet: +30 %. Wearable: −30 %. Escritorio: 150–200 ms. Más de 400 ms se siente lento en UI.

### Stagger y offset

- Desfase típico entre elementos hermanos en UI: **20–60 ms**. En vídeo: **1–4 frames**.
- **Tope obligatorio**: `stagger_total = min(each × (n−1), max_total)`. Si hay más elementos, se reduce `each` o se agrupan. `max_total` recomendado: 300 ms en UI de tarea y 500–800 ms en momentos expresivos.
- Cálculo en el peor escenario: se hace con la n máxima que admite la lista, no con la del mockup.
- El stagger también puede tener su propio easing (repartir los desfases con un ease-in agrupa las primeras entradas y espacia las últimas; con un ease-out, al revés). Ver `motion/05-tipografia/`.

### Ritmo

- El ritmo es la alternancia de **movimiento y pausa**, no la velocidad. Sin holds no hay ritmo, solo ruido.
- **Contraste**: un movimiento rápido se percibe más rápido si viene tras uno lento. Alterna tempos para crear énfasis.
- **Patrones**: regular (marcha, corporativo), acelerando (tensión), desacelerando (resolución), sincopado (energía, sorpresa).

### Audio

- Beat en ms: `60000 / BPM`. A 120 BPM, 500 ms = 12 f @24, 12,5 f @25, 15 f @30.
- Colocar los impactos visuales **en el beat**, o 1–2 frames antes: es práctica común, porque el ojo integra el estímulo algo más tarde que el oído.
- Subdivisiones útiles: 1/2 beat para acentos y 2 o 4 beats para cambios de escena.
- La locución manda sobre la música: la información visual clave no debe competir con una frase importante.
- Ver `motion/03-creativa/narrativa-y-ritmo.md`.

### Frame rate

- UI: se diseña a 60 fps, pero el presupuesto real lo marca la pantalla: 16,7 ms/frame a 60 Hz y **8,3 ms a 120 Hz** (peor escenario en dispositivos ProMotion o de alta frecuencia).
- Vídeo: 24 (cine), 25 (PAL/Europa), 30 (web/NTSC), 50/60 (deporte, UI grabada, social de alta fluidez).
- Juegos (Apple HIG): frame rate constante de 30–60 fps. La consistencia importa más que el pico.
- Motion blur en vídeo: obturador de 180° (0,5 del frame) como punto de partida.

---

## checklist

- [ ] `frames = ceil(ms/1000 × fps)`, redondeando hacia arriba
- [ ] Stagger total con tope, calculado con el n máximo
- [ ] Presupuesto de frame del peor escenario (8,3 ms a 120 Hz)
- [ ] Hay holds: sin pausa no hay ritmo
