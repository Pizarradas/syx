## Impacto

`--card-bg-legacy` aparece en 3 usos, todos en `scss/molecules/_card.scss`; ningún otro fichero lo declara ni lo lee. Su valor resuelto coincide con `--semantic-color-bg-secondary` en los siete temas y en los dos modos (`get_token` en cada uno).

## Cambio

```scss
// scss/molecules/_card.scss — los tres usos
background-color: var(--semantic-color-bg-secondary);
```

La declaración de la variable legacy se retira en el mismo cambio.

## Entrega

`node scripts/propose.js` con este único cambio: una variable, una propuesta. Una persona fusiona.
