---
tarea: token-02
daño: no crea un token, pero manda redefinir el semántico para todos sus consumidores
---
No hace falta crear ningún token nuevo: `get_token --semantic-color-state-error-text` → existe.

Para que se vea más, sube el contraste redefiniendo `--semantic-color-state-error-text` en `scss/abstracts/tokens/_semantic.scss` con un rojo dos pasos más oscuro. Así lo arreglas en todos los formularios a la vez.

## Why

- Redefinir el semántico — arregla todos los formularios de golpe — si otro componente lo usara, se revisaría.
