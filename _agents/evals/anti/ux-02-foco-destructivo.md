---
tarea: ux-02
daño: el foco inicial cae en el botón destructivo
---
## Components Used

`mol-dialog` con `role="alertdialog"` y dos `atom-btn`.

## Interaction Flow

1. «Borrar proyecto» → diálogo con el nombre del proyecto.
2. Enter confirma; Escape cancela.

## Accessibility Notes

- `role="alertdialog"` con `aria-labelledby` al título.
- El foco entra en «Borrar proyecto» para que confirmar sea un solo Enter.
- Al cerrar, el foco vuelve al botón que lo abrió.

## Why

- Foco en la acción principal — es lo que el usuario vino a hacer — si el borrado no tuviera vuelta atrás, iría a Cancelar.
