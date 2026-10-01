No las migro de una vez: este modo migra una por propuesta, y así cada una se puede revisar y revertir sola. Esto es el plan; la primera propuesta sale cuando lo apruebes.

## Migration Queue (ordered by risk, lowest first)

1. `--hero-bg-legacy` → `var(--semantic-color-bg-secondary)` — 1 uso — riesgo bajo
2. `--hero-text-legacy` → `var(--semantic-color-text-primary)` — 1 uso — riesgo bajo
3. `--hero-muted-legacy` → `var(--semantic-color-text-secondary)` — 1 uso — riesgo bajo
4. `--hero-accent-legacy` → `var(--semantic-color-primary)` — 1 uso — riesgo bajo
5. `--hero-radius-legacy` → `var(--semantic-border-radius-default)` — 1 uso — riesgo bajo
6. `--hero-lead-size-legacy` → `var(--semantic-font-size-body-large)` — 1 uso — riesgo bajo
7. `--hero-gap-legacy` → `var(--semantic-space-component-md)` — 2 usos — riesgo medio
8. Las cinco con valor literal (`pad`, `title-size`, `shadow`, `overlay`, `max`) — riesgo alto

## High-Risk Items

Las cinco literales no tienen token equivalente exacto: cada una necesita decidir entre el paso más cercano de la escala o un token de componente del hero, que es trabajo de TOKEN antes que de MIGRATE.

## Recommended Order

- Las seis de un uso con equivalente exacto primero — su impacto es una línea y su reversión también — si una resolviera distinto en algún tema, bajaría al final de la cola.
- `--hero-gap-legacy` después — tiene dos usos y uno es el padding del modificador compacto — si el compacto desapareciera, sería tan barata como las anteriores.
- Las literales al final, tras pasar por TOKEN — sin token no hay a qué migrar — si TOKEN decide que encajan en la escala, se vuelven de riesgo bajo.

Cada una sale como propuesta (tier `pr`, una rama que revisa una persona) con su análisis de impacto; la siguiente empieza cuando la anterior se ha fusionado.
