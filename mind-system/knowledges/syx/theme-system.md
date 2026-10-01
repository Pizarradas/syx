# Theme System — Estructura de temas en SYX

## meta

| Campo | Valor |
|-------|-------|
| **Dominio** | SYX — sistema de temas |
| **Fuente** | Arquitectura interna SYX |
| **Objetivo** | Estructura de `_theme.scss`, secciones obligatorias, dark mode, y compilación de bundles |
| **Agent tags** | `#theme-system` `#theme-scss` `#dark-mode` `#bundles` `#setup` |

---

## concepts

Un tema SYX es una configuración de primitivos de color y valores estructurales que sobreescriben los defaults del sistema. La arquitectura de temas garantiza que cada tema compile de forma aislada y que los componentes no necesiten modificarse para cambiar de tema.

---

## rules

### Estructura de carpetas de un tema

```
scss/themes/{name}/
├── _theme.scss           ← Único archivo que normalmente se edita:
│                            tokens + @mixin theme-{name}-fonts (las fuentes)
├── _setup.scss           ← ~15 líneas de cableado generadas; solo cambia el nombre
├── bundle-app.scss       ← Contexto app
├── bundle-blog.scss      ← Contexto blog/editorial
├── bundle-core.scss      ← Bundle mínimo de producción
├── bundle-docs.scss      ← Contexto documentación
└── bundle-marketing.scss ← Contexto marketing/landing
```

El punto de entrada real es `scss/styles-theme-{name}.scss`, que hace
`@use 'themes/{name}/setup'` (resuelve `_setup.scss`) y añade las
utilidades. Los temas del sitio de SYX incluyen además
`@include syx-bundle-site($theme)` (capa `scss/site/`, desmontable), y
`example-01`/`syx-sketch` llevan un `bundle-home.scss`.

**Regla:** `_theme.scss` es el único archivo que cambia por tema. Los
componentes NO se registran en `_setup.scss`: la lista vive una sola vez
en `scss/themes/_shared/_bundle-full.scss` (`syx-bundle-full`).

---

### `_theme.scss` — tres secciones + el mixin de fuentes

Todo el contenido vive dentro de `@mixin theme-{name} { :root { … } }`
(el `_setup.scss` hace `@include theme-{name}()`), y las fuentes en un
segundo mixin `@mixin theme-{name}-fonts { @include font-family(…); }` que
llaman el setup y todos los bundles — la lista de `@font-face` se declara
una sola vez por tema.

**Nota de nombres:** no existe una familia `brand` ni el escalón
`-950`. Los temas reales **rebindean** familias primitivas
existentes (`--primitive-color-blue-500`, `--primitive-color-cyan-500`,
`--primitive-color-gray-*`… con comentario `// rebind:`); las escalas van
de `-50` a `-900`. En los ejemplos siguientes `blue` hace de familia de marca y `cyan`
de acento: en un tema real van las familias que ese tema rebindea.

**Sección 1 — Color Primitivos** (solo `oklch()` aquí):
```scss
:root {
  --primitive-color-blue-50:  oklch(…);
  // … 50 a 900
  --primitive-color-cyan-50: oklch(…);
  // … 50 a 900
}
```

**Sección 2 — Mapeo semántico** (12 tokens obligatorios + otros semánticos):
```scss
// capa: scss/themes/{nombre}/_theme.scss — aquí var(--primitive-*) es correcto (R01)
:root {
  // Los 12 tokens de superficie obligatorios:
  --semantic-color-bg-primary:   var(--primitive-color-blue-50);
  --semantic-color-bg-secondary: var(--primitive-color-blue-100);
  --semantic-color-bg-tertiary:  var(--primitive-color-blue-200);
  --semantic-color-border-subtle:  var(--primitive-color-blue-100);
  --semantic-color-border-default: var(--primitive-color-blue-200);
  --semantic-color-border-strong:  var(--primitive-color-blue-400);
  --semantic-color-text-primary:   var(--primitive-color-blue-900);
  --semantic-color-text-secondary: var(--primitive-color-blue-600);
  --semantic-color-text-tertiary:  var(--primitive-color-blue-400);
  --semantic-color-text-inverse:   oklch(1 0 0);
  --semantic-color-primary:        var(--primitive-color-cyan-500);
  --semantic-color-state-hover-primary:  var(--primitive-color-cyan-600);
}
```

**Sección 3 — Overrides de componente** (opcional, solo si el tema necesita):
```scss
:root {
  // Solo añadir si un componente necesita un valor no-default EN ESTE TEMA
  --component-button-border-radius: var(--semantic-border-radius-full);
}
```

---

### Dark mode — inversión de escala

```scss
// capa: scss/themes/{nombre}/_theme.scss
// LIGHT: bg-primary = más claro, bg-tertiary = menos claro
--semantic-color-bg-primary:   var(--primitive-color-blue-50);   // 0.97 L
--semantic-color-bg-secondary: var(--primitive-color-blue-100);
--semantic-color-bg-tertiary:  var(--primitive-color-blue-200);  // 0.82 L

// DARK: bg-primary = más oscuro, bg-tertiary = menos oscuro
--semantic-color-bg-primary:   var(--primitive-color-blue-900);  // 0.22 L
--semantic-color-bg-secondary: var(--primitive-color-blue-800);
--semantic-color-bg-tertiary:  var(--primitive-color-blue-700);  // 0.42 L

// DARK: texto inverso
--semantic-color-text-primary:   var(--primitive-color-blue-50);
--semantic-color-text-secondary: var(--primitive-color-blue-200);
--semantic-color-text-tertiary:  var(--primitive-color-blue-400);
--semantic-color-text-inverse:   oklch(0.1 0 0);
```

**Error frecuente:** no es invertir todos los valores — es que los fondos más elevados (tarjetas, modales) son MÁS CLAROS que el fondo base en dark mode. La señal de elevación funciona igual que en light mode.

---

### Variaciones estructurales

Si el tema tiene diferencias de layout (posición del sidebar, tamaño del
logo), se expresan como tokens `--component-*` sobreescritos en su
`_theme.scss`; para una diferencia que ningún token puede llevar, un bloque
`@if $theme == "{name}"` dentro del parcial del componente.

> El mapa `$theme-config` y `theme-cfg()` fueron retirados el 2026-09-12:
> ningún componente los llamó nunca y sus claves habían derivado de los
> nombres reales de los temas.

---

### Checklist de 12 tokens de superficie

Antes de declarar un tema completo:

- [ ] `--semantic-color-bg-primary`
- [ ] `--semantic-color-bg-secondary`
- [ ] `--semantic-color-bg-tertiary`
- [ ] `--semantic-color-border-subtle`
- [ ] `--semantic-color-border-default`
- [ ] `--semantic-color-border-strong`
- [ ] `--semantic-color-text-primary`
- [ ] `--semantic-color-text-secondary`
- [ ] `--semantic-color-text-tertiary`
- [ ] `--semantic-color-text-inverse`
- [ ] `--semantic-color-primary`
- [ ] `--semantic-color-state-hover-primary`

---

## checklist

- [ ] ¿Los primitivos usan solo `oklch()` (no hex en _theme.scss)?
- [ ] ¿Los semánticos referencian primitivos (no valores raw)?
- [ ] ¿Los 12 tokens de superficie están definidos?
- [ ] ¿El dark mode tiene bg-primary como el valor más oscuro?
- [ ] ¿Las variaciones estructurales son tokens `--component-*` (o, como último recurso, `@if $theme ==` en el parcial)?
- [ ] ¿Las fuentes del tema están declaradas una sola vez, en `@mixin theme-{name}-fonts` dentro de `_theme.scss`?
- [ ] ¿El contraste `text-primary` / `bg-primary` cumple WCAG AA (≥ 4.5:1)?
- [ ] ¿El contraste `text-inverse` / `color-primary` cumple WCAG AA (≥ 4.5:1)?
- [ ] ¿Todos los bundles compilan sin errores tras el cambio?
