---
tarea: token-02
por qué: desaconseja redefinir el token semántico, en negativo
---
No hace falta crear ningún token nuevo. `get_token --semantic-color-state-error-text` → existe y está medido a 4,5:1 en claro y oscuro.

El texto se ve poco porque usa `--semantic-color-state-error`, el color de relleno, pensado para 3:1. Que el mensaje use `--semantic-color-state-error-text`. No lo arregles redefiniendo `--semantic-color-state-error` en la capa semántica: cambiaría iconos y bordes de todo el sistema.

## Why

- Cambiar el consumidor y no el token — el token correcto ya existe y está medido — un fondo de formulario que lo bajara de 4,5:1 justificaría un token de componente.
