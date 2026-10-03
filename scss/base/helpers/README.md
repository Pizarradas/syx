# base/helpers/

Mixins **tema-conscientes** que generan clases `.syx-*` dentro de `@layer syx.utilities`. Se llaman desde `themes/_shared/_core.scss` (`syx-core($theme)`), que cada `_setup.scss` y cada `bundle-*.scss` incluyen; reciben el parámetro `$theme` que les permite distinguir qué theme está compilando.

**Prefijo de clases generadas**: `.syx-*`
**Layer**: `@layer syx.utilities`
**Tema-dependientes**: ✅ Sí — cada tema produce sus propias variaciones de color, tamaño de tipografía, dimensiones e iconos

> **Diferencia clave con `utilities/`**: Los helpers generan clases que dependen de los tokens del tema activo. Un hero de "example-01" puede tener `--icon-rrss-facebook` diferente al de "example-02". Las utilidades de `utilities/` son idénticas en todos los temas.

---

## Cuándo usar estas clases

Usa las clases de `base/helpers/` para:

- **Colores de fondo** temáticos (`.syx-bg-color-primary` … `.syx-bg-color-quinary`, `.syx-bg-color-white`, `.syx-bg-color-black`)
- **Colores de texto** temáticos (`.syx-font-color-primary` … `.syx-font-color-quinary`, `.syx-font-color-white`, `.syx-font-color-black`)
- **Tipografía** con escala de fuentes del tema (`.syx-font-size-1` a `.syx-font-size-5`)
- **Dimensiones** del sistema de dimensiones del tema (`.syx-size-1` a `.syx-size-5`)
- **Iconos de RRSS** (`.syx-icon`, `.syx-icon--facebook-primary`, etc.)
- **Pesos y familias de fuente** del tema (`.syx-font-bold`, `.syx-font-medium`, `.syx-font-weight-1`/`-2` —familias, no pesos—, `.syx-font-scope-1`…`-5`)

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
<div class="syx-bg-color-tertiary">Fondo terciario</div>
<div class="syx-bg-color-black">Fondo negro</div>
<div class="syx-bg-color-white">Fondo blanco</div>
```

> Algunos temas añaden lógica adicional con `@if $theme` para definir el `color` del contenedor cuando el fondo es oscuro — esto es intencional y no reemplazable por CSS custom properties. El color se define directamente en el elemento contenedor (p.ej. `.syx-bg-color-primary { color: var(--primitive-color-white) }`), y los hijos lo heredan de forma natural a través de la cascada CSS. No se usan selectores `* { color }`.

---

### `_fonts.scss` — Tipografía temática (`helper-fonts`)

Color, peso y "scope" (tamaño + line-height combinados) de tipografía.

#### Color de texto

```html
<p class="syx-font-color-primary">Texto en color primario del tema</p>
<p class="syx-font-color-secondary">Texto en color secundario</p>
<p class="syx-font-color-tertiary">Texto en color terciario</p>
<p class="syx-font-color-black">Texto negro</p>
<p class="syx-font-color-white">Texto blanco</p>
```

#### Peso de fuente

```html
<span class="syx-font-medium">Medium</span>
<span class="syx-font-bold">Bold (peso y familia de negrita)</span>
<!-- nombre histórico: -weight-1/-2 cambian la FAMILIA (texto / negrita), no el peso -->
<span class="syx-font-weight-1">Familia de texto</span>
<span class="syx-font-weight-2">Familia de negrita</span>
```

#### Scope (tamaño + interlineado del tema)

```html
<p class="syx-font-scope-1">1 — texto más pequeño del sistema</p>
<p class="syx-font-scope-2">2</p>
<p class="syx-font-scope-3">3</p>
<p class="syx-font-scope-4">4</p>
<p class="syx-font-scope-5">5</p>
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

> **`helper-spacer` retirado (2026-09-12):** las clases ❌ `.syx-spacer-*` ✓ no
> tenían ningún uso real en el sitio ni en el sistema. Para espaciado usa
> `utilities/_spacing.scss` (`.syx-mt-*`, `.syx-pt-*`, …).

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

1. `syx-core(example-01)` (en `themes/_shared/_core.scss`) llama `@include helper-backgrounds(example-01)`
2. El mixin compila las clases `.syx-bg-color-*` con los tokens del tema
3. Las clases se envuelven en `@layer syx.utilities` → siempre ganan sobre componentes
4. El CSS final de cada tema tiene sus propias variaciones de estas clases

## Añadir un nuevo helper

1. Crear `_mi-helper.scss` en esta carpeta
2. Definir `@mixin helper-mi-helper($theme: null) { @layer syx.utilities { ... } }`
3. Usar `.syx-*` como prefijo para las clases generadas
4. `@forward` en `helpers/helpers.scss`
5. Llamar `@include helper-mi-helper($theme)` una sola vez en `themes/_shared/_core.scss` (el mixin `syx-core()`)
