## Idea

El informe se cuenta en cinco escenas; cada cifra aparece cuando el texto la nombra. El scroll marca el ritmo, no lo impone.

## Construcción

Fichero autónomo para que una persona lo coloque. Patrones de `motion/08-ejecucion/gsap/03-patrones/` y la separación de `gsap.matchMedia()`:

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
