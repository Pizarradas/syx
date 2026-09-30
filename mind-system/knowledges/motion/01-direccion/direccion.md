# Dirección de motion

## meta

| Campo | Valor |
|-------|-------|
| **Dominio** | motion — dirección · clasificar, enrutar y gobernar el dominio |
| **Fuente** | Síntesis propia del sistema sobre las fuentes del dominio (ver `motion/00-indice/fuentes.md`) |
| **Objetivo** | Clasificar un encargo de movimiento, decidir qué estratos intervienen y en qué orden, y fijar el contrato antes de implementar |
| **Agent tags** | `#motion` `#direction` `#routing` `#governance` `#spec` |

---

## concepts

Todo encargo de movimiento empieza preguntando **por qué** se mueve algo, **cómo debe sentirse** y **qué no puede romper**. Después se reparte entre los estratos de conocimiento, se fijan los valores en una Motion Spec y solo entonces se pasa al estrato de ejecución. Al final, se revisa.

### No es un modo

La dirección es un **protocolo**, no un modo SYX: no tiene bloque `Trust`, no escribe nada y no se invoca con `[SYX: …]`. La ejecutan los modos que ya existen, cada uno en su dominio:

| Estrato | Lo decide | Por qué ese modo |
|---|---|---|
| Propósito, patrón, coreografía | **UX** | Es estado, flujo y feedback: el *qué* y el *porqué* |
| Concepto, carácter, exploración | **CREATIVE** (o **BRAND**, si es identidad) | Dirección de arte; BRAND fija el eje motion una vez para que CREATIVE lo herede |
| Valores del sistema | **TOKEN** (THEME si solo reajusta un tema) | Los tokens de motion viven en `tokens.json` |
| Implementación en `scss/` | **UI** | Única vía a producción, con `@include transition()` y tokens `--semantic-*` |
| Prototipo, Rive, AE, Cavalry, Blender | **CREATIVE** | Exento de R01–R08; fuera de `scss/` |
| Revisión | **AUDIT**, a petición | Asesor, sin número R |

Composiciones típicas: `[SYX: UX → TOKEN → UI + AUDIT]` para una transición de producto; `[SYX: BRAND → THEME]` cuando la identidad mueve el eje motion; `[SYX: CREATIVE → TOKEN → UI]` para llevar un prototipo animado a producción.

### 1. Clasifica el encargo

| Tipo | Ejemplos | Estratos que lideran |
|---|---|---|
| **Micro-interacción UI** | hover, press, toggle, checkbox, tooltip | propósito → sistema → ejecución |
| **Transición UI** | modal, navegación, tarjeta→detalle, lista | propósito → teoría → sistema → ejecución |
| **Feedback y estado** | loaders, progreso, éxito/error, value change | propósito → sistema → ejecución |
| **Scroll y storytelling web** | reveals, parallax, secciones narrativas | propósito + creativa → accesibilidad → ejecución |
| **Ilustración o personaje** | mascota, iconos animados, Rive interactivo | creativa + teoría → ejecución (Rive) |
| **Motion graphics / vídeo** | spot, explainer, ident, social, lower thirds | creativa → teoría → tipografía → ejecución (Cavalry/AE/Blender) |
| **Tipografía cinética** | títulos, lyric video, CTAs animados | tipografía + creativa → ejecución |
| **Datos** | gráficos que crecen, contadores, dashboards | propósito (value change) → teoría → ejecución |
| **Ambient / loop** | fondos, estados idle, loops de marca | creativa → accesibilidad (pausa) → ejecución |
| **3D** | producto, cámara, escenas | creativa + teoría → ejecución (Blender) |
| **Sistema** | definir el lenguaje de motion de una marca o producto | creativa → sistema → propósito → accesibilidad |
| **Revisión** | "¿qué le pasa a esta animación?" | crítica (y desde ahí, el módulo causante) |

### 2. Elige el recorrido

- **Rápido** (micro-tareas, un solo elemento, valores ya definidos por el sistema): sistema → ejecución → comprobación de accesibilidad → crítica exprés (5 preguntas). Sin spec escrita salvo que se pida.
- **Completo** (transiciones, coreografías, piezas de marca o vídeo): pipeline entero y Motion Spec escrita.
- **Exploratorio** (hay concepto abierto o el usuario pide "ir más allá"): propón **2–3 direcciones** con caracteres distintos (ver `motion/03-creativa/`), cada una con su mini-spec y lo que se gana o se pierde. Deja elegir antes de implementar.

Si el encargo es ambiguo, **pregunta como máximo por** el medio o destino, la herramienta y el carácter deseado. Todo lo demás se puede proponer.

---

## rules

### 3. Pipeline (recorrido completo)

1. **Intención.** Carga `motion/02-proposito/` (producto) o `motion/03-creativa/` (narrativa o marca). Resultado: propósito (continuidad, feedback, orientación, atención, jerarquía, narrativa, deleite, datos) y el mensaje en una frase. **Si no hay propósito, la respuesta correcta puede ser no animar.**
2. **Carácter.** `motion/03-creativa/` define la personalidad en ejes (energía, peso, elasticidad, precisión y formalidad) y el estilo *productive* o *expressive*.
3. **Física y tiempo.** `motion/04-teoria/` traduce el carácter en curvas, springs, timing/spacing y principios aplicables (anticipación, follow-through, arcos…).
4. **Sistema.** `motion/06-sistema/` fija los valores. Si el carácter exige salirse de los tokens, se hace como **excepción documentada**, nunca en silencio.
5. **Coreografía.** `motion/02-proposito/` define el orden, el stagger, el offset, la jerarquía y el patrón de transición. Para texto, `motion/05-tipografia/`.
6. **Accesibilidad.** `motion/07-accesibilidad/` define la variante con movimiento reducido (obligatoria), el control de destellos y las pausas.
7. **Motion Spec.** Rellena `motion/01-direccion/motion-spec.md`. Es el contrato.
8. **Implementación.** Carga el módulo de ejecución del destino. Ese módulo traduce la spec y declara cualquier pérdida de fidelidad (por ejemplo, un spring aproximado con `linear()` o con Elastic en Rive).
9. **Revisión.** `motion/09-critica/`: protocolo de visionado, tabla de síntomas y rúbrica. Si falla, vuelve al paso responsable, no al código por defecto.

### 4. Reglas de gobierno

**Precedencia en conflictos dentro del dominio** (gana el nivel más alto):

1. **Accesibilidad y seguridad**: destellos, riesgo vestibular, pausa, reduced motion.
2. **Propósito**: si el movimiento no comunica, sobra.
3. **Sistema**: consistencia entre pantallas y piezas.
4. **Dirección creativa**: carácter y expresividad.
5. **Preferencia técnica**: comodidad de implementación.

Para romper un nivel superior hace falta una **excepción documentada** en la spec, con motivo, alcance y alternativa reducida. Ejemplo: un hero de marca puede usar un spring expresivo fuera de tokens, pero nunca saltarse la variante reducida.

**Esta escalera vive entera dentro del escalón 6.** Es la precedencia *entre estratos del dominio motion*, no entre documentos del repositorio. Por encima de todos sus niveles siguen `contracts/trust.json`, R01–R08 y el bloque `Trust` de cada modo (`mind-system/README.md`). Una excepción documentada en la spec rompe un nivel de *esta* escalera — el sistema de referencia, la dirección creativa —, nunca R03 ni el tier de un fichero. En CREATIVE es la desviación declarada del `## Why`; en UI no existe: lo que UI necesita y no está en `tokens.json` pasa antes por TOKEN.

**Una sola fuente de verdad.** Dentro del dominio, los valores canónicos viven en `motion/06-sistema/escala.md` y los demás módulos los citan por nombre de token. En código SYX la fuente del valor es `tokens.json` (`--semantic-duration-*`, `--semantic-easing-*`); si un módulo de ejecución necesita un valor que no existe, lo propone a TOKEN como token nuevo, nunca lo escribe suelto.

**Unidades canónicas.**

- Tiempo en **ms**. Para frames: `frames = ceil(ms / 1000 × fps)`. En caso de duda se redondea hacia arriba, porque un frame de menos se nota más que uno de más en entradas cortas.
- Easing como `cubic-bezier(x1, y1, x2, y2)`, o spring perceptual `{duration, bounce}`. Las conversiones a stiffness/damping, influence, handles o frames están en `motion/04-teoria/springs.md` y en cada módulo de ejecución.

**Peor escenario.** Las estimaciones se calculan en el caso más desfavorable:

- Tiempo de lectura: lector lento.
- Rendimiento: dispositivo modesto a 60 Hz y el presupuesto de frame de 120 Hz si aplica.
- Duración de una coreografía: número máximo de elementos. El stagger total siempre lleva tope.
- Carga: red lenta para assets (.riv, Lottie, vídeo).

**Interrumpibilidad (UI).** Toda animación que responde a una acción del usuario debe poder interrumpirse o redirigirse sin saltos: hereda la velocidad (springs) o parte del valor actual. Nunca bloquea la interfaz más allá de su duración perceptual.

**Honestidad técnica.** Si la herramienta no puede reproducir algo (springs reales en CSS puro, efectos de AE en Lottie, 3D en Rive…), dilo y ofrece la mejor aproximación con su coste.

### 5. Enrutado rápido por palabras clave

- "se siente robótico / lento / brusco / flotante / barato" → `motion/09-critica/` → `motion/04-teoria/`
- "curva", "easing", "bezier", "spring", "rebote", "overshoot" → `motion/04-teoria/`
- "transición", "navegación", "modal", "lista", "coreografía", "stagger" → `motion/02-proposito/`
- "concepto", "marca", "personalidad", "storyboard", "style frame", "música", "ritmo" → `motion/03-creativa/`
- "texto animado", "kinetic", "títulos", "split text" → `motion/05-tipografia/`
- "tokens", "design system", "variables de motion" → `motion/06-sistema/`
- "reducir movimiento", "epilepsia", "mareo", "WCAG", "autoplay" → `motion/07-accesibilidad/`
- CSS / GSAP / Motion / WAAPI / Rive / Cavalry / AE / Lottie / Blender → el módulo de ejecución correspondiente

### 6. Entregables

- **Recorrido rápido:** el código o el cambio, más una línea que diga qué tokens se usaron y cuál es la variante reducida.
- **Recorrido completo:** Motion Spec + implementación + informe de crítica (breve).
- **Recorrido exploratorio:** 2–3 direcciones (nombre, carácter, mini-spec y prototipo si es posible) y una recomendación razonada.

---

## checklist

- [ ] Encargo clasificado y recorrido elegido (rápido, completo o exploratorio)
- [ ] Propósito declarado; si no lo hay, se ha considerado no animar
- [ ] Cada estrato asignado al modo SYX que lo decide
- [ ] Valores ligados a tokens de `tokens.json` o excepción documentada en la spec
- [ ] Variante reducida definida antes de implementar
- [ ] Peor escenario calculado (lectura, rendimiento, n máximo, red)
- [ ] Revisión con `motion/09-critica/critica.md` antes de dar por terminado
