# Accessibility WCAG — Accesibilidad y estándares web

## meta

| Campo | Valor |
|-------|-------|
| **Dominio** | Front-end — accesibilidad y estándares WCAG |
| **Fuente** | W3C WCAG 2.1 AA; W3C WCAG 2.2; ARIA Authoring Practices Guide; Heydon Pickering — *Inclusive Components* |
| **Objetivo** | Fundamentar los requisitos de accesibilidad en los modos UX y AUDIT de SYX |
| **Agent tags** | `#accessibility` `#wcag` `#aria` `#focus` `#contrast` |

---

## concepts

La accesibilidad no es una capa adicional que se añade al final. Es una propiedad estructural del diseño. Diseñar accesible desde el principio:
- Hace la jerarquía semántica correcta (mejora SEO y mantenibilidad)
- Hace los estados de los componentes explícitos (mejora la robustez)
- Hace el contraste suficiente (mejora la legibilidad para todos los usuarios)
- Hace la navegación por teclado funcionar (beneficia a usuarios de power-keyboard, no solo a usuarios con discapacidad motriz)

La accesibilidad bien diseñada mejora la UX general. No la degrada.

---

## rules

### Contraste (WCAG 1.4.3 / 1.4.11)

| Tipo | Mínimo | Cuándo aplica |
|------|--------|---------------|
| Texto normal (< 18pt regular / < 14pt bold) | **4.5:1** | Cuerpo, labels, hints, captions |
| Texto grande (≥ 18pt / ≥ 14pt bold) | **3:1** | Headings, texto display |
| Componentes UI | **3:1** | Bordes de input, botones, focus ring, iconos |

**Por qué 4.5:1:** garantiza legibilidad para usuarios con visión reducida equivalente a 20/80 sin corrección.

**El límite `#6b7280`:** ese valor produce exactamente 4.6:1 sobre blanco `#ffffff`. Es el mínimo aceptable para texto de cuerpo normal. Por debajo de ese valor, el texto muted viola WCAG 1.4.3.

```
#111827 → 16.8:1 (headings, texto primario)
#374151 → 10.7:1 (texto de cuerpo)
#6b7280 → 4.6:1  (texto muted — mínimo AA)
#9ca3af → 2.5:1  (FALLA texto normal — solo decorativo)
```

---

### Uso del color (WCAG 1.4.1)

El color no puede ser el único medio para transmitir información. ~8% de los hombres tienen alguna forma de deficiencia en la percepción del color.

**Regla SYX:** cada estado (error, éxito, deshabilitado) requiere al menos dos señales visuales:
- Error: cambio de borde + icono + texto
- Éxito: cambio de color + icono de checkmark
- Deshabilitado: opacity + cursor + atributo `disabled` o `aria-disabled`

---

### Secuencia significativa (WCAG 1.3.2)

El orden de lectura del contenido debe ser correcto sin CSS. → Ver `mobile-first.md` §4 (DOM order = prioridad de contenido).

---

### Tamaño de objetivo táctil

| Estándar | Mínimo | Nivel |
|----------|--------|-------|
| WCAG 2.1 — 2.5.5 | 44×44px | AAA (recomendado) |
| WCAG 2.2 — 2.5.8 | 24×24px | AA (obligatorio) |
| Apple HIG / Material | 44×44px | Recomendación de plataforma |

En SYX: 44×44px como mínimo para el área táctil. El área táctil puede ser mayor que el elemento visual mediante padding.

---

### Focus appearance (WCAG 2.2 — 2.4.11)

El indicador de foco debe ser visible con:
- Área mínima: perímetro del componente × 2px
- Contraste: 3:1 entre el estado enfocado y no enfocado
- No recortado por `overflow: hidden` en ningún ancestro

**Implementación SYX:** `@include focus-ring()` — 2px outline, 2px offset. Nunca `outline: none` sin un reemplazo visible.

---

### ARIA — cuándo y por qué

ARIA no es un reemplazo del HTML semántico. Es un complemento para cuando el HTML es insuficiente.

**Regla:** HTML semántico primero. ARIA solo cuando el HTML es insuficiente.

```html
<!-- Bien: HTML semántico, no necesita ARIA -->
<button type="button">Guardar cambios</button>

<!-- Bien: HTML insuficiente para el patrón, ARIA necesario -->
<div role="dialog" aria-labelledby="modal-title" aria-modal="true">…</div>

<!-- Mal: ARIA innecesario sobre HTML semántico -->
<button type="button" role="button">Guardar cambios</button>
```

**Atributos ARIA obligatorios en SYX:**

| Atributo | Cuándo | Por qué |
|----------|--------|---------|
| `aria-expanded` | Toggles, acordeones, dropdowns | El estado abierto/cerrado no es perceptible sin él |
| `aria-hidden="true"` | Iconos decorativos | Evita que el lector anuncie nombres de iconos sin contexto |
| `aria-describedby` | Campos con hint o error | Asocia el texto de ayuda al campo |
| `aria-live` | Contenido que cambia dinámicamente | Sin esto, los cambios son silenciosos para lectores de pantalla |
| `aria-busy="true"` | Estados de carga | Indica que el contenido está siendo actualizado |
| `aria-required="true"` | Campos obligatorios | El `*` visual no es suficiente para tecnología asistiva |
| `aria-current="page"` | Estado activo en navegación | El estado activo debe comunicarse semánticamente |

---

### Patrones ARIA de referencia (ARIA APG)

| Patrón | Qué implementa |
|--------|----------------|
| **Dialog (Modal)** | Focus trap al abrir, `Escape` para cerrar, restaurar foco al trigger |
| **Disclosure (Accordion)** | `aria-expanded` en el trigger, `aria-controls` apuntando al panel |
| **Tabs** | `role="tablist"`, `role="tab"`, `role="tabpanel"`, navegación con flechas |
| **Combobox** | `role="combobox"`, `aria-autocomplete`, `aria-owns` |

Referencia: [w3.org/WAI/ARIA/apg](https://www.w3.org/WAI/ARIA/apg/)

---

### Gestión del foco — las tres reglas

1. **El foco no desaparece nunca.** Cuando un elemento interactivo desaparece (modal que se cierra), el foco va a un lugar definido — el trigger que abrió el modal.

2. **El foco no se sale del modal.** Cuando un modal está abierto, el foco no puede alcanzar elementos detrás del modal (focus trap).

3. **El foco visible es obligatorio.** WCAG 2.4.7 (AA) exige que el foco sea visible. `outline: none` sin reemplazo es una violación.

---

## checklist

**Contraste:**
- [ ] ¿Texto normal ≥ 4.5:1?
- [ ] ¿Texto grande ≥ 3:1?
- [ ] ¿Componentes UI ≥ 3:1?
- [ ] ¿Texto muted no usa valores por debajo de 4.6:1 sobre blanco?

**Color e información:**
- [ ] ¿Cada estado tiene al menos 2 señales visuales (no solo color)?
- [ ] ¿Los errores tienen borde + icono + texto?

**Interacción:**
- [ ] ¿Todos los targets interactivos ≥ 24×24px (AA)? ¿≥ 44×44px (recomendado)?
- [ ] ¿El focus ring es visible y tiene contraste ≥ 3:1?
- [ ] ¿Los modales tienen focus trap y restauran el foco al cerrar?
- [ ] ¿La navegación por teclado sigue el DOM order?

**ARIA:**
- [ ] ¿Los toggles tienen `aria-expanded`?
- [ ] ¿Los iconos decorativos tienen `aria-hidden="true"`?
- [ ] ¿Los campos con hint/error usan `aria-describedby`?
- [ ] ¿Los cambios dinámicos usan `aria-live` o `role="alert"`?
- [ ] ¿El estado activo en navegación usa `aria-current="page"`?
