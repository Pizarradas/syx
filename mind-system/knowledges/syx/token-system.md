# Token System — Arquitectura de tokens SYX

## meta

| Campo | Valor |
|-------|-------|
| **Dominio** | SYX — sistema de tokens |
| **Fuente** | Arquitectura interna SYX; `contracts/rules.json`; `tokens.json` |
| **Objetivo** | Referencia operativa de la jerarquía de tokens, naming convention, y contratos entre tiers |
| **Agent tags** | `#token-system` `#tiers` `#naming` `#contracts` `#r01` |

---

## concepts

El sistema de tokens SYX separa los valores de diseño en cuatro capas con responsabilidades distintas. Cada capa puede solo referenciar la capa inmediatamente superior — nunca saltar capas.

---

## rules

### Los cuatro tiers

```
Tier 1 — Primitivos      scss/abstracts/tokens/primitives/
  Valores de diseño crudos. Sin significado semántico.
  --primitive-color-blue-500: oklch(0.55 0.22 260);
  --primitive-space-base: 0.25rem;
  ↓ solo se asignan en _theme.scss

Tier 2 — Semánticos      scss/abstracts/tokens/semantic/
  Roles contextuales. Nombres de función, no de valor.
  --semantic-color-primary: var(--primitive-color-brand-500);
  --semantic-space-inset-md: calc(var(--primitive-space-base) * 4);
  ↓ referenciados por tokens de componente

Tier 3 — Componente      scss/abstracts/tokens/components/
  Contratos por componente. Un archivo por componente.
  --component-btn-primary-bg: var(--semantic-color-primary);
  ↓ solo referenciados por el archivo SCSS del componente correspondiente

Tier 4 — Página/Override scss/pages/ o inline en temas
  Overrides de contexto específico. Raros.
```

**Regla de referencia:**
- ✅ Component → Semantic → Primitive
- ❌ Component → Primitive (salta semántico — viola R01)
- ❌ Semantic → Component (dirección incorrecta)

---

### Prefijos oficiales

Solo estos prefijos son válidos en SYX:

| Prefijo | Tier | Propósito |
|---------|------|-----------|
| `--primitive-` | 1 | Valores crudos |
| `--semantic-` | 2 | Roles contextuales |
| `--component-` | 3 | Contratos de componente |
| `--theme-` | Cualquiera | Valores estructurales de tema |
| `--icon-` | Cualquiera | Sistema de tamaños/colores de iconos |
| `--layout-` | Cualquiera | Sistema de grid y layout |
| `--reset-` | Cualquiera | Valores de reset/base |

Cualquier propiedad que no use uno de estos prefijos es una **variable legacy** (R07) catalogada en `lint-contract.json`.

---

### Naming convention

```
--{tier}-{category}-{property}-{variant?}-{state?}

Ejemplos:
--primitive-color-brand-500
--semantic-color-bg-primary
--semantic-color-text-secondary
--semantic-border-radius-md
--semantic-space-inset-lg
--component-btn-primary-bg
--component-btn-primary-bg-hover
--component-form-border-focus
--component-card-padding-x-compact
```

**Reglas:**
- Solo guiones. Sin underscores, sin camelCase.
- Grupos de categoría: `color`, `space`, `font`, `border`, `shadow`, `opacity`, `size`, `transition`
- Sufijos de variante: `-primary`, `-secondary`, `-subtle`, `-inverse`, `-sm`, `-md`, `-lg`, `-xl`
- Sufijos de estado: `-hover`, `-focus`, `-active`, `-disabled`, `-error`, `-success`

---

### Cobertura semántica obligatoria

Todo tema debe definir todos los tokens en estas categorías:

**Color — Superficies:**
```
--semantic-color-bg-primary / -secondary / -tertiary
--semantic-color-border-subtle / -default / -strong
--semantic-color-text-primary / -secondary / -tertiary / -inverse
--semantic-color-primary / -primary-hover
```

**Color — Estado:**
```
--semantic-color-state-success / -error / -warning / -info / -focus
--semantic-color-border-focus
```

**Espaciado:**
```
--semantic-space-inset-xs / -sm / -md / -lg / -xl
--semantic-space-stack-xs / -sm / -md / -lg / -xl
--semantic-space-inline-xs / -sm / -md / -lg / -xl
```

**Tipografía:**
```
--semantic-font-size-overline / -body-small / -body / -body-large
--semantic-font-weight-regular / -medium / -bold / -black
--semantic-font-family-base / -mono
--semantic-line-height-tight / -base / -loose
```

**Forma:**
```
--semantic-border-width
--semantic-border-radius-sm / -md / -lg / -full
```

**Movimiento:**
```
--semantic-transition-duration-fast / -base / -slow
--semantic-transition-easing-default / -in / -out
```

---

### tokens.json — formato de entrada

Cada token creado debe registrarse en `tokens.json`:

```json
"--component-{name}-{property}": {
  "type": "color | spacing | font-size | font-weight | border-radius | border-width | shadow | opacity | duration | easing | size",
  "rawValue": "var(--semantic-color-primary)",
  "status": "active",
  "usedIn": ["scss/atoms/_{name}.scss"]
}
```

Status: `active` | `deprecated` | `phantom`

---

### Principio de tokens context-neutral

Los tokens no deben asumir viewport, estado de JS, o contexto de renderización.

```scss
// ✗ El token asume un viewport
--component-hero-font-size: 3.25rem;

// ✓ El token expresa intención; clamp() codifica el rango
--component-hero-font-size: clamp(2.5rem, 7vw, 5rem);
```

**Qué referencia un token de componente.** Por defecto, el semántico inmediatamente superior:

```scss
--component-hero-title-font-size: var(--semantic-font-size-h1);
--component-hero-title-color:     var(--semantic-color-text-primary);
```

La rampa fluida es la excepción documentada: **no existe un tier semántico fluido**, así que un `clamp()` que necesita interpolar entre dos extremos lo escribe el token de componente en literales, como hace `scss/abstracts/tokens/components/_sections.scss`. Es la única forma en la que un valor crudo es legítimo, y lo es porque vive en la capa de tokens, no en la de componente. Dentro de `scss/atoms|molecules|organisms/` no hay excepción: solo `var(--component-*)` y `var(--semantic-*)`.

```scss
// ✗ Fallback roto sin JS
--component-menu-height: var(--js-menu-height, 0px);

// ✓ Fallback usable
--component-menu-height: var(--js-menu-height, auto);
```

---

## checklist

- [ ] ¿El token referencia solo el tier inmediatamente superior?
- [ ] ¿El nombre sigue el patrón `--{tier}-{category}-{property}-{variant?}-{state?}`?
- [ ] ¿El token está registrado en `tokens.json` con status `active`?
- [ ] ¿Los tokens de componente van en `scss/abstracts/tokens/components/_{name}.scss`?
- [ ] ¿El token no asume viewport, JS, ni contexto de renderización?
- [ ] ¿No se crean tokens especulativos (solo los que realmente varían entre temas)?
