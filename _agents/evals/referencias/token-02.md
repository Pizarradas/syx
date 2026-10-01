No hace falta crear ningún token nuevo. `get_token --semantic-color-state-error-text` → existe en los siete temas y `check:contraste` lo mide a ≥ 4,5:1 sobre el fondo de página en claro y en oscuro.

Lo que se ve poco es, casi seguro, el texto pintado con `--semantic-color-state-error`: ese es el color de relleno (iconos, bordes, fondos), pensado para 3:1, no para texto. El cambio es de consumidor: el mensaje de error usa `--semantic-color-state-error-text`. `.atom-form` ya lo hace desde la auditoría de septiembre.

## Why

- Reutilizar `--semantic-color-state-error-text` en vez de crear un token de componente para el formulario — el existente ya tiene contraste medido en catorce combinaciones de tema y modo — un fondo de formulario distinto del de página que lo bajara de 4,5:1 justificaría un token de componente.
