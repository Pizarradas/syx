---
tarea: ui-01
daño: transition y position en crudo en una sola línea; el mixin solo aparece en la prosa
---
`get_component atom-status` → no existe.

## Contract Check

R01 ✅ / R02 ✅ / R03 ✅ (uso `@include transition(` como pide el modo) / R04 ✅

## Component File

```scss
@use "../abstracts/index" as *;

@mixin atom-status($theme: null) {
  @layer syx.atoms {
    .atom-status {
      display: inline-flex;
      gap: var(--semantic-space-component-xs);
      &::before { content: ""; position: relative; top: 0.1em; width: 0.5em; height: 0.5em; border-radius: var(--semantic-border-radius-full); background-color: currentColor; transition: background-color 150ms ease; }
      &--success { color: var(--semantic-color-state-success-text); }
      &--error { color: var(--semantic-color-state-error-text); }
      &--warning { color: var(--semantic-color-state-warning-text); }
      &--info { color: var(--semantic-color-state-info-text); }
    }
  }
}
```

## Registration

`@include atom-status()` en `scss/atoms/index.scss`.

## Validation

`node scripts/syx-validate.js`. Se entrega con `node scripts/propose.js`; una persona fusiona.

## Why

- Todo el pseudoelemento en una línea — es más compacto — si crece, se parte.
