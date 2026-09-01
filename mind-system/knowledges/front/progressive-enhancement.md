# Progressive Enhancement — Tres capas independientes

## meta

| Campo | Valor |
|-------|-------|
| **Dominio** | Front-end — estrategia de construcción por capas |
| **Fuente** | Aaron Gustafson — *Adaptive Web Design: Crafting Rich Experiences with Progressive Enhancement* (2011); W3C — Understanding Progressive Enhancement |
| **Objetivo** | Fundamentar las reglas de capas HTML/CSS/JS en los modos UX, UI y AUDIT de SYX |
| **Agent tags** | `#progressive-enhancement` `#html` `#css` `#javascript` `#accessibility` |

---

## concepts

Progressive enhancement es la estrategia de construir primero lo esencial y ampliar con complejidad progresiva. No es una preferencia técnica — es una forma de garantizar que el contenido sea accesible en el mayor rango posible de contextos (sin CSS, sin JS, conexión lenta, tecnología asistiva, bots).

**El problema que resuelve:**

El diseño que empieza por desktop y "adapta" hacia abajo produce:
1. Contenido que requiere CSS para ser accesible
2. Funcionalidad que requiere JS para existir
3. Experiencias que fallan completamente cuando una capa no carga

Progressive enhancement invierte el orden: primero lo esencial (accesible), después la complejidad (mejorada).

---

## rules

### Las tres capas

```
┌─────────────────────────────────────────────────────┐
│  Capa 3 — Comportamiento (JavaScript)               │
│  Interactividad dinámica, estados, animaciones JS   │
├─────────────────────────────────────────────────────┤
│  Capa 2 — Presentación (CSS)                        │
│  Layout, color, tipografía, espaciado               │
├─────────────────────────────────────────────────────┤
│  Capa 1 — Contenido (HTML)                          │
│  Texto legible, navegable, con jerarquía semántica  │
└─────────────────────────────────────────────────────┘
```

Cada capa es independiente. Quitarla no debe romper el acceso al contenido de la capa inferior.

---

### Capa 1 — HTML (contenido)

El contenido es accesible sin CSS ni JS:
- Los headings comunican jerarquía
- Los botones son `<button>`, los enlaces son `<a>`
- Las listas son `<ul>` / `<ol>` / `<dl>`
- Un lector de pantalla, un bot de búsqueda, o un navegador que bloquea CSS/JS accede a todo el contenido

**Violaciones frecuentes:**
```html
<!-- ✗ Contenido en CSS — no existe sin CSS -->
<div class="hero" data-text="Título del artículo"></div>
<!-- El texto viene de content: attr(data-text) en CSS -->

<!-- ✗ Contenido en JS — no existe sin JS -->
<div id="headline"></div>
<!-- JS hace document.getElementById("headline").textContent = "Título" -->

<!-- ✓ Correcto — contenido en HTML -->
<h1 class="org-hero__headline">Título del artículo</h1>
```

**DOM order = prioridad de lectura:** el N1 editorial debe estar primero en el DOM, independientemente de su posición visual. (Ver `mobile-first.md` §4.)

---

### Capa 2 — CSS (presentación)

La presentación mejora la capa HTML. Restricciones:

1. **No esconder contenido que era accesible en Capa 1.** `display: none` o `visibility: hidden` ocultan contenido a lectores de pantalla. Solo usar cuando el contenido realmente no debe estar disponible (no como técnica de layout).

2. **No usar `::before`/`::after` para contenido con significado.** Los pseudo-elementos no son accesibles a lectores de pantalla.
   ```scss
   // ✗ Contenido con significado en CSS
   .atom-required-field::after { content: " (requerido)"; }
   
   // ✓ Contenido en HTML
   <span class="atom-required-indicator" aria-hidden="true">*</span>
   <span class="sr-only">requerido</span>
   ```

3. **No depender de CSS para que JS funcione.** Si JS aplica una clase para mostrar un elemento, ese elemento debe tener un estado funcional sin esa clase.

---

### Capa 3 — JavaScript (comportamiento)

La interactividad es una mejora de la experiencia, no su fundamento. Cada componente interactivo tiene un estado no-JS documentado:

```html
<!-- No-JS: acordeón visible, todos los paneles expandidos -->
<!-- JS: colapsa paneles, añade toggle con aria-expanded -->
<div class="mol-accordion">
  <div class="mol-accordion__item">
    <button class="mol-accordion__trigger" aria-expanded="true">
      ¿Cómo me suscribo?
    </button>
    <div class="mol-accordion__panel">
      Puedes suscribirte desde tu perfil…
    </div>
  </div>
</div>
```

**Estado no-JS funcional:** todos los paneles visibles, el usuario puede leer todo el contenido. JS colapsa los paneles para mejorar la experiencia — no para hacerla posible.

**Regla crítica:** ningún flujo esencial puede ser inaccesible sin JavaScript.

---

### Progressive enhancement en CSS (para el modo UI)

Las capas también aplican dentro del CSS del componente:

```scss
// Capa 1 — Base (no queries, no feature detection)
// Funcional en cualquier viewport, cualquier dispositivo

// Capa 2 — Layout (min-width únicamente)
@include breakpoint(sm) { … }

// Capa 3 — Enhancement (@supports)
@supports (backdrop-filter: blur(8px)) {
  .mol-header { backdrop-filter: blur(8px); }
}

// Capa 4 — Motion (prefers-*)
@include reduced-motion { animation: none; }
```

---

## checklist

**HTML (Capa 1):**
- [ ] ¿El contenido es legible sin CSS ni JS?
- [ ] ¿El DOM order refleja la prioridad de lectura?
- [ ] ¿Los elementos semánticos son los correctos (button, a, h1-h6, ul/ol)?
- [ ] ¿No hay contenido crítico en `::before`/`::after`?
- [ ] ¿No hay contenido dependiente de JS para existir?

**CSS (Capa 2):**
- [ ] ¿El CSS no oculta contenido que era accesible en HTML?
- [ ] ¿Solo se usa `display:none` cuando el contenido genuinamente no debe estar disponible?
- [ ] ¿Los breakpoints son solo `min-width`?
- [ ] ¿El `@supports` tiene fallback funcional?

**JavaScript (Capa 3):**
- [ ] ¿Cada componente interactivo tiene estado no-JS documentado?
- [ ] ¿El estado no-JS es funcional (no solo "visible pero roto")?
- [ ] ¿Ningún flujo esencial es inaccesible sin JS?
