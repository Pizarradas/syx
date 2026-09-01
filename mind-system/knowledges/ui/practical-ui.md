# Practical UI — Correcciones ópticas, elevación y densidad

## meta

| Campo | Valor |
|-------|-------|
| **Dominio** | UI — detalle visual y correcciones ópticas en componentes |
| **Fuente** | Práctica consolidada de sistemas de diseño maduros (Material Design, Apple HIG); Refactoring UI (Wathan & Schoger, 2018) |
| **Objetivo** | Fundamentar el sistema de elevación, los modificadores de densidad y las correcciones ópticas del modo `[SYX: UI]:` |
| **Agent tags** | `#ui` `#elevation` `#density` `#optical` `#border-radius` |

---

## concepts

La "precisión matemática" en UI a menudo produce resultados que se ven incorrectos. El ojo humano tiene sesgos perceptivos que hacen que valores geométricamente exactos parezcan desalineados o desequilibrados. El diseño de detalle corrige estos sesgos.

---

## rules

### 1. Sistema de elevación — 5 niveles

La sombra comunica proximidad al usuario. Un componente con más sombra está perceptivamente "más cerca" del usuario que la superficie de la página.

| Nivel | Token | Uso típico |
|-------|-------|-----------|
| 0 | sin sombra | Elementos planos, filas de tabla, list items |
| 1 | `--semantic-shadow-sm` | Tarjetas, inputs, selects en reposo |
| 2 | `--semantic-shadow-md` | Dropdowns abiertos, tooltips, floating labels |
| 3 | `--semantic-shadow-lg` | Modales, drawers, popovers |
| 4 | `--semantic-shadow-xl` | Command palettes, overlays a pantalla completa |

**Regla:** una tarjeta (Level 1) dentro de un modal (Level 3) no gana una segunda sombra. Los elementos hijos heredan el contexto de elevación del contenedor.

**Nunca mezclar niveles** en el mismo componente: si un card tiene `shadow-sm`, ninguno de sus elementos hijos debe tener sombra propia.

---

### 2. Densidad — tres contextos sin breakage

Los componentes soportan tres densidades mediante modificadores CSS:

| Densidad | Clase | Padding-y | Font-size |
|----------|-------|-----------|-----------|
| Compact | `--compact` | × 0.75 | Un paso menor (0.875rem si base es 1rem) |
| Default | _(ninguna)_ | × 1 | Como diseñado |
| Comfortable | `--comfortable` | × 1.375 | Como diseñado |

**Implementación mediante token override:**
```scss
.atom-btn--compact {
  --component-btn-padding-y: calc(var(--component-btn-padding-y-base) * 0.75);
}
```

No hardcodear los valores de densidad — hacerlo mediante `calc()` sobre el token base garantiza que los temas que cambian el token base no rompan la densidad.

---

### 3. Border-radius compensation (corrección óptica crítica)

Cuando un elemento hijo está dentro de un contenedor redondeado con padding, el radio del hijo debe ser menor que el del padre:

```
child-radius = parent-radius − parent-padding
```

**Ejemplo:**
- `parent-radius: 12px` + `parent-padding: 8px` → `child-radius: 4px`
- Usar `12px` en el hijo produce un "bulging corner" — las esquinas del hijo sobresalen visualmente del padre

```scss
// ✓ Correcto
.mol-card { @include border-radius(var(--semantic-border-radius-lg)); /* 12px */ }
.mol-card__image { @include border-radius(var(--semantic-border-radius-sm)); /* 4px = 12 - 8 */ }

// ✗ Incorrecto
.mol-card__image { @include border-radius(var(--semantic-border-radius-lg)); /* 12px — bulge */ }
```

---

### 4. Alineación óptica de iconos con texto

Los iconos alinean al **centro óptico** del cap-height del texto, no al centro matemático del line-height.

```scss
// Punto de partida
vertical-align: middle;

// Ajuste fino si el cap-height genera desalineación
transform: translateY(-1px);  // corrección óptica típica
```

**Por qué:** `vertical-align: middle` alinea al centro del em-square, no al centro del cap-height. La mayoría de fuentes tienen el cap-height ligeramente por encima del centro matemático del em-square. El `translateY(-1px)` corrige esa diferencia perceptiva.

---

### 5. Padding óptico de botones

Los botones visualmente equilibrados tienen padding horizontal mayor que vertical:

```
padding-x = 1.5× a 2× padding-y
```

Un botón con `padding: 12px` en todos los lados parece "apretado" horizontalmente. Con `padding: 12px 20px`, el texto respira igualmente en todas las direcciones.

```scss
// ✓ Óptico
@include padding(var(--component-btn-padding-y) var(--component-btn-padding-x));
// padding-y: 0.75rem, padding-x: 1.25rem (≈ 1.67×)

// ✗ Matemáticamente simétrico pero visualmente desequilibrado
@include padding(var(--component-btn-padding-y));
```

---

### 6. Outline visual weight en dark mode

Un `outline-width: 2px` sobre fondo oscuro parece más delgado que sobre fondo claro. En superficies oscuras, compensar:

```scss
@include darkmode {
  outline-width: 2.5px;
  // O usar: var(--semantic-focus-ring-width-inverse)
}
```

---

## checklist

- [ ] ¿Las sombras siguen el sistema de 5 niveles (0–4)?
- [ ] ¿Los elementos hijos no tienen sombra propia cuando están en un contenedor elevado?
- [ ] ¿El componente soporta `--compact` y `--comfortable` sin breakage?
- [ ] ¿La densidad se implementa con `calc()` sobre el token base (no hardcoded)?
- [ ] ¿Los hijos dentro de contenedores redondeados aplican radius compensation?
- [ ] ¿Los iconos inline aplican corrección óptica de alineación?
- [ ] ¿El padding horizontal de botones es ≥ 1.5× el vertical?
- [ ] ¿El focus ring tiene compensación de grosor en dark mode?
