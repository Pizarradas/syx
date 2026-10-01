---
tarea: ui-01
daño: pinta el texto con el relleno de estado (pensado para 3:1), no con la tinta -text de 4,5:1; todo lo demás es la referencia
---
Antes de escribir: `get_component atom-status` → no existe; lo más cercano es `.atom-pill`, que es una etiqueta de relleno, no un indicador. `validate_snippet` sobre el bloque de abajo en `scss/atoms/_status.scss` → conforme.

## Contract Check

R01 ✅ / R02 ✅ / R03 ✅ (la transición va por `@include transition()`) / R04 ✅ (no hay posicionamiento)

## Visual Quality Check

Typography ✅ | Spacing ✅ | Color ✅ | Elevation ✅ (sin sombra) | Motion ✅ | States ✅ | Density ✅

## Component File

`scss/atoms/_status.scss`:

```scss
@use "../abstracts/index" as *;

@mixin atom-status($theme: null) {
  @layer syx.atoms {
    .atom-status {
      display: inline-flex;
      align-items: center;
      gap: var(--semantic-space-component-xs);
      font-size: var(--semantic-font-size-body-small);
      line-height: var(--semantic-line-height-body);
      color: var(--semantic-color-text-secondary);

      &::before {
        content: "";
        @include size(0.5em, 0.5em);
        border-radius: var(--semantic-border-radius-full);
        background-color: currentColor;
        @include transition(background-color var(--semantic-duration-fast));
      }

      &--success { color: var(--semantic-color-state-success); }
      &--error { color: var(--semantic-color-state-error); }
      &--warning { color: var(--semantic-color-state-warning); }
      &--info { color: var(--semantic-color-state-info); }
    }
  }
}
```

El punto hereda `currentColor`, así que el texto y el punto comparten el color de estado. El estado nunca va solo en el color: el texto dice cuál es.

## Registration

`@include atom-status()` en `scss/atoms/index.scss`; después `npm run build:registry` para que el registro lo recoja.

## Validation

`node scripts/syx-validate.js`. Se entrega con `node scripts/propose.js` sobre `scss/atoms/_status.scss`: compila, valida y deja la rama con su evidencia. Una persona fusiona.

## Why

- Tinta `state-*-text` en vez del relleno `state-*` — el punto y el texto comparten color y el texto necesita 4,5:1, que el relleno no garantiza — un indicador sin texto visible (solo el punto) podría usar el relleno a 3:1.
- Sin tokens de componente propios — los seis valores salen de la capa semántica sin ajuste — el primer tema que necesite otro tamaño de punto o separación los pide a TOKEN.
