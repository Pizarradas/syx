# Knowledge UI — Índice

Fundamentos de diseño visual que respaldan las reglas del modo `[SYX: UI]:` y las decisiones de `[SYX: CREATIVE]:`.

---

## Módulos

| Módulo | Qué aporta |
|--------|-----------|
| `refactoring-ui.md` | Spacing system, jerarquía visual, composición, correcciones ópticas |
| `color-theory.md` | Distribución 60/30/10, semántica del color, contrastes |
| `typography-systems.md` | Escalas modulares, line-height, letter-spacing, fluid type con clamp() |
| `motion-principles.md` | Easing, duración, GPU-composited properties, reduced-motion |
| `practical-ui.md` | Elevación, densidad, correcciones ópticas, border-radius compensation |

---

## Relación con los modos

| Regla en ui.md | Knowledge de origen |
|----------------|---------------------|
| 4px base grid | `refactoring-ui.md` → spacing system |
| line-height por rol tipográfico | `typography-systems.md` |
| letter-spacing negativo en titulares | `typography-systems.md` |
| Fluid type con clamp() | `typography-systems.md` |
| 60/30/10 distribución de color | `color-theory.md` |
| Shadow system 0–4 | `practical-ui.md` |
| Density --compact / --comfortable | `practical-ui.md` |
| Easing y duración por tipo | `motion-principles.md` |
| Solo transform+opacity en animaciones | `motion-principles.md` |
| Reduced-motion obligatorio | `motion-principles.md` |
