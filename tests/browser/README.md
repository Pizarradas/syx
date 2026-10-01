# Pruebas en navegador

Lo que solo se puede comprobar con un navegador de verdad: píxeles, foco,
teclado, anchura de la ventana. Nada de esto viaja en el paquete; la CI lo
corre en el job **navegador** (PR y `main`) y **todo rompe** salvo la
regresión visual, que informa.

Todas las pruebas montan su página desde `component-registry.json`: un
componente entra en ellas el día que entra en el registro, con su `usage`. Las
de componentes comparten esa página (`lib/comun.mjs`), así que un componente no
puede pasar una prueba en un marco que las demás no ven.

## Qué mide cada una

| Comando | Qué mide | Dónde |
|---|---|---|
| `node run.mjs --axe` | axe-core, WCAG 2.2 A y AA. Las **violaciones** y también los **incompletos** (lo que axe no sabe decidir) fallan salvo que estén revisados en `axe-excepciones.json`. Los incompletos de contraste se miden en píxeles (ver abajo). `--rtl` repite en derecha a izquierda. | Cada componente, 7 temas × 2 modos |
| `node interaccion.mjs` | Lo que prometen los `js/syx-*.js`: teclado APG del menú, tooltip (1.4.13), región viva del toast, contador de caracteres. | Un tema |
| `node foco.mjs` | **Foco visible** (2.4.7, 2.4.11, 2.4.13): foto de cada enfocable sin foco y con foco de teclado; el indicador —píxeles que cambian con ≥ 3:1 entre antes y después— debe medir 2 × el perímetro del control. **Orden de Tab y trampas** (2.4.3, 2.1.2): Tab recorre todos los enfocables en orden y sale por el final; un diálogo con `showModal()` sí atrapa. | Cada enfocable de cada `usage`, 7 temas × 2 modos (el orden, en uno) |
| `node reflow.mjs` | **Reflow** (1.4.10): a 320 px nada ensancha el documento salvo dentro de un contenedor con scroll previsto (tabla responsiva, código, pestañas). **Tamaño de objetivo** (2.5.8) con la regla `target-size` de axe a ese ancho. `--ancho N` mide otro. | Componentes (7 × 2) y las cuatro páginas |
| `node sitio.mjs` | Las cuatro páginas (`home`, `docs`, `why-syx`, `theme-builder`) en **axe** con su CSS de `dist/site`, a 375 y 1280 px, claro y oscuro. Y el **cajón móvil** de `org-site-header` con el teclado: cerrado no se enfoca; Enter lo abre y mete el foco, que se ve; Tab no sale; Escape cierra y devuelve el foco. | Páginas del sitio |
| `node run.mjs --capturas DIR` · `node paginas.mjs --capturas DIR` · `node comparar.mjs` | Regresión visual contra la rama base, fotografiada en la misma máquina. Informa, no rompe. | Componentes / páginas |

La prueba de que estas pruebas fallan cuando deben está en
`scripts/check-mutacion.js` (job **mutación**): por ejemplo, cambia el anillo de
foco de `.atom-btn` por `outline: none` y exige que `foco.mjs` lo pare.

### Cómo se mide en píxeles

- **Contraste que axe no resuelve** (`lib/pixeles.mjs`): foto del elemento con
  su texto y sin él (color transparente solo en el elemento). Los píxeles que
  cambian son el texto; la foto sin texto da el fondo exacto detrás de cada uno.
  El contraste es el del color del texto contra ese fondo, y cuenta el **peor**
  píxel: un texto que cruza un degradado se lee tan mal como su tramo más claro.
- **Foco**: foto de la sección sin foco y con foco, a escala 2. Cuenta los
  píxeles cuyo color cambia con ≥ 3:1; los del borde suavizado de un anillo
  (cambian sin llegar a 3:1 pero tocan uno que sí) cuentan medio. El perímetro
  es el del control que se ve, como rectángulo redondeado; en un check, radio o
  switch, el de la pieza dibujada, no el de la etiqueta con su texto.

## Cómo correrlas

Desde la raíz, con el CSS y `dist/` generados (`npm run build`):

```sh
cd tests/browser && npm ci && npx playwright install chromium
node run.mjs --axe
node foco.mjs [--temas syx-sketch,example-01] [--solo-foco | --solo-orden]
node reflow.mjs [--solo-componentes | --solo-paginas] [--ancho 320]
node sitio.mjs [--paginas home,docs] [--solo-axe | --solo-cajon]
```

O todas seguidas: `npm run test:navegador` en la raíz. Con un Chromium ya
instalado, `SYX_CHROMIUM=/ruta/a/chromium` en vez de `playwright install`.

## Cómo se registra una excepción de axe

Lo deseable es que `axe-excepciones.json` no tenga nada que no sea un
incompleto revisado. Una entrada lleva:

| Campo | Qué es |
|---|---|
| `tipo` | `violacion` (por defecto) o `incompleto` |
| `regla` | id de la regla de axe (`color-contrast`, `aria-valid-attr-value`…) |
| `componente` | el componente del registro, o la página (`docs.html`) |
| `selector` | un trozo del selector de axe del nodo, **o** |
| `dentro` | un selector CSS del ámbito: el nodo debe estar dentro (`#hero`). Para páginas con cientos de textos sobre un degradado: una entrada por sección |
| `temas` | `tema/modo` en los componentes (`syx-sketch/dark`); `ancho/modo` en las páginas (`375/light`, `cajon-375/light` con el cajón abierto) |
| `ratioMinima` | solo contraste: la peor medida en píxeles cuando se revisó, como **suelo**. Si la medida baja de él —o del mínimo de WCAG— deja de cubrir |
| `caduca` | `AAAA-MM-DD`. Caducada, la ejecución para |
| `porque` | qué se comprobó y por qué cumple, en frases. Uno que empiece por `REVISAR` o sea demasiado corto para la ejecución |

Una excepción que en una ejecución completa no cubre nada también para la
ejecución: es un agujero por el que pasaría la próxima violación con ese
selector. Se borra.

Para no escribirlas a mano, `--proponer` imprime las entradas de los
incompletos **que cumplen** medidos en píxeles, listas para revisar:

```sh
node run.mjs --axe --proponer      # componentes, una por selector
node sitio.mjs --solo-axe --proponer   # páginas, una por sección (dentro)
```

El suelo propuesto deja 0,15 de holgura bajo lo medido (nunca por debajo del
mínimo de WCAG): la misma página rasterizada en otra máquina mueve algún
píxel. Los que no cumplen no se proponen: se arreglan. Los incompletos que no
son de contraste salen con `porque: "REVISAR…"`, que no se acepta hasta que
alguien escribe lo que comprobó.
