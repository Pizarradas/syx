# utilities/

Clases de utilidad **tema-agnósticas**. Viven en `@layer syx.utilities` — el layer más alto del stack, lo que significa que **siempre sobreescriben** a cualquier componente (`atom-*`, `mol-*`, `org-*`) sin necesitar `!important`.

**Prefijo**: `.syx-*`
**Layer**: `@layer syx.utilities`
**Tema-dependientes**: ❌ No — son iguales en todos los temas

> **Diferencia clave con `base/helpers/`**: Las utilidades aquí son universales (no cambian por tema). Si necesitas clases de color, tipografía o iconos que sí varían por tema, usa los helpers de `base/helpers/`.

---

## Tabla de escala numérica

Varias utilidades usan una escala `-1` a `-5` cuyos valores **son siempre los mismos** y mapean directamente a tokens semánticos. Esta tabla es la llave de decodificación:

| Paso | Token semántico              | Valor aprox.     |
| ---- | ---------------------------- | ---------------- |
| `-1` | `--semantic-space-inline-xs` | 8px              |
| `-2` | `--semantic-space-inline-sm` | 16px             |
| `-3` | `--semantic-space-inline-md` | 24px             |
| `-4` | `--semantic-space-inline-lg` | 32px             |
| `-5` | `--semantic-space-layout-xl` | 32–48px (fluido) |

El paso `-0` es siempre `0`. El **espaciado es fluido** en el rango layout: el valor exacto varía entre el mínimo y máximo según el viewport.

Aplica a: `.syx-m-*` · `.syx-p-*` · `.syx-gap-*` · `.syx-col-gap-*` · `.syx-row-gap-*`

---

## Cuándo usar estas clases

Usa `utilities/` para:

- **Componer layouts** con flexbox/grid sin escribir CSS propio
- **Ajustar espaciado** puntualmente (márgenes, paddings)
- **Ocultar/mostrar** elementos por breakpoint
- **Controlar tipografía** (peso, alineación, transform, color semántico)
- **Insertar iframes/mapas/videos** responsivos
- **Accesibilidad** (skip links, screen reader only)

**No** uses estas clases para:

- Colores de marca específicos del tema → usa `base/helpers/` (`.syx-bg-color-primary`, `.syx-font-color-brand-*`)
- Iconos SVG → usa `base/helpers/` (`.syx-icon--facebook-primary`)
- Componentes → usa `atoms/`, `molecules/`, `organisms/`

---

## Archivos y clases

### `_display.scss` — Display, Flex, Grid, Position, Visibilidad

#### Display

| Clase                 | Efecto                                |
| --------------------- | ------------------------------------- |
| `.syx-d-flex`         | `display: flex`                       |
| `.syx-d-inline-flex`  | `display: inline-flex`                |
| `.syx-d-block`        | `display: block`                      |
| `.syx-d-inline-block` | `display: inline-block`               |
| `.syx-d-inline`       | `display: inline`                     |
| `.syx-d-none`         | `display: none` (esconde el elemento) |
| `.syx-d-grid`         | `display: grid`                       |
| `.syx-d-inline-grid`  | `display: inline-grid`                |
| `.syx-d-contents`     | `display: contents`                   |
| `.syx-d-table`        | `display: table`                      |
| `.syx-d-table-cell`   | `display: table-cell`                 |
| `.syx-d-table-row`    | `display: table-row`                  |
| `.syx-d-list-item`    | `display: list-item`                  |

#### Visibilidad responsiva

| Clase            | Comportamiento                   |
| ---------------- | -------------------------------- |
| `.syx-d-sm-only` | Solo visible en mobile (< 768px) |
| `.syx-d-sm-up`   | Visible desde 768px en adelante  |
| `.syx-d-md-up`   | Visible desde 1024px en adelante |
| `.syx-d-lg-up`   | Visible desde 1280px en adelante |
| `.syx-d-xlg-up`  | Visible desde 1440px en adelante |

#### Width / Height

`.syx-w-full` · `.syx-w-auto` · `.syx-h-full` · `.syx-h-auto` · `.syx-w-screen` · `.syx-h-screen`

#### Border

`.syx-border` · `.syx-border-none`

#### Flex — dirección

`.syx-flex-row` · `.syx-flex-row-reverse` · `.syx-flex-col` · `.syx-flex-col-reverse`

#### Flex — wrap

`.syx-flex-wrap` · `.syx-flex-nowrap`

#### Flex — grow/shrink

`.syx-flex-1` · `.syx-flex-auto` · `.syx-flex-none`

#### Justify content

`.syx-justify-start` · `.syx-justify-end` · `.syx-justify-center` · `.syx-justify-between` · `.syx-justify-around` · `.syx-justify-evenly`

#### Align items

`.syx-items-start` · `.syx-items-end` · `.syx-items-center` · `.syx-items-baseline` · `.syx-items-stretch`

#### Align content

`.syx-content-start` · `.syx-content-end` · `.syx-content-center` · `.syx-content-between` · `.syx-content-around`

#### Align self

`.syx-self-start` · `.syx-self-end` · `.syx-self-center` · `.syx-self-auto`

#### Gap (referencias a tokens `--semantic-space-inline-*`)

| Clase        | Token                        |
| ------------ | ---------------------------- |
| `.syx-gap-0` | 0                            |
| `.syx-gap-1` | `--semantic-space-inline-xs` |
| `.syx-gap-2` | `--semantic-space-inline-sm` |
| `.syx-gap-3` | `--semantic-space-inline-md` |
| `.syx-gap-4` | `--semantic-space-inline-lg` |
| `.syx-gap-5` | `--semantic-space-layout-xl` |

También: `.syx-col-gap-{1–5}` y `.syx-row-gap-{1–5}` (misma escala, igual de exhaustivo)

#### Overflow

`.syx-overflow-hidden` · `.syx-overflow-auto` · `.syx-overflow-scroll` · `.syx-overflow-x-hidden` · `.syx-overflow-y-auto`

#### Position

`.syx-relative` · `.syx-absolute` · `.syx-sticky` · `.syx-fixed` · `.syx-static`

Insets: `.syx-inset-0` · `.syx-top-0` · `.syx-right-0` · `.syx-bottom-0` · `.syx-left-0`

#### Vertical align

`.syx-valign-top` · `.syx-valign-middle` · `.syx-valign-bottom` · `.syx-valign-baseline` · `.syx-valign-sub` · `.syx-valign-super`

#### Animaciones

`.syx-fade-in` — fade in suave con `cubic-bezier`

---

### `_spacing.scss` — Margin y Padding

Escalas del 0 al 5 mapeadas a `--semantic-space-inline-*` y `--semantic-space-layout-*`:

| Sufijo | Token                        |
| ------ | ---------------------------- |
| `-0`   | 0                            |
| `-1`   | `--semantic-space-inline-xs` |
| `-2`   | `--semantic-space-inline-sm` |
| `-3`   | `--semantic-space-inline-md` |
| `-4`   | `--semantic-space-inline-lg` |
| `-5`   | `--semantic-space-layout-xl` |

**Margin**: `.syx-m-{0–5}` · `.syx-mt-*` · `.syx-mb-*` · `.syx-ml-*` · `.syx-mr-*` · `.syx-mx-*` · `.syx-my-*`

**Padding**: `.syx-p-{0–5}` · `.syx-pt-*` · `.syx-pb-*` · `.syx-pl-*` · `.syx-pr-*` · `.syx-px-*` · `.syx-py-*`

**Logical (RTL)**: `.syx-pis-{0–5}` · `.syx-pie-{0–5}`

**Shorthands**: `.syx-pad-section` (padding de sección) · `.syx-mx-auto` · `.syx-ml-auto` · `.syx-mr-auto`

---

### `_text.scss` — Texto, Tipografía y Color

#### Color de texto

`.syx-text-primary` · `.syx-text-secondary` · `.syx-text-white` · `.syx-text-black` · `.syx-text-gray` · `.syx-text-muted` · `.syx-text-inverse` · `.syx-text-error` · `.syx-text-success` · `.syx-text-warning`

Colores de marca: `.syx-text-facebook` · `.syx-text-twitter` · `.syx-text-instagram` · `.syx-text-whatsapp`

#### Alineación

`.syx-text-center` · `.syx-text-left` · `.syx-text-right` · `.syx-text-justify` · `.syx-text-start` · `.syx-text-end`

#### Decoración

`.syx-text-underline` · `.syx-text-overline` · `.syx-text-strikethrough` · `.syx-text-no-underline`

#### Transform

`.syx-text-uppercase` · `.syx-text-lowercase` · `.syx-text-capitalize`

#### Font weight

`.syx-font-regular` · `.syx-font-medium` · `.syx-font-bold`

#### Medida de texto (max-width)

`.syx-max-w-15ch` · `.syx-max-w-50ch` · `.syx-max-w-65ch`

#### Escala tipográfica fluida (Major Third × 1.250, fluid `clamp()`)

| Clase                           | Uso                         |
| ------------------------------- | --------------------------- |
| `.syx-type-display-1`           | Hero / portadas             |
| `.syx-type-h1` – `.syx-type-h6` | Headings de contenido       |
| `.syx-type-body-large`          | Lead paragraph              |
| `.syx-type-body`                | Texto estándar              |
| `.syx-type-body-small`          | Texto secundario / metadata |
| `.syx-type-caption`             | Caption / overline          |

> Para headings dentro de componentes de contenido (artículos, cards) prefiere `atom-title atom-title--h{n}`.
> `syx-type-*` es mejor para headings de página o secciones de layout.

---

### `_media.scss` — Imágenes, Iframes y Object-fit

#### Imagen responsiva

```html
<img class="syx-img-fluid" src="..." alt="..." />
```

#### Embed con aspect-ratio

```html
<div class="syx-embed syx-embed--16by9">
  <iframe class="syx-embed__item" src="..."></iframe>
</div>
```

Variantes: `--16by9` · `--8by5` · `--3by2` · `--4by3` · `--1by1`

#### Mapa (Google Maps, etc.)

```html
<div class="syx-map syx-map--16by9">
  <iframe class="syx-map__iframe" src="..."></iframe>
</div>
```

Variantes: `--16by9` · `--8by5` · `--4by3` · `--3by2` · `--h100`

#### Object-fit

`.syx-obj-cover` · `.syx-obj-contain` · `.syx-obj-fill` · `.syx-obj-none` · `.syx-obj-scale-down`

#### Object-position

`.syx-obj-center` · `.syx-obj-top` · `.syx-obj-bottom`

#### Background-size

`.syx-bg-cover` · `.syx-bg-contain` · `.syx-bg-auto`

---

### `_accessibility.scss` — A11y

| Clase                    | Uso                                                           |
| ------------------------ | ------------------------------------------------------------- |
| `.syx-sr-only`           | Oculta visualmente, accesible a lectores de pantalla          |
| `.syx-sr-only-focusable` | Como `sr-only` pero visible al recibir foco (tab)             |
| `.syx-skip-link`         | Skip-to-content al inicio del `<body>`                        |
| `.syx-motion-safe`       | Deshabilita animaciones si el usuario prefiere reduced-motion |

```html
<!-- Skip link — al principio del <body> -->
<a href="#main-content" class="syx-skip-link">Ir al contenido principal</a>

<!-- Etiqueta accesible para un icono -->
<button class="atom-btn">
  <span class="syx-icon syx-icon--search" aria-hidden="true"></span>
  <span class="syx-sr-only">Buscar</span>
</button>
```

---

## Patrón de composición típico

```html
<!-- Card centrada, flex column, gap-3 -->
<div class="syx-d-flex syx-flex-col syx-items-center syx-gap-3 syx-p-4">
  <img class="syx-img-fluid syx-obj-cover" src="..." alt="..." />
  <p class="syx-type-body syx-text-gray syx-max-w-65ch">...</p>
  <button class="atom-btn atom-btn--primary atom-btn--filled syx-mt-2">
    CTA
  </button>
</div>
```

---

## Añadir nuevas utilidades

1. Crear `_mi-utilidad.scss` en esta carpeta
2. Envolver todo en `@layer syx.utilities { ... }`
3. Usar prefijo `.syx-{propiedad}-{valor}`
4. Registrar el `@forward` en `utilities/index.scss`
5. No usar `!important`
6. No hardcodear valores — referenciar tokens `--semantic-*` o `--primitive-*`
