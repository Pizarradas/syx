# Cursor follower

## Intención
Sustituir el cursor del sistema por un elemento personalizado que sigue al ratón y reacciona a las zonas interactivas — refuerza la identidad de marca premium y aporta nivel adicional de microinteracción.

## Definición
Un `<div class="cursor">` fijo en pantalla con `pointer-events: none` y `z-index: 9999`. Su `x`/`y` se sincronizan con el `mousemove` global usando `gsap.quickTo` (suaviza el seguimiento). Sobre `a, button, [data-cursor-hover]` el cursor cambia de tamaño/forma/etiqueta. Variantes documentadas: brass dot (ATELIER) y carmine reticle/crosshair (OBSIDIANA).

## Sinónimos útiles
Custom cursor, pointer follower, cursor reticle, magic cursor, cursor blob.

## Se suele confundir con
- **Magnetic button**: el magnetic mueve el botón hacia el cursor; el cursor follower es el cursor mismo.
- **Cursor JS lib (Magic Cursor, Mouse Follower)**: este es manual y ligero, sin dependencias.

## Control GSAP
```js
const cursor = document.getElementById("cursor");
document.body.classList.add("has-cursor");  // CSS oculta cursor sistema con cursor: none

const xTo = gsap.quickTo(cursor, "x", { duration: 0.5, ease: "power3" });
const yTo = gsap.quickTo(cursor, "y", { duration: 0.5, ease: "power3" });

window.addEventListener("mousemove", (e) => {
  cursor.classList.add("is-active");
  xTo(e.clientX);
  yTo(e.clientY);
}, { passive: true });

const label = cursor.querySelector(".cursor__label");
document.querySelectorAll("a, button, [data-cursor-hover]").forEach((el) => {
  el.addEventListener("mouseenter", () => {
    cursor.classList.add("is-hover");
    label.textContent = el.dataset.cursorHover || "ver";
  });
  el.addEventListener("mouseleave", () => cursor.classList.remove("is-hover"));
});
```

CSS clave:
```css
body.has-cursor { cursor: none; }
body.has-cursor a, body.has-cursor button { cursor: none; }
.cursor { position: fixed; pointer-events: none; mix-blend-mode: difference; }
.cursor.is-hover { width: 72px; height: 72px; }
```

## Parámetros sensibles
| Parámetro | Nota |
|---|---|
| `quickTo duration` | 0.3 — 0.6 s. Más bajo se siente exacto, más alto se siente sedoso |
| `ease` | `power3` o `power4` — sin elastic (incomodaría) |
| Tamaño base | 8 — 12 px |
| Tamaño hover | 60 — 80 px |
| `mix-blend-mode: difference` | Útil para ATELIER (cursor cambia de color sobre dark/light) |
| `[data-cursor-hover="texto"]` | Atributo declarativo: el HTML decide la etiqueta del cursor sobre cada elemento |

## Casos de uso
- Página de marca con identidad fuerte
- Long-form premium donde el cursor refuerza el registro
- Galerías de imagen donde el cursor anuncia "ver más"
- **Nunca** en flujos donde el cursor del sistema tiene significado (formularios largos, dashboards densos)

## Prompt IA
> "Cursor follower brass de 10px que sigue al ratón con `gsap.quickTo` (power3, 0.5s). Al pasar sobre `a, button, [data-cursor-hover]` escala a 72px y muestra etiqueta del atributo. Aplicar `mix-blend-mode: difference` para autoinvertir sobre fondos claros/oscuros. Activar sólo en `(hover: hover)` y sin reduced-motion. Body: `cursor: none`."

## Fallback hover/touch/reduced-motion
```js
const fineHover = window.matchMedia("(hover: hover)").matches;
if (!cursor || !fineHover || reduced) return;
```

CSS también esconde el cursor follower en touch:
```css
@media (hover: none), (prefers-reduced-motion: reduce) {
  .cursor { display: none; }
}
```

## Anti-patrón
- **No usar lag exagerado** (>800ms): el usuario percibe que no responde y se frustra.
- **No reemplazar el cursor del sistema sin restaurarlo**: en formularios o links externos hay que mostrar el cursor real, idealmente vía clase `is-text` con `cursor: text` o liberando `cursor: none`.
