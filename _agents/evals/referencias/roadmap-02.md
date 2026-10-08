## Capability Check

| Idea | find_capability | Status | Evidence |
|---|---|---|---|
| Espaciado fluido con `--semantic-space-fluid-sm` / `-lg` | "--semantic-space-fluid-sm" → fluid-spacing | done | scss/abstracts/tokens/primitives/_fluid.scss:21 · scss/abstracts/tokens/semantic/_spacing.scss:21 |

El espaciado fluido ya existe; lo que no existe es ese nombre.

## Already Covered

- **Espaciado fluido** — done. La escala fluida son los primitivos `clamp()` de `scss/abstracts/tokens/primitives/_fluid.scss`, y la capa semántica la expone como `--semantic-space-layout-md` (y el resto de la escala layout) y `--semantic-space-component-md` (y el resto de la escala component). Úsalos directamente: `--semantic-space-layout-sm` es el equivalente de lo que pedías como `-fluid-sm`, `--semantic-space-layout-lg` el de `-fluid-lg`.
- Los nombres `--semantic-space-fluid-*` serían un segundo nombre para el mismo valor: dos tokens que no se pueden distinguir, y la pregunta de cuál usar en cada componente.

## Proposals

None — no hay nada que añadir a la hoja de ruta.

## Ledger Update

None. El registro ya lleva `--semantic-space-fluid-sm` entre los alias de `fluid-spacing`, que es por lo que la consulta lo encontró.

## Why

- Los tokens layout y no los component como equivalente — porque `-sm` y `-lg` en tu petición hablaban de márgenes entre bloques, que es lo que cubre la escala layout — serían los component si el espaciado fuera dentro de un componente.
