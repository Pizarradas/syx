# HTML Semantics — Elementos semánticos y jerarquía

## meta

| Campo | Valor |
|-------|-------|
| **Dominio** | Front-end — HTML semántico y jerarquía de documento |
| **Fuente** | W3C HTML Living Standard; MDN Web Docs; ARIA APG |
| **Objetivo** | Fundamentar las reglas de HTML semántico en el modo UX y los checks de AUDIT de SYX |
| **Agent tags** | `#html` `#semantics` `#headings` `#landmarks` `#accessibility` |

---

## concepts

El HTML semántico no es solo una buena práctica — es la base de la accesibilidad. Los elementos semánticos comunican el propósito del contenido a lectores de pantalla, bots de búsqueda, y al propio navegador. Un `<button>` es focusable y activable por teclado por defecto. Un `<div>` no.

---

## rules

### 1. Elementos interactivos — usar el elemento nativo

| Propósito | Elemento correcto | Incorrecto |
|-----------|-------------------|------------|
| Acción que no navega | `<button type="button">` | `<div onclick>`, `<span onclick>` |
| Navegar a una URL | `<a href="…">` | `<button onclick="navigate()">` |
| Enviar un formulario | `<button type="submit">` | `<div onclick="form.submit()">` |
| Input de texto | `<input type="text">` | `<div contenteditable>` para campos de formulario |

**Por qué:** los elementos nativos tienen comportamiento de teclado, roles ARIA, y estados de accesibilidad incorporados. Replicarlos con `<div>` requiere añadir manualmente `role`, `tabindex`, y todos los event handlers de teclado.

---

### 2. Jerarquía de headings — sin saltarse niveles

La jerarquía de headings es el esquema del documento. Los lectores de pantalla la usan para navegar.

```html
<!-- ✓ Correcto — jerarquía secuencial -->
<h1>Título principal de la página</h1>
  <h2>Sección principal</h2>
    <h3>Subsección</h3>
  <h2>Otra sección principal</h2>

<!-- ✗ Incorrecto — salto de nivel -->
<h1>Título principal</h1>
  <h3>Subsección directa bajo h1</h3>  <!-- falta h2 -->
```

**Un solo `<h1>` por página:** el h1 identifica el título principal del documento. Múltiples h1 en la misma página confunden a lectores de pantalla y degradan SEO.

**La jerarquía visual es independiente:** un `<h3>` puede tener font-size grande si el diseño lo requiere. La jerarquía del documento no tiene que coincidir con la jerarquía visual. (Ver `ui/refactoring-ui.md` §8.)

---

### 3. Landmark elements — estructura de página

Los landmarks HTML5 permiten a los lectores de pantalla saltar directamente a secciones:

| Elemento | Rol | Cuándo usar |
|----------|-----|-------------|
| `<header>` | `banner` | Cabecera del sitio (una vez por página) |
| `<nav>` | `navigation` | Cada grupo de navegación |
| `<main>` | `main` | Contenido principal (una vez por página) |
| `<aside>` | `complementary` | Contenido complementario (sidebar, publicidad) |
| `<footer>` | `contentinfo` | Pie del sitio (una vez por página) |
| `<section>` | `region` (si tiene aria-label) | Sección con nombre propio |
| `<article>` | `article` | Contenido auto-contenido (noticia, post) |

**Regla:** múltiples elementos del mismo tipo necesitan `aria-label` para distinguirse:
```html
<nav aria-label="Principal">…</nav>
<nav aria-label="Pie de página">…</nav>
```

---

### 4. Formularios — asociación correcta

```html
<!-- ✓ Correcto: label asociado con for/id -->
<label for="email">Email</label>
<input type="email" id="email" name="email" autocomplete="email" />

<!-- ✗ Incorrecto: label sin asociar -->
<label>Email</label>
<input type="email" name="email" />
```

**Elementos obligatorios en campos de formulario:**
- `<label>` con `for` apuntando al `id` del input
- `id` único en la página
- `name` para envío del formulario
- `type` apropiado para el dato
- `autocomplete` en datos personales

---

### 5. Imágenes — alt text

```html
<!-- Imagen con contenido — alt descriptivo -->
<img src="portada.jpg" alt="Portada del número de marzo 2024">

<!-- Imagen decorativa — alt vacío -->
<img src="decoracion.svg" alt="" aria-hidden="true">

<!-- Figura con caption -->
<figure>
  <img src="grafico.png" alt="Gráfico de barras mostrando las ventas por trimestre">
  <figcaption>Ventas trimestrales 2023–2024</figcaption>
</figure>
```

**Regla:** si la imagen tiene información que no está en el texto circundante, el alt la describe. Si la imagen es decorativa, `alt=""` y `aria-hidden="true"`.

---

## checklist

- [ ] ¿Todos los elementos interactivos son `<button>` o `<a>` (no divs/spans)?
- [ ] ¿Los `<button>` tienen `type` declarado (button, submit, reset)?
- [ ] ¿La jerarquía de headings es secuencial (h1→h2→h3, sin saltos)?
- [ ] ¿Solo hay un `<h1>` por página?
- [ ] ¿Los landmarks principales están presentes (header, nav, main, footer)?
- [ ] ¿Los landmarks múltiples del mismo tipo tienen `aria-label`?
- [ ] ¿Todos los inputs tienen `<label>` asociado con for/id?
- [ ] ¿Las imágenes con contenido tienen alt descriptivo?
- [ ] ¿Las imágenes decorativas tienen `alt=""`?
