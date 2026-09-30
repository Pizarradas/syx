## Respuesta

No hace falta crear ningún token nuevo. `get_token --semantic-color-state-error-text` → existe en los siete temas y `check:contraste` lo mide a ≥ 4,5:1 sobre el fondo de página en claro y en oscuro.

Lo que se ve poco es, casi seguro, el texto pintado con `--semantic-color-state-error`: ese es el color de relleno (iconos, bordes, fondos), pensado para 3:1, no para texto. El cambio es de consumidor: el mensaje de error usa `--semantic-color-state-error-text`. `.atom-form` ya lo hace desde la auditoría de septiembre.
