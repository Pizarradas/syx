# Isométrico · Color, luz y sombra

## meta

| Campo | Valor |
|-------|-------|
| **Dominio** | isometric — fundamentos · color |
| **Fuente** | IBM Design Language (Isometric style), Linearity, Graphic Design Stack Exchange, WCAG 1.4.11 |
| **Objetivo** | Definir paleta, tres tonos por cara, sombras proyectadas, degradados y contornos de una ilustración flat isométrica |
| **Agent tags** | `#isometric` `#color` `#light` `#shadow` `#palette` |

Se abre cuando `fundamentos.md` pide definir una paleta, sombrear caras, proyectar sombras o decidir un degradado. La teoría general de color (distribución, semántica) está en `ui/color-theory.md`; la construcción de escalas de SYX, en `syx/color-oklch.md`.

---

## concepts

En flat el volumen lo dan solo los tonos. Una luz única y fija decide qué cara es clara, cuál media y cuál oscura, y esa asignación es la misma en todos los objetos y en toda la serie. Calentar el techo y enfriar la sombra da un resultado más vivo que oscurecer con negro.

---

## rules

### 1. Tres tonos por material

| Cara | Valor | Ajuste desde el color base (HSL) |
|---|---|---|
| Superior | el más claro: recibe la luz del cielo | L +10–14, matiz 4–6° hacia cálido (amarillo) |
| Lateral iluminado | medio | color base |
| Lateral en sombra | el más oscuro | L −14–18, saturación ×0.85, matiz 4–6° hacia frío (azul) |

- Con luz arriba-izquierda (convención por defecto) la cara izquierda es la media y la derecha la oscura. Con luz arriba-derecha se invierten.
- `shade()` en `../02-svg-web/herramientas/iso.mjs` y `tres_tonos()` en `../04-blender/herramientas/iso_comun.py` implementan esta tabla (L +12, −16, matiz 6°) y dan hex idénticos: 16 casos comprobados, y el render de Blender tras `iso_setup.py` los reproduce exactos.
- Nunca `multiply` negro para sombrear.
- Una paleta flat funciona cuando sus colores base tienen saturación y luminosidad parecidas. De 4 a 6 colores base.
- Transparencias solo cuando hacen falta. Sin modos de fusión (screen, multiply, overlay): se ven sucios en flat y Lottie no los exporta.

### 2. Una sola fuente de luz

Se fija al principio y se aplica a todos los objetos y a toda la serie. Ángulos de sombra mezclados sugieren varias luces y rompen la lectura.

### 3. Sombras proyectadas

- Luz direccional = rayos paralelos. La sombra de un plano sobre un plano paralelo tiene la misma forma, desplazada.
- Construcción: cada esquina del contorno superior se une al suelo en la dirección de la luz y se cierra el polígono con la base. `flatShadow()` de `iso.mjs` lo hace; por defecto desplaza 0.6 en x y 0.25 en y por unidad de altura.
- Objeto flotante: la esquina se proyecta en vertical hasta el suelo y se corta con la dirección de la luz.
- Dos estilos, uno por serie: sombra plana (bordes duros, 8–15 % de negro o del color frío del suelo) o sombra que se desvanece.
- Las sombras largas a 45° son un recurso de iconos, no una sombra física. No se mezclan con sombras isométricas construidas.

### 4. Degradados

En flat estricto no hay. En flat «moderno», uno lineal suave dentro de una cara, en la dirección de la luz. Si la pieza va a Lottie, colores planos y degradados lineales simples.

### 5. Contornos

- Sin contorno: el volumen depende solo de los tonos; la diferencia entre ellos tiene que ser clara.
- Con contorno: grosor uniforme, uniones redondeadas y un oscuro del mismo matiz, no negro puro.
- Aclarar o quitar el contorno donde el objeto toca el suelo lo asienta; reforzarlo lo hace más sólido o interactivo.

### 6. Contraste para la web

- Si la ilustración transmite información (diagramas, pasos), lo que explica contrasta al menos 3:1 con el fondo (WCAG 1.4.11; ver `front/accessibility-wcag.md`).
- Se comprueba en modo oscuro si la web lo tiene. Lo normal es mantener los tres tonos y cambiar solo el fondo y la losa.

### 7. En SYX

Los colores base no se inventan: salen de los roles semánticos del tema (ver `fundamentos.md` §8). La derivación a tres tonos de esta tabla es lo único propio de la ilustración, y se escribe como tokens del proyecto. El 3:1 se comprueba contra el `--semantic-color-bg-*` real sobre el que va la ilustración, en los dos modos.

---

## checklist

- [ ] Tres tonos calculados con `shade()` / `tres_tonos()`, no a ojo
- [ ] Una luz, la misma en todos los objetos y en la serie
- [ ] Sombras construidas en la dirección de la luz, un solo estilo
- [ ] Sin modos de fusión ni `multiply` negro
- [ ] Elementos informativos a ≥ 3:1 del fondo, en claro y en oscuro
