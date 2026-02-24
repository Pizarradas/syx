# atoms/

Los átomos son los **componentes de interfaz más pequeños e indivisibles** del sistema. Cada uno es autosuficiente: tiene sus propios tokens de componente, sus variantes BEM y su accesibilidad incorporada. Se montan en `@layer syx.atoms`.

**Prefijo de clases**: `atom-*`
**Layer**: `@layer syx.atoms`
**Las utilidades `.syx-*` siempre sobreescriben a los átomos** (por diseño del stack de layers)

---

## Cuándo usar átomos

- Para construir **cualquier elemento interactivo básico**: botones, campos, checks, links
- Como **bloques de construcción** de moléculas y organismos
- Nunca dividas un átomo — si necesitas dos componentes juntos, ya es una molécula

---

## Catálogo de átomos

### `atom-btn` — Botón

El átomo más usado. Tiene variantes de color, estilo de relleno y tamaño.

```html
<!-- Variante y relleno son independientes -->
<button class="atom-btn atom-btn--primary atom-btn--filled">
  Primary filled
</button>
<button class="atom-btn atom-btn--primary">Primary outline</button>
<button class="atom-btn atom-btn--secondary atom-btn--filled">
  Secondary filled
</button>
<button class="atom-btn atom-btn--secondary">Secondary outline</button>

<!-- Tamaños -->
<button class="atom-btn atom-btn--primary atom-btn--filled atom-btn--size-sm">
  Small
</button>
<button class="atom-btn atom-btn--primary atom-btn--filled">
  Medium (default)
</button>
<button class="atom-btn atom-btn--primary atom-btn--filled atom-btn--size-lg">
  Large
</button>

<!-- Circular (solo icono) -->
<button
  class="atom-btn atom-btn--primary atom-btn--filled atom-btn--circle"
  aria-label="Buscar"
>
  <span class="atom-icon atom-icon--search" aria-hidden="true"></span>
</button>

<!-- Disabled -->
<button class="atom-btn atom-btn--primary atom-btn--filled" disabled>
  Disabled
</button>
```

**Modificadores disponibles:**

- Color: `--primary` · `--secondary`
- Estilo: `--filled` (sólido) · sin modificador (outline)
- Tamaño: `--size-sm` · `--size-lg` (medium es el default)
- Forma: `--circle` (para botones de solo icono)
- Scopes: `--scope-1` · `--scope-2` · `--scope-3` (tamaños alternativos del tema)

---

### `atom-form` — Campo de texto / Select / Textarea

```html
<!-- Input text -->
<input class="syx-form syx-form--text" type="text" placeholder="Escribe..." />

<!-- Select -->
<select class="syx-form syx-form--select">
  <option>Opción 1</option>
</select>

<!-- Textarea -->
<textarea class="syx-form syx-form--textarea"></textarea>

<!-- Status variants -->
<input class="syx-form syx-form--text syx-form--error" type="text" />
<input class="syx-form syx-form--text syx-form--success" type="text" />
```

> Siempre envuelve el campo en `syx-form-field` (mol) para obtener el espaciado y label correctos.

---

### `atom-check` — Checkbox

```html
<label class="atom-check">
  <input type="checkbox" class="atom-check__input" />
  Texto de la opción
</label>

<!-- Checked -->
<label class="atom-check">
  <input type="checkbox" class="atom-check__input" checked />
  Seleccionado
</label>

<!-- Disabled -->
<label class="atom-check atom-check--disabled">
  <input type="checkbox" class="atom-check__input" disabled />
  Deshabilitado
</label>
```

---

### `atom-radio` — Radio button

```html
<label class="atom-radio">
  <input type="radio" class="atom-radio__input" name="grupo" />
  Opción A
</label>
<label class="atom-radio">
  <input type="radio" class="atom-radio__input" name="grupo" checked />
  Opción B
</label>
```

---

### `atom-switch` — Toggle switch

```html
<label class="atom-switch">
  <input type="checkbox" class="atom-switch__input" role="switch" />
  <span class="atom-switch__track" aria-hidden="true"></span>
  Activar notificaciones
</label>
```

---

### `atom-link` — Enlace semántico

```html
<a class="atom-link" href="#">Enlace estándar</a>
<a class="atom-link atom-link--secondary" href="#">Enlace secundario</a>
<a class="atom-link atom-link--subtle" href="#">Enlace sutil</a>
<a class="atom-link atom-link--inverse" href="#">Enlace sobre fondo oscuro</a>
```

---

### `atom-label` — Etiqueta de campo

```html
<label class="atom-label" for="mi-campo">Nombre</label>
<label class="atom-label atom-label--required" for="mi-campo">Email *</label>
```

---

### `atom-pill` — Pill / Badge

```html
<span class="atom-pill">Default</span>
<span class="atom-pill atom-pill--primary">Primary</span>
<span class="atom-pill atom-pill--success">Success</span>
<span class="atom-pill atom-pill--warning">Warning</span>
<span class="atom-pill atom-pill--error">Error</span>
<span class="atom-pill atom-pill--info">Info</span>
```

---

### `atom-icon` — Icono

Base para iconos de la librería interna del sistema (flechas, controles, UI icons). Para iconos de RRSS usa `base/helpers/_icons.scss`.

```html
<span class="atom-icon atom-icon--arrow-default" aria-hidden="true"></span>
<span class="atom-icon atom-icon--close" aria-hidden="true"></span>
<span class="atom-icon atom-icon--search" aria-hidden="true"></span>
```

> Siempre `aria-hidden="true"` en iconos decorativos. Añade `syx-sr-only` si el icono porta significado.

---

### `atom-title` — Heading de contenido

Para headings dentro de componentes (cards, artículos). Para headings de página/layout, usa `syx-type-h*` de utilities.

```html
<h2 class="atom-title atom-title--h2">Título de sección</h2>
<h3 class="atom-title atom-title--h3">Subtítulo</h3>
<h4 class="atom-title atom-title--h4">Título de card</h4>
```

---

### `atom-txt` — Bloque de texto

Texto de párrafo con estilos base del sistema.

```html
<p class="atom-txt">Párrafo estándar con estilos de SYX.</p>
<p class="atom-txt atom-txt--lead">Lead paragraph destacado.</p>
<p class="atom-txt atom-txt--small">Texto pequeño / metadata.</p>
```

---

### `atom-breadcrumb` — Migas de pan

```html
<nav aria-label="Ruta de navegación">
  <ol class="atom-breadcrumb">
    <li class="atom-breadcrumb__item"><a href="/">Inicio</a></li>
    <li class="atom-breadcrumb__item"><a href="/blog">Blog</a></li>
    <li
      class="atom-breadcrumb__item atom-breadcrumb__item--active"
      aria-current="page"
    >
      Artículo
    </li>
  </ol>
</nav>
```

---

### `atom-list` — Lista estilizada

```html
<ul class="atom-list">
  <li class="atom-list__item">Elemento 1</li>
  <li class="atom-list__item">Elemento 2</li>
</ul>
```

---

### `atom-table` — Tabla

```html
<table class="atom-table">
  <thead>
    <tr>
      <th>Columna</th>
      <th>Otra</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Dato</td>
      <td>Dato</td>
    </tr>
  </tbody>
</table>
```

---

### `atom-pagination` — Paginación

```html
<nav class="atom-pagination" aria-label="Paginación">
  <a class="atom-pagination__item" href="#">«</a>
  <a class="atom-pagination__item atom-pagination__item--active" href="#">1</a>
  <a class="atom-pagination__item" href="#">2</a>
  <a class="atom-pagination__item" href="#">»</a>
</nav>
```

---

### Solo docs / showroom (excluidos del bundle core)

| Átomo           | Uso                                                     |
| --------------- | ------------------------------------------------------- |
| `atom-specimen` | Bloques de muestra de color y tipografía en el showroom |
| `atom-swatch`   | Paletas de color interactivas                           |
| `atom-code`     | Bloques de código con resaltado de sintaxis             |

> Estos átomos **no están en `styles-core.css`**. Solo se compilan en los bundles de documentación (`styles-theme-example-*.css`).

---

## Reglas de los átomos

1. **Nunca hardcodear valores** — siempre tokens `--component-*`
2. **Siempre accesibilidad**: `aria-*`, roles, `disabled` nativo
3. **BEM estricto**: `.atom-btn__icon`, `.atom-btn--primary`, nunca `.atom-btn .icon`
4. **No incluir layout propio**: un átomo no se posiciona a sí mismo en la página — eso es responsabilidad de la molécula u organismo que lo contiene
