# Guía de Uso del Sistema de Tokens - SYX

## Introducción

El sistema de tokens de SYX está organizado en **3 capas** que proporcionan escalabilidad, mantenibilidad y consistencia.

## Arquitectura de 3 Capas

```
Primitivos → Semánticos → Componentes
(Foundation)  (Context)    (Specific)
```

### Capa 1: Tokens Primitivos

**Ubicación**: `scss/abstracts/tokens/primitives/`

Valores base sin contexto semántico. Son los "átomos" del sistema.

**Nomenclatura**: `--primitive-{category}-{variant}-{modifier}`

**Ejemplo**:

```scss
--primitive-color-purple-500
--primitive-space-4
--primitive-font-size-2
```

### Capa 2: Tokens Semánticos

**Ubicación**: `scss/abstracts/tokens/semantic/`

Tokens con significado contextual que referencian tokens primitivos.

**Nomenclatura**: `--semantic-{purpose}-{variant}-{state}`

**Ejemplo**:

```scss
--semantic-color-primary
--semantic-space-layout-md
--semantic-font-size-body
```

### Capa 3: Tokens de Componentes

**Ubicación**: `scss/abstracts/tokens/components/`

Tokens específicos para componentes que referencian tokens semánticos.

**Nomenclatura**: `--component-{name}-{property}-{variant}-{state}`

**Ejemplo**:

```scss
--component-button-primary-color
--component-form-field-padding-x
--component-table-border-width
```

---

## Cómo Usar los Tokens

### En Componentes SCSS

```scss
.my-button {
  // ✅ CORRECTO: Usar tokens de componentes
  color: var(--component-button-primary-color);
  padding: var(--component-button-padding-y) var(--component-button-padding-x);
  border-radius: var(--component-button-border-radius);

  &:hover {
    color: var(--component-button-primary-color-hover);
  }
}
```

### En Temas

Los temas solo deben sobrescribir **tokens primitivos**. Los tokens semánticos y de componentes se actualizarán automáticamente.

```scss
@mixin theme-codymer {
  // ✅ CORRECTO: Sobrescribir primitivos
  --primitive-space-base: 0.5rem;
  --primitive-color-purple-500: hsl(248, 62%, 22%);

  // ❌ INCORRECTO: No sobrescribir semánticos o componentes
  // --semantic-color-primary: ...
  // --component-button-primary-color: ...
}
```

---

## Reglas de Uso

### ✅ Hacer

1. **Usar tokens de componentes** en tus estilos de componentes
2. **Referenciar tokens de capas inferiores** (componentes → semánticos → primitivos)
3. **Sobrescribir solo primitivos** en temas
4. **Crear nuevos tokens** siguiendo la nomenclatura establecida

### ❌ No Hacer

1. **No usar valores hardcoded** (ej: `color: #ff0000`)
2. **No saltar capas** (ej: usar primitivos directamente en componentes)
3. **No sobrescribir semánticos o componentes** en temas
4. **No crear nomenclaturas inconsistentes**

---

## Ejemplos Prácticos

### Ejemplo 1: Crear un Nuevo Botón

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

  // Cambiar tipografía
  --primitive-font-family-space-grotesk-regular: "Helvetica", Arial, sans-serif;
}
```

### Ejemplo 3: Añadir un Nuevo Color de Estado

```scss
// 1. Añadir primitivo
// primitives/_colors.scss
--primitive-color-info-500: hsl(200, 100%, 50%);

// 2. Añadir semántico
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
- **Semánticos**: `--semantic-color-{purpose}`
- **Componentes**: `--component-{name}-{property}-color`

### Espaciado

- **Primitivos**: `--primitive-space-{number}`
- **Semánticos**: `--semantic-space-{context}-{size}`
- **Componentes**: `--component-{name}-{property}`

### Tipografía

- **Primitivos**: `--primitive-font-{property}-{value}`
- **Semánticos**: `--semantic-font-{purpose}`
- **Componentes**: `--component-{name}-font-{property}`

### Bordes

- **Primitivos**: `--primitive-border-{property}-{value}`
- **Semánticos**: `--semantic-border-{property}-{size}`
- **Componentes**: `--component-{name}-border-{property}`

### Sombras

- **Primitivos**: `--primitive-shadow-{size}`
- **Semánticos**: `--semantic-shadow-{purpose}`
- **Componentes**: `--component-{name}-shadow-{state}`

---

## Beneficios

✅ **Escalabilidad**: Fácil añadir nuevos temas  
✅ **Mantenibilidad**: Cambios globales desde tokens primitivos  
✅ **Consistencia**: Nomenclatura predecible  
✅ **Documentación**: Auto-documentado por nomenclatura  
✅ **Colaboración**: Diseñadores y desarrolladores hablan el mismo idioma

---

## Helpers vs Utilities — ¿Cuál usar?

SYX tiene dos sistemas de clases de utilidad con propósitos distintos:

### `base/helpers/` — Helpers de tema

**Ubicación**: `scss/base/helpers/`
**Generados por**: mixins con parámetro `$theme` (ej. `@include helper-spacer(example-01)`)
**Prefijo de clase**: `syx-*` con namespace de tema

Son clases generadas **por tema** que usan los tokens semánticos del tema activo.
Incluyen: espaciado, tipografía, colores, iconos, gaps, dimensiones, fondos.

```html
<!-- Clase generada por helper-spacer(example-01) -->
<div class="syx-mt-4 syx-px-2">...</div>
```

**Cuándo usar**: cuando necesitas clases que respeten el sistema de tokens del tema.

---

### `utilities/` — Utilidades globales

**Ubicación**: `scss/utilities/`
**Generados por**: clases CSS planas sin parámetro de tema
**Prefijo de clase**: `syx-*` genérico

Son clases **agnósticas al tema**, basadas en valores fijos o variables CSS nativas.
Incluyen: display, text-align, spacing básico.

```html
<!-- Clase de utilities/display -->
<div class="syx-d-flex syx-justify-between">...</div>
```

**Cuándo usar**: para layout rápido y utilidades de composición que no dependen del tema.

---

### Regla de oro

| Necesitas...                            | Usa                         |
| --------------------------------------- | --------------------------- |
| Colores, tipografía, espaciado del tema | `base/helpers/`             |
| Flexbox, display, alineación            | `utilities/`                |
| Ambos                                   | Ambos — son complementarios |

> **Nota**: `base/helpers/helpers.scss` incluye internamente un `@forward 'utilities'`
> que exposa algunas utilidades adicionales dentro del namespace de helpers.
> Esto es legacy y se eliminará en v2.1.

---

## Estado actual y próximos pasos

### ✅ Completado (Feb 2026)

1. ✅ Componentes migrados a tokens semánticos (card, btn, utilities)
2. ✅ `@layer` granular implementado: `syx.atoms`, `syx.molecules`, `syx.organisms`, `syx.utilities`
3. ✅ Accesibilidad: `.syx-sr-only`, `.syx-skip-link`, `.syx-motion-safe` añadidos
4. ✅ `color-mix()` para hover tints de botones
5. ✅ Dark-mode: card, borders y utilities respetan el tema
6. ✅ **Bundle core** (`styles-core.scss`): producción-ready, sin overhead de documentación. **138 KB** sin PurgeCSS, **~110 KB** con PurgeCSS.
7. ✅ **`_template` neutral (Sección 3)**: botones y forms tienen identidad visual mínima sin marca SYX. Base ideal para nuevos proyectos.
8. ✅ **Deprecation warnings** de Sass corregidos en `_directional.scss`, `_font.scss`, `_triangle.scss`, `_theme-config.scss`.

### 🔵 Pendiente (v2.1+)

1. Eliminar `_token-aliases.scss` cuando no haya referencias activas (milestone v2.1)
2. Añadir tokens de switch faltantes (`--component-switch-slider-*`, `--component-switch-status-*`)
3. Consolidar helpers legacy con utilities
4. Expansión de organisms
5. Site de documentación pública

---

## CSS @layer — Gestión de Especificidad

SYX usa `@layer` nativo de CSS para gestionar la especificidad sin `!important`.

### Stack de capas

```css
@layer syx.reset, syx.base, syx.tokens, syx.atoms, syx.molecules, syx.organisms, syx.utilities;
```

| Capa            | Contenido                  | Gana a    |
| --------------- | -------------------------- | --------- |
| `syx.reset`     | Reset del navegador        | —         |
| `syx.base`      | Elementos HTML, helpers    | reset     |
| `syx.tokens`    | Tokens CSS custom property | base      |
| `syx.atoms`     | Componentes atómicos       | tokens    |
| `syx.molecules` | Componentes compuestos     | atoms     |
| `syx.organisms` | Secciones UI complejas     | molecules |
| `syx.utilities` | Clases utility             | todo      |

### Regla de oro

Las clases utility **siempre** ganan sobre los componentes. Esto es por diseño.

```html
<!-- La utility .syx-d-none siempre oculta el botón, sin !important -->
<button class="atom-btn atom-btn--primary syx-d-none">Hidden</button>
```

### Por qué no necesitas !important

```scss
// ❌ Antes (sin @layer)
.syx-d-none {
  display: none !important;
}

// ✅ Ahora (con @layer)
@layer syx.utilities {
  .syx-d-none {
    display: none;
  } // Gana por posición en el stack, no por !important
}
```

> **Nota**: Si ves `!important` en el codebase, es un bug. Repórtalo.
