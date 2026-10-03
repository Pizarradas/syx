# themes/

Cada subdirectorio representa un **tema visual completo** del sistema. Un tema define los tokens primitivos específicos de la marca (paleta de color, tipografía, espaciado base) y llama a los helpers temáticos para generar las clases `.syx-*` de su propio bundle CSS.

---

## Estructura de un tema

```
themes/
├── _base/          # Valores universales (RRSS, marcas externas) + stack @layer
├── _shared/        # syx-core + los bundles compartidos (_bundle-full, _bundle-app…)
├── _template/      # Plantilla neutral para crear nuevos temas
├── example-01/     # Tema 1
│   ├── _theme.scss      ← ÚNICO fichero por-tema de verdad: tokens + theme-x-fonts()
│   ├── _setup.scss      ← ~15 líneas de cableado (solo cambia el nombre del tema)
│   └── bundle-*.scss    ← Bundles de contexto (app, docs, marketing, blog)
├── example-02/
└── ...
```

---

## Cómo funciona un tema

El bundle de compilación (`scss/styles-theme-example-01.scss`) importa el tema así:

1. `@use "themes/example-01/setup"` — que ejecuta toda la cadena de setup
   - `@include universal-values()` emite automáticamente el stack `@layer` como primera regla CSS
2. Cada `_setup.scss` hace exactamente seis llamadas:
   - `@include universal-values()` — valores universales + stack `@layer`
   - `@include theme-example-01()` — tokens del tema (`_theme.scss`)
   - `@include theme-example-01-fonts()` — los `@font-face` (declarados una vez en `_theme.scss`)
   - `@include syx-core(example-01)` — reset, elementos base, helpers `.syx-*` y grid (`_shared/_core.scss`)
   - `@include syx-bundle-full(example-01)` — todos los componentes del sistema (`_shared/_bundle-full.scss`)
   - `@include syx-bundle-site(example-01)` — la capa site (solo los temas del sitio de SYX; desmontable)

---

## Crear un nuevo tema

### 1. Copiar la plantilla

```
themes/_template/ → themes/mi-marca/
```

La plantilla `_template/` es el **contrato mínimo** de un tema: marca → roles, tintas sobre relleno, textos, forma, tipografía con `syx-font()`, iconos y modo oscuro con sus dos entradas. Cada declaración tiene lector y `npm run check:plantilla` la compila y la revisa como un tema más.

### 2. Cambiar los valores marcados con ✎

En `themes/mi-marca/_theme.scss`: la paleta de la marca como primitivos **propios** (`--primitive-color-brand-*`, no los del sistema reescritos con otro tono), qué primitivo es cada rol (`--semantic-color-primary`…), la tinta encima de cada relleno (`--semantic-color-on-*`, la elige `check:contraste`), textos, radios y la familia tipográfica.

> **Regla de oro**: lo que el tema dice son ROLES (`--semantic-*`). Un componente nunca lee un primitivo (R01, R11), y una sobrescritura de componente solo puede leer roles. Qué puede y qué no puede declarar un tema: `THEMING-RULES.md`, «El contrato de un tema».

### 3. Ajustar `_setup.scss`

Sustituir "template" por el nombre del tema — nada más. Los helpers los
emite `syx-core()` y la lista de componentes vive en
`themes/_shared/_bundle-full.scss`:

```scss
// themes/mi-marca/_setup.scss
@include universal-values();
@include theme-mi-marca();
@include theme-mi-marca-fonts();  // ← las fuentes, declaradas en _theme.scss
@include syx-core(mi-marca);
@include syx-bundle-full(mi-marca);
```

### 4. Crear el punto de entrada

Crear `scss/styles-theme-mi-marca.scss`:

```scss
// El @layer order es emitido automáticamente por universal-values() en _setup.scss
@use "themes/mi-marca/setup";
@use "utilities/index" as *;  // las utilidades .syx-* entran SOLO por aquí
```

### 5. Compilar

```bash
sass --no-source-map scss/styles-theme-mi-marca.scss:css/styles-theme-mi-marca.css
```

---

## Directorio `_shared/`

Contiene mixins y estilos compartidos entre todos los temas. No debe contener tokens específicos de ningún tema.

## Directorio `_base/`

Tokens base que actúan como fallback si un tema no los overrides. Todos los temas los heredan de forma implícita.

---

## Qué declara un tema

El contrato completo —qué DEBE declarar un tema, qué PUEDE y qué NO, con el guardián que vigila cada punto— está en `THEMING-RULES.md`, «El contrato de un tema». En corto: roles semánticos con la paleta del tema, sus dos entradas al modo oscuro, ninguna declaración sin lector (`check:consumidores`) y ningún token de componente que lea un primitivo o un color literal (R11).

---

## Variables de entorno de tema

La variable `$theme` que se pasa a los helpers es una string usada por el mixin para comparaciones `@if $theme == "mi-marca"`. Esto permite lógica de compilación por tema (por ejemplo, fondos especiales solo para un tema).

<!-- syx: ejemplo-nuevo -->
```scss
// Ejemplo de lógica de tema en _backgrounds.scss
@if $theme == "example-02" {
  .syx-bg-color-special {
    background: var(--semantic-color-brand-secondary);
  }
}
```
