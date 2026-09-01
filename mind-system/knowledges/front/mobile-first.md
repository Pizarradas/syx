# Mobile-First — Referencia transversal

## meta

| Campo | Valor |
|-------|-------|
| **Dominio** | Front-end — estrategia de diseño y implementación |
| **Fuente** | Luke Wroblewski — *Mobile First* (2011); Brad Frost — *Atomic Design* (2016); Aaron Gustafson — *Adaptive Web Design* (2011) |
| **Objetivo** | Fundamentar las reglas de breakpoints, DOM order y progressive enhancement en todos los modos SYX |
| **Agent tags** | `#mobile-first` `#breakpoints` `#responsive` `#dom-order` `#clamp` |

---

## concepts

**Mobile-first** es una estrategia de diseño: la experiencia en el escenario más restrictivo se diseña primero, y la complejidad se añade progresivamente hacia escenarios con más recursos.

**No es lo mismo que responsive design:** responsive design es la técnica CSS (`min-width`, `max-width`, `clamp()`). Mobile-first es la filosofía que decide el orden de aplicación. Un sitio puede ser responsive sin ser mobile-first — si el CSS de base es para desktop y se sobreescribe con `max-width`, es responsive pero mobile-last.

Este documento es la referencia de mobile-first para todos los modos del sistema. Cuando un modo tiene una regla de mobile-first, el fundamento está aquí.

---

## rules

### 1. Worst-case first

Diseñar desde el escenario más restrictivo:

```
Pantalla más pequeña (320px)
+ Conexión más lenta (2G/3G)
+ Atención más fragmentada (uso en movimiento)
+ Input más impreciso (dedos, no ratón)
+ Sin JS garantizado
```

Si el diseño funciona en esas condiciones, escalar hacia condiciones mejores es trivial.

**Por modo:**

| Mode | Aplicación de worst-case first |
|------|-------------------------------|
| SKETCH | Base CSS para 320px; layout de columna única por defecto |
| UX | DOM order = prioridad de contenido; estado no-JS documentado |
| UI | Breakpoints solo con `min-width`; base styles funcionales sin media query |
| TOKEN | Tokens con `clamp()` para tipografía fluida; sin tokens dependientes de viewport |
| AUDIT | Flag en `max-width` queries; flag en contenido sin estado no-JS |

---

### 2. Solo `min-width` breakpoints

```scss
// ✓ Mobile-first: base para móvil, overrides para pantallas mayores
.mol-card-grid {
  display: grid;
  grid-template-columns: 1fr;        // móvil: columna única

  @include breakpoint(sm) {          // 640px+
    grid-template-columns: 1fr 1fr;
  }
  @include breakpoint(lg) {          // 1024px+
    grid-template-columns: repeat(3, 1fr);
  }
}

// ✗ Mobile-last: señal de diseño desde desktop
.mol-card-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);

  @media (max-width: 1024px) { grid-template-columns: 1fr 1fr; }
  @media (max-width: 640px)  { grid-template-columns: 1fr; }
}
```

**Por qué `min-width`:** con `min-width`, cada breakpoint añade reglas al contexto anterior — es aditivo. Con `max-width`, cada breakpoint sobreescribe reglas del contexto mayor — es sustractivo y genera cascadas difíciles de mantener.

---

### 3. Breakpoints del sistema SYX

| Nombre | `min-width` | Uso típico |
|--------|-------------|-----------|
| base | — | 320px — columna única, layout de flujo |
| `sm` | 640px | Dos columnas, CTAs inline |
| `md` | 768px | Sidebar visible, formularios side-by-side |
| `lg` | 1024px | Tres columnas, layout editorial completo |
| `xl` | 1200px | Max-width del contenedor, ajustes de espaciado |

**Documentar siempre** el comportamiento de cada breakpoint en el HTML:

```html
<!-- RESPONSIVE:
  - base (320px): columna única, imagen arriba del texto
  - sm (640px+): dos columnas, imagen a la izquierda
  - lg (1024px+): tres columnas con sidebar
-->
```

---

### 4. DOM order = prioridad de contenido

La estructura del HTML refleja la prioridad del contenido para el usuario, no la composición visual en desktop.

**Por qué:** los lectores de pantalla, la navegación por teclado, y el parser del navegador siguen el orden del DOM. Si el contenido principal está en la segunda columna pero es el cuarto elemento del DOM, llega tarde a los usuarios que dependen del orden de lectura.

```html
<!-- ✓ Correcto: contenido principal primero en el DOM -->
<div class="org-grid-editorial">
  <main class="org-grid-editorial__content">   <!-- N1 y N2 aquí -->
    …
  </main>
  <aside class="org-grid-editorial__sidebar">  <!-- datos de mercado, publicidad -->
    …
  </aside>
</div>
<!-- El sidebar aparece a la derecha en desktop con CSS:
     grid-template-columns: 2fr 1fr;
     El orden del DOM no cambia. -->
```

**Reordenado visual:** siempre con CSS (`order`, `grid-template-areas`, `flex-direction: column-reverse`). Nunca duplicando el elemento HTML.

---

### 5. Fluid values con `clamp()`

Para valores que escalan de forma continua entre mobile y desktop:

```css
/* font-size fluido entre 32px (mobile) y 52px (desktop) */
font-size: clamp(2rem, 4vw, 3.25rem);

/* spacing fluido */
padding: clamp(1rem, 3vw, 2.5rem);
```

| Caso | Solución |
|------|---------|
| Tipografía de titulares N1/N2 | `clamp()` — la escala es continua |
| Spacing entre secciones principales | `clamp()` — se beneficia de la fluidez |
| Cambio de layout (1 col → 2 col) | Breakpoint — es un cambio discreto |
| Font-size de cuerpo | Fijo o breakpoints — la legibilidad óptima es estable |

---

### 6. Touch — diseño para dedos

- Mínimo **44×44px** en el área interactiva (WCAG 2.5.5)
- El área táctil puede ser mayor que el elemento visual mediante `padding`
- Separación mínima entre targets adyacentes: **8px**
- Ningún estado solo en hover — equivalente en `focus-visible`

---

### 7. Estado no-JS

Cada componente interactivo tiene un estado funcional sin JavaScript:

```html
<!-- No-JS: el menú es una lista visible y navegable -->
<!-- JS: colapsa el menú en un toggle con aria-expanded -->
<nav class="mol-menu-principal">
  <ul>
    <li><a href="/economia">Economía</a></li>
  </ul>
</nav>
```

**Qué significa funcional:** el usuario puede acceder al contenido y completar las tareas principales. No tiene que ser idéntico — puede ser menos elegante. Pero no puede ser inaccesible.

---

## checklist

```
Layout
□ Base CSS funciona a 320px sin ninguna media query
□ Solo min-width breakpoints — ningún max-width en components
□ DOM order = prioridad de contenido (N1 primero)
□ Reordenado visual con CSS order, nunca con HTML duplicado

Tipografía
□ Titulares N1/N2 usan clamp() para escala fluida
□ Body font-size fijo o con breakpoints (no clamp)
□ line-height unitless (no px)

Interacción
□ Todos los targets interactivos ≥ 44×44px
□ Ningún estado solo en hover — equivalente en focus-visible
□ Estado no-JS documentado en componentes interactivos

Imágenes
□ loading="lazy" (excepto imagen LCP)
□ width y height declarados
□ Contenedor con aspect-ratio definido
□ Componente funcional sin imagen
```
