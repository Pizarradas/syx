## Concept

El informe se cuenta en cinco escenas; cada cifra aparece cuando el texto la nombra. El scroll marca el ritmo, no lo impone.

## Build

Fichero autónomo para que una persona lo coloque. Estrato del córtex: `motion/08-ejecucion/gsap` (ejecución con GSAP); de ahí, los patrones de `03-patrones/` y la separación de `gsap.matchMedia()`:

```js
const mm = gsap.matchMedia();
mm.add('(prefers-reduced-motion: no-preference)', () => {
  gsap.utils.toArray('.escena').forEach((el) => {
    gsap.from(el.querySelectorAll('.cifra'), {
      y: 24, opacity: 0, stagger: 0.12,
      scrollTrigger: { trigger: el, start: 'top 70%' },
    });
  });
});
mm.add('(prefers-reduced-motion: reduce)', () => { /* reducido: sin animación, todo visible */ });
```

El HTML trae todo el contenido; sin JavaScript se lee entero.

## Technique Log

- `gsap.matchMedia()`: la versión con movimiento y la reducida se montan y desmontan solas al cambiar la preferencia.
- `gsap.from`: el estado final es el del HTML, así que sin JavaScript no queda nada oculto.

## Why

- Dirección de arte editorial y pausada: una cifra protagonista por escena, el resto quieto — un informe anual se lee para entender, no para impresionar — una campaña de captación aceptaría más simultaneidad.
- `from` y no `to` — el contenido existe sin la animación — si las cifras se cargaran por API, haría falta un estado de carga propio.
