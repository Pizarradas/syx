## Tokens

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

## Registro

Los seis van a `tokens.json` bajo la familia `status` (R05). Tienen consumidor: `.atom-status` (R08).

## Entrega

`node scripts/propose.js token` deduce `scss/abstracts/tokens/components/_status.scss` por la familia, compila, valida y deja la rama con su evidencia. Una persona fusiona.
