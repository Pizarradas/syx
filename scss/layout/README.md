# layout/

Las piezas de maquetación de SYX: la **rejilla de columnas** y dos **primitivas** para lo que una pantalla de producto repite sin parar —una columna con espacio regular y una fila que envuelve—.

| Clase | Fichero | Para |
| ----- | ------- | ---- |
| `layout-grid` | `grids/_grid.scss` | La página o una sección: 12 columnas con los gutters del tema |
| `layout-stack` | `_stack.scss` | Bloques uno debajo de otro con el mismo espacio (`--xs` … `--xl`) |
| `layout-cluster` | `_cluster.scss` | Elementos en fila que bajan de línea si no caben (`--xs` … `--lg`, `--between`, `--end`) |

**Layer**: `@layer syx.base` — cualquier utilidad `.syx-*` las sobrescribe sin `!important`.
**Se incluyen** desde `themes/_shared/_core.scss`, así que están en todos los bundles.
El armazón de una aplicación (cabecera, barra lateral y contenido) es un componente con color propio: `org-app-shell`, en `organisms/`.

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

## Stack y cluster

```html
<!-- Una pantalla de ajustes: secciones apiladas, acciones que envuelven -->
<div class="layout-stack layout-stack--lg">
  <section>…</section>
  <section>…</section>
  <div class="layout-cluster layout-cluster--end">
    <button class="atom-btn atom-btn--secondary" type="button">Cancel</button>
    <button class="atom-btn atom-btn--primary atom-btn--filled" type="button">Save</button>
  </div>
</div>
```

| Modificador | Stack (`--semantic-space-stack-*`) | Cluster (`--semantic-space-inline-*`) |
| ----------- | ---------------------------------- | ------------------------------------- |
| por defecto | `md` (24 px) | `xs` (8 px) |
| `--xs` … `--lg` | 8 · 16 · 24 · 32 px | 8 · 16 · 24 · 32 px |
| `--xl` | 48 px | — |
| `--between` | — | reparte a los extremos |
| `--end` | — | alinea al final de la línea (lógico: en RTL es la izquierda) |

No duplican las utilidades: `layout-stack` es `syx-d-flex syx-flex-col` con la escala de pila por defecto, y `layout-cluster` es `syx-d-flex syx-flex-wrap syx-items-center` con la escala en línea. Usa la primitiva cuando el patrón sea ese (se lee mejor y el espaciado sale de la escala correcta) y las utilidades para un ajuste puntual. Usan `gap`, nunca márgenes: un hijo con `hidden` no deja hueco.

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

1. Crear `grids/_mi-layout.scss` (una rejilla) o `_mi-primitiva.scss` (una primitiva)
2. Añadir su `@forward` en `layout/index.scss`
3. Incluir su mixin en `themes/_shared/_core.scss`
4. Documentar en este README
