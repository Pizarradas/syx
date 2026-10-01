## Color Brief

El primario de `example-03` pasa a la rampa verde de primitivas: un paso más oscuro en claro y uno más claro en oscuro. `--semantic-color-border-focus` sigue al primario, así que el anillo de foco cambia con él; `--semantic-color-text-on-primary` puede tener que pasar de claro a oscuro según el paso elegido.

## Files for a person to create

Un cambio en `scss/themes/example-03/_theme.scss` (las dos líneas de `--semantic-color-primary`, claro y oscuro). Es un cambio de tema: se entrega para que una persona lo aplique.

## Compilation Check

`npm run build` y `npm run check:contraste`: primario como texto (4,5:1), como borde de foco (3:1) y el texto sobre primario, en claro y en oscuro. Después `npm run check:modo-claro`.

## Why

- Verde 700 en claro y 300 en oscuro — son los primeros pasos que superan 4,5:1 como texto sobre el fondo de cada modo — si el primario dejara de usarse como color de enlace, bastaría 3:1 y se podría subir un paso.
