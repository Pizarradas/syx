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

---

## Tokens de superficie disponibles

Definidos una sola vez, en `scss/abstracts/tokens/semantic/_colors.scss` (los valores por defecto) y en `_dark-mode.scss` (su reasignación en oscuro). Cada `_theme.scss` los sobreescribe para crear la identidad del tema. Los alias de compatibilidad para código legado viven en `scss/base/_deprecated-aliases.scss`, con retirada fijada en SYX v5.0.

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

## Cómo crear un nuevo tema

1. Copia `scss/themes/_template/` como base.
2. En `_theme.scss`, sobreescribe **todos** los tokens de superficie:

```scss
// OBLIGATORIO en cada _theme.scss
--semantic-color-bg-primary: #TU_COLOR;
--semantic-color-bg-secondary: #TU_COLOR;
--semantic-color-bg-tertiary: #TU_COLOR;
--semantic-color-border-default: #TU_COLOR;
--semantic-color-border-subtle: #TU_COLOR;
--semantic-color-text-primary: #TU_COLOR;
--semantic-color-text-secondary: #TU_COLOR;
--semantic-color-text-tertiary: #TU_COLOR;
--semantic-color-text-inverse: #TU_COLOR;
```

3. Si el tema es **dark**, invierte la escala: `bg-primary` = el más oscuro, `bg-tertiary` = el más claro.
4. Declara las tintas `--semantic-color-on-*` de tus rellenos de marca (ver la sección anterior) y pasa `npm run check:contraste` hasta que esté en verde.

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

- `scss/themes/*/\_theme.scss` — para definir los semánticos
- `scss/base/\_reset.scss` — para el reset global
- Colores de marca específicos de un componente que **no deben cambiar con el tema** (ej: badges de categoría con colores fijos)

Los **semánticos** se pueden sobreescribir directamente en `_theme.scss` **únicamente** en la Sección 3 (Neutral Brand), que define la identidad visual base para el bundle core (`_template`). En temas con marca propia, sobreescribir siempre desde primitivos.

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
