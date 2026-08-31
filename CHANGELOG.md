# Changelog

All notable changes to SYX Design System will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
