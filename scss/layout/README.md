# layout/

Sistema de **grid de columnas** de SYX. Genera el contenedor y la rejilla de columnas con padding, gaps y breakpoints del tema.

**Clase raíz**: `syx-grid`
**Layer**: `@layer syx.atoms` (parte de la arquitectura de componentes de layout)
**Archivo único**: `grids/grid.scss`

---

## Cuándo usar el grid

Usa `syx-grid` para **layouts de página completos** o **secciones de contenido** que requieran una rejilla de columnas con gutters coherentes con el sistema de espaciado.

Para micro-layouts (flex row, centrado, alineaciones puntuales), usa las utilidades de `utilities/_display.scss` (`.syx-d-flex`, `.syx-gap-*`, etc.).

---

## Estructura base

```html
<!-- Contenedor grid + 2 columnas -->
<div class="syx-grid">
  <div class="syx-grid__col syx-grid__col--6">Columna izquierda</div>
  <div class="syx-grid__col syx-grid__col--6">Columna derecha</div>
</div>
```

```html
<!-- 3 columnas desiguales -->
<div class="syx-grid">
  <div class="syx-grid__col syx-grid__col--3">Sidebar</div>
  <div class="syx-grid__col syx-grid__col--6">Contenido principal</div>
  <div class="syx-grid__col syx-grid__col--3">Aside</div>
</div>
```

La suma de columnas debe ser **12** (sistema de 12 columnas).

---

## Modificadores del contenedor

| Modificador        | Efecto                                                              |
| ------------------ | ------------------------------------------------------------------- |
| `syx-grid--no-pad` | Elimina el padding lateral del contenedor (`padding: 0 !important`) |
| `syx-grid--full`   | Grid a ancho completo, sin max-width                                |
| `syx-grid--narrow` | Contenedor de anchura reducida (para texto largo)                   |

```html
<!-- Grid sin padding (para imágenes de borde a borde) -->
<div class="syx-grid syx-grid--no-pad">
  <div class="syx-grid__col syx-grid__col--12">
    <img class="syx-img-fluid syx-obj-cover syx-w-full" src="..." alt="..." />
  </div>
</div>
```

---

## Breakpoints responsivos

El grid usa un sistema mobile-first. Las columnas pueden especificarse por breakpoint:

```html
<!-- 12 columnas en mobile, 6 en tablet, 4 en desktop -->
<div
  class="syx-grid__col syx-grid__col--12 syx-grid__col--sm-6 syx-grid__col--md-4"
>
  ...
</div>
```

| Modificador | Breakpoint |
| ----------- | ---------- |
| `--sm-{n}`  | ≥ 768px    |
| `--md-{n}`  | ≥ 1024px   |
| `--lg-{n}`  | ≥ 1280px   |

---

## Grid anidado

Para grids dentro de grids, el grid hijo hereda el padding del contenedor padre. Usa `--no-pad` en el hijo para eliminar el doble padding:

```html
<div class="syx-grid">
  <div class="syx-grid__col syx-grid__col--8">
    <!-- Grid anidado sin doble padding -->
    <div class="syx-grid syx-grid--no-pad">
      <div class="syx-grid__col syx-grid__col--6">Sub-col A</div>
      <div class="syx-grid__col syx-grid__col--6">Sub-col B</div>
    </div>
  </div>
  <div class="syx-grid__col syx-grid__col--4">Aside</div>
</div>
```

---

## Combinación con utilidades

Las utilidades `.syx-*` se pueden añadir directamente a columnas del grid:

```html
<div class="syx-grid syx-gap-4">
  <div
    class="syx-grid__col syx-grid__col--6 syx-d-flex syx-flex-col syx-justify-center"
  >
    <h2 class="syx-type-h2">Título</h2>
    <p class="atom-txt syx-text-gray">Descripción</p>
  </div>
  <div class="syx-grid__col syx-grid__col--6">
    <img class="syx-img-fluid syx-obj-cover" src="..." alt="..." />
  </div>
</div>
```

---

## Notas técnicas

- El grid usa CSS `padding` y `gap` para los gutters — los valores vienen de los tokens `--component-grid-*` del tema activo
- El modificador `--no-pad` usa `padding: 0 !important` y `gap: 0 !important`: esto es un uso **justificado** de `!important` para sobreescribir la especificidad del grid en grids anidados
- No hay dependencias JS — es CSS puro

---

## Añadir nuevos sistemas de layout

Si necesitas un sistema de layout diferente (masonry, CSS subgrid, etc.):

1. Crear `grids/_mi-layout.scss`
2. Añadir `@forward 'grids/mi-layout'` en `layout/index.scss`
3. Documentar en este README
