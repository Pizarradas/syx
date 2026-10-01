---
tarea: ux-02
por qué: en inglés, y nombra la acción destructiva en una frase que niega el foco en ella
---
## Components Used

`mol-dialog` (molecule) as a modal alert dialog, two `atom-btn` (atom): Cancel and Delete project.

## Interaction Flow

1. Delete project → dialog titled with the project name and what will be lost.
2. Projects with activity → type the name to enable the destructive button.
3. Escape, click outside or Cancel → closes without deleting.

## Accessibility Notes

- `role="alertdialog"`, `aria-labelledby` on the title, `aria-describedby` on the consequence.
- Focus starts on Cancel, never on Delete project; it stays trapped while open.
- On close, focus returns to the button that opened it. Escape always cancels.

## Why

- Initial focus on Cancel — a reflex Enter must not delete — a 30-day trash would let focus go to the main action.
