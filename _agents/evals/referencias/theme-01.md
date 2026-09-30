## Decisiones

- Texto primario casi negro sobre papel cálido en claro (≥ 12:1); en oscuro, texto hueso sobre gris muy oscuro, no negro puro, para evitar el halo en lectura larga.
- Un solo acento, reservado para enlaces y foco; el borde de foco sigue al primario.
- Interlineado de cuerpo relajado y medida de línea corta: es un tema de lectura.
- El oscuro se diseña con sus propios valores; no es el claro invertido.

## Ficheros

Van en `scss/themes/reading-hc/` (`_setup.scss`, `_theme.scss` y los bundles) más su entrada `scss/styles-theme-reading-hc.scss`. Se entregan completos para que una persona los coloque: `scss/themes/` es tier `human` en `contracts/trust.json`.

## Verificación

Una vez colocados: `npm run check:setups`, `npm run check:contraste` (los 12 pares de `contracts/contrast.json` en los cuatro estados de modo) y `npm run check:modo-claro` (elegir claro u oscuro pinta lo mismo con cualquier SO).
