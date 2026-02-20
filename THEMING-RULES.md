# SYX Theming Rules â Contrato de Desarrollo

> **Regla de oro:** En pÃ¡ginas y componentes, **nunca usar `--primitive-*` directamente**. Siempre usar tokens semÃ¡nticos.

---

## La jerarquÃ­a de tokens

```
PRIMITIVO  â  SEMÃNTICO  â  COMPONENTE  â  PÃGINA
  (valor)      (rol)         (elemento)    (layout)
```

- **Primitivos** (`--primitive-color-*`): valores brutos. Solo se usan _dentro_ de `_theme.scss` para definir semÃ¡nticos.
- **SemÃ¡nticos** (`--semantic-color-*`): rol de la UI. Se usan en componentes y pÃ¡ginas.
- **Componente** (`--component-*`): tokens especÃ­ficos de un Ã¡tomo/molÃ©cula.

---

## Mapa de sustituciÃ³n obligatorio

| â Nunca en pÃ¡ginas/componentes                              | â Usar en su lugar               |
| ------------------------------------------------------------ | --------------------------------- |
| `--primitive-color-white` / `#fff` / `rgba(255,255,255,...)` | `--semantic-color-bg-primary`     |
| `--primitive-color-gray-50`                                  | `--semantic-color-bg-secondary`   |
| `--primitive-color-gray-100` (fondos)                        | `--semantic-color-bg-tertiary`    |
| `--primitive-color-gray-100` (bordes)                        | `--semantic-color-border-subtle`  |
| `--primitive-color-gray-200/300` (bordes)                    | `--semantic-color-border-default` |
| `--primitive-color-gray-400/500` (bordes)                    | `--semantic-color-border-strong`  |
| `--primitive-color-gray-900` (texto)                         | `--semantic-color-text-primary`   |
| `--primitive-color-gray-500/600` (texto)                     | `--semantic-color-text-secondary` |
| `--primitive-color-gray-300/400` (texto)                     | `--semantic-color-text-tertiary`  |
| `#fff` sobre fondos oscuros                                  | `--semantic-color-text-inverse`   |

---

## Tokens de superficie disponibles

Definidos en `scss/abstracts/tokens/semantic/_colors.scss` como valores de referencia. Cada `_theme.scss` los sobreescribe para crear la identidad del tema. El archivo `_token-aliases.scss` provee fallbacks de compatibilidad (deprecated, se eliminarÃ¡ en v2.1).

```css
/* Backgrounds */
--semantic-color-bg-primary     /* fondo principal de pÃ¡gina */
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

## CÃ³mo crear un nuevo tema

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

3. Si el tema es **dark**, invierte la escala: `bg-primary` = el mÃ¡s oscuro, `bg-tertiary` = el mÃ¡s claro.

---

## Ejemplos

### â Correcto

```scss
.my-section {
  background: var(--semantic-color-bg-secondary);
  border-bottom: 1px solid var(--semantic-color-border-subtle);
  color: var(--semantic-color-text-primary);
}
```

### â Incorrecto

```scss
.my-section {
  background: var(--primitive-color-gray-50); // â rompe la personalizaciÃ³n
  border-bottom: 1px solid #e5e7eb; // â hardcoded, nunca cambia
  color: var(--primitive-color-gray-900); // â no respeta el tema
}
```

---

## Excepciones permitidas

Los primitivos **sÃ­ se pueden usar** en:

- `scss/themes/*/\_theme.scss` â para definir los semÃ¡nticos
- `scss/base/\_reset.scss` â para el reset global
- Colores de marca especÃ­ficos de un componente que **no deben cambiar con el tema** (ej: badges de categorÃ­a con colores fijos)

Los **semÃ¡nticos** se pueden sobreescribir directamente en `_theme.scss` **Ãºnicamente** en la SecciÃ³n 3 (Neutral Brand), que define la identidad visual base para el bundle core (`_template`). En temas con marca propia, sobreescribir siempre desde primitivos.

---

## Dark Mode

El dark-mode se activa de dos formas:

1. **AutomÃ¡tica**: `@media (prefers-color-scheme: dark)` â respeta la preferencia del SO
2. **Manual**: `[data-theme="dark"]` en `<html>` â control explÃ­cito desde JS

Los tokens de dark-mode estÃ¡n en `scss/abstracts/tokens/semantic/_dark-mode.scss`.
Solo se reasignan tokens de superficie, texto y borde. Los brand colors y estados (success/error/warning) **no cambian**.

```scss
// Activar dark-mode manual desde JS
document.documentElement.setAttribute('data-theme', 'dark');

// Desactivar
document.documentElement.setAttribute('data-theme', 'light');
```

> **Regla:** Si un componente usa `--semantic-color-bg-primary`, `--semantic-color-border-*` y `--semantic-color-text-*`, el dark-mode funciona automÃ¡ticamente sin cÃ³digo adicional.
