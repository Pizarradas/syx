# Dirección creativa del movimiento

## meta

| Campo | Valor |
|-------|-------|
| **Dominio** | motion — creativa · concepto, carácter, marca y narrativa |
| **Fuente** | Austin Shaw — *Design for Motion* (2.ª ed.); Figma — *Principles in Motion*; JR Canest — *10 Principles of Motion Design* |
| **Objetivo** | Convertir el movimiento en lenguaje: idea, metáfora, carácter y direcciones alternativas antes de fijar valores |
| **Agent tags** | `#creative` `#motion` `#concept` `#character` `#brand` `#narrative` |

---

## concepts

La ejecución responde al **cómo**. Este módulo responde al **qué idea** y al **cómo se siente**. Evita que el movimiento sea genérico (el "fade-up de 300 ms" de siempre) y lo convierte en lenguaje.

### 1. Del mensaje a la metáfora de movimiento

Todo buen motion parte de una **idea de movimiento**, no de una lista de propiedades animadas.

1. **Mensaje:** qué debe entender o sentir el espectador, en una frase.
2. **Verbo:** qué hace la cosa. No es "aparece": es *brota, se despliega, cae, se ensambla, respira, se imanta, se disuelve, late, se enfoca…*
3. **Material:** de qué está hecha en su mundo (papel, goma, líquido, metal, luz, humo, tinta, cristal). El material dicta la física.
4. **Metáfora:** la combinación de ambos. "Los datos **se imantan** a su sitio como limaduras de hierro" o "el menú **se despliega como papel** plegado".

Ejemplo:

```
Mensaje: "tus ahorros crecen solos"
Verbo:   crecer, acumularse
Material: agua (llena, se asienta, refleja)
Metáfora: el gráfico se llena como un vaso; el nivel oscila y se asienta (spring con bounce bajo, effects lineales para el color)
```

El material se traduce después a física (ver `motion/03-creativa/personalidad.md`):

| Material | Comportamiento |
|---|---|
| Papel | Rígido en el plano, dobla por ejes, poco rebote, sombra al levantarse |
| Goma | Squash & stretch, rebote alto, volumen constante |
| Líquido | Overshoot suave, ondas, follow-through largo, sin aristas |
| Metal | Pesado: arranque lento, parada seca con micro-rebote de alta frecuencia |
| Luz | Sin masa: fades lineales, bloom, velocidad constante |
| Humo o tinta | Straight ahead, turbulencia (noise), disolución |
| Cristal | Preciso, refracción, parada limpia, destellos puntuales |

### 2. Carácter: los cinco ejes

Todo carácter se describe con cinco ejes (1–5). `motion/04-teoria/` los convierte en física y `motion/06-sistema/` en valores.

| Eje | 1 | 3 | 5 |
|---|---|---|---|
| **Energía** | calma, contemplativa | neutra | enérgica, urgente |
| **Peso** | ligera, etérea | natural | pesada, contundente |
| **Elasticidad** | rígida, seca | amortiguada | elástica, rebotona |
| **Precisión** | orgánica, imperfecta | equilibrada | mecánica, exacta |
| **Formalidad** | lúdica, cartoon | cercana | formal, institucional |

**Estilo global:** *productive* (sirve a la tarea) o *expressive* (es el mensaje). Un mismo producto usa los dos, pero en momentos distintos.

Los arquetipos de partida y el mapeo a parámetros están en `motion/03-creativa/personalidad.md`: *Preciso, Amable, Enérgico, Lujoso, Lúdico, Técnico, Editorial, Orgánico*.

### Encaje con CREATIVE y BRAND

Cuando BRAND ya ha decidido una identidad, el eje de movimiento viene dado: los cinco ejes de este módulo se **heredan**, no se eligen, y apartarse de ellos es una desviación declarada en el `## Why`. Sin BRAND, CREATIVE elige el carácter en cada encargo y lo deja escrito. La exploración en tres direcciones (A segura, B carácter, C riesgo) es la versión de movimiento de lo que CREATIVE ya hace con la dirección de arte.

### Módulos relacionados

- `motion/03-creativa/personalidad.md` — arquetipos, adjetivos y materiales traducidos a parámetros.
- `motion/03-creativa/lenguaje-de-marca.md` — plantilla de lenguaje de motion de marca.
- `motion/03-creativa/narrativa-y-ritmo.md` — estructuras por duración, beats y música.

---

## rules

### 3. Lenguaje de motion de marca

Un lenguaje de motion es un conjunto pequeño de **decisiones firmes** que se repiten:

1. **Principio rector** (una frase): "Todo se mueve como si respirara", "Precisión suiza", "Energía contenida".
2. **Movimiento firma** (1–2): un gesto reconocible, como el "tick" de una transición, una forma de entrar o un overshoot característico.
3. **Curvas propias** (2–3): una de entrada, una de salida y una estándar, con nombre.
4. **Escala de tiempos**: los tokens, ajustados al carácter.
5. **Reglas de coreografía**: dirección, orden y stagger.
6. **Qué nunca hacemos**: por ejemplo, "nunca rebotamos texto", "nunca giramos el logo".
7. **Modo reducido de marca**: cómo se expresa la marca **sin** movimiento espacial (color, fundido, tipografía).

Plantilla completa en `motion/03-creativa/lenguaje-de-marca.md`.

### 4. Narrativa y estructura

Para piezas con duración (vídeo, social, explainer, onboarding, scroll storytelling):

- **Estructura en beats**: hook → desarrollo → clímax → resolución → end card.
- **Una idea por beat**. Si un beat necesita dos ideas, son dos beats.
- **Hold para leer**: todo texto necesita su tiempo de lectura en el peor escenario (ver `motion/05-tipografia/`).
- **Transiciones como puntuación**: el corte es un punto; el fundido, una coma larga; el match cut, un "y entonces…"; el wipe, "mientras tanto".
- **Ritmo musical**: cortes y acentos en el beat; cambios de escena cada 2 o 4 compases.

Detalle y plantillas en `motion/03-creativa/narrativa-y-ritmo.md`.

### 5. Proceso de diseño previo a animar (Austin Shaw)

1. **Concepto** en texto: mensaje, verbo, material y metáfora.
2. **Moodboard de movimiento**: referencias en vídeo, no solo imágenes. Busca en la naturaleza, el cine, la danza, el deporte, la maquinaria o la ilustración gestual, además del propio sector.
3. **Style frames**: 3–5 fotogramas clave con el acabado final. Fijan composición, color, tipografía e iluminación.
4. **Design boards**: la secuencia de style frames que cuenta la pieza, con notas de transición entre ellos. Tipos: tipográficos, ilustrativos, de infografía o datos, de personajes, táctiles y matte painting.
5. **Animatic**: timing bruto sobre el audio.
6. **Animación**: pose to pose, después follow-through y detalles, y por último el pulido.

En UI el proceso se comprime: concepto → 2–3 direcciones → prototipo de la interacción clave → sistema.

### 6. Exploración: ir más allá de lo obvio

Cuando el encargo lo permita (recorrido exploratorio de `motion/01-direccion/direccion.md`), genera **tres direcciones** que se diferencien de verdad:

| Dirección | Estrategia |
|---|---|
| **A: Segura** | Cumple el sistema, clara y eficaz. La referencia. |
| **B: Carácter** | La misma función con más personalidad: un material o metáfora distinta y un movimiento firma. |
| **C: Riesgo** | Cambia el concepto: otra metáfora, otro medio (3D, tipografía, partículas), otra estructura temporal. |

Cada dirección lleva: nombre evocador, metáfora en una frase, ejes 1–5, mini-spec, qué se gana y qué se pierde (claridad, coste, accesibilidad, rendimiento).

**Técnicas para salir de lo genérico:**

- **Cambia el verbo**: "aparece" → "se revela tras una máscara", "se ensambla por piezas", "se enfoca".
- **Cambia el material** (tabla de arriba).
- **Cambia el origen**: desde dónde nace el movimiento (del cursor, del dato, del sonido, del borde, del centro).
- **Cambia la escala temporal**: lo que suele ser rápido, muy lento, o al revés, con intención.
- **Traslada una referencia**: montaje de cine (match cut, jump cut, smash cut), física de juguete, coreografía de danza, títulos de crédito de Saul Bass, motion de broadcast deportivo.
- **Restricción creativa**: solo opacidad, solo 2 colores, solo movimientos a 45°, todo a 12 fps…
- **Movimiento negativo**: lo que **no** se mueve para que lo que sí se mueve destaque.

### 7. Exageración y appeal según contexto

| Contexto | Exageración | Appeal |
|---|---|---|
| UI productiva, alta frecuencia | 0–1 | claridad |
| UI de marca, onboarding, éxito | 2–3 | simpatía |
| Social, publicidad | 3–4 | impacto |
| Personaje, cartoon, juego | 4–5 | personalidad |

---

## checklist

### Qué entrega

- [ ] Concepto (mensaje, verbo, material y metáfora).
- [ ] Ejes de carácter 1–5 + estilo productive/expressive.
- [ ] Movimiento firma y "nunca hacemos", si aplica.
- [ ] Estructura de beats (piezas con duración).
- [ ] En el recorrido exploratorio: tres direcciones comparadas.
