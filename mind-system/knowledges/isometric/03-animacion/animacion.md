# Isométrico · Animación

## meta

| Campo | Valor |
|-------|-------|
| **Dominio** | isometric — movimiento (módulo de entrada del estrato) |
| **Fuente** | Kit iso-flat; GSAP (SVG, MotionPath, ScrollTrigger, a11y), MDN (`prefers-reduced-motion`), web.dev (animations guide) |
| **Objetivo** | Animar escenas flat isométricas para web y motion —construcción por capas, crecimiento de bloques, movimiento sobre ejes, trazados, scroll, hover— sin romper la proyección ni la luz en ningún fotograma |
| **Agent tags** | `#isometric` `#motion` `#gsap` `#css` `#lottie` `#rive` |

Parte de una escena que cumple `../01-fundamentos/fundamentos.md`, con un `<g id data-iso-part>` por objeto y caras `.face-*`, como la generan `iso.mjs` y los exportadores de Blender.

**Precedencia.** Este estrato solo añade lo que la proyección paralela exige. Por encima tiene `ui/motion-principles.md` (suelo físico) y `motion/07-accesibilidad/accesibilidad.md` (gana siempre). El carácter, el timing y la coreografía se deciden con el dominio `motion/`; la librería, con `motion/08-ejecucion/gsap/`.

---

## concepts

**Animar en el espacio del mundo.** La proyección es paralela, así que el movimiento también. Desplazarse por un eje del mundo es sumar su vector proyectado (isométrica real, 1 unidad = `u` px):

| Eje | Vector en pantalla |
|---|---|
| x | `(+0.866u, +0.5u)` |
| y | `(−0.866u, +0.5u)` |
| z | `(0, −u)` |

En dimétrica 2:1, 0.866 → 1. En CSS puro, `--iso-u/v/w` registradas con `@property` (`../02-svg-web/svg-web.md` §4). Los manifiestos de Blender traen estos vectores calculados en `ejes_px`.

**Tres capas, tres movimientos.** El envoltorio `data-iso-part` se mueve en el mundo, el grupo con la matriz del plano no se toca, y el grupo interior gira o escala *en plano* —y eso se ve como rotación isométrica real—.

---

## rules

### 1. Lo que la proyección prohíbe

- **Nunca animar `transform` sobre un elemento con atributo `transform`**: lo sustituye.
- **La altura no se anima con `scaleY`**: deforma las aristas inclinadas. Se anima un objeto de datos (`{ h }`) y se recalculan los puntos en `onUpdate`, o `translateY` en la cara superior más un `clip-path` en los laterales.
- **Sin perspectiva ni escala** para simular profundidad.
- **Si un objeto cambia quién tapa a quién**, se reordena el DOM en ese instante o se divide el recorrido en tramos. El exportador SVG de Blender anota esos `cruces` en su manifiesto.
- Un objeto que recorre un camino no gira con la curva: mantiene sus caras (`autoRotate: false`).

### 2. Elegir destino

| Destino | Para | Lee |
|---|---|---|
| GSAP sobre SVG o DOM | webs, scroll, interacción, control fino | `recetas.md` · `motion/08-ejecucion/gsap/` |
| CSS keyframes/transitions | hover, bucles simples, sin JS | `recetas.md` §7 · `motion/08-ejecucion/css/css.md` |
| Lottie | apps nativas o equipos de After Effects | `lottie-rive.md` · `motion/08-ejecucion/cavalry-ae/lottie.md` |
| Rive | estados interactivos (hover, clic, datos) | `lottie-rive.md` · `motion/08-ejecucion/rive/rive.md` |
| Blender | curvas reales, mecanismos, coreografías largas | `../04-blender/blender.md`: traslaciones → `@keyframes`, rotaciones → flipbook |

### 3. Flujo

1. **Guion:** por objeto, qué hace, cuándo (s), con qué curva y si es decorativo o funcional. Para algo no trivial, una Motion Spec (`motion/01-direccion/motion-spec.md`).
2. **Versión reducida antes de animar nada:** normalmente solo opacidad o el estado final, sin desplazamientos grandes.
3. **Una timeline por escena,** escalonada por profundidad: de atrás hacia delante, o de abajo arriba.
4. **Revisión:** sin saltos de orden de profundidad, sombras que siguen al objeto, bucles sin corte. Sin navegador, `iso-render.py --fijar '[data-iso-part="x"]=translate(…)'` congela un instante; con navegador, pausar `document.getAnimations()` en varios tiempos y capturar.
5. **Comprobar `prefers-reduced-motion: reduce`.**

Terminada cuando corre fluida, respeta el movimiento reducido y conserva proyección y luz en cada fotograma.

### 4. Tiempos y curvas de partida

| Efecto | Mecanismo | Curva y duración |
|---|---|---|
| Construcción por capas | opacidad y caída en z, escalonada | `back.out(1.4)`, escalonado 0.12 s |
| Torre o pila | capas de abajo arriba | `back.out(1.5)`, escalonado 0.15 s |
| Explosionar o montar | `--gap` compartido o z por capa | `power3.inOut`, 0.7–1 s |
| Elevación en hover | +12 px en z, sombra más amplia | `power2.out`, 0.25 s |
| Deriva de cámara | unos px o grados, en vaivén | `sine.inOut`, 6–12 s |

Son puntos de partida, no reglas. En una pieza con identidad, se traducen a la escala de `motion/06-sistema/escala.md` o al lenguaje de motion de la marca; en `scss/`, a `--semantic-duration-*` y `--semantic-easing-*`.

### 5. Accesibilidad del movimiento

- Lo decorativo desaparece con movimiento reducido; lo funcional (progreso, feedback) se simplifica a opacidad.
- Sin parpadeos con cortes de color duros ni barridos grandes en x/y. Las microinteracciones pequeñas suelen estar bien.
- Más de 5 s o en bucle: botón de pausa.
- Detalle y umbrales: `motion/07-accesibilidad/accesibilidad.md`.

---

## checklist

- [ ] Movimiento por vectores de eje del mundo; nada de perspectiva, `scaleY` ni escala de profundidad
- [ ] Animación en el envoltorio `data-iso-part` o en el grupo interior, nunca sobre el atributo `transform`
- [ ] Versión reducida definida antes de la completa
- [ ] Orden de profundidad estable o reordenado en los cruces
- [ ] Un instante intermedio revisado (`--fijar` o animaciones pausadas)
- [ ] Bucles largos con pausa; sin destellos
