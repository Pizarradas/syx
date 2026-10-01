# SYX Theming Rules — Contrato de Desarrollo

> **Regla de oro:** En páginas y componentes, **nunca usar `--primitive-*` directamente**. Siempre usar tokens semánticos.

---

## La jerarquía de tokens

```
PRIMITIVO  →  SEMÁNTICO  →  COMPONENTE  →  PÁGINA
  (valor)      (rol)         (elemento)    (layout)
```

- **Primitivos** (`--primitive-color-*`): valores brutos. Solo se usan _dentro_ de `_theme.scss` para definir semánticos.
- **Semánticos** (`--semantic-color-*`): rol de la UI. Se usan en componentes y páginas.
- **Componente** (`--component-*`): tokens específicos de un átomo/molécula.

---

## Mapa de sustitución obligatorio

| ❌ Nunca en páginas/componentes                              | ✅ Usar en su lugar               |
| ------------------------------------------------------------ | --------------------------------- |
| `--primitive-color-white` / `oklch(1 0 0)` / `oklch(1 0 0 / ...)` | `--semantic-color-bg-primary`     |
| `--primitive-color-gray-50`                                  | `--semantic-color-bg-secondary`   |
| `--primitive-color-gray-100` (fondos)                        | `--semantic-color-bg-tertiary`    |
| `--primitive-color-gray-100` (bordes)                        | `--semantic-color-border-subtle`  |
| `--primitive-color-gray-200/300` (bordes)                    | `--semantic-color-border-default` |
| `--primitive-color-gray-400/500` (bordes)                    | `--semantic-color-border-strong`  |
| `--primitive-color-gray-900` (texto)                         | `--semantic-color-text-primary`   |
| `--primitive-color-gray-500/600` (texto)                     | `--semantic-color-text-secondary` |
| `--primitive-color-gray-300/400` (texto)                     | `--semantic-color-text-tertiary`  |
| `oklch(1 0 0)` sobre fondos oscuros                                  | `--semantic-color-text-inverse`   |
| `text-inverse` / blanco sobre un relleno de marca                    | `--semantic-color-on-{rol}`       |
| `--semantic-color-{rol}` usado como texto (enlace, `.syx-text-*`)    | `--semantic-color-{rol}-text`     |
| `--semantic-color-primary` como borde o relleno de control (foco, check, pestaña) | `--semantic-color-primary-strong` |
| `--primitive-color-blue-50/200/600` (fondo, borde y texto de una etiqueta de tono: píldora, cabecera de fragmento) | `--semantic-color-tone-{primary,secondary,success,warning,error}-subtle-{bg,border,fg}` |
| Una paleta fija para distinguir categorías (las capas del icono de característica) | `--semantic-color-category-{1…6}-{bg,fg}` |
| `--primitive-color-gray-900` como superficie oscura en los dos modos | `--semantic-color-bg-emphasis` / `--semantic-color-on-emphasis` |
| Colores del bloque de código y de la sintaxis | `--semantic-color-code-*` |

---

## Tokens de superficie disponibles

Definidos una sola vez, en `scss/abstracts/tokens/semantic/_colors.scss` (los valores por defecto) y en `_dark-mode.scss` (su reasignación en oscuro). Un tema los sobrescribe solo si quiere otra cosa. Las variables heredadas sin prefijo se retiraron en la acción 14 de la auditoría de 2026-10; el mapa de cada una a su token oficial está en `contracts/legacy-map.json`.

```css
/* Backgrounds */
--semantic-color-bg-primary     /* fondo principal de página */
--semantic-color-bg-secondary   /* secciones alternadas, sidebars */
--semantic-color-bg-tertiary    /* cards, inputs, code blocks */

/* Borders */
--semantic-color-border-default /* bordes visibles */
--semantic-color-border-subtle  /* divisores sutiles */
--semantic-color-border-strong  /* bordes fuertes, focus rings */

/* Text */
--semantic-color-text-primary   /* headings, body */
--semantic-color-text-secondary /* labels, captions */
--semantic-color-text-tertiary  /* hints, placeholders */
--semantic-color-text-inverse   /* texto sobre fondos oscuros */
```

---

## Color de marca: relleno, tinta, tinta encima y variante fuerte

Un color de marca hace cuatro trabajos distintos y cada uno tiene su token. El **relleno** (`--semantic-color-{primary,secondary,tertiary,quaternary,quinary}`) es la identidad del tema y **no se toca para cuadrar el contraste**: lo que se ajusta es lo que va encima o al lado.

| Trabajo | Token | Mínimo | Cómo se obtiene |
| --- | --- | --- | --- |
| Relleno (botón, cabecera de tabla, página activa) | `--semantic-color-{rol}` | — | Lo declara el tema |
| Texto encima del relleno | `--semantic-color-on-{rol}`, `--semantic-color-on-state-hover-{rol}`, `--semantic-color-on-primary-strong` | 4,5:1 (1.4.3); 3:1 la marca del check | El tema elige `var(--semantic-color-ink-light)` o `var(--semantic-color-ink-dark)` |
| El color de marca como texto (enlace, placeholder, `.syx-text-primary`) | `--semantic-color-{rol}-text` | 4,5:1 | Derivado: mismo tono y croma, luminosidad `--semantic-brand-text-lightness` |
| Límite de control (anillo de foco, borde enfocado, check/radio marcados, indicador de pestaña) | `--semantic-color-primary-strong`, `--semantic-color-state-success-strong` (switch) | 3:1 (1.4.11) | Derivado: la luminosidad del relleno sujeta a ±0,12 de la de la tinta |

**Por qué las tintas `on-*` se eligen y no se calculan.** Los rellenos de los temas rondan L 0,60 en OKLCH: ni el blanco ni un gris oscuro llegan a 4,5:1 sobre ellos, solo el negro (o casi). Calcular «la tinta que más contraste da» en CSS exige `contrast-color()` o sintaxis de color relativa con condiciones, y ninguna existe en el soporte mínimo del sistema (Chrome 111, Safari 16.2, Firefox 121). Así que el tema declara la elección y `npm run check:contraste` la valida en los cuatro estados de modo; si un par no llega, el informe dice cuál de las dos tintas sí:

```scss
// _theme.scss — sección de color semántico
--semantic-color-on-primary: var(--semantic-color-ink-dark);   // cian claro: tinta oscura
--semantic-color-on-quinary: var(--semantic-color-ink-light);  // violeta oscuro: tinta clara
// Opcional: afina las dos tintas (siguen pasando por el mismo contrato)
--semantic-color-ink-dark: var(--primitive-color-ink);
```

Lo que no se declara se queda en `--semantic-color-text-inverse`, el comportamiento anterior. Los rellenos de hover son otro color y pueden pedir la otra tinta (en claro, un peldaño más oscuro suele pedir la clara): por eso tienen sus propios `on-state-hover-*`. En oscuro, `dark-mode-tokens()` apunta cada hover a su relleno base y su tinta con él.

**La tinta y la variante fuerte se derivan solas** con sintaxis relativa dentro de `@supports`; donde no la hay, caen al relleno (el comportamiento anterior). Un tema que ya es oscuro en su modo base sube `--semantic-brand-text-lightness` a 0,80 y las dos derivaciones le siguen. Una variante fuerte que cae dentro de la franja sale idéntica al relleno: solo cambian los temas que no llegaban.

Los pares viven en `contracts/contrast.json` (texto sobre cada relleno y su hover, botones rellenos, cabecera de tabla, página activa, selección, enlace, placeholder, sintaxis del código, anillo de foco, controles marcados, switch, pestaña). Un tema nuevo no está terminado hasta que `npm run check:contraste` sale en verde.

---

## El contrato de un tema

Un tema es una lista de declaraciones. Este contrato dice cuáles debe tener, cuáles puede tener y cuáles no, y cada punto lo vigila un guardián de `npm run check`. La plantilla (`scss/themes/_template/`) es el contrato **mínimo**: `npm run check:plantilla` la compila como un tema más y le pasa todo lo de aquí. (Auditoría 2026-10 · acción 14)

### Lo que un tema DEBE declarar

| Qué | Tokens | Lo vigila |
| --- | --- | --- |
| Su marca, como primitivos **propios** | `--primitive-color-brand-*` (o el nombre que la describa), `--primitive-space-base` | — |
| Los rellenos de marca y sus hover | `--semantic-color-{primary,secondary,tertiary…}`, `--semantic-color-state-hover-*` | — |
| La tinta encima de cada relleno | `--semantic-color-on-*`, `--semantic-color-on-state-hover-*` | `check:contraste` |
| Lo que todos los temas declaran y el sistema lee | iconos `--icon-*` | `check:plantilla` |
| Modo oscuro con **sus dos entradas**, las dos con `dark-mode-tokens()` | `@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) {…} }` y `:root[data-theme="dark"] {…}` | `check:themes --strict`, `check:modo-claro` |
| Sus fuentes, una vez | `theme-x-fonts()` con `syx-font()` | `check:setups` |

Superficies, textos, bordes, sombras, escala tipográfica, la tinta de marca como texto (`--semantic-color-*-text`) y la variante fuerte de los controles los pone el sistema, en claro y en oscuro. Un tema los declara solo cuando quiere otra cosa.

### Lo que un tema PUEDE declarar

- **Cualquier rol semántico** (`--semantic-*`): superficies, textos, estados (`--semantic-color-state-*`), tonos suaves, colores categóricos, superficie de énfasis, paleta de código, tintas… con un primitivo o con un literal. Es el sitio donde el tema traduce su paleta a papeles.
- **Primitivos**: los suyos, o los del sistema reescritos (ver la recomendación del inventario: mejor los suyos).
- **Tokens de componente** (`--component-*`), siempre que **lean roles** (R11): un `--semantic-*`, otro `--component-*`, `--theme-*`, `--layout-*`, un icono o una longitud literal. No hay lista cerrada de los que se pueden sobrescribir: R11 garantiza que lo que se sobrescriba siga al tema y al modo.
- La forma y la estructura: `--theme-radius`, `--theme-focus-ring-width`, `--layout-*`, `--reset-*`.

### Lo que un tema NO puede declarar

| No | Por qué | Lo vigila |
| --- | --- | --- |
| Una declaración que no lee nadie | No hace nada y nadie se entera: example-06 «arreglaba» un contraste con `--btn-primary-filled-text`, que ningún botón leía. Solo se admiten los `--semantic-*` del sistema, que son API pública para las aplicaciones | `check:consumidores` |
| Un `--component-*` que lea un `--primitive-*`, una variable heredada o un color literal | El componente dejaría de seguir al tema y al modo (la píldora violeta en el tema cian) | R11 (`check:reglas` y `validate` en el fuente; `check:compilado` en el CSS emitido, también en átomos, moléculas y organismos) |
| Un token deprecado | Desde 2026-10 los alias deprecados SIGUEN al canónico: declarar el alias no cambia nada. Se declara el canónico (`replacedBy` en `tokens.json`) | `check:tokens-json` |
| Variables sin prefijo oficial | Las heredadas se retiraron; `contracts/legacy-map.json` dice a qué token oficial va cada una | R07 (`validate`) |
| Un oscuro con una sola entrada | El botón de modo no tendría efecto con el SO en claro, o el tema no seguiría al SO | `check:themes --strict` |

### Inventario medido de los temas (octubre de 2026)

Declaraciones en cada `_theme.scss`, antes y después de la acción 14 (todas las declaraciones, contando las de claro y oscuro):

| Tema | Antes | Después | Primitivos (reescritos del sistema · propios) | Semánticos | Componente | Primitivos cuyo nombre no es su tono |
| --- | --- | --- | --- | --- | --- | --- |
| example-01 | 233 | 132 | 21 (9 · 12) | 55 | 11 | 4: `blue-500/400` índigo (h 277), `cyan-500` ámbar (h 70), `orange-500` índigo (h 277) |
| example-02 | 256 | 145 | 22 (12 · 10) | 71 | 7 | 3: `purple-500` rosa (h 7), `blue-500` violeta (h 293), `yellow-500` ámbar (h 70) |
| example-03 | 267 | 161 | 25 (6 · 19) | 81 | 10 | 0 |
| example-04 | 269 | 162 | 25 (4 · 21) | 82 | 10 | 0 |
| example-05 | 286 | 174 | 31 (4 · 27) | 88 | 10 | 0 |
| example-06 | 240 | 149 | 30 (4 · 26) | 64 | 10 | 0 |
| syx-sketch | 493 | 377 | 48 (36 · 12) | 189 | 94 | 0 |

Lo que se fue eran alias heredados y declaraciones sin lector. Los tokens de componente de los temas de ejemplo son los de la lista (`--component-list-*`, que antes escribían con nombres heredados). Los de syx-sketch bajan de 170 a 94 y ahora todos leen roles: los colores de sus píldoras, iconos, código y tabla pasaron a la capa semántica.

### Recomendación (decisión pendiente)

1. **Primitivos que no mienten.** example-01 y example-02 reescriben primitivos del sistema con otro tono (`purple-500` rosa, `orange-500` índigo, `cyan-500` ámbar). Desde R11 ningún componente lee primitivos, pero sí la capa del sitio (`scss/site/tokens/`, que R01 permite) y cualquier aplicación que use la paleta: recibe un «violeta» rosa. Mejor la convención de la plantilla: primitivos propios con el nombre de su papel en la marca (`--primitive-color-brand-*`) y los del sistema intactos.
2. **syx-sketch** sigue siendo el tema que más reescribe (94 tokens de componente: tarjetas, tabla, botones, código). Todos leen roles, así que siguen al modo; si su lenguaje (trazo, sombra dura) se quiere ofrecer a otros temas, el paso siguiente es subir esos ajustes a roles semánticos de forma (`--semantic-shadow-hard*` ya existe) en vez de repetirlos componente a componente.
3. **¿Lista cerrada de componentes sobrescribibles?** Hoy no la hay; R11 y `check:consumidores` cubren lo que una lista protegería (que la sobrescritura tenga efecto y siga al tema). Si se quisiera, iría en `contracts/` y la leería `check:consumidores`.

### Pasos para un tema nuevo

1. Copia `scss/themes/_template/` y cambia `template` por el nombre (ver su README).
2. Cambia los valores marcados con ✎: marca, textos, forma, tipografía.
3. Crea `scss/styles-theme-<tema>.scss`, compila (`npm run build`) y pasa `npm run check` hasta que esté en verde: `check:contraste` te dirá qué tinta `on-*` declarar sobre cada relleno, y `check:consumidores` qué declaraciones no lee nadie.

---

## Ejemplos

### ✅ Correcto

```scss
.my-section {
  background: var(--semantic-color-bg-secondary);
  border-bottom: 1px solid var(--semantic-color-border-subtle);
  color: var(--semantic-color-text-primary);
}
```

### ❌ Incorrecto

```scss
.my-section {
  background: var(--primitive-color-gray-50); // ❌ rompe la personalización
  border-bottom: 1px solid oklch(0.928 0.006 264.531); // ❌ hardcoded, nunca cambia
  color: var(--primitive-color-gray-900); // ❌ no respeta el tema
}
```

---

## Excepciones permitidas

Los primitivos **sí se pueden usar** en:

- `scss/themes/*/_theme.scss`, en la capa semántica — para darles papel (nunca en un `--component-*`: R11)
- `scss/abstracts/tokens/semantic/` y `scss/abstracts/tokens/primitives/` — donde se definen
- `scss/base/`, `scss/utilities/` y `scss/setup-builder.scss` — reset, helpers y el editor de temas
- `scss/site/tokens/` — la capa del sitio de SYX, que no es del sistema

Un color que no debe cambiar con el tema tampoco va como primitivo en un componente: tiene un rol semántico con su valor por defecto (la superficie de énfasis, la paleta de código, los colores categóricos), y un tema que quiera otra cosa lo cambia ahí.

---

## Dark Mode

El dark-mode se activa de dos formas:

1. **Automática**: `@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { … } }` — respeta la preferencia del SO salvo que el usuario haya elegido claro
2. **Manual**: `[data-theme="dark"]` en `<html>` — control explícito desde JS

El `:not([data-theme="light"])` es lo que hace que elegir «claro» funcione sin un bloque que revierta el oscuro a mano: el `:root` por defecto queda intacto. Un tema claro por defecto no necesita `:root[data-theme="light"]`. Lo vigila `npm run check:modo-claro`.

Los tokens de dark-mode están en `scss/abstracts/tokens/semantic/_dark-mode.scss`.
Solo se reasignan tokens de superficie, texto y borde. Los brand colors y estados (success/error/warning) **no cambian**.

```scss
// Activar dark-mode manual desde JS
document.documentElement.setAttribute('data-theme', 'dark');

// Desactivar
document.documentElement.setAttribute('data-theme', 'light');
```

> **Regla:** Si un componente usa `--semantic-color-bg-primary`, `--semantic-color-border-*` y `--semantic-color-text-*`, el dark-mode funciona automáticamente sin código adicional.

---

## Sobrescribir tokens desde tu aplicación

Los bloques `:root` que declaran tokens se emiten **fuera de cualquier `@layer`**, a propósito: así ninguna regla de componente puede pisar un token por accidente (ver `scss/ARCHITECTURE.md`). La consecuencia para quien consume SYX es concreta: **una declaración dentro de una capa nunca gana a un token de SYX**, aunque venga después. Si tu aplicación organiza su CSS en capas (Tailwind v4, por ejemplo), sobrescribe los tokens fuera de ellas:

```css
/* capa: prototipo fuera de scss/ — CSS de la aplicación que consume SYX */
/* ✓ gana: sin capa, cargado después de la hoja de SYX */
:root {
  --semantic-color-primary: oklch(0.55 0.2 250);
}

/* ✗ no gana: cualquier @layer pierde contra los :root sin capa de SYX */
@layer theme {
  :root { --semantic-color-primary: oklch(0.55 0.2 250); }
}
```

Para respetar el modo oscuro, repite la sobrescritura en las mismas dos entradas que usa el sistema: `@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { … } }` y `:root[data-theme="dark"] { … }`. Si lo que cambias es la identidad entera y no un token suelto, no es una sobrescritura: es un tema (ver *Cómo crear un nuevo tema*).

---

## Estructura V4: Responsabilidades de Capas
En la versión V4, el sistema estandariza estrictamente el ciclo de vida de los tokens. **Nunca rompas esta cascada de dependencias:**

1. **Tokens Primitivos (Primitives):** Paletas crudas (ej. `purple-500`, `space-base`).
2. **Arquitectura y Tema (Theme Config):** Variables estructurales cross-componentes que definen el aspecto y tacto *general* del sistema, tales como focus rings, bordes base o radios (ej. `--theme-focus-ring-width`, `--theme-radius`).
3. **Estados Semánticos (States):** Responsables exclusivamente de feedback universal, con un solo nombre por estado: `--semantic-color-state-*` (ej. `--semantic-color-state-success`). Los nombres de antes (`--semantic-tone-*-bg`, `--semantic-color-success`…) son alias deprecados que lo siguen.
4. **Aliases de Componente (Components):** Propiedades explícitas dedicadas que consumen de los niveles superiores. Un botón nunca define `--semantic-color-primary`, consume su prop propia, e.g. `--component-button-primary-filled-color`, que lee `--semantic-color-on-primary` y con él reacciona al tema y al modo oscuro. Un token de componente solo lee roles semánticos u otros tokens de componente (R11).
