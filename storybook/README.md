# Sandbox de portabilidad

Este directorio responde a una sola pregunta: **¿es la arquitectura de SYX
trasladable a React, Vue, etc. sin reescribir nada?** No es un paquete, no se
publica en npm y no forma parte del entregable del sistema: es el banco de
pruebas donde esa afirmación se convierte en un check ejecutable.

## La tesis

Los componentes de SYX son CSS puro con un contrato de markup (clases,
elementos, modifiers) que ya está codificado en `component-registry.json`.
Si eso es cierto, un wrapper React o Vue es trivial — tan trivial que **se
genera solo desde el registro**, sin escribir un componente a mano. El número
de excepciones manuales que haga falta introducir es la medida exacta de lo
que *no* es portable.

## Cadena de generación

```
component-registry.json          (fuente única — nivel repo, generado del SCSS)
        │
        ▼  generate-spec.mjs
spec/spec.json                   (spec neutral: ejes enum, flags, templates, temas)
        │
        ├─▼  generate-stories.mjs          → stories HTML (lib/runtime.js)
        ├─▼  frameworks/react/generate-react.mjs → src/*.jsx + stories JSX
        ├─▼  frameworks/vue/generate-vue.mjs     → src/*.js (h()) + stories
        │
        ▼  storybook build (×3)
storybook-static/ ×3             (tres catálogos, misma toolbar tema × modo)
        │
        ▼  check-portabilidad.mjs
portability-report.json          (pixel-diff HTML↔React y HTML↔Vue por story)
```

Los wrappers compilan el template `usage` parseado (lib/parse-html.mjs) a JSX
o a render functions h(): el nodo base recibe la clase calculada desde las
props y los children/slot por defecto salen del propio template. El runtime
HTML renderiza el template *verbatim*, así que el pixel-diff arbitra cualquier
divergencia del compilador.

Nada de lo generado se versiona (ver `.gitignore` raíz): se regenera en cada
`npm run generate`, así que no puede desviarse del registro. Lo único
versionado aquí son los generadores, `lib/runtime.js` y `.storybook/`.

### Derivación de props (dónde vive cada regla)

Las reglas que convierten modifiers en props (`atom-btn--size-lg` → prop
`size="lg"`, `is-*`/`has-*` → flags booleanos, `--lc-*` → enum `icon`, los
modifiers de elementos internos fuera de la API raíz) están en
`generate-spec.mjs`, una sola vez, documentadas en su cabecera. Los wrappers
de cada framework consumen el spec ya derivado y no reinterpretan nada.

## Uso

```bash
cd storybook
npm install
npm run dev      # regenera spec + stories y abre Storybook en :6006
npm run build    # ídem + build estático en storybook-static/
```

Toolbar global: tema (los 7 de `css/styles-theme-*.css`) × modo
(`data-theme="light|dark"` en `<html>`), con las fuentes servidas desde
`fonts/` con la misma ruta relativa que usa el CSS compilado.

## Fases

- [x] **1. Spec neutral** — `generate-spec.mjs`. 27 componentes, 8 ejes, 45 flags.
- [x] **2. Storybook HTML** — línea base visual (este directorio).
- [x] **3. Wrappers React y Vue generados** — `frameworks/react/` y
      `frameworks/vue/`: 27 componentes cada uno, cero escritos a mano.
- [x] **4. `npm run check:portabilidad`** — pixel-diff HTML ↔ React ↔ Vue por
      story (Playground + ejes + flags), Chromium vía Playwright, umbral 0,1 %
      de píxeles con el antialiasing descontado.
- [x] **5. Publicación** — `.github/workflows/pages.yml` construye los tres
      catálogos y los sirve en `/storybook/` junto al sitio de siempre.
      Requiere un clic único en Settings → Pages → Source: "GitHub Actions".

## El catálogo (estilo Carbon)

Los tres Storybooks comparten marca (`lib/brand.js` → "SYX · HTML/React/Vue")
y árbol lateral ordenado: **Introducción → Tokens → Atoms → Molecules →
Organisms**. Cada componente lleva página **Docs** autogenerada (descripción
del registro + el contrato de markup real como código fuente) y su Playground
con controls agrupados en *ejes* y *flags*. El catálogo HTML añade dos
secciones propias:

- `docs/Introduccion.mdx` — la bienvenida (escrita, no generada).
- `generate-tokens.mjs` → **Tokens** — el registro completo de `tokens.json`
  como galería viva: las muestras usan `var(--token)`, así que cambiar tema o
  modo en la toolbar las repinta con los mismos custom properties que usan
  los componentes. Colores primitivos, escalas por familia, semánticos con su
  cadena de alias, y los 631 de componente plegados por componente.

## Resultado

Última pasada completa (local, Chromium):

- **50 stories × 2 pares (HTML↔React, HTML↔Vue) = 100 comparaciones, 0 divergencias.**
- 27 wrappers React (media 36 líneas, máx. 82) y 27 Vue (media 45, máx. 94),
  todos generados; **cero componentes escritos a mano, una sola regla de
  derivación añadida en todo el traslado** (la de palabras reservadas, abajo).

## Hallazgos

Lo que el proceso ya enseñó sobre el sistema (esta lista es parte del valor):

- `component-registry.json` mezcla en `modifiers` los del bloque y los de
  elementos internos (`atom-pagination__item--is-active`). El spec los separa
  (`elementModifiers`), porque un modifier de elemento no es un prop del
  componente raíz. Candidato a distinguirse en el propio registro.
- Los 4 componentes que carecían de `usage` (evidence, score, compare-card,
  ranking) resultaron ser piezas exclusivas de `why-syx.html`: hoy viven en
  `scss/site/` (capa site, fuera del registro) y ya no aparecen en el catálogo.
- Un modifier puede camelizar a una palabra reservada de JS:
  `atom-evidence--new` → prop `new`, que no compila. No es una excepción por
  componente sino una regla de derivación que faltaba (reservada → `isNew`),
  añadida en `lib/wrappers.mjs`. Es el único choque que produjo el traslado
  completo a dos frameworks.
- En `atom-code`, el espacio entre `<span>`s dentro del `<pre>` es contenido:
  el pixel-diff cazó al primer compilador de wrappers descartando nodos de
  texto de solo espacios (0,11 % de píxeles). Los templates del registro van
  en una línea, así que *todo* whitespace es significativo — regla ahora en
  `lib/parse-html.mjs`. Exactamente la clase de divergencia silenciosa para
  la que se construyó el check.
- Drift del sistema, no del sandbox: el CSS compilado declara `@font-face`
  de Inter (`../fonts/google-inter/…`) pero `fonts/` solo contiene Space
  Grotesk y Syne — ese 404 ocurre hoy también en el sitio publicado. Cae al
  fallback en los tres frameworks por igual.
