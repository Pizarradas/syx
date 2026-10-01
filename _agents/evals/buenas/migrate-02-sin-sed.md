---
tarea: migrate-02
por qué: rechaza el sed y el commit único nombrándolos en negativo
---
No con un sed en las doce ni en un solo commit: este modo migra una por propuesta, porque así cada una se revisa y se revierte sola.

## Migration Queue

1. `--hero-bg-legacy` → `var(--semantic-color-bg-secondary)` — 1 uso — bajo
2. `--hero-text-legacy` → `var(--semantic-color-text-primary)` — 1 uso — bajo
3. … las de equivalente exacto, después `--hero-gap-legacy` (2 usos), y al final las cinco literales.

## High-Risk Items

Las cinco literales (`pad`, `title-size`, `shadow`, `overlay`, `max`): sin token equivalente, pasan antes por TOKEN.

## Recommended Order

- Primero las de un uso con equivalente exacto — una línea de impacto y de reversión — si alguna resolviera distinto en algún tema, iría al final.

Cada una sale como propuesta, en su rama.
