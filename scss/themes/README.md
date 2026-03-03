# themes/

Cada subdirectorio representa un **tema visual completo** del sistema. Un tema define los tokens primitivos específicos de la marca (paleta de color, tipografía, espaciado base) y llama a los helpers temáticos para generar las clases `.syx-*` de su propio bundle CSS.

---

## Estructura de un tema

```
themes/
├── _base/          # Tokens base compartidos por todos los temas
├── _shared/        # Mixins y setup compartido entre temas
├── _template/      # Plantilla neutral para crear nuevos temas
├── example-01/     # Tema 1
│   ├── setup.scss       ← Punto de entrada del tema
│   ├── _tokens.scss     ← Override de tokens primitivos
│   ├── _overrides.scss  ← Overrides de componentes específicos
│   └── ...
├── example-02/
└── ...
```

---

## Cómo funciona un tema

El bundle de compilación (`scss/styles-theme-example-01.scss`) importa el tema así:

1. `@use "themes/example-01/setup"` — que ejecuta toda la cadena de setup
   - `@include universal-values()` emite automáticamente el stack `@layer` como primera regla CSS
2. Cada `setup.scss` llama a los mixins del tema:
   - `@include theme-example-01` — aplica los tokens primitivos
   - `@include helper-backgrounds($theme)` — genera `.syx-bg-*`
   - `@include helper-fonts($theme)` — genera `.syx-font-*`
   - `@include helper-font-sizes($theme)` — genera `.syx-font-size-*`
   - `@include helper-dimensions($theme)` — genera `.syx-size-*`
   - `@include helper-spacer($theme)` — genera `.syx-spacer-*`
   - `@include helper-icons($theme)` — genera `.syx-icon--*`

---

## Crear un nuevo tema

### 1. Copiar la plantilla

```
themes/_template/ → themes/mi-marca/
```

La plantilla `_template/` es un tema neutral con identidad visual mínima: sin colores de marca, sin fonts personalizadas. Es el punto de partida ideal.

### 2. Definir los tokens primitivos

En `themes/mi-marca/_tokens.scss`, sobreescribir **solo los primitivos**:

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

### 3. Registrar el tema en `setup.scss`

```scss
// themes/mi-marca/setup.scss
@use "../../base/helpers" as helpers;
@use "./_tokens" as *;

// Aplicar tokens del tema
@include theme-mi-marca;

// Generar clases de helpers con el contexto del tema
@include helpers.helper-backgrounds("mi-marca");
@include helpers.helper-fonts("mi-marca");
@include helpers.helper-font-sizes("mi-marca");
@include helpers.helper-dimensions("mi-marca");
@include helpers.helper-spacer("mi-marca");
@include helpers.helper-icons("mi-marca");
```

### 4. Crear el bundle de compilación

Crear `scss/styles-theme-mi-marca.scss`:

```scss
// El @layer order es emitido automáticamente por universal-values() en setup.scss
@use "themes/mi-marca/setup";
// ... resto de @use de atoms, molecules, etc.
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
