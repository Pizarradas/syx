## Tier Placement

Tier 3 — componente. Fichero nuevo: `scss/abstracts/tokens/components/_status.scss`.

## Token Definitions

```scss
:root {
  --component-status-gap: var(--semantic-space-component-xs);
  --component-status-dot-size: 0.5em;
  --component-status-success-color: var(--semantic-color-state-success-text);
  --component-status-error-color: var(--semantic-color-state-error-text);
  --component-status-warning-color: var(--semantic-color-state-warning-text);
  --component-status-info-color: var(--semantic-color-state-info-text);
}
```

Cada uno apunta a la capa semántica. Los colores usan la tinta de texto de estado, no el relleno, porque aquí colorean texto.

## tokens.json Entries

Los seis van a `tokens.json` bajo la familia `status` (R05). Tienen consumidor: `.atom-status` (R08).

## How it lands

`node scripts/propose.js token --name --component-status-gap --value "var(--semantic-space-component-xs)" --why "separación punto-texto de .atom-status"`, y así con cada uno: deduce `scss/abstracts/tokens/components/_status.scss` por la familia, compila, valida y deja la rama con su evidencia. Una persona fusiona.

## Why

- Tier de componente y no semántico — solo `.atom-status` los consume — un segundo componente con el mismo punto los subiría a la capa semántica.
- `dot-size` en `em` y no un token de espacio — el punto escala con el texto que acompaña — si el indicador se usara sin texto, pasaría a un paso de la escala de tamaños.
