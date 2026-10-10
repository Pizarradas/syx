# Isométrico · Accesibilidad, optimización y entrega

## meta

| Campo | Valor |
|-------|-------|
| **Dominio** | isometric — motor de código · cierre |
| **Fuente** | W3C (Writing accessible SVG), SVGO, web.dev (animations guide), WCAG 1.4.11 |
| **Objetivo** | Dejar un SVG isométrico accesible, ligero y optimizado sin destruir su estructura animable |
| **Agent tags** | `#isometric` `#a11y` `#svgo` `#performance` `#delivery` |

Se lee antes de entregar cualquier SVG o escena CSS isométrica. La base de accesibilidad del sistema está en `front/accessibility-wcag.md`.

---

## concepts

Un SVG isométrico es contenido o decoración, nunca las dos cosas. Y un optimizador con la configuración por defecto destruye justo lo que lo hace animable: los `id`, los grupos, las matrices de plano y las clases.

---

## rules

### 1. Accesibilidad

- **Informativa:** `role="img"`, `aria-labelledby` que apunte a `<title>` y, si es compleja, también a `<desc>`.
- **Decorativa:** `aria-hidden="true"` y ningún título.
- Si un diagrama transmite datos, el mismo contenido va también en texto HTML cerca de la ilustración.
- Con `<use>` que apunta a `<defs>`: un `<desc>` en cada pieza definida y un `<title>` en el `<use>`.
- Lo que transmite información contrasta al menos 3:1 con su fondo.
- Animación: `../03-animacion/animacion.md` y `motion/07-accesibilidad/accesibilidad.md`.

### 2. SVGO sin romper la animación

```js
// svgo.config.mjs (SVGO 4; en SVGO 3 añade también removeViewBox: false dentro de overrides)
export default {
  multipass: true,
  plugins: [
    { name: 'preset-default', params: { overrides: {
      cleanupIds: false,            // conserva los id que usan GSAP/CSS
      convertShapeToPath: false,    // mantiene polygon/ellipse legibles
      mergePaths: false,            // no fusiona caras: cada una se anima por separado
      collapseGroups: false,        // conserva los <g> semánticos
      moveGroupAttrsToElems: false, // no baja la matriz del plano a los hijos (rompería la rotación en plano)
      convertTransform: false,      // mantiene las matrices de plano exactas (iso-check las reconoce)
      removeUnknownsAndDefaults: { keepDataAttrs: true }, // conserva data-iso-part
      inlineStyles: false,          // no convierte clases en style="": las clases anclan la animación
    } } },
    'removeDimensions',             // el tamaño lo decide el CSS
  ],
};
```

`svgo in.svg -o out.svg --config svgo.config.mjs`. Después, `iso-check.py` sobre el resultado y comparación visual antes y después con `iso-render.py`. Esta configuración se comprobó en Chromium pausando la animación en varios instantes, antes y después de optimizar.

### 3. Rendimiento

- Estática: mejor como `<img src="x.svg">`, que se cachea. Si se anima o se tematiza, inline.
- Solo `transform` y `opacity`. Filtros y sombras con desenfoque cuestan más de pintar.
- `will-change` solo ante un problema medido, y se quita después.
- Con más de unos cientos de polígonos animados a la vez, Canvas/WebGL o una escena más simple.

### 4. Entrega

- SVG fuente legible (comentarios y datos de escena) y SVG optimizado para producción.
- PNG de vista previa a 2x.
- La paleta en tokens: variables CSS con los tres tonos de cada color, con el prefijo del proyecto.
- Por cada pieza animable, una línea: `data-iso-part` → qué movimiento admite y su pivote.

---

## checklist

- [ ] Informativa (`role="img"` + `<title>`) o decorativa (`aria-hidden="true"`), nunca a medias
- [ ] Datos de un diagrama también en texto HTML
- [ ] SVGO con la configuración de §2; `iso-check.py` y render repetidos tras optimizar
- [ ] Solo `transform` y `opacity` animados; `will-change` solo si se midió
- [ ] Entrega: fuente, optimizado, PNG 2x, tokens y lista de piezas animables
