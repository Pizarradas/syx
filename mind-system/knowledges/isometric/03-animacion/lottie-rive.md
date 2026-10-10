# Isométrico · Lottie y Rive

## meta

| Campo | Valor |
|-------|-------|
| **Dominio** | isometric — movimiento · entrega a apps y estados |
| **Fuente** | Airbnb Lottie (flujo de After Effects y funciones soportadas), Rive (state machines en la web) |
| **Objetivo** | Llevar una escena isométrica a un JSON de Lottie o a un `.riv` sin perder la proyección ni la luz |
| **Agent tags** | `#isometric` `#lottie` `#after-effects` `#rive` `#state-machine` |

Se abre cuando `animacion.md` elige Lottie o Rive. El flujo general de cada herramienta está en `motion/08-ejecucion/cavalry-ae/lottie.md` y `motion/08-ejecucion/rive/rive.md`; aquí, lo que cambia por ser isométrico.

---

## concepts

Ni Lottie ni Rive saben de proyecciones. La isometría llega ya dibujada en 2D, con una pieza por objeto y una cara por tono, y se anima con los vectores de eje proyectados. Lo que esos formatos no exportan (fusiones, filtros, capas 3D) coincide con lo que el flat isométrico ya prohíbe.

---

## rules

### 1. Lottie (After Effects y Bodymovin)

1. Agrupa bien la ilustración: un grupo por objeto y caras separadas.
2. Exporta a SVG, ábrelo en Illustrator y guárdalo como .ai: da una conversión más limpia que PDF o EPS.
3. Importa el .ai en After Effects, *Layer › Create shapes from vector layer*, y borra el original.
4. Anima y exporta con Bodymovin a 1x.
5. Valida arrastrando el JSON a LottieFiles.

No exporta, o lo hace mal: expresiones, efectos, modos de fusión, mates de luminancia, estilos de capa (sombra paralela, trazo) y, en parte, capas 3D. En isométrico:

- Las sombras son formas planas con opacidad, nunca el estilo *drop shadow*.
- El sombreado de caras va en colores planos por cara, sin modos de fusión.
- **Nada de capas 3D de After Effects con cámara para fingir la isometría.** Se anima en 2D con los vectores de eje proyectados.

Peso: parenting para movimientos compartidos, pocos keyframes de trazado y sin vértices sobrantes, sin wiggle ni autotrace (un keyframe por fotograma), nulls visibles con opacidad 0 % (si no, no se exportan), mates pequeños.

Blender no exporta Lottie: se exporta el SVG por piezas (`../04-blender/blender.md`) y se reconstruye en After Effects, o se anima en código.

### 2. Rive (interacción por estados)

- Para escenas que reaccionan a hover, clic o datos (encender y apagar servidores en un diagrama).
- Una state machine por artboard, con estados como `idle`, `hover`, `active`, controlada por data binding o inputs. Las state machines se asientan cuando no hay cambios y dejan de calcular.

```js
const r = new rive.Rive({
  src: "/escena-iso.riv",
  canvas: document.getElementById("iso"),
  autoplay: !matchMedia("(prefers-reduced-motion: reduce)").matches,
  stateMachine: "Main",
  onLoad: () => r.resizeDrawingSurfaceToCanvas(),
});
```

Con movimiento reducido, sin reproducción automática y con el estado final a la vista.

### 3. Cuándo cada uno

| Situación | Destino |
|---|---|
| Ya hay SVG y es para web | GSAP (`recetas.md`) |
| Entrega a apps nativas o a un equipo de After Effects | Lottie |
| Interactiva con estados | Rive |
| Bucle de fondo sencillo | CSS (`recetas.md` §7) |

---

## checklist

- [ ] Un grupo por objeto y una cara por tono antes de exportar
- [ ] Sombras como formas planas; sin fusiones, filtros ni capas 3D
- [ ] JSON validado en LottieFiles
- [ ] Rive: state machine con estados nombrados; sin autoplay con movimiento reducido
