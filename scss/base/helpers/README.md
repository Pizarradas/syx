# base/helpers/

Mixins **tema-conscientes** que generan clases `.syx-*` dentro de `@layer syx.utilities`. Se llaman desde cada `themes/{nombre}/setup.scss`, recibiendo el parámetro `$theme` que les permite distinguir qué theme está compilando.

**Prefijo de clases generadas**: `.syx-*`
**Layer**: `@layer syx.utilities`
**Tema-dependientes**: ✅ Sí — cada tema produce sus propias variaciones de color, tamaño de tipografía, dimensiones e iconos

> **Diferencia clave con `utilities/`**: Los helpers generan clases que dependen de los tokens del tema activo. Un hero de "example-01" puede tener `--icon-rrss-facebook` diferente al de "example-02". Las utilidades de `utilities/` son idénticas en todos los temas.

---

## Cuándo usar estas clases

Usa las clases de `base/helpers/` para:

- **Colores de fondo** temáticos (`.syx-bg-color-primary`, `.syx-bg-color-brand-*`)
- **Colores de texto** temáticos (`.syx-font-color-primary`, `.syx-font-color-brand-*`)
- **Tipografía** con escala de fuentes del tema (`.syx-font-size-1` a `.syx-font-size-5`)
- **Dimensiones** del sistema de dimensiones del tema (`.syx-size-1` a `.syx-size-5`)
- **Espaciado temático** (`.syx-spacer-gap-t-1`, `.syx-spacer-inner-t-1`)
- **Iconos de RRSS** (`.syx-icon`, `.syx-icon--facebook-primary`, etc.)
- **Pesos y familias de fuente** del tema (`.syx-font-weight-light`, `.syx-font-scope-*`)

**No** uses estas clases para:

- Layout, flexbox, grid → usa `utilities/_display.scss`
- Margen / padding genérico → usa `utilities/_spacing.scss`
- Object-fit, iframes → usa `utilities/_media.scss`
- Accesibilidad → usa `utilities/_accessibility.scss`

---

## Archivos activos

### `_backgrounds.scss` — Fondos (`helper-backgrounds`)

Genera clases de tamaño de fondo y **color de fondo temático**.

#### Background-size

```html
<div class="syx-bg-auto">...</div>
<div class="syx-bg-cover">...</div>
<div class="syx-bg-contain">...</div>
```

#### Colores de fondo (resueltos por tokens del tema)

```html
<div class="syx-bg-color-primary">Fondo primario del tema activo</div>
<div class="syx-bg-color-secondary">Fondo secundario</div>
<div class="syx-bg-color-neutral">Fondo neutro</div>
<div class="syx-bg-color-dark">Fondo oscuro</div>
<div class="syx-bg-color-white">Fondo blanco</div>
```

> Algunos temas añaden lógica adicional con `@if $theme` — esto es intencional y no reemplazable por CSS custom properties.

---

### `_fonts.scss` — Tipografía temática (`helper-fonts`)

Color, peso y "scope" (tamaño + line-height combinados) de tipografía.

#### Color de texto

```html
<p class="syx-font-color-primary">Texto en color primario del tema</p>
<p class="syx-font-color-secondary">Texto en color secundario</p>
<p class="syx-font-color-neutral">Texto neutro</p>
<p class="syx-font-color-dark">Texto oscuro</p>
<p class="syx-font-color-white">Texto blanco</p>
<p class="syx-font-color-brand-primary">Color de marca primario</p>
```

#### Peso de fuente

```html
<span class="syx-font-weight-light">Light</span>
<span class="syx-font-weight-regular">Regular</span>
<span class="syx-font-weight-medium">Medium</span>
<span class="syx-font-weight-semibold">Semibold</span>
<span class="syx-font-weight-bold">Bold</span>
```

#### Scope (tamaño + interlineado del tema)

```html
<p class="syx-font-scope-xs">XS — texto más pequeño del sistema</p>
<p class="syx-font-scope-sm">SM</p>
<p class="syx-font-scope-md">MD — cuerpo base</p>
<p class="syx-font-scope-lg">LG</p>
<p class="syx-font-scope-xl">XL</p>
```

---

### `_font-sizes.scss` — Tamaños de fuente responsivos (`helper-font-sizes`)

Escala de 5 niveles con escalado responsivo. Los tokens `--font-size-{n}` los define cada tema.

```html
<p class="syx-font-size-1">Tamaño 1 — mayor</p>
<p class="syx-font-size-2">Tamaño 2</p>
<p class="syx-font-size-3">Tamaño 3 — base</p>
<p class="syx-font-size-4">Tamaño 4</p>
<p class="syx-font-size-5">Tamaño 5 — menor</p>
```

> Diferencia con `syx-type-*` de utilities: `syx-font-size-*` usa los tokens del tema activo; `syx-type-*` usa la escala fluida de Major Third del core.

---

### `_dimensions.scss` — Dimensiones temáticas (`helper-dimensions`)

Tamaños width/height del sistema de dimensiones del tema. Los tokens `--dimension-{n}` los define cada tema.

```html
<div class="syx-size-1"><!-- Dimensión 1 del tema --></div>
<div class="syx-size-2">2</div>
<div class="syx-size-3">3</div>
<div class="syx-size-4">4</div>
<div class="syx-size-5">5</div>
```

---

### `_spacers.scss` — Espaciado temático (`helper-spacer`)

Márgenes y paddings usando el sistema de gaps e inners del tema. Los tokens `--gap-{n}` e `--inner-{n}` los define cada tema.

```html
<!-- Gap (spacing exterior / entre secciones) -->
<section class="syx-spacer-gap-t-1"><!-- margin-top gap-1 del tema --></section>
<section class="syx-spacer-gap-b-2"><!-- margin-bottom gap-2 --></section>

<!-- Inner (padding interior / dentro de componentes) -->
<div class="syx-spacer-inner-t-1"><!-- padding-top inner-1 --></div>
<div class="syx-spacer-inner-x-2"><!-- padding inline inner-2 --></div>
```

> Para espaciado no-temático (valores numéricos fijos), usa `utilities/_spacing.scss`.

---

### `_icons.scss` — Iconos de RRSS (`helper-icons`)

Genera clases para iconos de redes sociales incluyendo color, hover y variantes. Los tokens `--icon-rrss-*` los define cada tema (pudiendo tener colores de marca distintos por theme).

```html
<!-- Icono base -->
<span class="syx-icon syx-icon--facebook-primary" aria-hidden="true"></span>
<span class="syx-icon syx-icon--twitter-primary" aria-hidden="true"></span>
<span class="syx-icon syx-icon--instagram-primary" aria-hidden="true"></span>
<span class="syx-icon syx-icon--youtube-primary" aria-hidden="true"></span>
<span class="syx-icon syx-icon--whatsapp-primary" aria-hidden="true"></span>
<span class="syx-icon syx-icon--linkedin-primary" aria-hidden="true"></span>
```

Usar siempre `aria-hidden="true"` en iconos decorativos. Si el icono **es** la etiqueta del botón, añadir `<span class="syx-sr-only">Label</span>` al lado.

```html
<!-- Patrón accesible -->
<a href="#" class="atom-link">
  <span class="syx-icon syx-icon--facebook-primary" aria-hidden="true"></span>
  <span class="syx-sr-only">Síguenos en Facebook</span>
</a>
```

---

## Cómo funciona internamente

1. `themes/example-01/setup.scss` llama `@include helper-backgrounds('example-01')`
2. El mixin compila las clases `.syx-bg-color-*` con los tokens del tema
3. Las clases se envuelven en `@layer syx.utilities` → siempre ganan sobre componentes
4. El CSS final de cada tema tiene sus propias variaciones de estas clases

## Añadir un nuevo helper

1. Crear `_mi-helper.scss` en esta carpeta
2. Definir `@mixin helper-mi-helper($theme: null) { @layer syx.utilities { ... } }`
3. Usar `.syx-*` como prefijo para las clases generadas
4. `@forward` en `helpers/helpers.scss`
5. Llamar `@include helper-mi-helper($theme)` en los `setup.scss` de cada tema
