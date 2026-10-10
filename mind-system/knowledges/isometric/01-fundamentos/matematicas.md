# Isométrico · Matemáticas

## meta

| Campo | Valor |
|-------|-------|
| **Dominio** | isometric — fundamentos · referencia numérica |
| **Fuente** | Wikipedia (Isometric projection, Isometric video game graphics), I am Dan, JointJS, Blender 3D Architect; verificación en `../00-indice/fuentes.md` |
| **Objetivo** | Dar los valores exactos para código, transformaciones, cámaras y conversión de coordenadas |
| **Agent tags** | `#isometric` `#math` `#matrix` `#ssr` `#camera` |

Se abre cuando `fundamentos.md` pide un valor exacto. Todos los números están verificados numéricamente.

---

## concepts

La isométrica real gira el mundo 45° en Z y luego lo inclina 35.264° (= asin(tan 30°)): los tres ejes quedan a 120° en pantalla y cada uno se acorta igual, a √(2/3). La dimétrica 2:1 inclina 30° y acorta dos ejes por igual y el tercero distinto; a cambio, sus aristas caen en un escalón exacto de 2 px por 1 px.

---

## rules

### 1. Constantes

| Magnitud | Isométrica real | Dimétrica 2:1 |
|---|---|---|
| Ángulo de las aristas de suelo | 30° | 26.565° = atan(1/2) |
| Ángulos entre ejes en pantalla | 120°, 120°, 120° | 116.565°, 116.565°, 126.870° |
| Elevación de cámara sobre el suelo | 35.264° = asin(tan 30°) = atan(1/√2) | 30° |
| Rotación X de cámara en Blender (Z = 45°, Y = 0) | 54.736° = atan(√2) | 60° |
| Rotación X en CSS (con rotateZ ±45°) | 54.7356deg | 60deg |
| Alto/ancho del rombo de suelo | 1 : √3 ≈ 0.577 | 1 : 2 = 0.5 |
| Escorzo de cada eje | √(2/3) ≈ 0.8165 | — |
| Pixel art: escalón de línea | — | 2 px horizontales por 1 px vertical |

### 2. Mundo → pantalla (y de pantalla hacia abajo)

```js
// Isométrica real
sx = (x - y) * Math.cos(Math.PI / 6) * unit;   // 0.8660254
sy = ((x + y) * 0.5 - z) * unit;
// Dimétrica 2:1 (tiles de ancho W y alto W/2)
sx = (x - y) * (W / 2);
sy = (x + y) * (W / 4) - z * zUnit;
```

Pantalla → suelo (z = 0), isométrica real:

```js
x = (sx / (unit * 0.8660254) + sy / (unit * 0.5)) / 2;
y = (sy / (unit * 0.5) - sx / (unit * 0.8660254)) / 2;
```

### 3. Matrices SVG por plano (isométrica real)

La forma se dibuja en plano, sin deformar, dentro de un `<g>` con la matriz de su cara. `offset` desplaza el plano a lo largo de su normal, en unidades de mundo (por `unit` si se trabaja en px). En las caras laterales el eje y local apunta hacia abajo (−z), como en SVG.

| Plano | `matrix(a, b, c, d, e, f)` |
|---|---|
| Suelo/techo (XY) | `matrix(0.866, 0.5, -0.866, 0.5, 0, -offset)` |
| Cara izquierda (XZ, normal +y) | `matrix(0.866, 0.5, 0, 1, -0.866*offset, 0.5*offset)` |
| Cara derecha (YZ, normal +x) | `matrix(0.866, -0.5, 0, 1, 0.866*offset, 0.5*offset)` |

- La cara derecha admite la forma espejada `matrix(-0.866, 0.5, 0, 1, …)`, que dibuja desde la arista contraria: vale para formas simétricas pero invierte el texto. `iso-check.py` acepta las dos.
- Un círculo dibujado en plano se convierte solo en la elipse isométrica correcta.
- Con DOMMatrix, el plano de suelo es `new DOMMatrix().rotate(30).skewX(-30).scale(1, 0.86602)`. Con 0.8602 (valor que circula en un artículo) el eje y queda un 0.7 % corto.
- Dimétrica 2:1, plano de suelo: `matrix(1, 0.5, -1, 0.5, 0, 0)`, multiplicada por la escala que se quiera.

### 4. SSR en Illustrator (escalar, sesgar, rotar)

Desde un cuadrado, en este orden:

| Cara | Escala vertical | Sesgado | Rotación |
|---|---|---|---|
| Superior | 86.602 % | 30° | −30° |
| Izquierda | 86.602 % | −30° | −30° |
| Derecha | 86.602 % | 30° | 30° |

Comprobación: las aristas que en la vista ortográfica forman 90° o 180° caen a 30° o 150°.

### 5. CSS 3D

```css
/* capa: prototipo fuera de scss/ — CREATIVE o @layer syx.app; desarrollo en ../02-svg-web/css-3d.md */
.iso-true { transform: rotateX(54.7356deg) rotateZ(-45deg); transform-style: preserve-3d; }
.iso-2to1 { transform: rotateX(60deg) rotateZ(-45deg); transform-style: preserve-3d; }
```

Sin `perspective`, o con un valor enorme: la proyección es paralela.

### 6. Orientaciones

Hay 8 orientaciones isométricas. En cámaras, girar Z en saltos de 90° (45°, 135°, 225°, 315°) mantiene la isométrica vista desde otro lado. Al girar, se reasigna qué cara es «izquierda» y cuál «derecha» para conservar la luz.

---

## checklist

- [ ] Constantes copiadas de la tabla, no recordadas (86.602 %, 54.7356°)
- [ ] Matrices de plano de §3 para todo detalle sobre una cara
- [ ] Forma espejada de la cara derecha solo en formas simétricas, nunca con texto
- [ ] Al girar la cámara, laterales reasignados según la luz
