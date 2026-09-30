# Ejecución · Rive

## meta

| Campo | Valor |
|-------|-------|
| **Dominio** | motion — ejecución · motion interactivo con state machines |
| **Fuente** | Documentación de Rive (editor, state machines, Data Binding, scripting Luau, runtime web, MCP), a septiembre de 2026 |
| **Objetivo** | Traducir una Motion Spec a un .riv y diseñar su state machine e integración en producto |
| **Agent tags** | `#motion` `#rive` `#state-machine` `#data-binding` |

---

## concepts

Rive es **pose to pose + lógica**: los estados clave viven en timelines y la state machine decide cuándo y cómo se pasa entre ellos. Traduce la spec a esa estructura y respeta los tokens y la accesibilidad del sistema.

### 1. Modelo mental

```
Archivo .riv
└─ Artboard (pantalla o componente; un artboard anidado = componente reutilizable)
   ├─ Timelines (animaciones: one-shot, loop, ping-pong) ← las poses y movimientos
   ├─ State Machine
   │   ├─ Layers (grafos en paralelo: p. ej. "cuerpo", "ojos", "UI")
   │   │   ├─ Entry · Any State · Exit
   │   │   ├─ States: timeline único · Blend 1D · Blend Additive · Blend Direct
   │   │   └─ Transitions: condiciones + duración (mix) + exit time + interpolación
   │   ├─ Listeners (pointer sobre shapes → cambiar propiedad o disparar evento)
   │   └─ Events (salen al runtime: sonido, analítica, navegación)
   └─ Data Binding: View Model ⇄ propiedades del artboard / condiciones
```

**Data Binding sustituye a los inputs.** La documentación marca los inputs (boolean, number, trigger) como *DEPRECATED*. En proyectos nuevos, usa **View Models**:

- **View Model:** el esquema (propiedades number, string, boolean, color, enum, trigger, list, image, font, artboard, view model anidado).
- **View Model Instance:** los datos concretos que se enlazan en runtime.
- **Converters:** transforman valores entre la propiedad y su destino (p. ej. de 0–1 a grados).
- Existen **view models globales** para valores compartidos (tema, `reducedMotion`, escala de tiempo).

### Módulos relacionados

- `motion/08-ejecucion/rive/state-machines.md` — patrones de state machine.
- `motion/08-ejecucion/rive/runtime-web.md` — runtime JS y React.

---

## rules

### 2. Traducir la Motion Spec a Rive

| Spec | Rive |
|---|---|
| `states` / estados de la interacción | Un timeline por pose o estado + un estado en la SM |
| `transitions` y su duración (token) | Transición con **duración de mezcla** en ms e interpolación Cubic con los 4 valores del token |
| Curva (token cubic-bezier) | Interpolación **Cubic** en los keys (se teclean o pegan los 4 valores) |
| Spring (token) | **Elastic** (amplitude y period) para rebotes; si hace falta precisión, keys horneadas desde `spring-to-linear.js` (muestreo) o scripting |
| Overshoot o anticipación | Cubic con y > 1 o y < 0, o keys extra |
| Stagger y offset | Desplazar keys en el timeline; o capas o timelines por elemento con retardo; o blend por índice |
| Follow-through | Keys desfasados 2–4 frames en los hijos; constraints con `strength` < 1; bones en cadena |
| Value change / datos | Propiedad number en el VM → Blend 1D o binding directo a la propiedad, con converter |
| Hover, press, focus | Listeners → propiedades booleanas del VM → condiciones |
| Reduced motion | `reducedMotion: boolean` en el VM (global) → condiciones que llevan a estados sin movimiento espacial |
| Pausa > 5 s | Propiedad `paused` / `playing` en el VM; el producto muestra el control |
| Parenting (UX in Motion) | Jerarquía de grupos o bones; constraints de transformación |

**Duración y frames:** el timeline trabaja en fps (60 por defecto en UI); convierte los tokens con `ceil(ms/1000 × fps)`. Las transiciones de la SM se expresan en ms o en % de la animación.

### 3. Diseño de la state machine

Principios:

1. **Una capa por dimensión independiente**: interacción (idle/hover/press), estado de negocio (loading/success/error), ambient (respiración, parpadeo). Las capas se combinan sin explotar el número de estados.
2. **Estados = poses estables**; las transiciones llevan el movimiento. Si una transición necesita una coreografía propia, crea un timeline one-shot de "paso" entre estados.
3. **Any State** solo para interrupciones globales (error, reset). Abusar de él da saltos.
4. **Exit time** para dejar terminar un gesto antes de transicionar (p. ej. que acabe el "press" antes del "success").
5. **Blend states** para continuos: 1D para progreso o dirección; Additive para varias capas de expresión (sonrisa + ceja).
6. **Interrumpibilidad:** la duración de mezcla de la transición suaviza el cambio a mitad de animación. Evita duraciones 0 salvo cortes intencionados.
7. **Nombra en el lenguaje de la spec**: VM `ButtonVM`, propiedades `isHover`, `isPressed`, `progress`, `onSuccess`, `reducedMotion`.

Patrones completos (botón, toggle, loader→éxito, personaje con mirada y parpadeo, icono animado, onboarding) en `motion/08-ejecucion/rive/state-machines.md`.

### 4. Rigging y deformación

- **Bones** + meshes con vertex weights para deformaciones orgánicas (squash & stretch de verdad, sin distorsionar el trazo).
- **Constraints:** IK, Distance, Transform, Translation, Rotation, Scale, Follow Path. Con `strength` parcial se consigue overlapping barato.
- **Follow Path** para arcos exactos (principio *arcs*).
- La ilustración puede venir de otra herramienta (Affinity, Figma, Illustrator) como SVG. Antes de importar, agrupa por partes móviles, nombra las capas y expande los trazos que se vayan a deformar.

### 5. Layouts y texto

- **Layouts** (tipo flexbox: dirección, gap, padding, wrap, hug/fill) para componentes que se adaptan. En runtime, `Fit.Layout` hace que el artboard responda al tamaño del canvas.
- **Texto:** text runs enlazables a propiedades string del VM. Para la animación por glifo, palabra o línea, usa los modifiers de texto (rangos con falloff), siguiendo `motion/05-tipografia/`.

### 6. Scripting (Luau)

Rive Scripting usa **Luau** y se ejecuta igual en el editor y en runtime. Hay cinco tipos de script: **Node** (dibujo propio), **Layout**, **Converter**, **PathEffect** y **Test**. Casos de uso:

- Springs reales o físicas propias (converter o node con estado).
- Generativo y procedural (partículas, patrones).
- Converters complejos (mapear datos a poses).
- Tests de state machine.

⚠️ Comprueba si el scripting está en GA o en beta en tu versión del editor, y su soporte en el runtime de destino, antes de depender de él en producción.

### 7. Runtime web

Resumen (detalle en `motion/08-ejecucion/rive/runtime-web.md`):

```js
import { Rive, Layout, Fit, Alignment } from "@rive-app/webgl2";   // o @rive-app/canvas / canvas-lite
const r = new Rive({
  src: "/button.riv", canvas, artboard: "Button", stateMachines: "SM", autoplay: true, autoBind: true,
  layout: new Layout({ fit: Fit.Contain, alignment: Alignment.Center }),
  onLoad: () => {
    r.resizeDrawingSurfaceToCanvas();
    const vm = r.viewModelInstance;
    const mq = matchMedia("(prefers-reduced-motion: reduce)");
    vm.boolean("reducedMotion").value = mq.matches;
    mq.addEventListener("change", e => (vm.boolean("reducedMotion").value = e.matches));
  },
});
```

- **Peso y carga:** los .riv son ligeros, pero el runtime WASM no. Usa carga diferida y un póster estático mientras carga (peor escenario: red lenta).
- **Limpieza:** `r.cleanup()` al desmontar.
- **Accesibilidad del canvas:** el canvas no es accesible. Pon `role="img"` y `aria-label`, o `aria-hidden` si es decorativo, y replica los controles interactivos en HTML real.

### 8. MCP oficial de Rive (Early Access)

- Funciona solo con el **editor de escritorio** (macOS o Windows) abierto. Config: `{"mcpServers":{"rive":{"url":"http://127.0.0.1:9791/mcp"}}}`.
- Permite: archivos y artboards, inspeccionar y editar la escena, shapes, paths y layouts, animaciones y keyframes, state machines y transiciones, data binding (view models, instancias, bindings), y scripts Luau y shaders WGSL con diagnóstico.
- **Flujo con este sistema:** Motion Spec → crear el VM y sus propiedades → timelines por pose (keys con la interpolación Cubic de los tokens) → SM con capas y transiciones → bindings → revisar en el editor → `motion/09-critica/`.
- Sin MCP (editor web): el agente puede guiar paso a paso o manejar el editor con automatización de navegador; en ese caso, verifica cada paso con capturas.

---

## checklist

- [ ] Data Binding (no inputs) en proyectos nuevos; propiedades con nombres de la spec
- [ ] Curvas Cubic = tokens; springs aproximados y anotados
- [ ] Una capa por dimensión independiente; transiciones con duración de mezcla
- [ ] `reducedMotion` y `paused` en el VM y conectados en el runtime
- [ ] Loops > 5 s con control de pausa en el producto
- [ ] Canvas accesible (label o hidden + controles HTML)
- [ ] Carga diferida + póster; `cleanup()`
