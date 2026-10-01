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
  --primitive-color-blue-500: oklch(0.60 0.275 270.486);
  --primitive-space-base: 0.5rem;
  ↓ la paleta propia de cada tema se asigna en su _theme.scss

Tier 2 — Semánticos      scss/abstracts/tokens/semantic/
  Roles contextuales. Nombres de función, no de valor.
  --semantic-color-primary: var(--primitive-color-purple-500);
  --semantic-space-component-md: var(--primitive-fluid-space-md);
  ↓ referenciados por tokens de componente

Tier 3 — Componente      scss/abstracts/tokens/components/
  Contratos por componente. Un archivo por componente.
  --component-button-primary-filled-bg: var(--semantic-color-primary);
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
--primitive-color-purple-500
--semantic-color-bg-primary
--semantic-color-text-secondary
--semantic-border-radius-default
--semantic-space-component-lg
--component-button-primary-filled-bg
--component-button-primary-filled-bg-hover
--component-form-field-border-focus
--component-button-disabled-color
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
--semantic-color-text-primary / -secondary / -tertiary / -inverse / -on-primary
--semantic-color-primary / -secondary / -tertiary / -quaternary / -quinary
```

El hover no es un sufijo de cada rol de marca: vive en
`--semantic-color-state-hover-primary / -secondary / -tertiary / -quaternary`.

**Color — Estado:**
```
--semantic-color-state-success / -error / -warning / -info / -focus
--semantic-color-border-focus
```

**Espaciado:**
```
--semantic-space-component-xs / -sm / -md / -lg / -xl   (relleno interno)
--semantic-space-stack-xs / -sm / -md / -lg / -xl       (separación vertical)
--semantic-space-inline-xs / -sm / -md / -lg            (separación horizontal)
--semantic-space-layout-xs / -sm / -md / -lg / -xl / -xxl
```

**Tipografía:**
```
--semantic-font-size-overline / -caption / -body-small / -body / -body-large / -h1 … -h6
--semantic-font-weight-regular / -medium / -bold / -black
--semantic-font-family-primary / -primary-bold / -heading / -mono
--semantic-line-height-tight / -snug / -normal / -relaxed / -body / -heading
```

**Forma:**
```
--semantic-border-width-thin / -default / -thick
--semantic-border-radius-sm / -default / -lg / -xl / -full
```

**Movimiento:**
```
--semantic-duration-instant / -fast / -base / -slow
--semantic-easing-standard / -out / -in-out / -linear
```

---

### tokens.json — se genera, no se escribe

`tokens.json` sale del SCSS: `npm run build` lo regenera con
`scripts/build-tokens-json.js` y `npm run check:tokens-json` falla si alguien lo
edita a mano o se queda desfasado. Registrar un token es declararlo en su
fichero de `scss/abstracts/tokens/`; la entrada aparece sola:

```json
"--component-button-primary-filled-bg": {
  "key": "button-primary-filled-bg",
  "type": "ALIAS",
  "value": "--semantic-color-primary",
  "rawValue": "var(--semantic-color-primary)",
  "status": "active",
  "layer": "component"
}
```

`type` es ALIAS · COLOR · FLOAT · STRING. `status` es `active` o `deprecated`
(lo único, junto con `note`, `aliasOf` y `replacedBy`, que el generador conserva
de la versión anterior porque el SCSS no lo dice).

¿Falta un token? Pregunta con `get_token`. Si no existe y es de componente,
propónlo con `node scripts/propose.js token`; si es semántico, la capa es humana
(`contracts/trust.json`): recomiéndalo a una persona.

---

### Principio de tokens context-neutral

Los tokens no deben asumir viewport, estado de JS, o contexto de renderización.

```scss
// ✗ El token asume un viewport
--component-hero-font-size: 3.25rem;

// ✓ El token expresa intención; clamp() codifica el rango
--component-hero-headline-font-size: clamp(2.5rem, 7vw, 5rem);
```

**Qué referencia un token de componente.** Por defecto, el semántico inmediatamente superior:

```scss
--component-dialog-title-font-size: var(--semantic-font-size-h5);
--component-dialog-color:            var(--semantic-color-text-primary);
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
- [ ] ¿El token está declarado en `scss/abstracts/tokens/` y `npm run check:tokens-json` pasa (tokens.json regenerado)?
- [ ] ¿Los tokens de componente van en `scss/abstracts/tokens/components/_{name}.scss`?
- [ ] ¿El token no asume viewport, JS, ni contexto de renderización?
- [ ] ¿No se crean tokens especulativos (solo los que realmente varían entre temas)?
