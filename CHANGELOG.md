# Changelog

All notable changes to SYX Design System will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [4.16.0] — 2026-08-31

### Added

- **SYX se puede instalar.** Hasta ahora no había vehículo de entrega: ninguna aplicación podía traerse SYX, así que tampoco había dónde detectar que una aplicación se hubiera desviado del sistema. Ese era el agujero del paso 1.2.

  `exports` con rutas separadas para cada tema (`syx-design-system/themes/syx-sketch.css`), para el SCSS fuente, para los contratos y para la API. `files` acotado: 295 ficheros, 2,4 MB comprimidos, sin el DTCG derivable ni los subproductos de compilación.

- **`index.js` — la cara programable del paquete.** `main` apuntaba al CSS de un tema concreto, que era un parche y además una mentira: `require()` sobre un `.css` falla. Ahora `require('syx-design-system')` devuelve las seis consultas —`getToken`, `findTokenByValue`, `listComponents`, `getComponent`, `validateSnippet`, `listThemes`— más las rutas resueltas de cada artefacto.

  **Los contratos viajan con el paquete**, y eso es lo que hace posible lo que viene: una aplicación valida contra la versión exacta que tiene instalada, no contra lo que hoy haya en `main`.

- `bin` `syx-mcp`: el servidor MCP arranca desde el paquete instalado. El registro en un cliente pasa a ser `npx -y syx-mcp`, sin rutas absolutas al repositorio.

- `scripts/check-package.js` — guardián de empaquetado, en la cadena de `npm run check`. Comprueba que cada ruta de `exports` viaja de verdad, que `main` es requerible, que el `bin` tiene shebang, que no se cuela nada derivable y que **el CSS no cita ficheros que se quedan fuera**. El error de empaquetado es silencioso por naturaleza: aquí todo funciona, y solo se rompe en la máquina de quien instala.

- `scripts/check-consumible.js` — la prueba de verdad, a demanda (`npm run check:consumible`): empaqueta, instala en un proyecto de usar y tirar **fuera del repositorio** y desde allí importa un tema, lee los tokens resueltos, llama a la API y arranca el servidor MCP por su `bin`. Ocho comprobaciones, incluida una que verifica que nada resuelve fuera de `node_modules` — probando desde dentro del repositorio, Node encontraría los ficheros por ruta relativa y la prueba se respondería a sí misma.

- `prepublishOnly` encadena `npm run check` y la prueba de consumo: no se publica sin pasar por las dos.

### Changed

- **La capa de consulta sale a `scripts/lib/consulta.js`.** El servidor MCP se queda solo con el protocolo (319 → 191 líneas) y comparte implementación con `index.js`. Un agente por MCP y una aplicación por `require` tienen que obtener la misma respuesta a la misma pregunta; con dos copias, no la obtendrían mucho tiempo.

- `repository`, `homepage`, `bugs`, `engines` (`node >=18`) y `sideEffects` (`*.css`, `*.scss`, para que ningún empaquetador se coma las hojas al hacer tree-shaking).

### Known

- **Cuatro familias tipográficas que el CSS cita no están en el repositorio**: `google-inter`, `google-playfair-display`, `google-dm-mono` y `google-bebas-neue` — 35 `url()` sin destino, que afectan a `example-01`, `03`, `04`, `05`, `06` y a `setup-builder.css`. `syx-sketch` y `example-02` no dependen de ninguna. El navegador cae a la siguiente familia de la pila, así que no rompe, pero son 35 peticiones a 404. `check:package` lo avisa en cada ejecución sin hacer fallar la cadena: no lo causa el empaquetado y no es un guardián quien debe decidir cómo se arregla.

---

## [4.15.0] — 2026-08-31

### Added

- **Servidor MCP: el sistema de diseño se puede preguntar.** `scripts/mcp-server.js`, JSON-RPC sobre stdio y sin una sola dependencia. Seis herramientas: `list_themes`, `get_token`, `find_token_by_value`, `list_components`, `get_component` y `validate_snippet`.

  El cambio de fondo no es tener un servidor, es **el orden de las cosas**. Hasta ahora un agente leía `tokens.json`, el registro y los ficheros de tema, resolvía la cascada de cabeza, escribía, y alguien validaba después. De ahí salían los nombres de token inventados: `--component-btn-primary-bg` en vez de `--component-button-primary-filled-bg` no lo detectaba nadie hasta compilar. Ahora `get_token` devuelve el valor que el navegador pintaría —tema y modo incluidos, con la cadena de alias que lo produce— y `validate_snippet` pasa R01–R04 **antes** de escribir, avisando además de los tokens que no existen.

  Registro para cualquier cliente MCP en el README. `npm run mcp` lo arranca.

- `scripts/check-mcp.js` — prueba de humo que lanza el servidor de verdad y le habla por stdio, como un cliente. Nueve comprobaciones a nivel de protocolo, no de funciones internas: lo que se rompe en un servidor MCP es el protocolo. Entra en la cadena de `npm run check` como `check:mcp`.

### Changed

- **Un solo motor, dos consumidores.** `scripts/lib/css-tokens.js` (resolución de la cascada, forma canónica, agrupación de assets) y `scripts/lib/rules.js` (R01–R04) salen de donde vivían y pasan a compartirse entre el generador del snapshot, el validador y el servidor.

  El motivo es el error que más veces se repitió en las últimas versiones: dos copias del mismo criterio acaban diciendo cosas distintas, y entonces el instrumento de medida inventa problemas que no existen. Con una copia sola, un fragmento que el servidor aprueba es un fragmento que `npm run validate` aprueba, y lo será dentro de seis meses.

  Verificado: el snapshot regenerado es idéntico byte a byte al de `HEAD` salvo la marca de tiempo, y el validador sigue dando 0 violaciones en R01–R04.

- `get_token` añade la cadena de alias (`cadenaDeAlias`), que era lo que faltaba para responder «por qué» y no solo «cuánto».

---

## [4.14.3] — 2026-08-31

### Changed

- **El guardián de tokens deja de perseguir al minificador.** Tres rondas seguidas de lo mismo —espacio tras la coma, espacios de la barra, espacio pegado al paréntesis— dejaron claro que igualar el formato transformación a transformación es una carrera que no se gana: el siguiente minificador trae la suya.

  El criterio de fondo es que **este guardián vigila el contenido**. Ahora, si al quitar todo el espacio en blanco los dos lados coinciden, avisa y **no falla**: lo único que ha cambiado es cómo viene formateado el CSS de partida, y eso no es motivo para parar a nadie. Si difiere algo más que espacios, falla como antes y enseña qué.

  Verificado en los dos caminos: contenido distinto sale con código 1, solo espacios sale con 0 y un aviso.

- La forma canónica cubre además el espacio pegado a un paréntesis, que era el que quedaba.

---

## [4.14.2] — 2026-08-31

### Fixed

- **Segunda vuelta de la forma canónica.** El minificador también quita los espacios que rodean a la barra: `oklch(0 0 0 / 0.05)` y `oklch(0 0 0/0.05)` son el mismo color y solo el segundo sobrevive. Quedaban 150 tokens distintos entre un build expandido y uno minificado. La forma canónica los normaliza también, sin tocar los espacios de `+` y `−`, que dentro de `calc()` sí son obligatorios.

  Verificado reproduciendo el minificado exacto sobre 3 temas × 2 modos: **6512 valores comparados, cero diferencias**.

- **El guardián ahora dice QUÉ difiere.** Antes solo decía «no coincide, regenera», y averiguar la causa exigía repetir la investigación entera — cosa que ya ha pasado tres veces en dos días. Ahora imprime los primeros valores distintos con los dos lados, y distingue en el mensaje los dos casos que se confunden: cambios reales de tokens, o un `css/` que no es el que produce `npm run build:css`.

### Notes

Al reverificar contra el navegador salieron **248 diferencias que no existían**: el script de verificación seguía normalizando a la manera vieja mientras el generador ya usaba la nueva. Alineados los dos, la clasificación vuelve a ser la de siempre —176 cadenas rotas, 76 `initial`, 16 `inherit`— y **cero valores equivocados**. Merece quedar escrito porque es el fallo que más veces ha aparecido en esta tanda: cuando el que mide y el medido no comparten criterio, el resultado parece un problema del código.

---

## [4.14.1] — 2026-08-31

### Fixed

- **El snapshot cambiaba con el formato del CSS, no solo con su contenido.** Al minificar desaparece el espacio detrás de las comas —`Arial, sans-serif` pasa a `Arial,sans-serif`, `clamp(a, b, c)` a `clamp(a,b,c)`— y colapsar espacios no devuelve los que ya no están: **118 tokens salían distintos** entre un build expandido y uno minificado del mismo código, y `check:tokens` fallaba **por formato**. Para un guardián es la peor manera de gastar la atención de quien lo ejecuta: la segunda vez que salta sin motivo, se ignora.

  Los valores pasan por una forma canónica que quita el espacio tras la coma pero **nunca el que rodea a un operador** —dentro de `calc()` los espacios de `+` y `−` son obligatorios— y respeta lo que va entre comillas, donde una coma es texto.

- **Los identificadores de los data URI dependían del orden de aparición.** Añadir un icono o reordenar los temas desplazaba el identificador de todos los siguientes y llenaba el diff de cambios que no eran cambios. Ahora salen del contenido: `sha1` recortado a 10 caracteres.

Verificado: el mismo tema en las dos formas produce ahora **snapshots idénticos** —1079 tokens, claro y oscuro, cero diferencias—, y contra `getComputedStyle` la clasificación no se mueve: **cero valores equivocados**.

---

## [4.14.0] — 2026-08-31

Paso **0.3** del plan agentic, y con él la fase **P0 cerrada**. `npm run check` termina en verde de principio a fin **por primera vez**.

### Removed

- **El bundle mínimo `styles-core` se retira.** Estaba documentado en README, CHANGELOG y TOKEN-GUIDE, pero su fuente **nunca existió en el historial**, y por eso `npm run check` fallaba siempre en el último paso. Dos datos decidieron retirarlo en vez de reconstruirlo:

  **Cinco de los seis componentes que debía excluir ya no existen** (`atom-specimen`, `atom-swatch`, `mol-demo`, `org-documentation-layout`, `org-content-columns`), así que hoy solo ahorraría `atom-code` y la página del theme-builder. Y **los bundles por contexto ya hacen ese trabajo, mejor y de verdad**: `bundle-app` pesa 38 KB con gzip frente a los 52 del tema completo —un 27 % menos— y los 31 compilan desde 4.3.0.

  Fuera `build:core` y `postcss:core`; las tres menciones en la documentación pasan a apuntar al sistema de bundles, que es lo que existe.

- **`main` dejaba de apuntar a `index.html`**, un fichero que tampoco existe. Ahora señala el CSS del tema por defecto. Es un apaño hasta el paso 1.2, que le pondrá `exports` en condiciones.

### Added

- **`scripts/export-tokens.js`** (`npm run export:tokens`) — la tercera promesa incumplida, y la que más importaba: el exportador es la puerta por la que SYX habla con herramientas que no son SYX. No se podía hacer antes de 4.12.0 porque no había nada resuelto que exportar.

  Emite **formato W3C DTCG**, que es lo que leen Style Dictionary, Figma Variables y Tokens Studio: 14 ficheros —uno por tema y modo, porque DTCG no tiene noción de tema— con 14 918 tokens, **9880 con `$type` inferido** del valor y los **9880 tipos dentro del estándar**, sin ninguno inventado.

  Verificado de ida y vuelta contra el navegador en 3 temas × 2 modos: **4854 valores leídos del DTCG coinciden exactos con `getComputedStyle`, cero diferencias, cero no encontrados.**

### Notes

Tres decisiones del exportador que merecen quedar escritas:

- **Las expresiones se exportan igualmente**, sin `$type` y marcadas en `$extensions`. DTCG describe valores y `color-mix()` o `calc()` no lo son, pero omitirlas mentiría por ausencia: quien importara esto vería un sistema con 260 tokens menos de los que tiene.
- **Los tokens rotos no se exportan** (266). DTCG no sabe decir «este token existe pero no tiene valor», y colarlo vacío haría que la herramienta receptora pintara con nada.
- **970 nombres son hoja y grupo a la vez** —existen `--component-button-primary-color` y `--component-button-primary-color-hover`— y DTCG no lo admite. El valor del padre baja a una hoja `DEFAULT` dentro del grupo, que es la convención que Style Dictionary y Tailwind ya usan. El primer intento le ponía un sufijo `_`: resolvía la colisión, pero dejaba un nombre arbitrario que nadie sabría interpretar al importar.

**`contracts/dtcg/` no se versiona.** Son 2,9 MB derivables enteros del snapshot —más que todo el resto del repositorio junto— y aquí vale el mismo criterio que se aplicó al índice inverso en 4.12.0: los datos derivados en un artefacto versionado se desfasan por su cuenta. Se generan a demanda.

---

## [4.13.0] — 2026-08-31

Paso **0.1** del plan agentic. `component-registry.json` se mantenía a mano y no se regeneraba desde el 3 de marzo. Ahora sale del código y se contrasta contra el CSS compilado.

### Fixed

El registro que `CLAUDE.md` ordena consultar antes de escribir código estaba mayoritariamente equivocado, y un agente que lo obedeciera escribía clases y tokens inexistentes sin forma de saberlo:

| | antes | ahora |
|---|---:|---:|
| rutas `tokenFile` rotas | **34 / 34** (100 %) | 0 / 33 |
| modificadores que no existen en el CSS | **30 / 48** (63 %) | 0 / 158 |
| tokens fuera de `tokens.json` | **81 / 111** (73 %) | 4 / 552 |

Y además cubre mucho más: de 48 modificadores a **158**, de 111 tokens a **552**, con 107 elementos que antes no estaban.

- **`tokenFile` pasa a `tokenFiles`** (array). Un componente lee tokens declarados en varios ficheros —`btn` toca `_buttons.scss` y `_icons.scss`— y el campo anterior, además de apuntar a rutas inexistentes, solo admitía una.

### Added

- **`scripts/build-component-registry.js`** (`npm run build:registry`) y **`npm run check:registry`**, dentro de `npm run check`, que falla si el registro se desfasa del código.

  El árbitro es el **CSS compilado**: una clase entra en el registro solo si aparece de verdad en la hoja de estilos. Es lo que garantiza que no vuelvan los 30 modificadores fantasma. `description` y `usage` no se generan —son prosa escrita a mano— y sobreviven a cada regeneración.

### Notes

Tres fallos propios por el camino, todos del mismo tipo: **acusar de roto lo que funciona**, que es el vicio que este paso venía a corregir.

- Al entrar en el primer `@mixin` se apilaba un contexto vacío en vez de `['']`, y el bucle sobre los padres no iteraba: salían **0 clases** en todos los ficheros.
- Se marcaban como fantasma las clases intermedias del anidamiento. `&--is { &-fs { … } }` produce `.atom-table--is-fs` y de paso un `.atom-table--is` que no llega al CSS porque no lleva declaraciones propias. Eso es cómo se escribe el Sass, no deriva.
- Se denunciaban tokens sin declarar que siempre se citan con `var(--x, fallback)`. Misma corrección que en 4.12.0.

Y encontró cuatro cosas ciertas:

- **`--component-check-bg` y `--component-radio-bg`** se usan **sin fallback** y no los declara nadie: la casilla y el radio se quedan sin fondo. `syx-validate` no lo veía porque R05 y R06 comparan declaraciones contra `tokens.json`, no el CONSUMO contra las declaraciones.
- **`.atom-label` la declaran dos ficheros** (`_form.scss` y `_label.scss`) y **`.atom-icon` otros dos** (`_icon.scss` y `_icon-lucide.scss`). No es un fallo del generador, pero quien pregunte «¿dónde se define esta clase?» merece las dos respuestas, y ahora las tiene.

---

## [4.12.1] — 2026-08-31

### Fixed

- **El generador del snapshot dependía del formato del CSS de entrada.** Comparaba el texto de las media queries tal cual —`prefers-color-scheme: dark`, con espacio—, y al minificar ese espacio desaparece. Con un CSS minificado no reconocía **ningún** bloque de modo oscuro y emitía un snapshot incompleto **sin avisar de nada**: el peor tipo de fallo para un contrato.

  Salió al sincronizar: `npm run check:tokens` falló en la máquina de José y el CSS de su copia de trabajo está minificado, mientras que `npm run build:css` emite `--style=expanded`. El guardián hizo exactamente su trabajo el primer día que existe.

  Ahora el texto del at-rule se normaliza —sin espacios y en minúsculas— antes de compararlo. Verificado con el mismo tema en las dos formas: **1079 tokens, claro y oscuro, cero diferencias**. El snapshot generado no cambia respecto a 4.12.0 salvo la marca de tiempo.

---

## [4.12.0] — 2026-08-31

Paso **0.2** del plan agentic. `tokens.json` es un registro de nombres, no de valores: 608 de sus 788 entradas guardan una referencia `var()` sin resolver y 318 tokens cambian entre claro y oscuro contra un esquema con un solo campo `value`. Ya no es el único sitio donde mirar.

### Added

- **`contracts/resolved-tokens.json`** — el valor real de cada token, en cada tema y en cada modo, con la cadena de alias ya resuelta. 7 temas × 2 modos, 1079 tokens por tema.

  Tres capas que se apilan, para no repetir lo mismo catorce veces: `base` lleva los **431 tokens que valen igual en los siete temas** —lo cual además dice algo cierto: ese token no depende del tema—, cada tema guarda solo lo suyo, y el modo oscuro solo lo que cambia. Los 31 data URI de iconos se internan en un almacén común: eran el 2 % de las entradas y se llevaban el 56 % del peso, repetidos idénticos en los siete temas. De 2703 KB en el primer intento a **569 KB**.

- **`scripts/build-token-snapshot.js`** (`npm run build:tokens`, encadenado a `build:css`) y **`npm run check:tokens`**, dentro de `npm run check`, que falla si alguien toca tokens y no regenera el snapshot.

### Verified

Contrastado token a token contra `getComputedStyle` en Chromium, en los 7 temas × 2 modos: **11 266 valores coinciden exactos**. Las 268 diferencias se clasificaron una a una y **ninguna es un valor equivocado** — son las tres formas de «este token no tiene valor», que el navegador representa todas igual (cadena vacía) y el snapshot distingue: 176 cadenas rotas, 76 `initial` y 16 `inherit` desde `:root`.

Las **expresiones** —`color-mix()`, `calc()`, `oklch(from …)`, 261 por tema— quedan sin evaluar a propósito, con todas sus variables ya sustituidas. Van listadas en `expressions` para que quien consuma sepa que son expresiones y no literales.

### Fixed

- **El resolutor daba 281 ciclos falsos** en su primera versión: llevaba un único conjunto de «tokens ya vistos» para toda la resolución, así que un valor como `calc(var(--x) / 2) calc(var(--x) / 2)`, que cita el mismo token dos veces, tomaba la segunda por recursión. El camino tiene que ser **por rama**, no global. Reescrito con recursión, memoria y camino explícito.
- **Denunciaba como rotos tokens que no lo están.** Uno sin declarar pero siempre citado con `var(--x, fallback)` funciona: el fallback es el mecanismo previsto. Ahora se separan los dos casos y solo se reporta el que se usa a pelo.

### Notes

El snapshot encontró **9 referencias rotas de verdad**, que llevaban ahí sin que ninguna regla las viera:

- `--semantic-font-size-sm` — no existe; el nombre real es `--semantic-font-size-body-sm`. Se queda sin valor el tamaño de los botones pequeños y el contador de las listas ordenadas.
- `--primitive-font-weight-black` — no existe. Se quedan sin peso los titulares de sección y el del hero.
- Los siete `--icon-*` (`--icon-logo`, `--icon-check`, `--icon-close`, los cuatro chevrons) — ningún tema los declara, así que el icono del logo de la cabecera, el del check, el del switch y los cuatro de la paginación no tienen imagen.

No se arreglan aquí: son de la capa de tokens, no del snapshot, y merecen su propia tanda con su verificación visual.

**Se apartó del plan en un punto:** el índice inverso *valor → token* iba a guardarse en el fichero y no se guarda. Pesaba 305 KB, es derivable del mapa de temas en una sola pasada, y guardar datos derivados en un artefacto versionado significa que pueden quedarse desfasados por su cuenta. Lo construye en memoria quien lo necesite — el servidor MCP del paso 1.1 y el escáner de deriva del 2.2.

**Se descartó usar un navegador para generar el snapshot**, aunque daría los valores finales ya evaluados: obliga a tener Chromium en la máquina y en CI, y resolviendo la cascada a mano se cubre el 100 % de los dos problemas que motivaban el paso —la cadena de alias y la dimensión de modo— sin instalar nada. El navegador se usó solo para verificar el resultado.

---

## [4.11.0] — 2026-08-31

Coherencia del número de versión en todo el repositorio, y la fila de controles de la cabecera pasa a ser una familia.

### Fixed

- **El número de versión estaba en cuatro sitios y ninguno coincidía.** `package.json` iba por 4.10.0 mientras el escudo del `README.md` decía **4.2.0**, `CLAUDE.md` y `AGENTS.md` decían **v4.1.0** y el paquete raíz de `package-lock.json` seguía en **4.2.0**. Todos al día.
- **«6 themes»** en `README.md`, `CLAUDE.md` y `AGENTS.md`, cuando son 7 desde que existe el tema blueprint — y la home ya decía 7. De paso, `AGENTS.md` y `CLAUDE.md` afirmaban «4 bundle contexts» por tema y `example-01` y `syx-sketch` tienen 5.
- **«The four machine-enforceable rules (R01–R04)»** en `CLAUDE.md`, `AGENTS.md` y `AI_GUIDELINES.md` — la misma afirmación que ya se corrigió en la home en 4.9.1, que se había quedado en los tres ficheros de entrada para agentes. El validador implementa R01–R07; R08 está declarada en `contracts/rules.json` pero no implementada.

- **Los tres controles de la cabecera venían de tres sitios distintos y se notaba.** Medido a 1440: el selector de tema **48 px** de alto (átomo de formulario), el conmutador de modo **36 px** (literales a pelo: `2.25rem`, trazo de 1 px, radio de `0.5rem`) y el botón de GitHub **52 px** (átomo de botón, trazo de 2 px). Tres alturas, tres radios y dos grosores de trazo en una fila con 16 px de hueco: el conmutador quedaba 12 px más bajo que sus vecinos y flotando entre los dos. Ahora los tres miden 44 px y comparten radio y trazo, tomados del botón —que es el control con más presencia, así que los otros dos se acercan a él y no al revés—. La hamburguesa entra en la misma familia: en móvil va pegada al conmutador y medía 40 px contra sus 44.

### Added

- `--component-header-control-height`, `--component-header-control-radius` y `--component-header-control-border-width`. El ajuste vive en la cabecera, no en los átomos: `.atom-select` y `.atom-btn` siguen midiendo lo que miden en un formulario o en el hero.

- **`scripts/check-version.js`** (`npm run check:version`, incluido en `npm run check`). Compara las diez citas de versión contra `package.json` y falla si alguna se descuelga. No toca las citas históricas —«Versions evaluated: SYX v4.2.0» en `why-syx.html`, los «v4.0.0» de `AUDIT_REPORT.md` y `TOKEN-GUIDE.md`— que son correctas tal cual y que un reemplazo masivo ya rompió una vez.

### Notes

Se probó dar la sombra dura también al selector y al conmutador, para que los tres leyeran como una familia de tarjetas levantadas. Se descartó: en oscuro ensucia y, sobre todo, la sombra es la señal de «acción principal» en este tema — repartirla entre los tres la diluye. El botón la conserva en solitario.

Verificado en los 7 temas: los tres controles con la misma altura en todos (44 px, o 50 en `example-03`, que tiene su propia escala). Cero desbordamiento a 1920/1440/1280/768/390, contraste 0/0 en `home.html` y `why-syx.html` en los dos modos, R01–R06 limpias y simetría completa.

---

## [4.10.0] — 2026-08-31

La figura del hero pasa de un alzado plano a un **alzado axonométrico** de la pila de `@layer`, y se levanta al entrar en la página.

### Changed

- **De máscara a imagen.** Una `mask-image` solo transporta **alfa**: toda la figura salía teñida de un único color, así que no podía tener canto, ni relleno, ni acento — que es exactamente lo que la dejaba plana. Como imagen de fondo sí, a cambio de que el tema declare **una versión por modo** en vez de un token de tinte. `--component-hero-figure-color` se retira con la máscara.
- **Dibujo nuevo:** siete placas en isometría con canto, las dos de abajo rayadas a 45° como corte de sección, la de arriba en el azul del tema, tirantes discontinuos a la línea de cota, cota vertical acotada a las siete y marcas de esquina de hoja. Elegir esa proyección no es decorativo: la pila **es** la metáfora de `@layer`.
- **Opacidad de 0,55 a 1** y altura mínima de 26 a 30 rem. El 55 % servía cuando la figura era monocroma y había que bajarle el peso; el dibujo ya trae su propia jerarquía —traza fina y azul pálido para lo secundario— y atenuarlo encima solo lo dejaba lavado.

### Added

- **Entrada al cargar.** El recorte sube desde abajo, así que las placas aparecen **en el orden que manda la cascada**: reset primero, utilities al final. Se anima el recorte y no la opacidad, para no pisar `--component-hero-figure-opacity`. Va dentro de `@media (prefers-reduced-motion: no-preference)`; verificado que con la preferencia activa no hay animación **ni recorte residual** — la figura se ve entera desde el primer fotograma.
- `--component-hero-figure-build-duration` (0,9 s).

### Fixed

- **La curva de entrada era un parpadeo.** Con `--semantic-easing-out` —`cubic-bezier(0.16, 1, 0.3, 1)`— al 30 % del tiempo ya estaba revelado el 85 %, seguido de una cola que no se ve. Medido posicionando la animación con la API de animaciones, no a ojo. En lineal las placas aparecen a ritmo constante, que además es como sale una lámina de un plóter.
- Dos defectos del primer dibujo, vistos al renderizarlo: la línea de cota **abarcaba solo cuatro placas de las siete** —tomaba el vértice trasero también para la de abajo, cuando el punto más bajo es el delantero más su canto— y el rayado en cuatro placas convertía el dibujo en una mancha de textura, sobre todo en oscuro. Ahora la cota abarca la pila entera y solo se rayan las dos de abajo.
- El dato de peso de `why-syx.html`, publicado hace dos versiones, pasa de 44–50 a **43–51 kB con gzip**: las dos versiones de la figura añaden unos 15 kB en crudo al bundle del tema, que comprimen a uno.

### Notes

Verificado en los dos modos a 1920 / 1440 / 1024 / 768 / 390: la figura solo aparece a partir de portátil, cero desbordamiento en todos, contraste 0/0 en `home.html` y `why-syx.html`, R01–R06 limpias y simetría claro/oscuro completa (168 tokens).

---

## [4.9.1] — 2026-08-31

Repaso de veracidad de la sección «Why SYX» de la home y de la página `why-syx.html`. Cada afirmación contrastada contra el repositorio; las de terceros, contra sus notas de versión.

### Fixed

- **Dos totales del ranking no cuadraban con la suma de su propia columna.** Tailwind sumaba 40 y figuraba con 38; Chakra sumaba 36 y figuraba con 34. El orden del ranking no cambia, pero los números sí eran falsos.
- **«~110kb CSS»** salía del bundle mínimo `styles-core.css`, que **no existe en el repositorio** — su fuente `styles-core.scss` no está ni ha estado nunca en el historial, aunque README, CHANGELOG y TOKEN-GUIDE la documenten. Lo que se entrega de verdad son los bundles de tema: 289–346 KB sin comprimir, **44–50 KB con gzip**, que es lo que viaja por la red. Ese es el número que aparece ahora.
- **«Switching theme is a single HTML attribute change» era falso.** Cada tema es un bundle CSS aparte y el conmutador cambia el `href` de la hoja **y** la clase del `<body>`; el `data-syx-theme` es, según el comentario del propio JS, «for reference». La frase dice ahora lo que de verdad pasa: se cambia un enlace de hoja de estilos y ningún componente.
- **«four contract rules (R01–R04)»** se quedó corto: el validador implementa **siete** (R01–R07), y `contracts/rules.json` declara además R08, que no está implementada. También se ha quitado «zero false positives»: no es una propiedad demostrable, y esta misma sesión encontró falsos positivos en el medidor de contraste.
- **El pie se contradecía a sí mismo**: «MIT License» y «All rights reserved» en líneas seguidas. La MIT concede expresamente los derechos que la otra frase se reserva, y el `LICENSE` del repo es MIT, así que sobraba la segunda. Corregido en las tres páginas.
- **Regresión propia de 4.7.0**: el reemplazo masivo de número de versión pisó la línea «Versions evaluated: SYX v4.2.0» de `why-syx.html`, que no es un distintivo de versión actual sino la constancia de qué se evaluó en abril. Hacía que un análisis fechado en abril afirmara haber evaluado una versión publicada en agosto. Restaurada a v4.2.0.

### Changed

- **La nota de versiones dice ahora qué ha quedado atrás.** Desde abril de 2026 han salido **Material UI v9** y **Ant Design v6**; ninguno se ha reevaluado, así que se declara como foto fechada en vez de como ranking vivo. Tailwind CSS v4 y Bootstrap v5 siguen siendo las mayores actuales, y esas etiquetas se quedan.

### Notes

Lo que se comprobó y **estaba bien**: las 7 capas de token (`tokens.json` tiene exactamente `primitives, semantic, component, reset, layout, theme, icon`); «no `!important`» —las seis apariciones en `scss/` son comentarios que dicen que se quitó—; los cuatro mixins citados (`size()`, `absolute()`, `transition()`, `breakpoint()`) existen; `_agents/` trae los cuatro flujos y los ocho modos que la tabla anuncia; `AGENTS.md`, `CLAUDE.md` y `AI_GUIDELINES.md` existen; 7 temas reales; cero dependencias de ejecución.

Dos cosas quedan como criterio tuyo, no como error: la cita del comité sobre el flujo con IA enumera **siete** modos y hay ocho (falta `CREATIVE`), y el 4 sobre 5 en accesibilidad convive con los 331 fallos de contraste que los seis temas de ejemplo siguen acumulando.

---

## [4.9.0] — 2026-08-31

Repaso de los seis temas de ejemplo. Salieron dos cosas: una **rota de verdad** y una de arquitectura de color.

### Fixed

- **El botón de modo oscuro no hacía nada en 6 de los 7 temas.** Hay dos entradas al modo oscuro —la media query del sistema y el `[data-theme="dark"]` manual— y `example-01` a `example-05` solo llamaban a `dark-mode-tokens()` en la primera. Con el sistema operativo en claro, pulsar "oscuro" cambiaba cuatro acentos y dejaba la página clara: el modo oscuro solo se veía si el sistema ya estaba en oscuro, o sea justo cuando el botón no hace falta.

  `example-06` era peor: reasignaba los fondos a mano pero **no los colores de texto**, así que en esa misma situación quedaba texto casi negro sobre fondo casi negro — **1,18:1**, ilegible. Ahora 16,55:1. Verificado en los siete temas: los siete responden al botón.

- **Los roles de marca no sirven de texto, y no por descuido de un tema.** Los `*-500` están todos a luminosidad OKLCH 0,60, que es el punto de cruce: **~4,0:1 contra blanco y ~4,3:1 contra tinta**, así que no llega a 4,5 en ninguna de las dos direcciones. Medido: **11 de los 18 roles de marca de los seis temas no valen de texto sobre ningún fondo**, y de ahí salía el **92 % de sus 463 fallos de contraste**.

### Added

- **`--semantic-color-*-text`**, la variante de tinta de cada rol de marca. Se **deriva** del propio color con sintaxis de color relativa —misma tonalidad, mismo croma, solo cambia la luminosidad— en vez de elegir a mano un peldaño de la rampa, que saltaba de familia y habría cambiado la marca (el azul de `example-01` acababa en morado). Los rellenos no se tocan.

  Va dentro de `@supports`: donde no haya sintaxis de color relativa no se declara nada y el token se queda con el valor de hoy. Nunca deja texto sin color.

- **`--semantic-brand-text-lightness`** (0,45 sobre claro, 0,80 sobre oscuro). Es un token porque no todos los temas parten de fondo claro: `example-03`, `-04` y `-05` son oscuros ya en su modo base y ahí la tinta tiene que ir hacia arriba aunque no sea "modo oscuro".

- **El guardián de simetría ahora cubre los temas sin mixin propio.** Antes los saltaba con un "se omite" y por eso nadie vio el fallo del oscuro manual en cinco temas. Comprueba que las dos entradas al oscuro activen, contando llaves en vez de fiarse de la indentación.

### Notes

Contraste de los seis temas: **463 → 331**. Lo que queda son otras dos causas, ya separadas y medidas, que no entran en esta tanda:

- **Texto oscuro sobre relleno de marca** (cabeceras de tabla, botones rellenos, píldoras numeradas): ~90 fallos. Falta el token simétrico, una tinta *para ir encima* del color de marca.
- **`--semantic-color-text-secondary` demasiado claro** en `example-01` (3,65:1) y `example-05` (4,36:1): ~150 fallos. Es un valor concreto de cada tema, no un fallo de arquitectura.

`home.html` y `why-syx.html` siguen a 0/0 con el tema blueprint en los dos modos a 1440/768/390. Cero desbordamiento y desfase de cabecera 0 en los 7 temas. R01–R06 limpias, 31/31 bundles.

---

## [4.8.0] — 2026-08-31

Revisión de rejilla y aprovechamiento del espacio, medida antes de tocar nada. Había **tres anchos de contenido conviviendo** en la misma página sin relación entre sí, y la cabecera no compartía columna con el contenido.

### Changed

- **La columna sube de 1200 a 1440 px.** Con 1200, una pantalla de 1920 usaba el 63 % y una de 2200 el 55 %. Ahora 75 % y 65 %. Las tarjetas de característica pasan de 373 a 464 px y sus títulos dejan de partirse en dos líneas.
- **El suelo de la canaleta crece con la pantalla**, `clamp(1.5rem, 3.5vw, 4.5rem)` en vez de `1.5rem` fijo. Con el mínimo de móvil clavado y la columna a 1440, un portátil de 1440 dejaba el logo y el botón de GitHub tocando el borde.
- **Canaleta común entre rejillas** (`--component-grid-gutter`). Las tarjetas iban a 16 px y los temas a 24, así que las columnas de dos secciones seguidas no cuadraban.

### Fixed

- **La cabecera no compartía columna con la página.** Llevaba `padding: 0 40px` fijo mientras las secciones se centran en su columna: **320 px de desfase a 1920 y 460 a 2200**. El logo flotaba en la esquina sin ninguna relación con el título de la primera sección. Ahora usa la misma canaleta; medido a trece anchos de 1024 a 2400, el desfase es 0 en todos. Los otros seis temas no cambian: en ellos el token vale exactamente lo que valía el literal.
- **Cinco topes de ancho escritos a mano** que no tenían relación con `--layout-max-width`: `72rem` (1152 px) en las rejillas de tarjetas y de temas, `64rem` (1024 px) en la pila de capas, y otros dos `72rem` en el pie y en la sección de capas. La sección de capas dejaba 176 px muertos a la derecha; las rejillas, el pie y las capas, 288. La columna la fija la página, no cada rejilla.
- **Las filas de la pila de capas no compartían rejilla.** La columna de la insignia iba en `auto`, así que cada fila la medía por su propio texto —89, 114, 132 y 155 px— y la descripción arrancaba en cuatro sitios distintos, con 25 px de salto entre filas contiguas. Ahora la columna tiene ancho de token.
- **`auto-fill` no sabe parar.** Al ensanchar la columna, las 6 tarjetas caían en **4+2** y los 7 temas en **5+2**, con huecos. El mínimo de cada rejilla lleva ahora un suelo dinámico —la parte que le tocaría a una columna del reparto deseado—, así que una columna de más nunca cabe: 3+3 y 4+3 desde 1200 px hasta cualquier anchura, y degradan a 2 y a 1 al estrecharse.
- **La descripción de cada capa llegaba a ~160 caracteres por línea** con la columna nueva. Medida de lectura a 75ch.

### Notes

`layout-grid`, la rejilla de 12 columnas del sistema, **no se usa ni una vez en la home**: cada organismo declara la suya. De ahí venían los tres anchos. Esta tanda los alinea a todos contra la misma columna, pero la unificación de raíz —colgar los ocho organismos de `layout-grid`— sigue pendiente y probablemente pida cambios en el HTML.

Sin regresiones: contraste 0/0 en `home.html` y `why-syx.html` en claro y oscuro a 1440/768/390, `docs.html` estable en 14/18, cero desbordamiento en las 18 combinaciones, R01–R06 limpias, simetría completa, 31/31 bundles.

---

## [4.7.0] — 2026-08-31

Rediseño **sin tocar una línea de HTML**: todo sale de CSS moderno —subgrid, container queries, contadores y máscaras— sobre el marcado que ya había.

### Added

- **Subgrid en las tarjetas de característica.** Las tarjetas de una misma fila comparten ahora la rejilla del contenedor, así que icono, título y cuerpo se alinean entre columnas aunque un título ocupe dos líneas y el de al lado una. Verificado: los tres títulos de la primera fila arrancan en 1650 px y los tres cuerpos en 1739.
- **Container query en la rejilla de tarjetas.** La tarjeta ajusta su relleno según el ancho de SU contenedor, no el de la ventana: la misma tarjeta se comporta bien en una rejilla de tres y en una de una sin media queries nuevas.
- **Numeración de sección con cota**, con contadores CSS: `SEC 01`, `SEC 02`… en versalita monoespaciada sobre una regla que cruza la columna, con un tope vertical al final. Es un `::before` y un `::after` de la cabecera; el HTML no cambia y el número se recalcula solo si se reordenan las secciones.
- **Figura técnica en el hero.** El hueco de la derecha —el hero era una columna centrada con media pantalla vacía— lleva un alzado acotado de la pila de `@layer`: siete barras, las tres primeras rayadas a 45° como un corte de sección, línea de cota con flechas, tirantes a cada barra, marcas de registro y marcas de esquina de hoja. Va como **máscara**, no como imagen, así que la tiñe un token y sigue al modo claro/oscuro sola. Es decorativa: vive en un `::after` y no la ve un lector de pantalla. Solo aparece a partir de portátil.
- `--component-pill-gap`: hueco entre el icono y el texto de una píldora. No existía, así que cualquier `.atom-icon` dentro de una píldora se pegaba a la primera letra.
- `--semantic-color-state-warning-text`, separado del ámbar de relleno.
- Valores por defecto para los doce `--component-docs-badge-*`.

### Fixed

- **La escala de puntuación de `why-syx.html` tenía un peldaño que no cumplía AA.** `blue-400` es la zona muerta de la rampa: 3,79:1 con blanco y 4,35:1 con tinta —no pasa con NINGÚN color de texto— y el paso 4 estaba justo ahí. En claro el 4 sube a `blue-500` (6,76:1) y el 5 a `blue-700` (10,86:1); en oscuro suben a `blue-300` (7,38:1) y `blue-200` (10,54:1). El comentario del fichero afirmaba "todos por encima de 4,5:1" y era falso; ahora dice el peor caso medido.
- **El ámbar de estado como TEXTO daba 3,2:1** sobre claro, y lo usaban la etiqueta y el mensaje de `mol-form-field--is-warning`. Sirve como relleno, no como tinta: el texto tiene ahora su propio tono (5,21:1) y se cae al de siempre si un tema no lo define.
- **Un `<code>` con `.syx-text-white` quedaba en 1,16:1.** La pastilla trae su propia pareja fondo+tinta y la utilidad solo cambiaba la tinta: blanco sobre pastilla pálida. Dejarla transparente tampoco valía —en oscuro las baldosas de color son claras—, así que la pastilla reafirma su pareja y se lee sobre cualquier baldosa, en los dos modos.
- **Los doce tokens `--component-docs-badge-*` vivían solo dentro de `syx-sketch`.** `docs.html` con cualquier otro tema se quedaba con las insignias de capa sin pintar. Ahora tienen valor por defecto en la capa de componente, hecho con roles semánticos.
- **La cota de la sección 02 se quedaba corta.** La dibuja el `::before` de la cabecera, y la cabecera de `org-home-tokens` llevaba `max-width: 52rem`: la regla medía 832 px mientras las de las demás secciones cruzaban 1200. La medida de lectura pasa a los hijos de texto; la cabecera cruza la columna entera.

### Notes

Sobre el `::after` del hero hubo dos fallos que conviene dejar escritos, porque los dos son sutiles:

- El `display` estaba en el bloque de la media query y la regla base se emitía **después** con la misma especificidad (0,1,1), así que ganaba siempre y la figura se quedaba en `none`. Ahora el breakpoint se anida dentro de la propia regla y el orden de origen deja de importar.
- `grid-row: 1 / -1` **no** abarca la rejilla: la línea `-1` es el final de la rejilla EXPLÍCITA, y aquí solo hay columnas declaradas. Con las siete filas implícitas, `-1` resolvía a la línea 1 y la figura ocupaba una sola fila.

Contraste verificado sobre píxeles renderizados, en claro y oscuro, a 1440 / 768 / 390: `home.html` y `why-syx.html` a **0 fallos en las seis combinaciones**; `docs.html` baja de 19 a 14 en claro y se queda en 18 en oscuro. Cero desbordamiento horizontal en las 18 combinaciones. R01–R06 limpias, simetría claro/oscuro completa (167 tokens), 31/31 bundles.

El lector de contraste de esta tanda también se corrigió: tomaba el color modal de la caja entera, y para un elemento recortado por un contenedor con `overflow` muestreaba zona no pintada, dando falsos 1,00:1. Ahora recorta contra cada ancestro con `overflow` antes de muestrear.

---

## [4.6.1] — 2026-08-31

### Fixed

- **El modo claro forzado estaba roto.** El bloque de oscuro redefine **166 tokens** y `:root[data-theme="light"]` solo revertía **17**. Consecuencia: con el sistema operativo en oscuro, pulsar el toggle a claro dejaba la página a medias —fondo blanco, pero telón del hero, tarjetas, píldoras, chips de código y botones todavía en valores de oscuro—, ilegible. Solo se veía el diseño claro real si el sistema ya estaba en claro, así que quien tuviera el equipo en oscuro nunca llegaba a verlo.

  El arreglo es estructural, no un parche: los valores claros dependientes de modo salen a un `@mixin syx-sketch-light-tokens`, simétrico al de oscuro, y se aplican en dos sitios — `:root` (estado por defecto) y `:root[data-theme="light"]` (elección explícita). Una sola fuente para los dos.

- `--component-pill-dark-bg`, `-color` y `-border-color` se referenciaban desde `_pill.scss` pero nunca llegaron a declararse, así que `.atom-pill--dark` se quedaba sin fondo en modo claro.

### Added

- **`scripts/check-theme-symmetry.js`** (`npm run check:themes`, incluido en `npm run check`). Compara token a token el bloque claro y el oscuro de cada tema y falla si el oscuro cambia algo que el claro forzado no revierte. Ninguna regla R01–R08 detectaba esto: token a token, todo era válido; el fallo estaba en lo que *faltaba*.

---

## [4.6.0] — 2026-08-31

Recorrido comparando claro y oscuro tramo a tramo. El modo oscuro no estaba mal de contraste —eso ya se había medido— sino de **estructura**: todo se aplanaba contra la página.

### Fixed

- **El modo oscuro no tenía escalera de elevación.** Las tarjetas usaban `bg-primary`, o sea EL MISMO color que la página, y las secciones alternas quedaban más claras que las tarjetas: la jerarquía estaba plana y, a ratos, invertida. En claro el lenguaje se sostiene solo con el trazo —papel blanco, caja dibujada encima—, pero en oscuro una línea gris sobre fondo gris no separa nada. Ahora la profundidad viene de la luminosidad: página 0.221 → sección alterna 0.265 → tarjeta 0.305 → franja CTA 0.355, con los bordes un paso más claros y la sombra dura aclarada para que el "papel levantado" se lea igual que en claro.
- **La franja del CTA se fundía con la página.** En claro es la isla oscura sobre papel blanco; en oscuro el salto de luminosidad disponible es mucho menor, así que además de subir al escalón más alto lleva un trazo de 2 px arriba y abajo.
- **`atom-pill--dark` usaba el rol `inverse`** — tercera aparición del mismo patrón, tras `.atom-code` y `.syx-bg-dark`. El "inverso" de una página oscura es claro, así que una píldora llamada *dark* salía CLARA sobre fondo oscuro.
- **Las píldoras `warning` y `danger` no tenían adaptación a oscuro** y conservaban su tinte claro: en `docs.html` los chips `ORG` y `PAGE` se leían como pegatinas encendidas sobre la tabla oscura.
- **El check del selector de tema era negro sobre círculo negro** en modo oscuro: `--component-theme-card-check-bg` apuntaba a `bg-primary`. El círculo se pinta sobre la muestra de color de la tarjeta, no sobre la página, así que ahora es un valor literal.
- **El chip de código en línea desaparecía dentro de las tarjetas** una vez subidas: quedaba al mismo tono. Sube un escalón más y se tiñe de azul.
- `.syx-bg-dark` seguía apuntando a `bg-inverse` (la corrección de 4.4.0 no llegó a aplicarse por un reemplazo fallido en silencio).

### Notes

Contraste final, verificado sobre píxeles renderizados: `home.html` y `why-syx.html` a **0 fallos en claro y en oscuro**; `docs.html` en 19/17, todos en los cuadrados de muestra que documentan las propias utilidades. Cero desbordamiento horizontal en las 12 combinaciones de página × anchura. R01–R04 a 0, 31/31 bundles.

---

## [4.5.0] — 2026-08-31

Todo lo de esta versión sale de recorrer el sitio a mano, pantalla por pantalla, en escritorio, tablet y móvil, y de usarlo: abrir el menú, cambiar de tema, tabular, pasar el ratón.

### Fixed

- **Los iconos medían 8×8 px en móvil.** `--component-icon-size-*` apuntaba a `--semantic-space-component-*`, que es una escala FLUIDA de 8–16 px. Los comentarios ya decían 16/24/32/40; ahora los valores lo cumplen. Los iconos del menú móvil eran motas.
- **La escala tipográfica grande no era fluida.** El paso `4xl` iba de 61 px a 68,7 px: un 12 % de recorrido entre un móvil de 390 px y un monitor de 1440. Un h1 de 61 px en una columna de 350 px no cabía y se salía del contenedor. Ahora `4xl` va de 40 a 67 px, `3xl` de 34 a 51 y `2xl` de 30 a 41. Los pasos pequeños no se tocan: ahí el rango corto era correcto.
- **`word-break: break-word` en los hijos del grid** partía palabras por la mitad aunque cupieran enteras en la línea siguiente ("Theme Architect / ure"). Es un valor obsoleto que se comporta como `overflow-wrap: anywhere`. Sustituido por `word-break: normal` + `overflow-wrap: break-word`, que solo parte cuando no hay alternativa.
- **Las tablas se comprimían en vez de hacer scroll.** Sin `min-width`, el navegador estrujaba las columnas hasta dejarlas en una palabra por línea antes de permitir desplazamiento. Con un suelo de 44rem la tabla mantiene su forma y el contenedor se desplaza. Añadido además un aviso visual de scroll con el truco de sombras de `background-attachment: local`, que aparece y desaparece solo, sin JavaScript.
- **Los badges de paso (01–04) se estiraban a 292 px** en móvil: como hijos de un grid de una sola columna pasaban de ser un chip de 28 px a una barra a todo lo ancho. `justify-self: start`.
- **La clase del `<body>` no seguía al tema.** Al cambiar de tema, `body` y hoja de estilos se contradecían. También `data-syx-theme` del `<html>` seguía diciendo `example-01` en las tres páginas.
- **`docs.html`: cinco enlaces equivalentes con cinco tratamientos de botón distintos** (relleno azul, relleno menta, dos contornos de colores y otro contorno). Unificados. Contadores a 7 temas.
- El comando de compilación del CTA de la home seguía apuntando a `example-01`.

### Notes

Dos cosas que parecían fallos y no lo eran, comprobadas antes de tocar nada: el scrim del menú móvil **sí funciona** (muestreo de píxeles: 126,126,126 = blanco al 50 %), y el "negro" bajo el theme-builder en las capturas es un artefacto de fotografiar a página completa un layout de `100vh`, no contenido perdido. Los botones del hero en móvil miden 190 y 191 px: la diferencia que parecía haber era la sombra.

`theme-builder.html` usa su propio tema y queda fuera de este trabajo. `example-03` es un tema oscuro con serif por diseño, pero le faltan los ficheros de Playfair Display en `fonts/`, así que cae a Georgia sin avisar — mismo caso que Inter en los demás `example-*`.

---

## [4.4.0] — 2026-08-31

### Added

- **`docs.html` y `why-syx.html` usan el tema Blueprint.** El sitio dejaba de ser coherente en cuanto pulsabas "Docs".
- **Tarjeta del tema Blueprint** en la rejilla de temas de la home, con muestra propia (papel + retícula, la única sin degradado). Contadores actualizados a 7 temas y tarjeta activa desacoplada de `example-01`.
- **`main` y enlace de salto en `home.html`.** Las otras dos páginas ya los tenían.
- **Utilidades que faltaban y se usaban igualmente:** `.syx-text-white`, `.syx-text-gray`, `.syx-text-muted`, `.syx-bg-white`, `.syx-bg-dark`, `.syx-bg-gray-50/100/200`, `.syx-font-bold`, `.syx-font-medium`. `docs.html` las invocaba 100+ veces sin que existieran.
- **Tokens de sintaxis del código** (`--component-code-syntax-*`), **de botón deshabilitado** (`--component-button-disabled-*`), **de badge de docs**, **de escala de puntuación** y de **columna de contenido** (`--component-section-padding-inline/-block`).

### Changed

- **Pasada de diseño sobre el tema:** hero y cabeceras de sección alineados a la izquierda dentro de una columna de 75rem centrada; escala de espaciado de layout ampliada (el sistema ya separaba layout de componente para esto, así que las secciones respiran el doble sin inflar los componentes); titulares de sección un punto por debajo para que el hero mande; rejilla de temas de 5+1 a 4+3.
- **Escala 1–5 de `why-syx.html`**: de cinco colores distintos con texto blanco (2,45:1 en el peor caso) a una secuencial de un solo tono, que se lee por intensidad y funciona en escala de grises. La rampa se invierte en modo oscuro, porque sobre fondo navy lo intenso es lo claro.
- **Badges de capa de `docs.html`**: de cuatro colores HSL sueltos a una secuencia neutro → azul creciente que sigue la jerarquía real.
- **Breakpoints primitivos en `em`**, para cuadrar con `$syx-breakpoints`, que ya lo estaba.
- **Colores de estado en modo oscuro** subidos de luminosidad: `dark-mode-tokens()` los deja intactos a propósito, lo cual es correcto para un fondo pero no para utilidades como `.syx-text-error`, que los usan como color de texto (2,83:1 sobre navy).

### Fixed

- **`--semantic-color-disabled-bg` y `--semantic-color-disabled-border` no existen.** Una custom property inexistente invalida la declaración entera, así que el botón deshabilitado con relleno quedaba en fondo transparente con texto blanco: **invisible sobre página clara, en los 7 temas**.
- **El bloque de código se invertía en modo oscuro.** `.atom-code` usaba `--semantic-color-bg-inverse` / `-text-inverse`; en una página oscura el "inverso" es claro, así que el bloque se volvía blanco y los colores de sintaxis desaparecían. Mismo fallo en `.syx-bg-dark`.
- **Los colores de sintaxis salían de los roles de marca** (primary/secondary/tertiary), pensados para el fondo de la página, no para el del código. Con un tema de marca oscura, `--val` era el mismo navy del fondo.
- **`example-01`: seis tokens semánticos con la luminosidad clavada en `0.60`** (3 fondos + 3 bordes), en contra de sus propios comentarios. El `<body>` salía gris medio. Corregir esos seis valores elimina 319 de los 400 fallos de contraste de `docs.html`. Los `*-500` de la capa de primitivos SÍ están a 0.60 a propósito y no se han tocado.
- **La cabecera anulaba el anillo de foco** (`outline: none` en sus cuatro reglas `:focus-visible`), dejando solo un subrayado idéntico al hover y por debajo del área que pide WCAG 2.2 (2.4.11). El anillo va ahora en reglas de foco propias, no compartidas con `:hover`.
- **Sliders del theme-builder con 4 px de área de pulsación** (WCAG 2.5.8 pide 24) y sin foco visible.
- `.syx-skip-link` y `--semantic-color-border` (token inexistente) en los estilos embebidos de `docs.html`.
- Los dos selectores de tema de `docs.html` daban nombres distintos a los mismos temas.

### Notes

Contraste verificado renderizando y muestreando los píxeles reales de cada caja, no leyendo el CSS: es la única forma de ver fondos pintados por `::before`, degradados y retículas. Resultado en las tres páginas del tema: **620 → 38 fallos**; `home.html` y `why-syx.html` a **0** en claro y en oscuro. `theme-builder.html` usa su propio tema y queda fuera de este trabajo (78 fallos sin tocar).

**Corrección a la auditoría previa:** el hallazgo de WCAG 1.4.4 (la cabecera desbordando con el texto al 200 %) era un **falso positivo**. Se simuló con `html{font-size:32px}`, que no mueve la base `em` de una media query. Con el tamaño de fuente por defecto del navegador a 32 px —el caso real— la nav colapsa a hamburguesa y el desbordamiento es 0. Igualmente, el aviso de que `example-02…05` compartían el bug de luminosidad era **incorrecto**: solo afecta a `example-01`.

---

## [4.3.0] — 2026-08-31

### Added

- **Tema `syx-sketch` ("Blueprint")** — nueva dirección visual del sitio, ahora el tema por defecto de `home.html`. Papel claro, trazo de tinta, sombra sólida sin difuminado, radios casi nulos, cero degradados decorativos y retícula de papel milimetrado. Paleta del portfolio de José Luis Pizarro en OKLCH (azul eléctrico `#1E3AFF` primario, menta `#3BC9A7` secundaria). Tipografía: Space Grotesk en las 5 variables. Incluye `setup.scss` y los 5 bundles.
- **Capa de tokens de movimiento** (`semantic/_motion.scss`) — `--semantic-duration-{instant,fast,base,slow}`, `--semantic-easing-{standard,out,in-out,linear}` y el anillo de foco (`--semantic-focus-ring-{width,offset,style}`), con guarda `prefers-reduced-motion`. Hasta ahora cada componente escribía sus propias duraciones (`0.15s` / `0.2s` / `0.25s` / `0.3s`) y ningún tema podía intervenir en el ritmo.
- **Sombras duras y retícula** (`semantic/_shadows.scss`) — `--semantic-shadow-hard{,-sm,-lg}` y `--semantic-bg-grid`, apagada por defecto (`--semantic-bg-grid-color: transparent`).
- **Escala de z-index** (`semantic/_spacing.scss`) — `--semantic-z-index-*`, para sustituir literales como el `9999` del skip-link.
- **Tokens de componente nuevos**: `components/_cards.scss` (feature-card, theme-card, code-snippet), `_pills.scss` (pill, feature-icon), `_surfaces.scss` (blockquote, hr, code, tabla base) y `_sections.scss` (organismos `home-*`: telón del hero, fondo del CTA, capas, diagrama de tokens, footer). 316 tokens registrados en `tokens.json`.
- **`scripts/build-lucide-tokens.js`** — regenera los tokens de icono Lucide incrustando los SVG como data URI.

### Changed

- **Los iconos se pintan con `mask-image` + `background-color: currentColor`**, no con `background-image`. Antes eran SVG externos con el color dentro del fichero: siempre negros, invisibles sobre fondo oscuro en los 6 temas. Los modificadores `--color-*` pasan de `filter:` (aproximaciones calculadas a ojo) a color exacto vía `--component-icon-color`.
- **Iconos Lucide incrustados como data URI** (~17 KB). Chrome bloquea una máscara SVG de otro origen y con `file://` cada fichero es un origen opaco: el sitio abierto en local se quedaba sin iconos. Los SVG de `img/icons/lucide/` siguen siendo la fuente de verdad.
- **Atoms, molecules, organisms y base reconectados a tokens**: sombras, radios, bordes, duraciones, anillos de foco y paletas de variante dejan de estar escritos a mano. Los valores por defecto reproducen el aspecto anterior, así que `example-01…06` no cambian.
- Cabecera de `_icon-lucide.scss`: la licencia de Lucide es **ISC**, no Apache 2.0.

### Fixed

- **Ningún `bundle-*.scss` compilaba, en ninguno de los 6 temas.** `themes/_shared/_core.scss` y los `_shared/bundle-*.scss` no importaban nada (los mixins se resuelven en el fichero que los declara), y además `_core.scss` invocaba 13 helpers eliminados al migrar las clases `.syx-*` a `utilities/`. Los 30 bundles existentes compilan ya; con los 5 nuevos, 31 de 31.
- **R03** — última `transition:` en crudo (`organisms/_home-tokens.scss:66`). R01–R04 quedan a 0 violaciones.
- **R01** — 12 primitivos usados dentro de `organisms/_home-layers.scss` y 24 valores `oklch()` en `molecules/_theme-swatch-card.scss`.
- Prefijo no oficial `--mol-*` (R07) en `_btn-group.scss` y `_label-group.scss` → `--component-*`.
- Valores de custom property partidos en varias líneas: invisibles para cualquier parser por líneas, incluido `syx-validate.js` (R06).
- `atoms/_code.scss` usaba `--semantic-border-radius-md`, que no existe en la escala (sm / default / lg / xl / 2xl) y resolvía a 0.
- `base/_reset.scss`: dos `box-shadow: 0 0 0 rgb(255,255,255)` sin efecto en `a:focus` y `button:focus`.
- `atoms/_breadcrumb.scss` tomaba su color de foco de `--component-form-field-border-focus` (acoplamiento indebido a formularios).

### Known issues

- **`example-01…05`: la luminosidad de varios tokens está fijada a `0.60`.** Afecta a `bg-secondary`, `bg-tertiary`, `bg-inverse` y a los tres `border-*`. Los comentarios contradicen los valores (`// deep indigo-black` sobre un gris medio). Consecuencia visible: el `<body>` de esos temas se pinta gris medio. No corregido para no alterar temas fuera del encargo.
- `example-01…06` declaran `@font-face` de **Inter**, pero `fonts/` solo contiene Space Grotesk y Syne: la fuente cae al system font sin avisar.

---

## [4.2.0] — 2026-04-03

### Added

- **`CLAUDE.md`** — tool-specific entry point for Claude Code; loads `AI_GUIDELINES.md`, contracts layer, and routes to the mode system
- **`AGENTS.md`** — agnostic entry point for OpenAI Codex, Cursor, GitHub Copilot, Windsurf and any other AI tool; self-contained with base rules, token tier contract, and workflow references
- **`_agents/modes/` — mode system (6 modes):**
  - `ux.md` — UX consultant mode: component selection, semantic HTML, accessibility, interaction states. Never writes SCSS.
  - `ui.md` — Senior SCSS developer mode: token-compliant code generation, pre-flight contract checklist, mixin enforcement
  - `token.md` — Token architect mode: 4-tier token design, naming conventions, `tokens.json` registry management
  - `theme.md` — Theme designer mode: OKLCH scale generation, `_theme.scss` authoring, dark mode inversion rules, mandatory surface token checklist
  - `audit.md` — QA reviewer mode: full R01–R08 inspection, structure/naming/mixin compliance, structured verdict reports
  - `migrate.md` — Migration specialist mode: legacy variable resolution using `lint-contract.json`, per-variable impact analysis and replacement workflow
- **`_agents/modes/README.md`** — mode system documentation with activation syntax, boundary definitions, and recommended multi-mode workflow

### Changed

- **`home.html` — AI First section:**
  - "Agent-native workflows" card updated to list all 4 workflows by name and document the mode system with all 6 prefixes
  - "AI-native documentation" card updated to feature `AGENTS.md` and `CLAUDE.md` as primary entry points with tool-agnostic framing
- **`README.md`** — version badge → 4.2.0, Status section and docs table updated to reflect new files

---

## [4.1.0] — 2026-03-03

### Added

- **AI First contracts layer** (`contracts/`) — machine-readable validation surface:
  - `contracts/rules.json` — 4 enforceable rules (R01–R04) with allowedIn/exceptions
  - `contracts/lint-contract.json` — last validation output (violations, phantom tokens, legacy vars with keep/migrate/kill classification)
  - `contracts/validation-report.md` — human-readable audit report
  - `contracts/usage-map.json` — token usage frequency across SCSS files
- **`scripts/syx-validate.js` v2** — unified validation script; cross-checks runtime CSS vs `tokens.json`, enforces R01–R04, classifies 279 legacy vars, generates all contracts in one pass (`--report` flag)
- **`component-registry.json`** — machine-readable component inventory (atoms, molecules, organisms)
- **`_agents/workflows/`** — agent-native workflow files: `/create-component`, `/create-theme`, `/audit-tokens`, `/update-changelog`
- **`--semantic-font-weight-black`** — new semantic token (`font-weight: 900`) for hero/display text in `_typography.scss`
- **`--semantic-color-state-{focus,success,error,warning,info}`** — state feedback aliases added to `_colors.scss`
- **`--semantic-color-border-focus`** — focus border alias added to `_colors.scss`
- **`--component-form-field-min-height`** — canonical token added to `tokens.json` (replaced deprecated `--component-form-field-height`)
- **`home.html` — AI First section** — new `#ai-first` section with 6 feature cards, validation badge, and nav links (desktop + mobile)

### Changed

- **R01 rule re-scoped** — `--primitive-*` ban now correctly excludes `scss/abstracts/`, `scss/themes/`, `scss/base/`, `scss/utilities/`, `scss/pages/` and intentional palette-tint files (`_feature-icon`, `_pill`, `_code-snippet`, `_home-layers`)
- **Atoms migrated to semantic tokens** — `_breadcrumb`, `_check`, `_code`, `_pill`, `_radio`, `_list`, `_pagination`, `_stat-counter`: all primitive typography/color tokens replaced with semantic equivalents
- **Organisms migrated** — 34 pattern replacements across `_home-*` and `_site-header.scss` (font-weight-black, font-size-sm, font-size-xs, letter-spacing-wide, font-family-mono)
- **`_site-header.scss` R04 fixes** — raw `position: sticky/fixed` replaced with `@include sticky()` / `@include fixed()` SYX mixins
- **`AI_GUIDELINES.md`** — rewritten with contracts layer reference table, R01–R04 rules, new semantic token tables, agent workflows, and updated mixin cheatsheet (now includes sticky/fixed)
- **`README.md`** — version badge → 4.0.0, AI First added to features list and docs table, status updated to March 2026

### Fixed

- **R02 (!important) violation** — `display: none !important` removed from `_site-header.scss:194`
- **R03 (raw transition:) violations** — `_accessibility.scss` and `_reset.scss` correctly excluded as architectural exceptions
- **R04 violations** — `_display.scss` utility classes (`syx-pos-*`) and `_accessibility.scss` skip-link correctly excluded

### Validation result

```
✅ R01 — Primitive tokens in components:  0 violations
✅ R02 — !important usage:                0 violations
✅ R03 — Raw transition::                 0 violations
✅ R04 — Raw position::                   0 violations
⚠️  R06 — 1 phantom token (pending npm run build)
Result: ⚠️ PASSED WITH WARNINGS
```

---

## [3.0.4] — 2026-02-26

### Added

- **`home.html`** — New landing page for the SYX Design System showcasing the architecture, tokens, and thematic capabilities.
- **`why-syx.html`** — New competitive analysis page evaluating SYX against Tailwind CSS, Material UI, Chakra UI, and Ant Design across 7 enterprise sectors and disciplines by an expert committee.
- **Organisms expansion** — Added 8 major organism components specifically for the documentation site (`org-home-hero`, `org-site-header`, `org-home-footer`, etc.).

### Changed

- **Unified Documentation** — Consolidated `docs-foundation`, `docs-components`, etc., into a single, unified `docs.html` page fully translated into English.
- **Component Inventory Update** — Reflected the new reality of the system across documentation constraints (20 atoms, 7 molecules, 8 organisms).
- **Navigation** — Implemented a modern, responsive navigation drawer and desktop header with theme switcher and dark mode persistence across `home.html`, `docs.html`, and `why-syx.html`.

---

## [3.0.3] — 2026-02-26

### Fixed

- **`line-height` bug in 10 utility classes** — `.syx-font-size-1..5` (`_font-sizes.scss`) and `.syx-font-scope-1..5` (`_fonts.scss`) were setting `line-height: var(--font-size-X)` — equal to the font size itself, producing zero vertical rhythm. Now uses inverse-scaled unitless primitives: small sizes → `var(--primitive-line-height-normal)` (1.5), mid → `var(--primitive-line-height-snug)` (1.2), largest → `var(--primitive-line-height-tight)` (1). The `calc(N% + var(--font-size-X))` pattern in responsive blocks was also removed from `line-height` (percentage operand on a dimensional value produces incorrect results).
- **Universal `* { color }` selectors removed from `_backgrounds.scss`** — Four instances of `* { color: … }` in `.syx-bg-color-black` and `.syx-bg-color-primary` blocks replaced by direct `color` on the container element. CSS cascade handles natural inheritance; components with their own color tokens are unaffected.
- **Breakpoints standardised to `em` across 5 files** — 21 occurrences of `min-screen(Npx)` replaced with `em` equivalents (768px→48em, 1024px→64em, 1280px→80em, 1440px→90em) in: `_backgrounds.scss`, `utilities/_text.scss`, `utilities/_display.scss`, `base/helpers/_spacers.scss`, `layout/grids/_grid.scss`.
- **`atom-table--resp` standalone selector added to `_table.scss`** — The `&--resp` modifier was only available nested inside `.atom-table`. A standalone `.atom-table--resp` selector was added (outside the block) so a wrapper `<div>` can use the class without also needing the base `atom-table` class.
- **`index.html` accessibility QA** — Full WCAG AA audit applied:
  - `<div id="main-content">` promoted to `<main>` landmark
  - Check, Switch and Radio groups wrapped in `<fieldset>` + `<legend>`
  - `scope="col"` added to all `<th>` elements; `aria-label` added to `<table>`
  - Generic IDs (`i1–i4`, `c1–c3`, `s1–s3`, `r1–r3`) renamed to descriptive values
  - `type="button"` added to all `<button>` elements in pagination and `mol-btn-group`
  - Decorative Lucide icons receive `aria-hidden="true"`; meaningful icons receive `role="img"` + `aria-label`

---

## [3.0.2] — 2026-02-25

### Fixed

- **`@layer` order declaration hoisted to `universal-values()`** — The canonical `@layer syx.reset, syx.base, …` declaration was previously placed directly inside entry-point files (`styles-core.scss`, `styles-theme-*.scss`). It is now emitted as the **first CSS rule inside `universal-values()`** in `themes/_base/_universal.scss`. This guarantees it appears at the top of the compiled output before any `@include` call emits component CSS, regardless of which entry point is compiled.
- **`base/_elements.scss` wrapped in `elements-base()` mixin** — Previously the `@layer syx.base { … }` block was at module top-level, causing it to be emitted during the `@use` phase. Now correctly wrapped in `@mixin elements-base($theme: null)` and called explicitly from each entry point via `@include elements-base($theme)`.
- **`.syx-theme-switcher` moved inside `org-navbar()` mixin** — The `.syx-theme-switcher` block was a standalone top-level block outside the mixin in `organisms/_navbar.scss`. Moved to the correct position inside `org-navbar()`.
- **Duplicate `@layer` declarations removed** — Entry points (`styles-core.scss` and all `themes/example-0X/setup.scss`) had a redundant `@layer` order declaration that is now exclusively owned by `universal-values()`.
- **Documentation updated** — `themes/README.md`, `themes/_template/README.md`, and `CHANGELOG.md` corrected to reflect the new `@layer` declaration location and `elements-base()` mixin pattern.

---

## [3.0.1] — 2026-02-24

### Fixed

- **`@layer` audit — complete layerization** — Two critical cascade inconsistencies resolved:
  1. **Rogue layer declaration removed** — `scss/base/_reset.scss` declared a conflicting `@layer syx.reset, syx.base, syx.components, syx.utilities` stack with a non-existent `syx.components` layer. Removed. The canonical `@layer` order declaration is now hoisted as the **first CSS rule inside `universal-values()`** in `themes/_base/_universal.scss`, so it always precedes any component CSS emitted by `@include` calls.
  2. **All components now wrapped in `@layer`** — Every atom (×15), molecule (×5), organism (×4), and the layout grid were producing unlayered CSS, floating above the layer system. All now emit CSS inside their respective `@layer` block (`syx.atoms`, `syx.molecules`, `syx.organisms`, `syx.base`).
- **`base/_elements.scss` now wrapped in `elements-base()` mixin** — Element defaults (`ul`, `table`, `p`, `a`, `blockquote`, `hr`, `code`, `pre`) were the last remaining unlayered block. Now wrapped in `@mixin elements-base($theme: null) { @layer syx.base { … } }` and explicitly called from every entry point with `@include elements-base($theme)`. This prevents premature CSS emission during the `@use` phase.
- **All 6 helper mixins confirmed in `@layer syx.utilities`** — `_backgrounds`, `_dimensions`, `_font-sizes`, `_fonts`, `_icons`, `_spacers` all already had the correct wrapper (no change needed, documented for clarity).

### Changed

- **`scss/CONTRIBUTING.md` — component template updated** — New component template now includes `@layer syx.atoms { }` wrapper so any new component follows the correct pattern by default. Checklist item added: "Mixin body wrapped in `@layer syx.{layer} { ... }`".

---

## [3.0.0] — 2026-02-24

### Added

- **Utility system overhaul** — All generic helpers migrated into a unified `scss/utilities/` layer. New utility files: `_backgrounds.scss`, `_borders.scss`, `_display.scss`, `_embed.scss`, `_flex.scss`, `_images.scss`, `_sizing.scss`, `_spacing.scss`, `_text.scss`, `_visibility.scss`. Scoped under `@layer syx.utilities`.
- **`docs-why-syx.html`** — New documentation page: competitive analysis of SYX vs Tailwind CSS, Material UI, Chakra UI, and Ant Design across 7 enterprise sectors.
- **`docs-developer-guide.html` — HTML Setup section** — Documents the required `<body class="syx syx--theme-example-*">` pattern, 5 theme reference table, and `syx--page-*` modifier convention.
- **Full `</head>` + `<body>` structure** — All 6 `docs-*.html` files now have explicit `</head>` and `<body class="syx syx--theme-example-01">` tags.
- **Grid system improvements** — `layout-grid__nested` double-padding fix; new `--no-pad` modifier for nested grids.

### Changed

- **Body class convention standardised** — All project HTML files now use `syx syx--theme-example-XX` on `<body>`. Page-type modifiers migrated from `page-*` to `syx--page-*` prefix (`test-01.html`, `test-02.html`, `text-03.html`).
- **"Codymer" theme renamed to "example-02"** — All references across SCSS files, documentation, and HTML removed. `_header.scss` `@if` guard, token comments, `_theme-config.scss` map, and `ARCHITECTURE.md` examples updated.
- **Deprecated helpers removed** — `scss/base/helpers/` folder cleaned. Generic helpers now covered by the utility layer. Theme-specific helpers (`_syx-layer.scss`, `_backgrounds.scss`) retained and modernised.
- **`scss/GETTING-STARTED.md`** — Quick-start HTML snippet updated to include the required body classes.
- **`scss/ARCHITECTURE.md`** — Updated to reflect the unified utility system, removed Codymer references, updated theme list.
- **`TOKEN-GUIDE.md`** — Mixin example updated: `theme-codymer` → `theme-example-02`.

### Removed

- All `scss/base/helpers/` deprecated partial files (covered by utilities).
- Every remaining reference to the internal name "Codymer" from functional code and documentation.

---

## [2.0.1] — 2026-02-19

### Added

- **`styles-core.scss` / `styles-core.css`** — Minimal production bundle. Excludes all documentation and showroom components (`atom-specimen`, `atom-swatch`, `atom-code`, `mol-demo`, `org-documentation-layout`, `org-content-columns`, `pages/*`). **138 KB** without PurgeCSS, **~110 KB** after.
- **PurgeCSS integration** — `postcss.config.js` + `@fullhuman/postcss-purgecss`. New scripts: `build:prod` (all themes + purge), `build:core` + `purge:core` (minimal bundle). Output to `css/prod/`.
- **`demo-bundle-weight.html`** — Real-weight reference page for the core bundle. Shows live components using `styles-core.css` only.
- **`_template` neutral theme (Sección 3)** — The `_template/_theme.scss` now defines a full set of neutral semantic token overrides specifically for buttons and forms: slate primary, system-ui fonts, standard blue links, 6px border-radius, accessible focus shadow. Ready to use as a production starting point.
- **`scss/themes/_shared/_bundle-core.scss`** — Shared mixin `syx-bundle-core()` that defines the production component set.

### Changed

- **`_template/_theme.scss`** — Now includes a "Sección 3" block overriding `--semantic-color-*`, `--semantic-font-family-*`, `--semantic-border-radius-*`, and `--semantic-shadow-focus` with neutral, brand-agnostic values.
- **`package.json`** — Added `build:core`, `purge:core`, `build:prod`, `purge:*` scripts. Uses `npx postcss` for cross-platform compatibility.

### Fixed

- **Sass deprecation warnings** — Replaced all deprecated `if()` function usage with `@if/@else` in `_directional.scss`, `_font.scss`, `_triangle.scss`, and `_theme-config.scss`.

---

## [2.0.0-beta] — 2026-02-18

### Added

- **`@layer` granular stack** — `syx.reset → syx.base → syx.tokens → syx.atoms → syx.molecules → syx.organisms → syx.utilities`. Utilities always win without `!important`.
- **Dark mode** — Dual activation: `@media (prefers-color-scheme: dark)` + `[data-theme="dark"]`. Persists in `localStorage`. Syncs with OS changes.
- **Accessibility utilities** — `.syx-sr-only`, `.syx-sr-only-focusable`, `.syx-skip-link`, `.syx-motion-safe` added to `_a11y.scss`.
- **`color-mix()` hover tints** — Button hover states now use `color-mix(in srgb, ...)` for dynamic tints without hardcoded values.
- **Card molecule** — `.syx-card` migrated from atoms to molecules layer with full dark-mode support.
- **Fluid display token** — `--primitive-fluid-font-display` and `--primitive-letter-spacing-display` added.
- **Container Queries** — Cards and column layouts use `@container` for truly responsive components.
- **`package.json`** — Build scripts for all 6 themes with Dart Sass.
- **`CHANGELOG.md`** — This file.
- **`LICENSE`** — MIT license.

### Changed

- **`_btn.scss`** — All `[class*="--variant"]` attribute selectors replaced with explicit BEM class selectors (`.atom-btn--primary`, `.atom-btn--filled`, etc.) for predictable specificity.
- **`_card.scss`** — Background, border, and text colors migrated from primitive tokens to semantic tokens (`--semantic-color-bg-primary`, `--semantic-color-border-subtle`, `--semantic-color-text-tertiary`).
- **`_display.scss`** — `.syx-border` migrated to semantic tokens for dark-mode compatibility.
- **`_tables.scss`** — Table hover token corrected from `state-focus` to `state-hover-primary`.
- **Documentation** — All 8 `.md` files and 5 docs HTML files updated to reflect the current `@layer` stack, molecule count, and system state.

### Fixed

- `--component-table-state-hover-bg` was incorrectly pointing to `--semantic-color-state-focus` (focus ring color) instead of `--semantic-color-state-hover-primary`.
- `@layer` stack in docs HTML showed the old `syx.components` monolithic layer instead of the granular 7-layer stack.
- Molecule count in `ARCHITECTURE.md` was 4 (missing card).
- Project score in `README.md` was stale (86/100 → 93/100).

### Removed

- `prepros.config` — Local build tool config, not needed in the repo.
- `metas-html.txt` — Internal working file.
- `sitemap.xml` — Stale file with old domain references.
- `test-*.html` — Development test files.

---

## [1.0.0] — 2024-01-01

### Added

- Initial release of SYX Design System.
- 5 example themes with full token architecture (Primitive → Semantic → Component).
- 19 atoms, 4 molecules, 6 organisms.
- Mixin library: positioning, spacing, sizing, flexbox, typography, media queries, accessibility.
- Fluid typography with `clamp()`.
- Multi-theming via `data-theme` attribute.
- Documentation: `ARCHITECTURE.md`, `GETTING-STARTED.md`, `CONTRIBUTING.md`, `THEMING-RULES.md`, mixin README, token guide.
