# Motion Principles — Principios de movimiento para interfaces

## meta

| Campo | Valor |
|-------|-------|
| **Dominio** | UI — movimiento, animación y transiciones en interfaces |
| **Fuente** | Material Design Motion (m1/m3.material.io); IBM Carbon — *Motion*; Drew Powers — *A handbook to animation easings*; Jakob Nielsen — *Response Times* (NN/g); Paul Lewis & Paul Irish — *High Performance Animations* (web.dev) |
| **Objetivo** | Fundamentar las tablas de easing, duración y propiedades animables en el modo `[SYX: UI]:` |
| **Agent tags** | `#ui` `#motion` `#animation` `#easing` `#performance` `#reduced-motion` |

---

## concepts

El movimiento en UI tiene una función específica: **comunicar relaciones espaciales y de estado**. Un dropdown que aparece desde el punto de clic comunica que viene de ahí. Una transición de color comunica un cambio de estado. Cuando el movimiento no tiene función, es ruido cognitivo.

**El problema secundario:** el movimiento puede ser físicamente molesto para usuarios con vestibular disorders (trastorno del equilibrio). La animación de parallax, zoom y movimiento de grandes masas puede causar náuseas. `@include reduced-motion { … }` es obligatorio — no opcional.

**Relación con el dominio `motion/`.** Este módulo es el **suelo físico** de la UI web de SYX: lo mínimo que todo `scss/` respeta, escrito en los tokens y mixins del sistema. La teoría completa de la que es resumen vive en `motion/04-teoria/`, el propósito en `motion/02-proposito/` y la accesibilidad del movimiento en `motion/07-accesibilidad/`. Para código de `scss/`, este módulo prevalece; los dos están reconciliados y no deben divergir.

---

## rules

### 1. Las curvas de easing — por qué no son lineales

El movimiento espacial lineal se percibe como mecánico: los objetos físicos aceleran y frenan, y el cerebro lee la inercia como naturalidad. La excepción son las propiedades de **efecto** (color, opacidad, brillo): ahí el easing produce mezclas desiguales, y lo correcto es lineal o casi lineal.

| Qué ocurre | Curva | Token SYX |
|--------|-------|-----------|
| Un elemento **entra** y se asienta | ease-out — llega con energía y frena, sin rebote | `--semantic-easing-out` (`cubic-bezier(0.16, 1, 0.3, 1)`) |
| Un elemento **sale** | ease-in — arranca despacio y se va | No hay semántico de salida; hoy `--semantic-easing-standard`. Candidato a TOKEN |
| Se **mueve** entre dos posiciones visibles (dropdown, accordion) | ease-in-out | `--semantic-easing-in-out` |
| **Color, opacidad**, brillo | lineal o casi lineal | `--semantic-easing-linear`; `--semantic-easing-standard` (`ease`) se tolera |
| Spinners, progreso, rotación continua | lineal | `--semantic-easing-linear` |
| **Overshoot** — `cubic-bezier(0.34, 1.56, 0.64, 1)` | se pasa del destino y vuelve | Sin token. Solo momentos *expressive* (éxito, onboarding, marca), como mucho uno por pantalla y nunca en UI de alta frecuencia |

**Por qué `ease-in` solo para salidas:** cuando un elemento desaparece, el usuario ya lo ha procesado. La salida rápida reduce el tiempo de espera percibido. La entrada lenta es correcta porque el usuario está procesando contenido nuevo.

---

### 2. Duraciones — valores específicos y sus fundamentos

| Tipo de interacción | Duración | Token SYX | Fundamento |
|--------------------|----------|-----------|------------|
| Feedback táctil (`:active`, press) | 80ms | `--semantic-duration-instant` | Por debajo de ~100 ms se percibe como instantáneo |
| Color, opacidad, focus, controles de formulario | 150ms | `--semantic-duration-fast` | Por debajo del umbral de percepción de "lentitud" |
| Hover, botones, cards, posición o tamaño pequeños | 250ms | `--semantic-duration-base` | Ventana óptima: perceptible pero no lento |
| Superficies, drawers, entradas grandes | 400ms | `--semantic-duration-slow` | Tiempo para que el ojo procese la nueva presencia |
| Salida de elemento | **75–85 % de la entrada** | Un escalón por debajo de la entrada | La salida siempre es más rápida que la entrada |
| Transición larga / página | ≤ 400–500ms | `--semantic-duration-slow` | Máximo antes del Doherty Threshold |

La duración crece con la distancia y el tamaño, pero menos que proporcionalmente (ver `motion/04-teoria/timing.md`). Y es inversa a la frecuencia: lo que ocurre decenas de veces por sesión va al escalón corto.

**Doherty Threshold (400ms):** por encima de 400ms, el usuario pierde el flujo. Las animaciones que superan ese umbral necesitan indicador de progreso.

---

### 3. Propiedades GPU-composited — las únicas que se animan

```scss
// Seguras — no causan layout recalculation
transform: translateX(), translateY(), scale(), rotate()
opacity
filter  // con precaución — puede crear stacking context
```

**Propiedades prohibidas en animaciones:**
```scss
// Estas recalculan el layout en cada frame → jank
width, height
top, right, bottom, left
margin, padding
font-size
```

**Por qué:** el compositor del navegador puede animar `transform` y `opacity` sin consultar al motor de layout. Las propiedades de geometría (width, top, margin) obligan a recalcular las posiciones de todos los elementos afectados — potencialmente toda la página. En 60fps, son 60 recálculos por segundo.

---

### 4. Nunca usar `all` en `transition`

```scss
// ✗ Peligroso — anima todas las propiedades, incluidas las que causan layout thrash
transition: all 0.2s ease;

// ✓ Correcto — solo las propiedades que cambian y son seguras
@include transition(background-color 0.2s ease, opacity 0.2s ease);
```

`transition: all` es un anti-patrón: anima propiedades que no deberían animarse y crea comportamientos inesperados cuando el componente gana nuevas propiedades.

---

### 5. `will-change` — uso con precaución

`will-change: transform` promueve el elemento a su propio layer de composición anticipadamente. Mejora el inicio de la animación — pero tiene un coste de memoria.

**Regla:** solo durante la animación (añadir con JS justo antes, eliminar cuando termina). Nunca en el CSS base del componente.

---

### 6. `prefers-reduced-motion` — obligatorio en todo

```scss
@include reduced-motion {
  animation: none;
}
```

**`transition` no hace falta declararlo aquí.** El mixin `transition()` ya emite su propia guarda `prefers-reduced-motion: reduce` con `transition: none`, así que repetirlo es redundante — y en un fichero de componente lo detecta R03, que mira la propiedad en crudo línea a línea sin saber que estaba dentro de una guarda. `@include reduced-motion` queda para lo que el mixin no cubre: `animation`, y cualquier `transform` de reposo que haya que neutralizar.

Esta media query responde a la preferencia del sistema operativo del usuario. Afectados: vestibular disorders, migrañas fotosensibles, epilepsia fotosensible, y preferencias personales.

**Lo que se elimina:** movimientos físicos (translate, scale, rotate) y transiciones de layout. En componentes esa es la estrategia por defecto (`remove`), y ya la aplican el mixin y `_motion.scss`, que lleva las `--semantic-duration-*` a `0.01ms`. Cuando la spec pide **sustituir** en vez de eliminar — un crossfade en lugar de un desplazamiento —, se escribe dentro de `@include reduced-motion`. La estrategia completa, con su tabla de sustituciones, está en `motion/07-accesibilidad/accesibilidad.md`.

**Lo que NO se elimina:** cambios de color, cambios de contenido — estos no son "motion" en el sentido que la media query previene.

---

## checklist

- [ ] ¿Las duraciones y curvas salen de `--semantic-duration-*` y `--semantic-easing-*`, sin literales?
- [ ] ¿Color y opacidad van en lineal (o `--semantic-easing-standard`), nunca con overshoot?
- [ ] ¿Las entradas usan ease-out (`--semantic-easing-out`) y el overshoot queda para momentos *expressive*?
- [ ] ¿Las salidas duran un escalón menos que la entrada?
- [ ] ¿Solo se animan `transform` y `opacity` (no width/height/top/left)?
- [ ] ¿No hay `transition: all` en ningún componente?
- [ ] ¿Toda `animation` tiene bloque `@include reduced-motion { … }`? (La `transition` ya la cubre el mixin.)
- [ ] ¿`will-change` no está en el CSS base del componente?
- [ ] ¿Las duraciones están por debajo del Doherty Threshold (400ms)?
