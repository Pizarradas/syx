---
tarea: ui-01
por qué: la misma entrega con los encabezados del modo en español y otra redacción; la primera versión exigía «## Código» y «## Entrega» y suspendía la del modo
---
Consulté `get_component atom-status`: no hay nada equivalente.

## Contrato

R01–R04 ✅. La transición del punto usa el mixin.

## Código

```scss
@use "../abstracts/index" as *;

@mixin atom-status($theme: null) {
  @layer syx.atoms {
    .atom-status {
      display: inline-flex;
      align-items: center;
      gap: var(--semantic-space-component-xs);
      color: var(--semantic-color-text-secondary);

      &::before {
        content: "";
        @include size(0.5em, 0.5em);
        border-radius: var(--semantic-border-radius-full);
        background-color: currentColor;
        @include transition(background-color var(--semantic-duration-fast));
      }

      &--success { color: var(--semantic-color-state-success-text); }
      &--error { color: var(--semantic-color-state-error-text); }
      &--warning { color: var(--semantic-color-state-warning-text); }
      &--info { color: var(--semantic-color-state-info-text); }
    }
  }
}
```

## Registro

Añadir `@include atom-status()` a `scss/atoms/index.scss` y regenerar el registro con `npm run build:registry`.

## Validación

`node scripts/syx-validate.js`; sale como propuesta en una rama (tier pr) y la fusiona una persona.

## Por qué

- Punto en `currentColor` — texto y punto comparten la tinta de 4,5:1 sin un segundo token — si el punto tuviera que distinguirse del texto, haría falta un token de componente.
