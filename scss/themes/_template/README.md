# Crear un tema nuevo en SYX

La plantilla es el **contrato mínimo** de un tema: cada declaración de
`_theme.scss` la lee algún componente del sistema, trae el modo oscuro con sus
dos entradas y pasa el contraste WCAG 2.2 AA en los cuatro estados de modo.
`npm run check:plantilla` lo comprueba en cada `npm run check`: instancia esta
carpeta como un tema más en una copia del árbol y le pasa los guardianes de los
temas reales.

Qué puede declarar un tema y qué no: [THEMING-RULES.md](../../../THEMING-RULES.md),
«El contrato de un tema».

## Pasos

1. **Copia la carpeta**

   ```bash
   cp -r scss/themes/_template scss/themes/mi-marca
   ```

2. **Cambia `template` por el nombre del tema** en `_theme.scss` y `_setup.scss`
   (los mixins `theme-template` y `theme-template-fonts`, y las llamadas
   `syx-core(template)` y `syx-bundle-full(template)`). Nada más: la lista de
   componentes vive en `themes/_shared/_bundle-full.scss` y el orden de las
   `@layer` lo emite `universal-values()`.

3. **Cambia los valores marcados con ✎** en `_theme.scss`, por secciones:

   | Sección | Qué es |
   | --- | --- |
   | 1 · Marca | La paleta del tema como primitivos propios y la unidad de espacio |
   | 2 · Roles de marca | Qué primitivo es el primario, el secundario, el terciario y sus hover; la tinta que va encima de cada relleno (`--semantic-color-on-*`) |
   | 3 · Texto | Los grises de texto |
   | 4 · Forma | Radios y ancho de la columna |
   | 5 · Tipografía | La familia, declarada con `syx-font()` en la sección 8 |
   | 6 · Iconos | Los que leen los componentes (por defecto, los de Lucide) |
   | 7 · Modo oscuro | Lo que el tema afina sobre `dark-mode-tokens()`, en **las dos** entradas |
   | 8 · Fuentes | `theme-x-fonts()`: `@include syx-font("Familia", 400 700);` |

   Si cambias un relleno de marca, `npm run check:contraste` dice qué tinta
   (`--semantic-color-ink-light` o `-ink-dark`) declarar encima.

4. **Crea el punto de entrada** `scss/styles-theme-mi-marca.scss`:

   ```scss
   @use "themes/mi-marca/setup";
   @use "utilities/index" as *;
   ```

5. **Compila y revisa**

   ```bash
   npm run build
   npm run check
   ```

   `check:consumidores` avisa de cualquier declaración del tema que no lea
   nadie: si querías cambiar algo, busca el token que de verdad lee el
   componente (`tokens.json`, o `get_component` en el servidor MCP).

## Lo que NO hace falta declarar

Superficies, bordes, sombras, escala tipográfica, espaciado, la tinta de marca
como texto (`--semantic-color-*-text`) y la variante fuerte de los controles
(`--semantic-color-primary-strong`): el sistema las deriva del rol, en claro y en
oscuro. Un tema solo las declara cuando quiere otra cosa.

## Bundles de contexto

`bundle-template.scss` es el esqueleto de un bundle de contexto (`bundle-app`,
`bundle-blog`…). Cada tema compila además `bundle-core.scss`, el más ligero,
definido una vez en `themes/_shared/_bundle-core.scss`.
