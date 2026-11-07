# Component Patterns — BEM y patrones de componente en SYX

## meta

| Campo | Valor |
|-------|-------|
| **Dominio** | SYX — patrones de nomenclatura y estructura de componentes |
| **Fuente** | Arquitectura interna SYX; BEM methodology (getbem.com) |
| **Objetivo** | Referencia de BEM en SYX, prefijos atom/mol/org, y checks de naming para AUDIT |
| **Agent tags** | `#bem` `#atomic` `#naming` `#atom-` `#mol-` `#org-` |

---

## concepts

SYX usa BEM (Block Element Modifier) con prefijos de nivel atómico. Los prefijos indican el nivel en la jerarquía Atomic Design, lo que permite saber con solo leer el nombre de la clase si un componente es un átomo, molécula u organismo.

---

## rules

### Niveles atómicos y sus prefijos

| Nivel | Prefijo CSS | Descripción | Carpeta SCSS |
|-------|-------------|-------------|--------------|
| Atom | `.atom-` | Elemento único, sin dependencias de componentes | `scss/atoms/` |
| Molecule | `.mol-` | Composición de átomos con función específica | `scss/molecules/` |
| Organism | `.org-` | Sección compleja de página, compuesta de moléculas | `scss/organisms/` |

**Regla:** no saltar niveles. Un organismo no contiene átomos directamente (contiene moléculas que contienen átomos).

---

### Sintaxis BEM en SYX

```
.{prefix}-{name}                   ← Block
.{prefix}-{name}__{element}        ← Element (doble underscore en BEM clásico → doble guión en SYX)
.{prefix}-{name}--{modifier}       ← Modifier
```

```html
<!-- Atom: botón. atom-btn no tiene elementos: el icono es un atom-icon dentro -->
<button class="atom-btn atom-btn--primary atom-btn--has-icon" type="button">
  <span class="atom-icon atom-icon--lc-check" aria-hidden="true"></span>
  Guardar
</button>

<!-- Molecule: campo de formulario (componen atoms: atom-label, atom-input) -->
<div class="mol-form-field mol-form-field--is-error">
  <label class="atom-label" for="email">Email</label>
  <input class="atom-input" type="email" id="email" aria-invalid="true" aria-describedby="email-msg" />
  <span class="mol-form-field__msg" id="email-msg">Email no válido</span>
</div>

<!-- Organism: header del sitio -->
<header class="org-site-header">
  <a class="org-site-header__brand" href="/">…</a>
  <nav class="org-site-header__nav">…</nav>
  <div class="org-site-header__actions">…</div>
</header>
```

---

### Reglas de naming

**Dos guiones para elementos (`__`) y modificadores (`--`):**
```scss
.mol-card { }           // Block
.mol-card__title { }    // Element
.mol-card--flat { }     // Modifier
```

**Nombres en kebab-case:**
```
✓ .mol-form-field-set
✓ .atom-btn--has-icon
✗ .molFormFieldSet
✗ .atom-btn--hasIcon
```

**Un nivel de elemento — sin elementos de elementos:**
```scss
// ✓ Correcto
.mol-card__header { }
.org-site-header__burger-line { }   // "burger line" como un concepto

// ✗ Incorrecto (elementos anidados)
.mol-card__header__title { }  // No existe en BEM
```

**Modificadores en el bloque, no en los elementos:**
```html
<!-- ✓ El modificador va en el bloque -->
<div class="mol-card mol-card--elevated">
  <h3 class="mol-card__title">…</h3>  <!-- ✗ no .mol-card__title--elevated -->
</div>
```

---

### Checks de naming (para AUDIT)

| Violación | Ejemplo | Corrección |
|-----------|---------|-----------|
| Prefijo incorrecto | `.button-primary` | `.atom-btn--primary` |
| Nombre sin prefijo | `.card` | `.mol-card` |
| Prefijo de nivel equivocado | ❌ `.atom-card` (card es molecule) | ✓ `.mol-card` |
| Elementos de elementos | ❌ `.mol-card__header__title` | ✓ un elemento con nombre compuesto, como `.org-site-header__burger-line` |
| Selector de atributo para BEM | `[class*="--primary"]` | `.atom-btn--primary` |
| camelCase | `.molCard` | `.mol-card` |

---

### Estructura del componente en el DOM

Todo componente SYX sigue esta estructura mínima:

```html
<!-- El bloque es el elemento root -->
<{element} class="{prefix}-{name} [{prefix}-{name}--{modifier}*]"
           [aria-*]
           [data-*]>

  <!-- Los elementos son hijos directos del bloque o de otros elementos -->
  <{element} class="{prefix}-{name}__{element}">
    <!-- Si contiene un átomo de otro tipo, va con su propio nombre BEM -->
    <span class="atom-icon" aria-hidden="true">…</span>
  </{element}>

</{element}>
```

---

## checklist

- [ ] ¿El bloque usa el prefijo correcto: `.atom-`, `.mol-`, o `.org-`?
- [ ] ¿Los elementos usan `__` (doble guión) correctamente?
- [ ] ¿Los modificadores usan `--` (doble guión) correctamente?
- [ ] ¿No hay elementos de elementos (`__element__subelement`)?
- [ ] ¿Los modificadores están en el bloque, no en los elementos?
- [ ] ¿No hay selectores de atributo para variantes BEM (`[class*="--"]`)?
- [ ] ¿Los nombres son kebab-case (sin camelCase)?
- [ ] ¿El nivel atómico es correcto (atom/molecule/organism)?
