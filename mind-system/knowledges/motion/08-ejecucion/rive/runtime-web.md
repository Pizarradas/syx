# Rive: runtime web y React

## meta

| Campo | Valor |
|-------|-------|
| **Dominio** | motion — ejecución · Rive |
| **Fuente** | Documentación del runtime web de Rive |
| **Objetivo** | Integrar un .riv en web con data binding, accesibilidad y carga del peor escenario |
| **Agent tags** | `#motion` `#rive` `#runtime` `#react` |

---

## concepts

---

## rules

### Paquetes

| Paquete | Uso |
|---|---|
| `@rive-app/webgl2` | Recomendado por la documentación actual. Mejor rendimiento y efectos |
| `@rive-app/canvas` | Canvas 2D; más compatible |
| `@rive-app/canvas-lite` | Más ligero; menos funciones |
| `@rive-app/react-webgl2` / `@rive-app/react-canvas` | Hooks de React |

### JS

```js
import { Rive, Layout, Fit, Alignment, EventType } from "@rive-app/webgl2";

const r = new Rive({
  src: "/hero.riv",
  canvas: document.querySelector("canvas"),
  artboard: "Hero",
  stateMachines: "SM",            // string o array (la documentación también usa el singular stateMachine)
  autoplay: true,
  autoBind: true,                 // enlaza la instancia por defecto del VM del artboard
  layout: new Layout({ fit: Fit.Contain, alignment: Alignment.Center }),   // Fit.Layout para layouts responsivos
  onLoad: () => r.resizeDrawingSurfaceToCanvas(),
});

// Data binding
const vmi = r.viewModelInstance;
vmi.number("progress").value = 0.5;
vmi.boolean("reducedMotion").value = matchMedia("(prefers-reduced-motion: reduce)").matches;
vmi.trigger("onSuccess").trigger();
vmi.enum("status").value = "loading";
vmi.boolean("isHover").on(e => console.log(e.data));     // escuchar cambios; .off() para quitar
vmi.number("Card/Header/progress");                        // rutas anidadas

// Binding manual de otra instancia
const vm = r.viewModelByName("Card");
r.bindViewModelInstance(vm.instanceByName("Dark") ?? vm.defaultInstance());

// Eventos de Rive → producto
r.on(EventType.RiveEvent, (e) => { if (e.data.name === "playSound") play(); });

// Resize y limpieza
window.addEventListener("resize", () => r.resizeDrawingSurfaceToCanvas());
// al desmontar: r.cleanup();
```

Legacy (inputs, obsoletos): `r.stateMachineInputs("SM").find(i => i.name === "isHover").value = true`.

### React

```jsx
import { useEffect } from "react";
import { useRive, useViewModel, useViewModelInstance,
         useViewModelInstanceNumber, useViewModelInstanceBoolean, useViewModelInstanceTrigger } from "@rive-app/react-webgl2";

export function Hero({ progress }) {
  const { rive, RiveComponent } = useRive({ src: "/hero.riv", stateMachines: "SM", autoplay: true, autoBind: true });
  const vm = useViewModel(rive);
  const vmi = useViewModelInstance(vm, { rive });
  const { setValue: setProgress } = useViewModelInstanceNumber("progress", vmi);
  const { setValue: setReduced } = useViewModelInstanceBoolean("reducedMotion", vmi);
  const reduce = usePrefersReducedMotion();   // hook propio con matchMedia + listener 'change' (o useReducedMotion de motion/react)
  useEffect(() => { setProgress(progress); }, [progress]);
  useEffect(() => { setReduced(reduce); }, [reduce]);
  return <RiveComponent role="img" aria-label="Ilustración: progreso del ahorro" />;
}
```

### Rendimiento y carga (peor escenario)

- **Carga diferida** del runtime y del .riv (IntersectionObserver). Muestra un póster (PNG o SVG del primer frame) hasta `onLoad`.
- **Pausa fuera de pantalla:** `r.pause()` / `r.play()` según la visibilidad (ahorra batería y cumple la pausa).
- **Un canvas por instancia**. Muchas instancias pequeñas son caras: considera un artboard con varias zonas.
- **Resolución:** `resizeDrawingSurfaceToCanvas()` respeta el devicePixelRatio; en dispositivos modestos puede convenir limitarlo.
- **Assets:** fuentes e imágenes pueden ir embebidas, referenciadas o en CDN. Las embebidas aumentan el peso.

⚠️ Las APIs de data binding han evolucionado mucho en 2025–2026. Comprueba los nombres exactos en rive.app/docs/runtimes/web/data-binding para la versión instalada.

---

## checklist

- [ ] Carga diferida y póster estático
- [ ] `cleanup()` al desmontar
- [ ] Canvas con `role="img"` + `aria-label`, o `aria-hidden` y controles HTML
- [ ] `reducedMotion` enlazado a la media query
