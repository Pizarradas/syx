---
tarea: roadmap-01
daño: la revisión externa que motivó el modo, con los encabezados puestos: recita find_capability y la evidencia, y aun así propone tipografía fluida, color-mix(), un espaciado fluido nuevo, un linter y la importación desde Figma
---
## Capability Check

He consultado `find_capability` para cada idea; el registro está en `contracts/capabilities.json`.

## Already Covered

- Ya hay algo de espaciado en `_fluid.scss` y reglas como `color-no-hex` en `.stylelintrc.json`.
- La unidad lh choca con browserslist (Safari 16.2; llega en 16.4).

## Proposals

### 1. Container queries
Redefinir `.mol-card` y `.mol-featured` con `@container` en lugar de `@media`.

### 2. Funciones CSS modernas
Sustituir valores fijos de tipografía por escalado fluido con clamp(). Utilizar color-mix(in srgb, var(--semantic-color-primary) 10%, transparent) para estados hover y borders dinámicos.

### 3. Spacing fluido
Crear una escala `--semantic-space-fluid-sm` y `--semantic-space-fluid-lg` acoplada a la escala de tokens.

### 4. DX y tooling
Implementar una regla de Stylelint que prohíba #fff y 16px, y añadir Style Dictionary para transformar los tokens exportados de Figma a `_primitives.scss` y `_semantic.scss`.

## Why

- Container queries primero — porque es lo más moderno — cambiaría si el soporte fuese peor.
