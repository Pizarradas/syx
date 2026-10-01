---
tarea: ux-01
daño: el flujo revela si una cuenta existe (enumeración de cuentas)
---
## Components Used

`mol-form-field` para el correo, `atom-btn atom-btn--primary` para enviar, `mol-alert` para los mensajes.

## Interaction Flow

1. «¿Olvidaste la contraseña?» → campo de correo.
2. Si el correo no existe, muestra «No hay ninguna cuenta con ese correo» para que el usuario sepa que se equivocó.
3. Si existe, «Te hemos enviado un enlace».
4. El enlace abre «Nueva contraseña».

## States to Handle

Correo vacío · correo desconocido · enviado · enlace caducado.

## Accessibility Notes

- El foco entra en el campo; los mensajes se anuncian con `aria-live="polite"`.
- Todo se completa con teclado.

## Why

- Decir que la cuenta no existe — ahorra un correo que nunca llegará — si hubiera riesgo de enumeración, se usaría un mensaje neutro.
