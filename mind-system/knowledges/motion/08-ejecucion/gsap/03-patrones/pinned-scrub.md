# Pinned scrub

## Intención
Convertir un scroll vertical en el motor narrativo de una secuencia — el usuario controla el avance de la animación con la rueda del ratón. Ideal para datos, infografías o capítulos que requieren atención sostenida.

## Definición
Una sección se fija (`pin: true`) durante una distancia de scroll declarada (`end: "+=2400"`), y a lo largo de esa distancia su `progress` (0 → 1) se entrega como `onUpdate(self => …)` que controla la animación. El usuario percibe que la página "se detiene" mientras la animación interna avanza.

## Sinónimos útiles
Scroll-coupled animation, scroll-driven sequence, scrub progress, scrollytelling, pinned section.

## Se suele confundir con
- **Parallax**: el parallax mueve una capa de fondo, no fija nada. El pinned-scrub detiene la sección entera.
- **Snap scrolling**: el snap salta entre puntos discretos; el scrub es continuo.

## Control GSAP
```js
ScrollTrigger.create({
  trigger: pinSection,
  start: "top top",
  end: "+=2400",         // 2400px de "scroll bandwidth"
  pin: true,
  scrub: 0.4,            // suaviza el binding scroll → animación
  anticipatePin: 1,      // evita salto al entrar en el pin
  invalidateOnRefresh: true,
  onUpdate: (self) => applyProgress(self.progress)
});
```

`applyProgress(p)` con `p ∈ [0, 1]` puede:
- Mover una capa horizontal (`x: -trackWidth * p`)
- Animar un path SVG (`stroke-dashoffset: 1 - p`)
- Interpolar entre milestones de datos (year + AUM en chart)
- Avanzar capítulos discretos (snap interno con `Math.floor(p * N)`)

## Parámetros sensibles
| Parámetro | Rango / nota |
|---|---|
| `end: "+=Npx"` | 1500 (corto) — 3000+ (largo). Más alto → más tiempo en la sección. Calibrar con la cantidad de información que se muestra. |
| `scrub` | `0.3 — 0.6` para suavidad orgánica. `true` se siente rígido. |
| `anticipatePin` | Siempre `1` |
| `invalidateOnRefresh` | Siempre `true` si el contenido depende de tamaños calculados |
| Mobile | Generalmente desactivar pin en mobile (`window.matchMedia("(min-width: 1024px)")`) — los teléfonos tienen scroll inertia que rompe la sensación |

## Casos de uso
- Scrub chart de evolución de un dato (BlackRock AUM 1999-2025)
- Timeline horizontal pinneada (Dimon 1982-2026)
- Caso de estudio paso a paso
- Infografía interactiva en long-form

## Prompt IA
> "Pinned scrub sobre la sección, pin true, end +=2400px, scrub 0.4, anticipatePin 1. En onUpdate(self.progress) interpolar entre milestones [{p:0, value:165}, {p:1, value:11500}] y aplicar al `stroke-dashoffset` del path principal y al texto del readout. Mobile y reduced-motion saltan al estado p=1."

## Fallback reduced-motion / mobile
```js
if (reduced || !desktopMQ.matches) {
  applyProgress(1);  // mostrar el estado final completo
  return;
}
```

El usuario ve la información sin tener que scrollear — útil además para usuarios que prefieren no jugar.
