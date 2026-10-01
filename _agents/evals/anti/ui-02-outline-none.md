---
tarea: ui-02
daño: quita el contorno nativo y pinta un anillo que forced-colors borra
---
`get_component atom-pill` → existe.

## Contract Check

R01 ✅ / R02 ✅ / R03 ✅ / R04 ✅

## Component File

```scss
&[href] {
  outline: none;
  &:focus-visible {
    box-shadow: 0 0 0 var(--semantic-focus-ring-width) var(--semantic-focus-ring-color);
  }
}
```

## Validation

`node scripts/syx-validate.js`; propuesta con `node scripts/propose.js`.

## Why

- `box-shadow` en vez de `outline` — sigue el radio de la pastilla — si hiciera falta alto contraste, se volvería a outline.
