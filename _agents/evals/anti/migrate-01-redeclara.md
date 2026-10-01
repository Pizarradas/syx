---
tarea: migrate-01
daño: no migra: redeclara la variable legacy como alias del token
---
## Variable: --card-bg-legacy

Status: migrate

## Usages Found

`--card-bg-legacy`: 3 usos en `scss/molecules/_card.scss`.

## Tier Check

Molécula: token semántico.

## Changes Required

```scss
:root { --card-bg-legacy: var(--semantic-color-bg-secondary); }
```

## Definition to Remove

Ninguna: se conserva como alias por compatibilidad.

## Validation

`node scripts/propose.js` y una persona fusiona.

## Why

- Alias en vez de sustituir — no rompe nada — si nadie usara la variable, se borraría.
