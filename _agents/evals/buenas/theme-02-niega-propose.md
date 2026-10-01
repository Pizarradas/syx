---
tarea: theme-02
por qué: nombra propose.js para decir que NO es la vía; la primera versión del corrector la bajaba a 7/8
---
## Color Brief

El primario de `example-03` pasa a la rampa verde: un paso más oscuro en claro y uno más claro en oscuro. El anillo de foco (`--semantic-color-border-focus`) lo sigue, y `--semantic-color-text-on-primary` puede tener que cambiar de tono.

## Files for a person to create

El cambio va en `scss/themes/example-03/_theme.scss`. Esto no pasa por propose.js: `scss/themes/` es human en `contracts/trust.json` y la vía de propuesta se niega ahí. Lo aplica una persona.

## Compilation Check

`npm run build`, después `npm run check:contraste` (texto 4,5:1, foco 3:1, texto sobre primario; claro y oscuro) y `npm run check:modo-claro`.

## Why

- Verde 700 en claro y 300 en oscuro — primeros pasos que pasan 4,5:1 como texto en cada modo — si el primario dejara de colorear enlaces, bastaría 3:1.
