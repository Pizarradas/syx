# Magnetic button

## Intención
Que el botón principal "se atraiga" al cursor cuando el ratón está cerca — comunica que es la acción más importante de la sección y aporta sensación de interactividad refinada.

## Definición
Un elemento (típicamente un CTA) y su contenido interno (`<span>`) responden al `mousemove` del propio elemento desplazándose proporcionalmente al delta entre el cursor y el centro del botón. El span interno se mueve **más** que el wrapper, generando una micro-disociación que se siente "elástica".

## Sinónimos útiles
Magnetic CTA, cursor attraction, sticky button, hover follow, magnetic effect.

## Se suele confundir con
- **Cursor follower**: el cursor follower es el propio cursor que se mueve. El magnetic es el botón que se mueve hacia el cursor.
- **Hover translate**: el hover translate aplica un único `transform: translate` fijo en `:hover`; el magnetic es continuo y elástico.

## Control GSAP
```js
const xTo = gsap.quickTo(el, "x", { duration: 0.6, ease: "elastic.out(1, 0.4)" });
const yTo = gsap.quickTo(el, "y", { duration: 0.6, ease: "elastic.out(1, 0.4)" });
const xToInner = gsap.quickTo(inner, "x", { duration: 0.6, ease: "elastic.out(1, 0.4)" });
const yToInner = gsap.quickTo(inner, "y", { duration: 0.6, ease: "elastic.out(1, 0.4)" });

el.addEventListener("mousemove", (e) => {
  const rect = el.getBoundingClientRect();
  const dx = e.clientX - (rect.left + rect.width / 2);
  const dy = e.clientY - (rect.top + rect.height / 2);
  xTo(dx * 0.25);     // wrapper se mueve 25 %
  yTo(dy * 0.45);
  xToInner(dx * 0.4); // span interno se mueve 40 % — la disociación
  yToInner(dy * 0.6);
});

el.addEventListener("mouseleave", () => {
  xTo(0); yTo(0); xToInner(0); yToInner(0);
});
```

## Parámetros sensibles
| Parámetro | Rango |
|---|---|
| Coeficiente wrapper | 0.2 — 0.3 |
| Coeficiente inner | 0.4 — 0.6 (siempre > wrapper) |
| `duration` | 0.5 — 0.7 s |
| `ease` | `elastic.out(1, 0.4)` (clásico), `power3` (más sobrio) |
| Diferencia X / Y | `dy * 0.45` > `dx * 0.25` da más juego vertical (sensación de "saltito") |

## Casos de uso
- CTA principal del masthead (cabecera fija)
- Botón "Suscribirse" en hero
- Acción protagonista en una landing
- **No** para listas de botones secundarios — pierde el efecto

## Prompt IA
> "Magnetic CTA en el botón `#subscribe`: usar `gsap.quickTo` para `x` e `y` del elemento y de su `<span>` interno con elastic.out(1, 0.4) duración 0.6. En mousemove calcular delta con el centro del botón; coeficientes 0.25/0.45 para wrapper y 0.4/0.6 para span. En mouseleave volver a 0. Sólo en `(hover: hover)` y sin reduced-motion."

## Fallback reduced-motion / touch
```js
if (reduced || !window.matchMedia("(hover: hover)").matches) return;
```

## Anti-patrón
Aplicar magnetic a varios botones cercanos: el cursor "rebota" entre ellos y se siente caótico. **Un magnetic por viewport, máximo dos en toda la página**.
