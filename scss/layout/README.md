# layout/

Sistema de **grid de columnas** de SYX. Genera el contenedor y la rejilla de columnas con padding, gaps y breakpoints del tema.

**Clase raíz**: `layout-grid`
**Layer**: `@layer syx.base` (parte de la arquitectura de componentes de layout)
**Archivo único**: `grids/_grid.scss`

---

## Cuándo usar el grid

Usa `syx-grid` para **layouts de página completos** o **secciones de contenido** que requieran una rejilla de columnas con gutters coherentes con el sistema de espaciado.

Para micro-layouts (flex row, centrado, alineaciones puntuales), usa las utilidades de `utilities/_display.scss` (`.syx-d-flex`, `.syx-gap-*`, etc.).

---

## Estructura base

```html
<!-- Contenedor grid + 2 columnas -->
<div class="layout-grid">
  <div class="layout-grid__col-xs-6">Columna izquierda</div>
  <div class="layout-grid__col-xs-6">Columna derecha</div>
</div>
```

```html
<!-- 3 columnas desiguales -->
<div class="layout-grid">
  <div class="layout-grid__col-xs-3">Sidebar</div>
  <div class="layout-grid__col-xs-6">Contenido principal</div>
  <div class="layout-grid__col-xs-3">Aside</div>
</div>
```

La suma de columnas debe ser **12** (sistema de 12 columnas).

---

## Modificadores del contenedor

| Modificador                 | Efecto                                    |
| --------------------------- | ----------------------------------------- |
| `layout-grid--no-padding`   | Elimina el padding lateral del contenedor |
| `layout-grid--is-edge2edge` | Grid a ancho completo sin padding lateral |
| `layout-grid--no-gap`       | Elimina el gap entre columnas             |
| `layout-grid--align-center` | Alineación vertical centrada              |

```html
<!-- Grid sin padding (para imágenes de borde a borde) -->
<div class="layout-grid layout-grid--no-padding">
  <div class="layout-grid__col-xs-12">
    <img class="syx-img-fluid syx-obj-cover syx-w-full" src="..." alt="..." />
  </div>
</div>
```

---

## Breakpoints responsivos

El grid usa un sistema mobile-first. Las columnas pueden especificarse por breakpoint:

```html
<!-- 12 columnas en mobile, 6 en tablet, 4 en desktop -->
<div class="layout-grid__col-xs-12 layout-grid__col-sm-6 layout-grid__col-md-4">
  ...
</div>
```

| Modificador    | Breakpoint                         |
| -------------- | ---------------------------------- |
| `__col-xs-{n}` | Todas las pantallas (mobile-first) |
| `__col-sm-{n}` | ≥ 48em (768px)                     |
| `__col-md-{n}` | ≥ 64em (1024px)                    |
| `__col-lg-{n}` | ≥ 80em (1280px)                    |

---

## Grid anidado

Para grids dentro de grids, el grid hijo hereda el padding del contenedor padre. Usa `--no-pad` en el hijo para eliminar el doble padding:

```html
<div class="layout-grid">
  <div class="layout-grid__col-xs-8">
    <!-- Grid anidado — usa layout-grid__nested para el grid hijo -->
    <div class="layout-grid__nested">
      <div class="layout-grid__col-xs-6">Sub-col A</div>
      <div class="layout-grid__col-xs-6">Sub-col B</div>
    </div>
  </div>
  <div class="layout-grid__col-xs-4">Aside</div>
</div>
```

> `layout-grid__nested` tiene `padding: 0` por defecto para evitar el doble gutter. No es necesario usar ningún modificador adicional.

---

## Combinación con utilidades

Las utilidades `.syx-*` se pueden añadir directamente a columnas del grid:

```html
<div class="layout-grid syx-gap-4">
  <div class="layout-grid__col-xs-6 syx-d-flex syx-flex-col syx-justify-center">
    <h2 class="syx-type-h2">Título</h2>
    <p class="atom-txt syx-text-gray">Descripción</p>
  </div>
  <div class="layout-grid__col-xs-6">
    <img class="syx-img-fluid syx-obj-cover" src="..." alt="..." />
  </div>
</div>
```

---

## Notas técnicas

- El grid usa CSS `padding` y `gap` para los gutters — los valores vienen de los tokens `--layout-*` del tema activo
- El modificador `--no-padding` / `--is-edge2edge` aplica `padding: 0` — sin necesidad de `!important` gracias a `@layer syx.base`
- No hay dependencias JS — es CSS puro

---

## Añadir nuevos sistemas de layout

Si necesitas un sistema de layout diferente (masonry, CSS subgrid, etc.):

1. Crear `grids/_mi-layout.scss`
2. Añadir `@forward 'grids/mi-layout'` en `layout/index.scss`
3. Documentar en este README
