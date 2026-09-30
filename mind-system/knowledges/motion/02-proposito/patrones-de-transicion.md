# Patrones de transición

## meta

| Campo | Valor |
|-------|-------|
| **Dominio** | motion — propósito · relación entre origen y destino |
| **Fuente** | Material Design 2 (the motion system); Material Design 3; Microsoft Fluent 2; Apple HIG |
| **Objetivo** | Elegir y parametrizar la transición según la relación entre lo que sale y lo que entra |
| **Agent tags** | `#motion` `#transitions` `#container-transform` `#shared-axis` |

---

## concepts

Fuentes: Material 2 (motion system), Material 3, Fluent 2 y Apple HIG. Los tokens citados son los de `motion/06-sistema/`.

---

## rules

### Container transform

Un contenedor se convierte en otro (tarjeta → detalle, FAB → hoja, fila → página).

- **Propiedades:** bounds (x, y, width, height), corner radius, elevación y color de fondo del contenedor. El contenido se cruza con un fade.
- **Timing:** `motion.transition.expand` (≈ 300–400 ms), easing standard/emphasized.
- **Fade de contenido:** el saliente sale en 0–30 % de la duración; el entrante entra en 30–100 % (o 40–100 %).
- **Vuelta atrás:** el mismo recorrido invertido. La duración puede ser un 10–20 % menor.
- **Web:** View Transitions API con `view-transition-name` compartido, o FLIP (First, Last, Invert, Play). En Motion: `layoutId`.
- **Reducido:** crossfade de 150 ms sin cambio de bounds.

### Shared axis

Movimiento compartido que expresa relación espacial o de navegación.

- **X** (hermanos, pasos, pestañas): el saliente se desplaza −30 px y hace fade out; el entrante llega desde +30 px con fade in. Al volver, el sentido se invierte.
- **Y** (hermanos en vertical, carruseles verticales): igual en Y.
- **Z** (padre ↔ hijo): el saliente escala 100 → 110 % (o 100 → 90 % al volver) con fade out; el entrante escala 80/90 → 100 % con fade in.
- **Timing:** ~300 ms. Los fades se escalonan: la salida ocupa el primer 30–35 % y la entrada, el resto.
- **Reducido:** solo el fade, sin desplazamiento ni escala.

### Fade through

Para elementos **sin relación** entre sí (cambiar de sección desde el nav inferior).

- El saliente hace fade out en los primeros ~35 %. El entrante hace fade in con escala **92 % → 100 %** en el resto.
- **Timing:** ~300 ms. Nunca se ven dos contenidos superpuestos a opacidad alta.

### Fade

Entradas y salidas **dentro** de la pantalla (diálogos, menús, snackbars, tooltips).

- **Entrada:** fade in + escala **80 % → 100 %** (o 90 → 100 % en elementos grandes), ~150–225 ms, ease-out.
- **Salida:** fade out sin escala, ~75–150 ms, ease-in (más rápida que la entrada).
- **Origen de la escala:** el punto del que brota (el botón que abre el menú). Aplica *relación* y *parenting*.

### Elevation (Fluent)

Una superficie gana altura: la sombra crece y la escala sube 1–2 %. Se usa en hover de tarjetas o en drag start.

### Top level (Fluent)

Cambio entre áreas principales: fade rápido o slide corto, sin coreografía compleja. Es la transición que más se repite, así que es la más discreta.

### Scrim / obscuration

Oscurecer el fondo (Carbon `slow-02`, 700 ms para el scrim es aceptable porque es periférico). Lineal (es opacidad). El contenido principal entra con su propio token, más rápido.

### Hojas (sheets) y drawers

- Entran desde el borde al que pertenecen, con spring spatial sin rebote o ease-out.
- Se pueden arrastrar: la entrada sigue al dedo; al soltar, se decide por posición **y** velocidad (un flick corto cierra aunque no se haya pasado la mitad).
- La salida vuelve por el mismo borde.

### Lista: insertar, eliminar, reordenar

- **Insertar:** el hueco se abre (altura 0 → auto) y luego entra el ítem con fade y un pequeño slide.
- **Eliminar:** el ítem sale (fade + slide hacia donde "va") y después se cierra el hueco. En dos tiempos, con la suma ≤ 300 ms.
- **Reordenar:** FLIP de todos los ítems afectados a la vez, con spring spatial.

---

## checklist

- [ ] El patrón se eligió por la relación origen → destino, no por gusto
- [ ] La salida es más corta que la entrada y usa ease-in
- [ ] Nunca hay dos contenidos superpuestos a opacidad alta
- [ ] La variante reducida está definida (normalmente, solo el fade)
- [ ] Lo que entra por un lado sale por el mismo al volver
