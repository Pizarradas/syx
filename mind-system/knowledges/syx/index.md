# Knowledge SYX — Índice

Conocimiento específico del sistema SYX: tokens, pipeline SCSS, patrones de componente, temas y color.

---

## Módulos

| Módulo | Qué aporta |
|--------|-----------|
| `token-system.md` | Cuatro tiers, contratos de naming, cómo referencia cada tier |
| `scss-pipeline.md` | Template de mixin, @layer, lista de mixins disponibles |
| `component-patterns.md` | BEM en SYX, prefijos atom/mol/org, estructura de componente |
| `theme-system.md` | Estructura de `_theme.scss`, secciones obligatorias, dark mode |
| `color-oklch.md` | Por qué OKLCH, construcción de escalas, distribución 60/30/10 |

---

## Relación con los modos

| Módulo | TOKEN | UI | THEME | AUDIT | MIGRATE |
|--------|-------|-----|-------|-------|---------|
| `token-system.md` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `scss-pipeline.md` | — | ✓ | — | ✓ | — |
| `component-patterns.md` | — | ✓ | — | ✓ | ✓ |
| `theme-system.md` | — | — | ✓ | ✓ | — |
| `color-oklch.md` | ✓ | — | ✓ | — | — |

---

## Contratos SYX de referencia rápida

Los contratos completos están en `contracts/rules.json`. Resumen:

| Regla | Descripción | Tier afectado |
|-------|-------------|---------------|
| R01 | No `--primitive-*` en atoms/molecules/organisms | Component (tier 3) |
| R02 | No `!important` en ningún archivo | Todos |
| R03 | No `transition:` raw — usar `@include transition()` | Component files |
| R04 | No `position: absolute/fixed/sticky` raw — usar mixins | Component files |
| R05 | Token en SCSS → debe estar en `tokens.json` | Tier 3 |
| R06 | Token en `tokens.json` → debe estar en CSS compilado | Tier 2–3 |
| R07 | Custom property sin prefijo SYX = legacy variable | Todos |
| R08 | Token en registry pero sin uso en SCSS | Tier 3 |
