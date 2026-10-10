# Isométrico · SVG y CSS para web

## meta

| Campo | Valor |
|-------|-------|
| **Dominio** | isometric — motor de código (módulo de entrada del estrato) |
| **Fuente** | Kit iso-flat; I am Dan (Isometric SVGs), JointJS (isometric diagrams), W3C (Writing accessible SVG) |
| **Objetivo** | Producir, editar y validar SVG o CSS 3D isométrico para web: heros, infografías, diagramas, iconos y escenas por capas, ligeros, accesibles, tematizables y preparados para animar |
| **Agent tags** | `#isometric` `#svg` `#css3d` `#tokens` `#animatable` |

Da por cumplido `../01-fundamentos/fundamentos.md`.

---

## concepts

**La geometría vive en atributos y el movimiento en CSS, en elementos distintos.** Si se anima `transform` por CSS sobre un elemento que ya tiene un atributo `transform`, se sustituye y la pieza se rompe. De ahí la estructura de tres capas de §4, que emiten igual `iso.mjs` y los exportadores de Blender.

**Herramientas** (`herramientas/`, sin dependencias salvo donde se indica):

| Herramienta | Qué hace | Necesita |
|---|---|---|
| `iso.mjs` | Escena JSON → SVG por piezas; también módulo: `prism()`, `cylinder()`, `flatShadow()`, `cylinderShadow()`, `shadowDir()`, `depthSort()`, `paletteCSS()`, `shade()`, `scene()`, `build()` | Node 18+ |
| `iso-check.py` | Escáner de reglas (§6) | Python 3.9+, solo biblioteca estándar |
| `iso-render.py` | Renderiza a PNG resolviendo tokens; `--fijar 'selector=transform'` congela un instante | `pip install cairosvg` |

Rutas desde la raíz del repositorio: `mind-system/knowledges/isometric/02-svg-web/herramientas/…`.

---

## rules

### 1. Elegir técnica

| Necesidad | Técnica |
|---|---|
| Ilustración, icono, hero o infografía con prismas y cilindros | Escena JSON → `iso.mjs build` (por defecto) |
| Biseles, booleanas, curvas, cientos de piezas, animación con curvas reales | `../04-blender/blender.md` |
| Texto, UI o imágenes planas pegadas a una cara | `<g transform="matrix(…)">` por plano (`../01-fundamentos/matematicas.md` §3) |
| Tarjetas o rejillas HTML reales en isométrico, con hover | `css-3d.md` |
| Escenas tipo juego, interactivas, con miles de piezas | Canvas/WebGL con cámara ortográfica (fuera de este dominio) |

### 2. Escena como datos

Ningún punto de pantalla a mano. La escena se describe en JSON (ejemplo completo: `ejemplos/escena-servidor.json`):

```json
{
  "title": "…", "desc": "…", "mode": "iso", "unit": 40, "prefix": "umbra",
  "palette": { "azul": "#5b8def", "losa": "#c9d6e8" },
  "bg": "#f6f4ef",
  "base": { "kind": "prism", "id": "losa", "x": -3, "y": -3, "z": 0, "w": 6, "d": 6, "h": 0.4, "token": "losa" },
  "objects": [
    { "kind": "prism", "id": "rack", "x": -2, "y": -2, "z": 0.4, "w": 1.5, "d": 1.5, "h": 3, "token": "azul" },
    { "kind": "cylinder", "id": "tanque", "cx": 1.2, "cy": 1.4, "z": 0.4, "r": 0.8, "h": 1.6, "color": "#f2a541" }
  ]
}
```

- Con `token`, la cara usa `style="fill:var(--<prefix>-<token>-top|left|right)"` y `palette` genera esos tokens con los tres tonos. Con `color`, hex directo (en SYX, solo en boceto).
- `prefix` es el del proyecto: nunca `app-` ni un prefijo de SYX.
- `light: "right"` intercambia laterales y refleja sombras; `shadows: false` las quita. Con `base`, las sombras de prismas y cilindros caen sobre la losa, recortadas a su cara superior.

### 3. Flujo

1. **Especificación** (`fundamentos.md` §1). Paleta desde roles semánticos; antes de crear tokens, consultar los existentes.
2. **Genera:** `node …/herramientas/iso.mjs build escena.json > escena.svg`. Demo: `iso.mjs demo iso > demo.svg` (esperado: `ejemplos/demo-iso.png`; `demo dimetric` → `ejemplos/demo-dimetric.png`).
3. **Escanea:** `python3 …/herramientas/iso-check.py --tokens escena.svg [estilos.css]` hasta 0 errores. Con `--tokens`, los colores literales pasan de aviso a error.
4. **Mira:** `python3 …/herramientas/iso-render.py escena.svg revision.png [--css tokens.css]`, y pasa el control de calidad de los fundamentos. Dos pasadas suelen bastar.
5. **Optimiza y haz accesible:** `accesibilidad-rendimiento.md` antes de entregar.

Terminado cuando el escáner da 0 errores, el PNG se ve bien, el SVG tiene `role`/`title` y conserva sus `id` y `data-iso-part` después de optimizar.

### 4. Estructura preparada para animar

```svg
<g id="ventilador" data-iso-part="ventilador">                   <!-- 1. movimiento en el mundo (CSS/GSAP): sin atributo transform -->
  <g transform="matrix(0.8660254 0.5 -0.8660254 0.5 120 42)">   <!-- 2. proyección del plano (atributo fijo) -->
    <g class="ventilador__aspas">                               <!-- 3. movimiento en plano: rotate/scale en coordenadas planas -->
      …
    </g>
  </g>
</g>
```

- **Capa 3:** una rotación dentro del grupo proyectado se ve como rotación isométrica real (un ventilador sobre el techo, una puerta sobre su pared). Lleva `transform-box: fill-box; transform-origin: center` (o el pivote).
- **Capa 1:** desplazamientos por los ejes del mundo con propiedades registradas, para que sean animables:

```css
/* capa: prototipo fuera de scss/ — CREATIVE o @layer syx.app; 40 = unidad de rejilla en px */
@property --iso-u { syntax: "<number>"; inherits: false; initial-value: 0; }
@property --iso-v { syntax: "<number>"; inherits: false; initial-value: 0; }
@property --iso-w { syntax: "<number>"; inherits: false; initial-value: 0; }
[data-iso-part] {
  transform: translate(calc((var(--iso-u) - var(--iso-v)) * 0.8660254px * 40),
                       calc(((var(--iso-u) + var(--iso-v)) * 0.5 - var(--iso-w)) * 1px * 40));
}
```

  Una animación dice entonces `--iso-w: 0.5` (sube media unidad).
- Solo se animan `transform` y `opacity`, dentro de `@media (prefers-reduced-motion: no-preference)`. La ilustración se lee sin animación.
- Referencia completa: `ejemplos/ejemplo-animable.svg` (tokens, tres capas, `@property`, reduced motion, rotación en plano). Recetas: `../03-animacion/`.

### 5. Reglas de código

- `viewBox` sin `width`/`height` fijos: el tamaño lo decide el contenedor. Centrado en el origen del mundo cuando se genera desde datos.
- Coordenadas con 2 decimales como máximo.
- `polygon`, `ellipse` y `path` cortos. Sin filtros (`feGaussianBlur`, `drop-shadow`): pesan al pintar y Lottie no los admite.
- Orden del documento = profundidad: suelo, sombras, objetos de atrás hacia delante.
- Color por token con `style="fill:var(--…)"` o clases. **Nunca `var()` en el atributo `fill`**: no es fiable en todos los navegadores y herramientas. Los literales solo aparecen como fallback en la declaración del token.
- Curvas sobre una cara (arcos, logos): en plano, envueltas en la matriz de esa cara.
- Personajes y formas orgánicas: base y sombra siguen la rejilla; la silueta puede ser libre.

### 6. Qué comprueba `iso-check.py`

| Regla | Nivel |
|---|---|
| Raster embebido (salvo composición declarada `data-iso-raster="capas"`) | error |
| `matrix()` que no es un plano isométrico o dimétrico conocido; mezcla de proyecciones | error |
| `data-iso-part` con atributo `transform`, o duplicado | error |
| `@keyframes` que animan algo distinto de `transform`, `opacity` o `--iso-*`; animación sin `prefers-reduced-motion`; `--iso-u/v/w` sin `@property` | error |
| Falta `<title>` (o `aria-hidden="true"` si es decorativa), falta `viewBox` | error |
| Colores literales | aviso (error con `--tokens`) |
| Tamaño fijo, más de 2 decimales, filtros, piezas sin `data-iso-part`, tokens nuevos sin `/* syx-reuse: … */` | aviso |

### 7. En SYX

- **Dónde vive.** Inline en la página (si se anima o se tematiza) o como `<img>` (si es estática). No es una clase del registro: no lleva prefijo `atom-`/`mol-`/`org-`, y si una pieza de UI la envuelve, esa pieza sigue las reglas de su capa.
- **El CSS de la ilustración** va en la capa de la app (`@layer syx.app`) con el prefijo del proyecto, o en el `<style>` del propio SVG. En un componente de `scss/`, el movimiento se reescribe con `@include transition()` y tokens de duración y curva (`motion/08-ejecucion/css/css.md`, *En SYX*).
- **El escáner no sustituye al validador.** `iso-check.py` juzga la ilustración; el CSS que la rodea en una app pasa por `syx-scan`, y en `scss/` por `node scripts/syx-validate.js`.

---

## checklist

- [ ] Escena descrita en JSON (o exportada de Blender), no puntos a mano
- [ ] Un `<g id data-iso-part>` por pieza, sin atributo `transform`; plano en el hijo, giro en plano en el nieto
- [ ] Colores con `style="fill:var(--<proyecto>-…)"`, nunca `var()` en `fill`
- [ ] `iso-check.py --tokens` con 0 errores
- [ ] Render mirado con `iso-render.py`; con animación, un instante con `--fijar`
- [ ] `accesibilidad-rendimiento.md` aplicado antes de entregar
