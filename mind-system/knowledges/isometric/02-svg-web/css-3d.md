# Isométrico · CSS 3D

## meta

| Campo | Valor |
|-------|-------|
| **Dominio** | isometric — motor de código · HTML real en isométrico |
| **Fuente** | Envato Tuts+ (Isometric layout with CSS 3D transforms); verificación de ángulos en `../00-indice/fuentes.md` |
| **Objetivo** | Poner contenido HTML real —tarjetas, rejillas de producto, mockups de UI, capas con hover— en un plano isométrico |
| **Agent tags** | `#isometric` `#css3d` `#transform` `#hover` |

Se abre cuando `svg-web.md` §1 elige CSS 3D. Todo el CSS de este módulo es prototipo: vive en CREATIVE o en `@layer syx.app` con el prefijo del proyecto. Dentro de `scss/`, la posición pasa por `@include absolute()` (R04), la transición por `@include transition()` (R03) y los colores y duraciones por tokens.

---

## concepts

El plano isométrico es un elemento girado `rotateX(54.7356deg) rotateZ(-45deg)` sin perspectiva. Lo que vive encima hereda la proyección mientras cada nivel intermedio declare `transform-style: preserve-3d`. La altura es `translateZ`, nunca `scale`.

---

## rules

### 1. Plano base

```css
/* capa: prototipo fuera de scss/ — CREATIVE o @layer syx.app */
.iso-scene { transform-style: preserve-3d; }
.iso-plane {
  transform: rotateX(54.7356deg) rotateZ(-45deg); /* isométrica real; dimétrica 2:1: rotateX(60deg) */
  transform-style: preserve-3d;
}
.iso-plane * { transform-style: preserve-3d; }
```

- `rotateX(60deg)` aplasta el plano al 50 % y da un rombo 2:1, que es lo que publica la mayoría de tutoriales. Se elige con intención y no se mezclan.
- Sin `perspective`, o con un valor enorme. Con perspectiva corta, la escena parece una tarjeta inclinada y deja de ser isométrica.
- `preserve-3d` en cada nivel intermedio: si falta, Firefox y otros aplanan los hijos.

### 2. Alturas y capas

```css
/* capa: prototipo fuera de scss/ — CREATIVE o @layer syx.app */
.iso-layer { transform: translateZ(calc(var(--z) * 1px)); }
.iso-exploded > * { transform: translateZ(calc(var(--i) * var(--gap))); }
```

Para una vista explosionada, una variable compartida `--gap` y un índice `--i` por capa.

### 3. Bloques sólidos

Un bloque son tres caras: la superior es el propio elemento y los laterales, hijos o pseudo-elementos girados 90°.

```css
/* capa: prototipo fuera de scss/ — CREATIVE; en scss/ la posición va con @include absolute() (R04) */
.iso-block { position: relative; width: 100px; height: 100px; background: var(--top); }
.iso-block .left  { position: absolute; inset: 0; background: var(--left);  transform-origin: bottom; transform: rotateX(-90deg); height: var(--h); top: calc(100% - var(--h)); }
.iso-block .right { position: absolute; inset: 0; background: var(--right); transform-origin: right;  transform: rotateY(90deg);  width: var(--h);  left: calc(100% - var(--h)); }
```

Los signos dependen de la orientación del plano. Se comprueba siempre en el navegador que las caras quedan unidas sin huecos.

### 4. Hover de elevación

```css
/* capa: prototipo fuera de scss/ — CREATIVE; en scss/ la transición va con @include transition() (R03) */
.iso-card img     { transform: translate3d(0, 0, 20px); transition: transform .3s cubic-bezier(.165, .84, .44, 1); }
.iso-card .shadow { opacity: .9; transition: opacity .3s cubic-bezier(.165, .84, .44, 1), box-shadow .3s cubic-bezier(.165, .84, .44, 1); }
.iso-card:hover img     { transform: translate3d(0, 0, 50px); }
.iso-card:hover .shadow { opacity: .6; }
```

Cuanto más se aleja el objeto del suelo, más ancha y difusa su sombra. La transición va además dentro de `prefers-reduced-motion: no-preference`, o se sustituye por un cambio sin movimiento (`motion/07-accesibilidad/accesibilidad.md`).

### 5. Límites

- No se construye una interfaz funcional entera en isométrico: cuesta interactuar con ella. Se reserva para heros, infografías y diagramas.
- El texto girado en 3D pierde nitidez: el texto importante va plano a pantalla, por encima de la escena.
- Las zonas de clic de los elementos transformados no coinciden con su caja original. Se prueban con ratón y con teclado, y el foco tiene que seguir siendo visible.

---

## checklist

- [ ] `rotateX(54.7356deg)` (o 60deg declarado como dimétrica), sin perspectiva
- [ ] `preserve-3d` en cada nivel intermedio
- [ ] Altura con `translateZ`, nunca `scale`
- [ ] Caras unidas sin huecos, comprobado en navegador
- [ ] Texto importante plano a pantalla; zonas de clic y foco probados
- [ ] Hover dentro de `prefers-reduced-motion: no-preference`
