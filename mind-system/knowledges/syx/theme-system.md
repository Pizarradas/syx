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
├── _theme.scss           ← Único archivo que normalmente se edita
├── setup.scss            ← Ensambla el bundle completo
├── bundle-app.scss       ← Contexto app (todos los componentes)
├── bundle-docs.scss      ← Contexto documentación
├── bundle-marketing.scss ← Contexto marketing/landing
└── bundle-blog.scss      ← Contexto blog/editorial
```

**Regla:** `_theme.scss` es el único archivo que cambia por tema. Editar `setup.scss` solo para registrar componentes nuevos específicos del tema.

---

### `_theme.scss` — tres secciones

**Sección 1 — Color Primitivos** (solo `oklch()` aquí):
```scss
:root {
  --primitive-color-brand-50:  oklch(…);
  // … 50 a 900
  --primitive-color-accent-50: oklch(…);
  // … 50 a 900
}
```

**Sección 2 — Mapeo semántico** (12 tokens obligatorios + otros semánticos):
```scss
// capa: scss/themes/{nombre}/_theme.scss — aquí var(--primitive-*) es correcto (R01)
:root {
  // Los 12 tokens de superficie obligatorios:
  --semantic-color-bg-primary:   var(--primitive-color-brand-50);
  --semantic-color-bg-secondary: var(--primitive-color-brand-100);
  --semantic-color-bg-tertiary:  var(--primitive-color-brand-200);
  --semantic-color-border-subtle:  var(--primitive-color-brand-100);
  --semantic-color-border-default: var(--primitive-color-brand-200);
  --semantic-color-border-strong:  var(--primitive-color-brand-400);
  --semantic-color-text-primary:   var(--primitive-color-brand-900);
  --semantic-color-text-secondary: var(--primitive-color-brand-600);
  --semantic-color-text-tertiary:  var(--primitive-color-brand-400);
  --semantic-color-text-inverse:   oklch(1 0 0);
  --semantic-color-primary:        var(--primitive-color-accent-500);
  --semantic-color-primary-hover:  var(--primitive-color-accent-600);
}
```

**Sección 3 — Overrides de componente** (opcional, solo si el tema necesita):
```scss
:root {
  // Solo añadir si un componente necesita un valor no-default EN ESTE TEMA
  --component-btn-primary-radius: var(--semantic-border-radius-full);
}
```

---

### Dark mode — inversión de escala

```scss
// capa: scss/themes/{nombre}/_theme.scss
// LIGHT: bg-primary = más claro, bg-tertiary = menos claro
--semantic-color-bg-primary:   var(--primitive-color-brand-50);   // 0.97 L
--semantic-color-bg-secondary: var(--primitive-color-brand-100);
--semantic-color-bg-tertiary:  var(--primitive-color-brand-200);  // 0.82 L

// DARK: bg-primary = más oscuro, bg-tertiary = menos oscuro
--semantic-color-bg-primary:   var(--primitive-color-brand-950);  // 0.10 L
--semantic-color-bg-secondary: var(--primitive-color-brand-900);
--semantic-color-bg-tertiary:  var(--primitive-color-brand-800);  // 0.23 L

// DARK: texto inverso
--semantic-color-text-primary:   var(--primitive-color-brand-50);
--semantic-color-text-secondary: var(--primitive-color-brand-200);
--semantic-color-text-tertiary:  var(--primitive-color-brand-400);
--semantic-color-text-inverse:   oklch(0.1 0 0);
```

**Error frecuente:** no es invertir todos los valores — es que los fondos más elevados (tarjetas, modales) son MÁS CLAROS que el fondo base en dark mode. La señal de elevación funciona igual que en light mode.

---

### Variaciones estructurales (`$theme-config`)

Si el tema tiene diferencias de layout (posición del sidebar, tamaño del logo):

```scss
// En scss/abstracts/_theme-config.scss
$theme-config: (
  "{name}": (
    header-sidenav-side: right,
    header-logo-size: 3rem,
  )
);
```

Solo añadir claves que difieren del default. No duplicar configuración que ya existe.

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
- [ ] `--semantic-color-primary-hover`

---

## checklist

- [ ] ¿Los primitivos usan solo `oklch()` (no hex en _theme.scss)?
- [ ] ¿Los semánticos referencian primitivos (no valores raw)?
- [ ] ¿Los 12 tokens de superficie están definidos?
- [ ] ¿El dark mode tiene bg-primary como el valor más oscuro?
- [ ] ¿Las variaciones estructurales están en `$theme-config` (no en SCSS de componente)?
- [ ] ¿El contraste `text-primary` / `bg-primary` cumple WCAG AA (≥ 4.5:1)?
- [ ] ¿El contraste `text-inverse` / `color-primary` cumple WCAG AA (≥ 4.5:1)?
- [ ] ¿Todos los bundles compilan sin errores tras el cambio?
