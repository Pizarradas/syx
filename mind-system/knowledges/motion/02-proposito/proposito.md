# Propósito — motion con función en producto digital

## meta

| Campo | Valor |
|-------|-------|
| **Dominio** | motion — propósito · por qué y qué se mueve en una interfaz |
| **Fuente** | Issara Willenskomer — *UX in Motion Manifesto*; Toptal — *12 Motion Design Principles for Digital Products*; Material Design 2/3; Microsoft Fluent 2; Apple HIG (Motion) |
| **Objetivo** | Decidir qué debe moverse en una interfaz, para qué, en qué orden y con qué patrón, antes de fijar valores |
| **Agent tags** | `#ux` `#motion` `#transitions` `#choreography` `#feedback` `#purpose` |

---

## concepts

El movimiento en producto es **información**, no decoración. Este módulo responde a "¿para qué se mueve?" y "¿qué relación comunica?". Entrega a `motion/06-sistema/` y a el módulo de ejecución una coreografía con propósito.

### 1. La prueba de propósito

Antes de animar, completa: **"Si quito este movimiento, el usuario pierde ______."**

| Propósito | Qué comunica | Ejemplo |
|---|---|---|
| **Continuidad** | Esto es lo mismo que antes, transformado | Tarjeta → detalle (container transform) |
| **Orientación** | Dónde estoy y de dónde vengo | Navegación lateral con shared axis X |
| **Relación** | Estos elementos están conectados (padre/hijo, origen) | Menú que brota del botón que lo abre |
| **Feedback** | El sistema te ha oído | Press, ripple, validación, toast |
| **Estado** | Algo está ocurriendo o ha cambiado | Loader, progreso, éxito/error |
| **Jerarquía** | Qué mirar primero | Stagger imagen → título → texto |
| **Atención** | Mira aquí (con moderación) | Notificación, badge, nudge |
| **Datos (value change)** | Este valor es dinámico | Contador que sube, barra que crece |
| **Carácter / deleite** | Personalidad de marca | Confeti tras completar un proceso largo |

Si el hueco se queda vacío, **no animes**, o reduce el movimiento a un fade mínimo.

**Frecuencia inversa:** cuanto más a menudo ocurre una animación, más corta y discreta debe ser. Una transición que se ve 200 veces al día no puede tener rebote de 600 ms.

### 2. Tiempo real y no tiempo real (UX in Motion)

- **Tiempo real (manipulación directa):** el objeto sigue al dedo o al cursor 1:1, sin easing ni latencia. Al soltar, un spring que hereda la velocidad. Nunca se anima *durante* un drag, un zoom o un scroll.
- **No tiempo real (transición):** se dispara y dura un tiempo. Debe ser corta, interrumpible y no bloquear la interacción más allá de su duración perceptual.

### Encaje con UX

Este módulo es la mitad de movimiento de lo que UX ya decide: estados, flujo y feedback. UX elige propósito, patrón y coreografía y los entrega como parte del *interaction flow*; nunca escribe SCSS. Los valores los fija TOKEN y los implementa UI.

### Módulos relacionados

- `motion/02-proposito/patrones-de-transicion.md` — cada patrón con sus parámetros.
- `motion/02-proposito/coreografia.md` — offsets, interrupción, n variable y scroll.
- `ux/microinteractions.md` — la anatomía trigger → reglas → feedback que este módulo anima.

---

## rules

### 3. Los 12 principios de UX in Motion (Willenskomer)

El movimiento mejora la usabilidad por **expectativa, continuidad, narrativa y relación**. Jerarquía de decisión: principio → técnica → propiedad (posición, opacidad, escala, rotación, anchor point, color, stroke, forma) → valor.

1. **Easing**: el comportamiento temporal cumple la expectativa (ver `motion/04-teoria/`).
2. **Offset & delay**: el desfase crea relación y jerarquía; separa lo que es distinto.
3. **Parenting**: vincula propiedades de un elemento padre y sus hijos (el hijo hereda escala o posición).
4. **Transformation**: un elemento cambia de naturaleza (botón → loader → check).
5. **Value change**: animar números o datos para mostrar que son dinámicos.
6. **Masking**: revelar u ocultar sin perder la identidad del elemento.
7. **Overlay**: capas que se superponen en Z sin perder el contexto de debajo.
8. **Cloning**: un elemento se divide en otros con un origen claro.
9. **Obscuration**: desenfocar u oscurecer el fondo para enfocar lo de encima.
10. **Parallax**: velocidades distintas para separar planos (⚠️ riesgo vestibular).
11. **Dimensionality**: profundidad, flips, planos en 3D que explican la estructura.
12. **Dolly & zoom**: acercar la cámara (dolly) no es lo mismo que escalar el elemento (zoom). El dolly cambia la perspectiva; el zoom, no.

### 4. Patrones de transición

Elige el patrón según la **relación entre el origen y el destino**. El detalle y los valores están en `motion/02-proposito/patrones-de-transicion.md`.

| Relación | Patrón |
|---|---|
| El destino **es** el origen, ampliado | **Container transform** |
| Hermanos (pasos, pestañas, carrusel) | **Shared axis X** (o Y) |
| Padre ↔ hijo en la jerarquía de navegación | **Shared axis Z** |
| Sin relación entre sí | **Fade through** (sale, luego entra con escala 92 % → 100 %) |
| Aparece o desaparece dentro de la pantalla (menú, diálogo, snackbar) | **Fade** (escala 80 % → 100 %) |
| Superficie que se eleva | **Elevation** (Fluent): sombra + ligera escala |
| Cambio de nivel superior (apps, espacios) | **Top level** (Fluent): cambio rápido con fade |

**Coherencia con el gesto** (Apple HIG): lo que baja desde arriba se descarta hacia arriba, no hacia un lado. Lo que entra por la derecha sale por la derecha al volver atrás.

### 5. Coreografía

- **Una estrella por beat**: el elemento importante tiene el movimiento más prominente y largo; el resto acompaña (Fluent).
- **Orden por lectura y jerarquía**: imagen → título → cuerpo → acciones. Salidas: todo a la vez o en orden inverso, siempre más rápido.
- **Stagger con desfases cortos** para suavizar entradas grandes: 20–60 ms, **con tope total** (ver `motion/04-teoria/timing.md`).
- **Entradas y salidas asimétricas**: la salida dura ~75–85 % de la entrada y usa ease-in (Material: entrar 225 ms, salir 195 ms).
- **Coreografía compartida** en container transform: el contenido saliente se desvanece durante el primer ~30 % y el entrante aparece desde el ~40 %, para no mezclar dos contenidos a la vez.
- **No animes todo**: lo estático da contexto al movimiento.

Más detalle en `motion/02-proposito/coreografia.md`.

### 6. Feedback y estados

| Caso | Recomendación |
|---|---|
| Press | Escala 0,96–0,98 o sombra; 70–110 ms; sin rebote en UI productiva |
| Hover | 110–150 ms; cambio de color lineal y translate/sombra con ease-out |
| Toggle / switch | Spring spatial rápido; el color como effect (sin rebote) |
| Validación de error | Shake breve: 3 oscilaciones, ±4–6 px, ~300 ms, + color + mensaje (nunca solo movimiento) |
| Éxito | Transformación (botón → check) + hold de 400–800 ms antes de continuar |
| Carga < 1 s | Nada, o un indicador tras un retardo de ~300–500 ms (evita el parpadeo) |
| Carga indeterminada | Spinner lineal y continuo; skeleton con shimmer lento (≥ 1,5 s por ciclo) |
| Progreso determinado | Barra con el valor real; interpolación corta entre actualizaciones |
| Value change | Contador con ease-out, 400–1000 ms según la magnitud; números tabulares para evitar saltos de ancho |

**Nunca comuniques solo con movimiento** (Apple): acompáñalo de un cambio de estado visible, texto, háptica o sonido.

### 7. Datos en movimiento

- Anima **desde un estado con significado**: desde 0, desde el valor anterior o desde la media, nunca desde un valor arbitrario.
- **Transiciones entre estados de un gráfico**: mantén la identidad de cada marca (el mismo elemento pasa de A a B). Si cambia el tipo de gráfico, primero cambia la forma y después los valores (en dos tiempos).
- Stagger por serie o categoría para ayudar a leer, siempre con tope.
- El movimiento de datos es **effects + spatial**: el color nunca rebota, y la posición en gráficos tampoco (el rebote falsea el valor momentáneamente).

---

## checklist

### Qué entrega

- [ ] Propósito y `if_removed` para la spec.
- [ ] Patrón de transición elegido.
- [ ] Secuencia con roles (hero/support/background), orden, offsets y tope de stagger.
- [ ] Comportamiento ante interrupción.
