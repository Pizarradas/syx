## Color Brief

Alto contraste para lectura larga, con claro y oscuro diseñados por separado. Texto casi negro sobre papel cálido en claro (≥ 12:1); en oscuro, texto hueso sobre gris muy oscuro, no negro puro, para evitar el halo en lectura larga. Un solo acento, reservado para enlaces y foco; el borde de foco sigue al primario. El oscuro se diseña con sus propios valores; no es el claro invertido.

## Primitive Scale

Primario (tinta azul, H≈255) de `oklch(0.97 0.01 255)` en el 50 a `oklch(0.22 0.06 255)` en el 900; neutros cálidos (H≈80, croma ≤ 0.012) para papel y texto. Los diez pasos de cada rampa van completos en `_setup.scss`.

## Files for a person to create

- `scss/themes/reading-hc/_setup.scss` — las rampas primitivas.
- `scss/themes/reading-hc/_theme.scss` — el mapa semántico, claro y oscuro.
- `scss/styles-theme-reading-hc.scss` — la entrada.

Se entregan completos para que una persona los coloque: `scss/themes/` es tier `human` en `contracts/trust.json`.

## Compilation Check

Una vez colocados: `npm run build`, `npm run check:setups`, `npm run check:contraste` (los 12 pares de `contracts/contrast.json` en los cuatro estados de modo) y `npm run check:modo-claro` (elegir claro u oscuro pinta lo mismo con cualquier SO).

## Why

- Fondo oscuro en gris muy oscuro (L≈0.18) y no negro — el negro puro con texto hueso produce halo en lectura larga — si el tema se usara sobre todo en pantallas OLED de noche, el negro ganaría por consumo.
- Contraste de cuerpo ≥ 12:1, muy por encima de AA — es el propósito del tema — si sustituyera a un tema de uso general, bajaría a 7:1 para no cansar.
