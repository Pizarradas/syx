# SCSS Pipeline — Estructura de componentes y @layer en SYX

## meta

| Campo | Valor |
|-------|-------|
| **Dominio** | SYX — implementación SCSS |
| **Fuente** | Arquitectura interna SYX |
| **Objetivo** | Template de componente, lista de mixins, estructura de @layer para el modo `[SYX: UI]:` |
| **Agent tags** | `#scss-pipeline` `#layer` `#mixin` `#component-template` |

---

## concepts

Todo componente SYX sigue un template estricto: un mixin con parámetro `$theme`, que contiene un `@layer` con la declaración del componente en BEM. Sin excepción.

---

## rules

### Template de componente

```scss
// CORE
// ===============================================
@use "../abstracts/index" as *;
// ===============================================

// {layer}: {name}
// ===============================================
@mixin {prefix}-{name}($theme: null) {
  @layer syx.{atoms|molecules|organisms} {

    .{prefix}-{name} {
      // 1. Positioning
      @include relative();

      // 2. Display / Box model
      @include flex-center();

      // 3. Dimensions
      // @include size(…, …);

      // 4. Spacing
      @include padding(var(--component-{name}-padding-y) var(--component-{name}-padding-x));

      // 5. Typography
      font-size: var(--component-{name}-font-size);
      color:     var(--component-{name}-color);

      // 6. Visual
      background-color: var(--component-{name}-bg);
      @include border(all, var(--component-{name}-border-width), solid, var(--component-{name}-border));
      @include border-radius(var(--component-{name}-radius));

      // 7. Transitions
      @include transition(background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease);

      // 8. States
      &:hover  { background-color: var(--component-{name}-bg-hover); }

      &:focus-visible {
        @include focus-ring();
      }

      &:disabled,
      &[aria-disabled="true"] {
        opacity: var(--semantic-opacity-disabled);
        cursor: not-allowed;
        pointer-events: none;
      }

      // 9. Elements
      &__element { … }

      // Modifiers
      &--modifier { … }

      // Theme-specific one-offs
      @if $theme == "example-02" { … }
    }

  } // end @layer
}
```

**Reglas de estructura:**
- `@use "../abstracts/index" as *` es la única importación permitida
- El mixin DEBE tener `$theme: null` como parámetro
- Todo el contenido DEBE estar dentro del `@layer syx.{layer}`
- Nesting máximo: 3 niveles dentro del bloque del componente

---

### Orden de propiedades (Property Order)

```
1. Positioning     @include relative/absolute/fixed/sticky()
2. Display         display, @include flex-center(), grid, etc.
3. Dimensions      width, height, @include size()
4. Spacing         @include padding(), @include margin()
5. Typography      font-size, font-weight, line-height, letter-spacing, color
6. Visual          background, @include border(), @include border-radius(), box-shadow
7. Transitions     @include transition()
8. States          &:hover, &:focus-visible, &:disabled, &[aria-disabled]
9. Elements        &__elemento { }
   Modifiers       &--modificador { }
```

---

### Stack de @layer en SYX

```scss
@layer syx.reset,
       syx.tokens,
       syx.base,
       syx.atoms,
       syx.molecules,
       syx.organisms,
       syx.utilities,
       syx.themes;
```

La última capa declarada gana en caso de conflicto, independientemente de especificidad.

---

### Mixins de referencia

| Necesidad | Mixin |
|-----------|-------|
| Positioning | `@include absolute($top: 0, $right: 0)` |
| Positioning | `@include relative()` / `@include sticky($top: 0)` / `@include fixed(…)` |
| Flexbox | `@include flex-center()` / `@include flex-between()` |
| Spacing | `@include padding(y x)` / `@include margin(null auto)` |
| Border | `@include border(all, var(--w), solid, var(--c))` |
| Border radius | `@include border-radius(var(--semantic-border-radius-md))` |
| Size | `@include size(100%, 3rem)` |
| Motion | `@include transition(opacity 0.2s ease)` |
| Responsive | `@include breakpoint(tablet) { … }` |
| Dark mode | `@include darkmode { … }` |
| Reduced motion | `@include reduced-motion { … }` |
| A11y | `@include sr-only()` / `@include focus-ring()` |
| Typography | `@include truncate(200px)` / `@include ellipsis(3)` |

**Regla:** si existe un mixin para la propiedad, usar el mixin. Nunca raw `position:`, `transition:`, `padding:` shorthand, `margin:` shorthand.

---

### Multi-Theme Strategy

```scss
// CSS custom properties para valores que difieren entre temas (runtime)
background: var(--component-header-bg);

// Sass map para diferencias estructurales (build-time)
@if theme-cfg($theme, "header-layout", "horizontal") == "vertical" { … }

// @if $theme == para one-offs en 1-2 temas específicos
@if $theme == "example-03" {
  backdrop-filter: blur(8px);
}
```

---

## checklist

- [ ] ¿El componente está en `@mixin {prefix}-{name}($theme: null) { @layer syx.{layer} { … } }`?
- [ ] ¿La única importación es `@use "../abstracts/index" as *`?
- [ ] ¿El orden de propiedades sigue Positioning → Display → Dimensions → … → States → Elements?
- [ ] ¿No hay raw `position:`, `transition:`, `padding:` shorthand?
- [ ] ¿El nesting no supera 3 niveles?
- [ ] ¿Todos los valores son `var(--component-*)` o `var(--semantic-*)`?
- [ ] ¿Está registrado con `@forward` en el index correspondiente?
