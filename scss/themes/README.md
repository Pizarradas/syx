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

La plantilla `_template/` es un tema neutral con identidad visual mínima: sin colores de marca, sin fonts personalizadas. Es el punto de partida ideal.

### 2. Definir los tokens primitivos

En `themes/mi-marca/_theme.scss`, sobreescribir **solo los primitivos**:

```scss
@mixin theme-mi-marca {
  // Color de marca
  --primitive-color-purple-500: hsl(248, 62%, 22%);
  --primitive-color-pink-500: hsl(350, 100%, 65%);

  // Tipografía
  --primitive-font-family-brand-regular: "Mi Fuente", sans-serif;
  --primitive-font-family-brand-bold: "Mi Fuente Bold", sans-serif;

  // Espaciado base
  --primitive-space-base: 0.5rem;
}
```

> **Regla de oro**: Solo overrides de primitivos. Los tokens semánticos y de componente cascadean automáticamente desde los primitivos. No hardcodees valores en los overrides.

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

## Tokens que un tema PUEDE sobreescribir

| Categoría        | Tokens                                                                                |
| ---------------- | ------------------------------------------------------------------------------------- |
| Colores de marca | `--primitive-color-{hue}-{shade}`                                                     |
| Tipografía       | `--primitive-font-family-*` · `--primitive-font-size-*` · `--primitive-font-weight-*` |
| Espaciado        | `--primitive-space-base` · `--primitive-space-{n}`                                    |
| Bordes           | `--primitive-border-radius-*` · `--primitive-border-width-*`                          |
| Sombras          | `--primitive-shadow-*`                                                                |

## Tokens que un tema NO debe sobreescribir

- `--semantic-*` — se calculan automáticamente desde los primitivos
- `--component-*` — igual, se calculan desde semánticos
- Excepciones: hay casos muy específicos de `_overrides.scss` donde un componente concreto de un tema necesita un ajuste visual que el sistema de tokens no puede expresar

---

## Variables de entorno de tema

La variable `$theme` que se pasa a los helpers es una string usada por el mixin para comparaciones `@if $theme == "mi-marca"`. Esto permite lógica de compilación por tema (por ejemplo, fondos especiales solo para un tema).

```scss
// Ejemplo de lógica de tema en _backgrounds.scss
@if $theme == "example-02" {
  .syx-bg-color-special {
    background: var(--semantic-color-brand-secondary);
  }
}
```
