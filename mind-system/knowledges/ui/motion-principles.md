# Motion Principles — Principios de movimiento para interfaces

## meta

| Campo | Valor |
|-------|-------|
| **Dominio** | UI — movimiento, animación y transiciones en interfaces |
| **Fuente** | Material Design Motion (m3.material.io); Jakob Nielsen — *Response Times* (NN/g); Paul Lewis & Paul Irish — *High Performance Animations* (web.dev) |
| **Objetivo** | Fundamentar las tablas de easing, duración y propiedades animables en el modo `[SYX: UI]:` |
| **Agent tags** | `#ui` `#motion` `#animation` `#easing` `#performance` `#reduced-motion` |

---

## concepts

El movimiento en UI tiene una función específica: **comunicar relaciones espaciales y de estado**. Un dropdown que aparece desde el punto de clic comunica que viene de ahí. Una transición de color comunica un cambio de estado. Cuando el movimiento no tiene función, es ruido cognitivo.

**El problema secundario:** el movimiento puede ser físicamente molesto para usuarios con vestibular disorders (trastorno del equilibrio). La animación de parallax, zoom y movimiento de grandes masas puede causar náuseas. `@include reduced-motion { … }` es obligatorio — no opcional.

---

## rules

### 1. Las curvas de easing — por qué no son lineales

El movimiento lineal se percibe como mecánico. Los objetos físicos reales aceleran y desaceleran — el cerebro interpreta la inercia como señal de naturalidad.

| Easing | Curva | Cuándo |
|--------|-------|--------|
| `ease` | `cubic-bezier(0.25, 0.1, 0.25, 1.0)` | Color / opacidad — sin movimiento espacial |
| Standard | `cubic-bezier(0.4, 0, 0.2, 1)` | Elementos que se mueven de A a B (dropdown, accordion) |
| Spring | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Entradas — el overshooting señala que el elemento ha "aterrizado" |
| `ease-in` | Inicio lento, final rápido | Solo para salidas (elementos que desaparecen) |

**Por qué `ease-in` solo para salidas:** cuando un elemento desaparece, el usuario ya lo ha procesado. La salida rápida reduce el tiempo de espera percibido. La entrada lenta es correcta porque el usuario está procesando contenido nuevo.

---

### 2. Duraciones — valores específicos y sus fundamentos

| Tipo de interacción | Duración | Fundamento |
|--------------------|----------|------------|
| Color / opacidad | 150ms | Por debajo del umbral de percepción de "lentitud" |
| Micro-interacción | 200ms | Dentro del "immediate response" window |
| Posición / tamaño | 250–300ms | Ventana óptima: perceptible pero no lento |
| Entrada de elemento | 300–400ms | Tiempo para que el ojo procese la nueva presencia |
| Salida de elemento | **75% de la entrada** | La salida siempre es más rápida que la entrada |
| Transición larga / página | 400–500ms | Máximo antes del Doherty Threshold |

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

**Lo que se elimina:** movimientos físicos (translate, scale, rotate) y transiciones de layout.

**Lo que NO se elimina:** cambios de color, cambios de contenido — estos no son "motion" en el sentido que la media query previene.

---

## checklist

- [ ] ¿Las transiciones de color/opacidad usan `150ms ease`?
- [ ] ¿Las entradas de elementos usan spring easing (cubic-bezier(0.34, 1.56, 0.64, 1))?
- [ ] ¿Las salidas de elementos son 75% de la duración de entrada?
- [ ] ¿Solo se animan `transform` y `opacity` (no width/height/top/left)?
- [ ] ¿No hay `transition: all` en ningún componente?
- [ ] ¿Toda animación tiene bloque `@include reduced-motion { … }`?
- [ ] ¿`will-change` no está en el CSS base del componente?
- [ ] ¿Las duraciones están por debajo del Doherty Threshold (400ms)?
