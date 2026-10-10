# Isométrico · Plantilla de prompt

> Plantilla del estrato `05-prompts-imagen/`. Se abre cuando `prompts-imagen.md` pide redactar el prompt. Los bloques PROYECCIÓN, LUZ y PALETA se mantienen idénticos en toda una serie; en SYX, la paleta lleva los hex de los roles del tema.

```text
[ESTILO] flat isometric vector illustration, clean geometric shapes, solid flat colors, minimal detail, modern web hero style.
[PROYECCIÓN] true isometric projection, 30-degree axonometric angles, parallel projection, no vanishing point, no perspective distortion, vertical lines perfectly vertical, equal weighting on three visible faces.
[CONTENEDOR] {isometric floating platform | single isometric tile | isometric room cutaway}, {material/color}, {proporción}.
[OBJETOS] {objeto 1} at front-left, {objeto 2} at rear-center, {objeto 3} at front-right; {relaciones de tamaño}; key object on the front-facing side.
[LUZ] single directional light from upper left, three distinct face values: top face lightest, left face mid-tone, right face darkest; hard-edged flat cast shadows on the ground; no gradients, no ambient occlusion, no glow.
[PALETA] {#hex1 nombre}, {#hex2 nombre}, {#hex3 nombre}, {#hex4 nombre}; background {#hex fondo | transparent}.
[ENCUADRE] {16:9 | 1:1 | 4:5}, composition centered {o: shifted left with empty space on the right for text}, generous margins.
[EVITAR] perspective, fisheye, vanishing point, photorealistic, texture, noise, soft shadows, multiple light sources, text, watermark.
```

## Ejemplo (Midjourney)

```text
flat isometric vector illustration of a small cloud data center on a floating platform, true isometric projection, 30-degree axonometric angles, parallel projection, no vanishing point, server racks at rear-center, a cylindrical database at front-left, a green cooling unit at front-right, single light from upper left, top faces lightest, left faces mid-tone, right faces darkest, hard flat shadows, palette #5B8DEF blue, #F2A541 orange, #56C596 green, #C9D6E8 light slate, background #F6F4EF, generous empty space on the right --ar 16:9 --raw --no perspective, gradient, texture, text
```

## Ejemplo (modelo conversacional)

```text
Create a flat isometric vector-style illustration for a website hero. Use true isometric projection with 30-degree angles and no perspective at all: parallel edges must stay parallel and vertical lines vertical. Show a floating light-slate platform with server racks at the back, a cylindrical database at the front-left and a green cooling unit at the front-right. Light comes from the upper left: top faces lightest, left faces mid-tone, right faces darkest, with hard flat shadows. Colors: #5B8DEF, #F2A541, #56C596, #C9D6E8 on a plain #F6F4EF background. Leave empty space on the right for a headline. Avoid gradients, textures, text and photorealism.
```
