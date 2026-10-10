# Isométrico · Prompts para modelos de imagen

## meta

| Campo | Valor |
|-------|-------|
| **Dominio** | isometric — motor ráster (módulo de entrada del estrato) |
| **Fuente** | Floniks (Prompting isometric scenes), Midjourney Docs (parámetros, `--no`), Chat2SVG, EZCharacter |
| **Objetivo** | Redactar y revisar prompts para que Midjourney, GPT Image, Flux, Imagen y similares generen flat isométrico coherente, y saber cuándo no basta |
| **Agent tags** | `#isometric` `#image-generation` `#prompt` `#midjourney` `#series` |

Da por cumplido `../01-fundamentos/fundamentos.md`. Plantilla rellenable y ejemplos: `plantilla-prompt.md`.

---

## concepts

Los modelos de imagen tienden a meter perspectiva, sombras suaves y texturas, y la palabra «isometric» sola no lo evita: hay que describir la proyección, la luz y lo que no se quiere. Y aun así **no garantizan la geometría**: para una pieza exigente, la geometría la pone Blender y el modelo solo el estilo. Una imagen ráster plana tampoco se anima por partes.

---

## rules

### 1. Estructura del prompt

En inglés, que es lo que mejor entienden los modelos, y en este orden:

1. **Tipo y estilo:** `flat isometric vector illustration, clean geometric shapes, solid colors`.
2. **Proyección:** `true isometric projection, 30-degree axonometric angles, parallel projection, no vanishing point, no perspective distortion, vertical lines perfectly vertical`.
3. **Contenedor primero:** `isometric floating platform / tile, rectangular, …`.
4. **Objetos relativos al contenedor:** posición (front-left, rear-right…), tamaño relativo y color. Lo importante, delante.
5. **Luz:** `single light source from upper left, three distinct face values: top face lightest, left face mid-tone, right face darkest, hard-edged flat shadows, no gradients`.
6. **Paleta:** 4–6 colores con hex o nombres precisos, más el fondo. En SYX, los hex de los roles del tema.
7. **Encuadre para web:** espacio vacío (`generous empty space on the right for headline`) y fondo liso o transparente.
8. **Exclusiones:** en Midjourney con `--no` al final; en los demás, una frase `Avoid: …`.

### 2. Por herramienta

- **Midjourney:** parámetros al final, separados por espacio y sin puntuación (`--ar 16:9 --raw --no perspective, gradient, texture, photorealistic`). Series con `--sref` y `--seed` fijo. `--raw` reduce el estilo propio. `--no` lee cada palabra por separado.
- **Conversacionales (GPT Image, Gemini/Imagen):** frases completas; `transparent background` si lo admiten; imagen de referencia de estilo en series.
- **Flux, SDXL y similares:** los negativos funcionan mejor; LoRA isométrica si hay; seed y resolución fijos.

### 3. Coherencia de serie

- Idénticos en toda la serie: el bloque de proyección, luz y paleta (copiado tal cual), la referencia de estilo y el encuadre.
- Cambia solo el bloque de objetos.
- Primero una pieza maestra; después, las demás con ella como referencia.

### 4. Blender como estructura

Para escenas exigentes, se invierte el orden:

1. Bloquear la escena en Blender con formas simples y ejecutar `iso_setup.py` (`../04-blender/blender.md`): el render da proyección, encuadre y tres tonos exactos.
2. Ese render es la guía estructural: imagen de referencia o img2img con fuerza media en los conversacionales, imagen de partida en Midjourney, ControlNet (depth, canny o lineart) en Flux/SDXL. El prompt aporta estilo, materiales y detalle; la imagen, la geometría.
3. Si la pieza se va a animar, la versión final se monta con `iso_export_svg.py` o `iso_export_capas.py` desde el mismo `.blend`, no desde la imagen generada.

### 5. Revisión obligatoria del resultado

1. Verticales verticales y paralelas que no convergen. Si convergen, regenerar reforzando `no vanishing point`.
2. Las tres caras siguen la misma luz en todos los objetos.
3. Sin texto basura, manos ni detalles fundidos.
4. Fondo y márgenes útiles para el layout.
5. Si se va a animar: vectorizar y reconstruir por piezas con `../02-svg-web/svg-web.md`.

Lista cuando pasa estos cinco puntos y el control de calidad de los fundamentos.

### 6. Personajes

Desde arriba se ven más la coronilla, los hombros y los sombreros que la cara: `slightly oversized head, readable silhouette from above`, con una sombra de contacto plana en rombo.

---

## checklist

- [ ] Los ocho bloques del prompt, en orden y en inglés
- [ ] Exclusiones con la sintaxis de la herramienta
- [ ] En serie: proyección, luz y paleta idénticas; pieza maestra como referencia
- [ ] Geometría exigente: render de Blender como guía estructural
- [ ] Revisión de cinco puntos pasada; si se anima, reconstruida por piezas
