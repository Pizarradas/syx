## Cambio

En `scss/themes/example-03/_theme.scss`, el primario pasa a la rampa verde de primitivas, con un paso más oscuro en claro y uno más claro en oscuro. `--semantic-color-border-focus` sigue al primario, así que el anillo de foco cambia con él; `--semantic-color-text-on-primary` puede tener que pasar de claro a oscuro según el paso elegido.

Es un cambio de tema: se entrega para que una persona lo aplique.

## Verificación

`npm run check:contraste`: primario como texto (4,5:1), como borde de foco (3:1) y el texto sobre primario, en claro y en oscuro. Después `npm run check:modo-claro`.
