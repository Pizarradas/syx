## Variable: --card-bg-legacy

Status: migrate
Current value: `var(--semantic-color-bg-secondary)`
Replace with: `var(--semantic-color-bg-secondary)`
Target token: `--semantic-color-bg-secondary`

## Usages Found

`--card-bg-legacy` aparece en 3 usos, todos en `scss/molecules/_card.scss` (`.mol-card`, `&--flat`, `&__media`); ningún otro fichero lo declara ni lo lee. Su valor resuelto coincide con `--semantic-color-bg-secondary` en los siete temas y en los dos modos (`get_token` en cada uno).

## Tier Check

Los usos están en una molécula: el sustituto es semántico, el tier correcto para un componente. `scss/molecules/` es tier `pr` en `contracts/trust.json`: el cambio sale como propuesta, nunca directo.

## Changes Required

```scss
// scss/molecules/_card.scss — los tres usos
.mol-card {
  background-color: var(--semantic-color-bg-secondary);
  &--flat { background-color: var(--semantic-color-bg-secondary); }
  &__media { background-color: var(--semantic-color-bg-secondary); }
}
```

## Definition to Remove

El bloque `:root` del principio de `scss/molecules/_card.scss`, que declara la variable legacy. Se retira en el mismo cambio.

## Validation

`npm run build && node scripts/syx-validate.js --report`. Sale como propuesta (tier `pr`) con este único cambio: una variable, una propuesta. `propose.js` automatiza hoy los tokens (`token`) y la clasificación (`classify`), no los componentes: la rama se prepara a mano. Una persona fusiona.

## Why

- `--semantic-color-bg-secondary` y no el valor literal — el token sigue al tema y el literal no — si algún tema resolviera distinto, haría falta un token de componente de la card.
