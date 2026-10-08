## Capability Check

Cada idea del encargo, preguntada a `find_capability` antes de escribirla:

| Idea | find_capability | Status | Evidence |
|---|---|---|---|
| Container queries | "container queries para cards" → container-queries | partial | scss/site/_home-features.scss:120 |
| Tipografía con clamp() | "tipografía fluida con clamp" → fluid-typography | done | scss/abstracts/tokens/primitives/_typography.scss:36 |
| Unidad lh | "unidad lh" → lh-unit | open | package.json (browserslist) |
| color-mix() en hover y bordes | "color-mix hover" → color-mix-states | done | scss/abstracts/tokens/components/_buttons.scss:13 |
| Escala de espaciado fluida | "espaciado fluido" → fluid-spacing | done | scss/abstracts/tokens/primitives/_fluid.scss:21 |
| Contrato tipográfico por rol | "contrato de tipografía semántica" → typography-presets | partial | scss/abstracts/mixins/_helpers.scss:151 |
| Linter de valores a pelo | "stylelint hex px" → hardcoded-value-lint | done | .stylelintrc.json |
| Tokens desde Figma a SCSS | "Figma a _primitives.scss" → figma-to-scss-import | rejected | scripts/export-figma.js |

## Already Covered

- **Tipografía fluida** — done. Todos los pasos de la escala son `clamp()` en `scss/abstracts/tokens/primitives/_typography.scss`.
- **color-mix()** — done, y en la capa correcta: los tintes de hover viven en los tokens de componente (`_buttons.scss:13`), no dentro de las reglas.
- **Espaciado fluido** — done: `scss/abstracts/tokens/primitives/_fluid.scss`, consumido como `--semantic-space-layout-md` y el resto de su escala. Un segundo nombre para los mismos valores no añade nada.
- **Lint de hex y px** — done: `.stylelintrc.json` aplica `color-no-hex` y `unit-disallowed-list` a átomos, moléculas, organismos y layout, con excepción por línea y motivo.
- **Generar `_primitives` y `_semantic` desde Figma** — rejected. El flujo va de código a Figma a propósito (`npm run export:figma`, y DTCG con `npm run export:tokens`): el SCSS es la fuente y los primitivos ni siquiera se exportan. Si se quiere reabrir, es una decisión de una persona, no una mejora.

## Proposals

### 1. Presets tipográficos por rol, como mixins
- Solves: cada encabezado repite tamaño, peso e interlineado llamando a `text()` argumento a argumento (`scss/abstracts/mixins/_helpers.scss:151`).
- Evidence of absence: el gap del registro — las piezas existen (`--semantic-font-size-h1`, `--semantic-line-height-heading`), no hay un preset por rol.
- Cost: ningún token nuevo; un mixin por rol, adoptado componente a componente. Una sola custom property no puede llevar cuatro declaraciones, así que no es un token.
- Decided by: `human` — `scss/abstracts/mixins/` está reservado.

### 2. Container queries donde un componente dependa de su hueco
- Solves: nada hoy de forma general — ningún componente del registro cambia de layout con `@media` de viewport, así que no hay migración que hacer.
- Evidence of absence: `grep -rn "@container" scss/` → un único resultado, en la capa de sitio. Ningún componente del registro.
- Cost: por componente; exige nombrar el componente y el hueco antes de escribir nada.
- Decided by: `pr` — un componente.

### 3. Unidad lh, condicionada al suelo de navegadores
- Solves: espaciados que siguen al interlineado sin recalcularlo.
- Evidence of absence: el registro la marca `open`; `grep -rn "[0-9]lh" scss/` → cero resultados.
- Cost: browserslist incluye Safari 16.2 y lh llega en 16.4. O se sube el suelo o cada uso lleva fallback.
- Decided by: `human` — el suelo vive en `package.json`.

## Ledger Update

None.

## Why

- Presets por delante de container queries — porque quitan repetición en componentes que existen hoy, mientras ningún componente del registro ha mostrado aún un layout que dependa de su hueco — cambiaría si un componente necesitara reorganizarse según el contenedor.
- lh al final — porque su coste no es técnico sino de soporte: depende de subir el suelo de navegadores — subiría si ese suelo se decide por otra razón.
