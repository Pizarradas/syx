# Isométrico · Fundamentos

## meta

| Campo | Valor |
|-------|-------|
| **Dominio** | isometric — fundamentos (módulo de entrada del dominio) |
| **Fuente** | Kit iso-flat (José Luis Pizarro Feo, 2026); fuentes verificadas en `../00-indice/fuentes.md` |
| **Objetivo** | Fijar la especificación, las reglas geométricas, la composición y el control de calidad de cualquier ilustración flat isométrica, antes de elegir motor |
| **Agent tags** | `#isometric` `#illustration` `#svg` `#flat` `#projection` |

---

## concepts

**Flat isométrico** es proyección paralela con tres tonos planos por material. No hay punto de fuga: las aristas paralelas siguen paralelas y el tamaño no cambia con la distancia. Todo lo demás de este dominio deriva de eso.

**Dos proyecciones, nunca mezcladas.** La *isométrica real* pone las aristas del suelo a 30° y los tres ejes a 120° (cámara a 54.7356°). La *dimétrica 2:1* las pone a 26.565° (cámara a 60°) y es la de pixel art y tiles. Muchas fuentes llaman «isométrica» a la segunda: se nombra siempre cuál se usa.

**Ejes comunes** a código, Blender y documentación: x hacia abajo-derecha, y hacia abajo-izquierda, z hacia arriba. El observador mira desde +x +y +z y ve las caras superior (z máx), derecha (x máx) e izquierda (y máx). En pantalla, isométrica real con unidad `u`:

```js
sx = (x - y) * 0.8660254 * u;
sy = ((x + y) * 0.5 - z) * u;   // dimétrica 2:1: 0.8660254 → 1
```

En Blender, con la cámara estándar: x = +X, y = −Y, z = +Z.

**Se calcula, no se dibuja.** Ningún punto de pantalla se escribe a mano: la escena se describe como datos (`../02-svg-web/`) o se modela en 3D (`../04-blender/`), y la herramienta proyecta. Un modelo ráster (`../05-prompts-imagen/`) no garantiza la geometría.

---

## rules

### 1. Las cinco decisiones, antes de dibujar

Se escriben al empezar y no cambian a mitad:

| Decisión | Opciones | Por defecto |
|---|---|---|
| Proyección | `iso` (30°, ejes a 120°) / `dimetric` (2:1, 26.565°) | `iso` en vector y web; `dimetric` en pixel art y tiles |
| Unidad de rejilla | p. ej. 8, 16, 40 px por unidad de mundo | 40 px en SVG |
| Luz | una sola, direccional | arriba-izquierda: techo claro, cara izquierda media, derecha oscura |
| Paleta | 4–6 colores base, tres tonos cada uno | en SYX, de los roles semánticos (ver *En SYX*) |
| Contorno | sin trazo / trazo fino uniforme | sin trazo: el volumen lo dan los tonos |

Además, dos que ahorran rehacer: **qué se va a animar** (aunque sea «más adelante») y **dónde vivirá** (inline, `<img>`, componente, Lottie, Rive). Si el encargo es ambiguo en algo caro de rehacer —estilo, encuadre, qué se anima— se pregunta una vez; si no, se decide y se deja escrito.

### 2. Geometría que no se negocia

- Las verticales son verticales. Las aristas de suelo van a ±30° (iso) o con pendiente 1:2 (dimétrica).
- La altura se expresa desplazando en z, nunca escalando.
- Todo se construye con primitivas (prisma, cilindro, cuña, esfera) que luego se suman o restan, con los vértices anclados a la rejilla.
- Los círculos del suelo son elipses 1:√3 (iso) o 1:2 (dimétrica), inscritas en un rombo de construcción.
- Valores exactos —matrices, SSR, cámaras, pantalla↔mundo—: `matematicas.md`.

### 3. Color, luz y sombra

- Cada material lleva tres tonos fijos: superior, lateral iluminado y lateral en sombra. Ningún objeto rompe esa asignación.
- Los tonos se calculan con `shade()` (`iso.mjs`) o `tres_tonos()` (`iso_comun.py`), que dan hex idénticos. Nunca a ojo, nunca con `multiply` negro.
- Fórmula, sombras proyectadas, degradados, contornos y contraste: `color-luz.md`.

### 4. Composición

- La escena se apoya en una plataforma o losa: primero el contenedor, después los objetos sobre él.
- Lo importante va delante (abajo en pantalla). El detalle denso en la parte trasera se solapa.
- Aire: los objetos flotantes y las alineaciones precisas dan ligereza.
- El texto va plano a pantalla o proyectado exactamente sobre un plano (techo, izquierda o derecha). Nunca a medias.
- **Orden del documento = orden de profundidad** (algoritmo del pintor): de atrás hacia delante por `x + y` y luego por `z`. Con cajas que se cruzan o tamaños muy distintos, un grafo «está detrás de» ordenado topológicamente. Si dos piezas se interpenetran, se divide una.

### 5. Control de calidad (siempre, antes de entregar)

1. Todas las verticales son verticales y todas las aristas de suelo tienen el ángulo de la proyección elegida.
2. Los tres tonos son coherentes en todos los objetos y todas las sombras caen hacia el mismo lado.
3. Ninguna arista paralela converge y nada se ha escalado para simular distancia.
4. Las elipses están inscritas en rombos; no son círculos.
5. Ningún objeto trasero tapa a uno delantero.
6. Paleta y contorno coinciden con la especificación de §1.
7. Si es SVG: `iso-check.py` da 0 errores **y la imagen se ha mirado renderizada** (`iso-render.py`), no solo leída en código. Con animación, también un instante intermedio.

Una ilustración que no se ha mirado renderizada no está terminada. Si falla un punto, se corrige y se vuelve a pasar la lista.

### 6. Errores frecuentes en las fuentes

| Se lee | Es |
|---|---|
| Escala SSR «86.062 %» | 86.602 % (cos 30°) |
| `rotateX(60deg) rotateZ(45deg)` es «isometría real» | dimétrica 2:1; la real necesita `rotateX(54.7356deg)` |
| Cámara de Blender a X = 60° | vista «de juego» 2:1; la real es X = 54.736° |

Contradicciones completas y su verificación numérica: `../00-indice/fuentes.md`.

### 7. Elegir motor

| Caso | Motor | Módulo |
|---|---|---|
| Prismas, cilindros, losas, iconos, diagramas | JSON → `iso.mjs` | `../02-svg-web/svg-web.md` |
| Texto, logos o ventanas sobre una cara | matrices de plano y estructura de tres capas | `../02-svg-web/svg-web.md` |
| Tarjetas o rejillas HTML reales en isométrico | CSS 3D | `../02-svg-web/css-3d.md` |
| Biseles, booleanas, curvas, mecanismos, animación compleja | Blender → SVG por piezas o capas PNG | `../04-blender/blender.md` |
| La imagen la genera un modelo ráster | prompt; si hay que animarla, se reconstruye por piezas | `../05-prompts-imagen/prompts-imagen.md` |
| Algo se mueve | después del motor | `../03-animacion/animacion.md` |

### 8. En SYX

Una ilustración isométrica en SYX es contenido de una página, no un componente del sistema. Eso fija dónde vive cada cosa:

- **Paleta desde los roles.** Los colores base salen de roles semánticos del tema (`--semantic-color-primary`, `--semantic-color-secondary`, `--semantic-color-bg-secondary` para la losa…), consultados con `get_token` en el tema y el modo que tocan. Lo que se inventa es solo la derivación a tres tonos.
- **Tokens del proyecto.** `iso.mjs` y `iso_export_svg.py --tokens` emiten `--<prefijo>-<material>-top|left|right`. El prefijo es el del proyecto (`umbra`, `strata`…), nunca `app-` ni un prefijo de SYX, y el bloque que los declara lleva `/* syx-reuse: checked … — por qué */`. `iso-check.py --tokens` lo vigila.
- **Hex, no OKLCH.** Las herramientas leen hex y los temas de SYX están en OKLCH. El hex de un color de componente lo da `get_figma_spec` (campo `hex`); un `oklch()` no se convierte a mano. Hoy no hay un paso verificado para pasar un rol semántico suelto de OKLCH a hex: es un hueco conocido del dominio.
- **Modo oscuro.** Se conservan los tres tonos y se cambian solo el fondo y la losa base, o se genera una segunda paleta con los valores del modo oscuro.
- **Movimiento.** En CREATIVE o en una app, CSS de prototipo dentro de `prefers-reduced-motion`. Dentro de `scss/`, `@include transition()` y tokens `--semantic-duration-*` / `--semantic-easing-*` (ver `motion/08-ejecucion/css/css.md`, *En SYX*).

---

## checklist

- [ ] Las cinco decisiones escritas al empezar, más qué se anima y dónde vive
- [ ] Proyección nombrada (`iso` o `dimetric`) y sin mezclar en la pieza ni en la serie
- [ ] Ningún punto de pantalla escrito a mano: escena como datos o modelada en Blender
- [ ] Tres tonos calculados con `shade()` / `tres_tonos()`
- [ ] Orden del documento = orden de profundidad; piezas interpenetradas divididas
- [ ] Paleta desde roles semánticos; tokens con prefijo del proyecto y `syx-reuse:`
- [ ] Control de calidad de §5 pasado, con la imagen mirada renderizada
