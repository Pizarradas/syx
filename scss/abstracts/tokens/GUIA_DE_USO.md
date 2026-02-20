# GuÃ­a de Uso del Sistema de Tokens - SYX

## IntroducciÃ³n

El sistema de tokens de SYX estÃ¡ organizado en **3 capas** que proporcionan escalabilidad, mantenibilidad y consistencia.

## Arquitectura de 3 Capas

```
Primitivos â SemÃ¡nticos â Componentes
(Foundation)  (Context)    (Specific)
```

### Capa 1: Tokens Primitivos

**UbicaciÃ³n**: `scss/abstracts/tokens/primitives/`

Valores base sin contexto semÃ¡ntico. Son los "Ã¡tomos" del sistema.

**Nomenclatura**: `--primitive-{category}-{variant}-{modifier}`

**Ejemplo**:

```scss
--primitive-color-purple-500
--primitive-space-4
--primitive-font-size-2
```

### Capa 2: Tokens SemÃ¡nticos

**UbicaciÃ³n**: `scss/abstracts/tokens/semantic/`

Tokens con significado contextual que referencian tokens primitivos.

**Nomenclatura**: `--semantic-{purpose}-{variant}-{state}`

**Ejemplo**:

```scss
--semantic-color-primary
--semantic-space-layout-md
--semantic-font-size-body
```

### Capa 3: Tokens de Componentes

**UbicaciÃ³n**: `scss/abstracts/tokens/components/`

Tokens especÃ­ficos para componentes que referencian tokens semÃ¡nticos.

**Nomenclatura**: `--component-{name}-{property}-{variant}-{state}`

**Ejemplo**:

```scss
--component-button-primary-color
--component-form-field-padding-x
--component-table-border-width
```

---

## CÃ³mo Usar los Tokens

### En Componentes SCSS

```scss
.my-button {
  // â CORRECTO: Usar tokens de componentes
  color: var(--component-button-primary-color);
  padding: var(--component-button-padding-y) var(--component-button-padding-x);
  border-radius: var(--component-button-border-radius);

  &:hover {
    color: var(--component-button-primary-color-hover);
  }
}
```

### En Temas

Los temas solo deben sobrescribir **tokens primitivos**. Los tokens semÃ¡nticos y de componentes se actualizarÃ¡n automÃ¡ticamente.

```scss
@mixin theme-codymer {
  // â CORRECTO: Sobrescribir primitivos
  --primitive-space-base: 0.5rem;
  --primitive-color-purple-500: hsl(248, 62%, 22%);

  // â INCORRECTO: No sobrescribir semÃ¡nticos o componentes
  // --semantic-color-primary: ...
  // --component-button-primary-color: ...
}
```

---

## Reglas de Uso

### â Hacer

1. **Usar tokens de componentes** en tus estilos de componentes
2. **Referenciar tokens de capas inferiores** (componentes â semÃ¡nticos â primitivos)
3. **Sobrescribir solo primitivos** en temas
4. **Crear nuevos tokens** siguiendo la nomenclatura establecida

### â No Hacer

1. **No usar valores hardcoded** (ej: `color: #ff0000`)
2. **No saltar capas** (ej: usar primitivos directamente en componentes)
3. **No sobrescribir semÃ¡nticos o componentes** en temas
4. **No crear nomenclaturas inconsistentes**

---

## Ejemplos PrÃ¡cticos

### Ejemplo 1: Crear un Nuevo BotÃ³n

```scss
// 1. Definir tokens de componente (si no existen)
:root {
  --component-button-danger-color: var(--semantic-color-state-error);
  --component-button-danger-bg: transparent;
  --component-button-danger-border: var(--semantic-color-state-error);
}

// 2. Usar en el componente
.button--danger {
  color: var(--component-button-danger-color);
  background: var(--component-button-danger-bg);
  border: var(--component-button-border-width) solid
    var(--component-button-danger-border);
}
```

### Ejemplo 2: Crear un Nuevo Tema

```scss
// themes/_my-theme.scss
@mixin theme-my-theme {
  // Cambiar base measure
  --primitive-space-base: 0.25rem;

  // Cambiar colores de marca
  --primitive-color-purple-500: hsl(280, 60%, 30%);
  --primitive-color-pink-500: hsl(350, 100%, 65%);

  // Cambiar tipografÃ­a
  --primitive-font-family-space-grotesk-regular: "Helvetica", Arial, sans-serif;
}
```

### Ejemplo 3: AÃ±adir un Nuevo Color de Estado

```scss
// 1. AÃ±adir primitivo
// primitives/_colors.scss
--primitive-color-info-500: hsl(200, 100%, 50%);

// 2. AÃ±adir semÃ¡ntico
// semantic/_colors.scss
--semantic-color-state-info: var(--primitive-color-info-500);

// 3. Usar en componente
// components/_alerts.scss
--component-alert-info-bg: var(--semantic-color-state-info);
```

---

## Tokens Disponibles

### Colores

- **Primitivos**: `--primitive-color-{name}-{shade}`
- **SemÃ¡nticos**: `--semantic-color-{purpose}`
- **Componentes**: `--component-{name}-{property}-color`

### Espaciado

- **Primitivos**: `--primitive-space-{number}`
- **SemÃ¡nticos**: `--semantic-space-{context}-{size}`
- **Componentes**: `--component-{name}-{property}`

### TipografÃ­a

- **Primitivos**: `--primitive-font-{property}-{value}`
- **SemÃ¡nticos**: `--semantic-font-{purpose}`
- **Componentes**: `--component-{name}-font-{property}`

### Bordes

- **Primitivos**: `--primitive-border-{property}-{value}`
- **SemÃ¡nticos**: `--semantic-border-{property}-{size}`
- **Componentes**: `--component-{name}-border-{property}`

### Sombras

- **Primitivos**: `--primitive-shadow-{size}`
- **SemÃ¡nticos**: `--semantic-shadow-{purpose}`
- **Componentes**: `--component-{name}-shadow-{state}`

---

## Beneficios

â **Escalabilidad**: FÃ¡cil aÃ±adir nuevos temas  
â **Mantenibilidad**: Cambios globales desde tokens primitivos  
â **Consistencia**: Nomenclatura predecible  
â **DocumentaciÃ³n**: Auto-documentado por nomenclatura  
â **ColaboraciÃ³n**: DiseÃ±adores y desarrolladores hablan el mismo idioma

---

## Helpers vs Utilities â Â¿CuÃ¡l usar?

SYX tiene dos sistemas de clases de utilidad con propÃ³sitos distintos:

### `base/helpers/` â Helpers de tema

**UbicaciÃ³n**: `scss/base/helpers/`
**Generados por**: mixins con parÃ¡metro `$theme` (ej. `@include helper-spacer(example-01)`)
**Prefijo de clase**: `syx-*` con namespace de tema

Son clases generadas **por tema** que usan los tokens semÃ¡nticos del tema activo.
Incluyen: espaciado, tipografÃ­a, colores, iconos, gaps, dimensiones, fondos.

```html
<!-- Clase generada por helper-spacer(example-01) -->
<div class="syx-mt-4 syx-px-2">...</div>
```

**CuÃ¡ndo usar**: cuando necesitas clases que respeten el sistema de tokens del tema.

---

### `utilities/` â Utilidades globales

**UbicaciÃ³n**: `scss/utilities/`
**Generados por**: clases CSS planas sin parÃ¡metro de tema
**Prefijo de clase**: `syx-*` genÃ©rico

Son clases **agnÃ³sticas al tema**, basadas en valores fijos o variables CSS nativas.
Incluyen: display, text-align, spacing bÃ¡sico.

```html
<!-- Clase de utilities/display -->
<div class="syx-d-flex syx-justify-between">...</div>
```

**CuÃ¡ndo usar**: para layout rÃ¡pido y utilidades de composiciÃ³n que no dependen del tema.

---

### Regla de oro

| Necesitas...                            | Usa                         |
| --------------------------------------- | --------------------------- |
| Colores, tipografÃ­a, espaciado del tema | `base/helpers/`             |
| Flexbox, display, alineaciÃ³n            | `utilities/`                |
| Ambos                                   | Ambos â son complementarios |

> **Nota**: `base/helpers/helpers.scss` incluye internamente un `@forward 'utilities'`
> que exposa algunas utilidades adicionales dentro del namespace de helpers.
> Esto es legacy y se eliminarÃ¡ en v2.1.

---

## Estado actual y prÃ³ximos pasos

### â Completado (Feb 2026)

1. â Componentes migrados a tokens semÃ¡nticos (card, btn, utilities)
2. â `@layer` granular implementado: `syx.atoms`, `syx.molecules`, `syx.organisms`, `syx.utilities`
3. â Accesibilidad: `.syx-sr-only`, `.syx-skip-link`, `.syx-motion-safe` aÃ±adidos
4. â `color-mix()` para hover tints de botones
5. â Dark-mode: card, borders y utilities respetan el tema
6. â **Bundle core** (`styles-core.scss`): producciÃ³n-ready, sin overhead de documentaciÃ³n. **138 KB** sin PurgeCSS, **~110 KB** con PurgeCSS.
7. â **`_template` neutral (SecciÃ³n 3)**: botones y forms tienen identidad visual mÃ­nima sin marca SYX. Base ideal para nuevos proyectos.
8. â **Deprecation warnings** de Sass corregidos en `_directional.scss`, `_font.scss`, `_triangle.scss`, `_theme-config.scss`.

### ðµ Pendiente (v2.1+)

1. Eliminar `_token-aliases.scss` cuando no haya referencias activas (milestone v2.1)
2. AÃ±adir tokens de switch faltantes (`--component-switch-slider-*`, `--component-switch-status-*`)
3. Consolidar helpers legacy con utilities
4. ExpansiÃ³n de organisms
5. Site de documentaciÃ³n pÃºblica

---

## CSS @layer â GestiÃ³n de Especificidad

SYX usa `@layer` nativo de CSS para gestionar la especificidad sin `!important`.

### Stack de capas

```css
@layer syx.reset, syx.base, syx.tokens, syx.atoms, syx.molecules, syx.organisms, syx.utilities;
```

| Capa            | Contenido                  | Gana a    |
| --------------- | -------------------------- | --------- |
| `syx.reset`     | Reset del navegador        | â         |
| `syx.base`      | Elementos HTML, helpers    | reset     |
| `syx.tokens`    | Tokens CSS custom property | base      |
| `syx.atoms`     | Componentes atÃ³micos       | tokens    |
| `syx.molecules` | Componentes compuestos     | atoms     |
| `syx.organisms` | Secciones UI complejas     | molecules |
| `syx.utilities` | Clases utility             | todo      |

### Regla de oro

Las clases utility **siempre** ganan sobre los componentes. Esto es por diseÃ±o.

```html
<!-- La utility .syx-d-none siempre oculta el botÃ³n, sin !important -->
<button class="atom-btn atom-btn--primary syx-d-none">Hidden</button>
```

### Por quÃ© no necesitas !important

```scss
// â Antes (sin @layer)
.syx-d-none {
  display: none !important;
}

// â Ahora (con @layer)
@layer syx.utilities {
  .syx-d-none {
    display: none;
  } // Gana por posiciÃ³n en el stack, no por !important
}
```

> **Nota**: Si ves `!important` en el codebase, es un bug. RepÃ³rtalo.
