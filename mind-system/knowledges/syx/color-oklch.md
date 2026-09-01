# Color OKLCH — Teoría del color en SYX

## meta

| Campo | Valor |
|-------|-------|
| **Dominio** | SYX — sistema de color con OKLCH |
| **Fuente** | Björn Ottosson — *A perceptual color space for image processing* (2020); Adam Wathan & Steve Schoger — *Refactoring UI* (2018) |
| **Objetivo** | Fundamentar el uso de OKLCH en primitivos SYX, la construcción de escalas y el sistema de temas dark/light |
| **Agent tags** | `#oklch` `#color` `#primitives` `#palette` `#dark-mode` `#perceptual` |

---

## concepts

SYX usa OKLCH como formato de color en los tokens primitivos. No es una preferencia estética — es una decisión técnica basada en uniformidad perceptiva. OKLCH produce escalas de color donde intervalos iguales de L producen cambios perceptivos iguales, independientemente del tono.

---

## rules

### 1. Por qué OKLCH y no HEX/HSL

**HEX y RGB:** precisión sin percepción. `#2563eb` y `#1d4ed8` son dos azules. Sin un conversor, no hay forma de saber cuál es más claro o cómo están relacionados. Valores a igual "distancia numérica" pueden tener diferencias perceptivas muy distintas.

**HSL:** un paso mejor, pero con uniformidad perceptiva fallida. `hsl(220, 90%, 56%)` (azul) y `hsl(120, 90%, 56%)` (verde) tienen el mismo valor L en HSL, pero el verde se percibe significativamente más brillante. Las paletas construidas en HSL tienen contraste inconsistente entre tonos del mismo "nivel".

**OKLCH:** perceptualmente uniforme. `L` de 0 a 1 produce incrementos perceptivos consistentes, independientemente del tono. Construir paletas es predecible.

```scss
// OKLCH(Lightness Chroma Hue)
oklch(0.55 0.22 260)
//     ↑     ↑    ↑
//     L     C    H
//     0-1   0-0.4  0-360°
```

**Soporte:** CSS nativo desde 2023. Chrome 111+, Firefox 113+, Safari 15.4+.

---

### 2. Construcción de una escala 50–900

```scss
// Escala teal (H=190), tema light
--primitive-color-brand-50:  oklch(0.97 0.03 190);  // near-white tinted
--primitive-color-brand-100: oklch(0.92 0.06 190);
--primitive-color-brand-200: oklch(0.82 0.10 190);
--primitive-color-brand-300: oklch(0.68 0.14 190);
--primitive-color-brand-400: oklch(0.56 0.17 190);
--primitive-color-brand-500: oklch(0.48 0.18 190);  // ← color principal de marca
--primitive-color-brand-600: oklch(0.38 0.15 190);
--primitive-color-brand-700: oklch(0.28 0.11 190);
--primitive-color-brand-800: oklch(0.20 0.07 190);
--primitive-color-brand-900: oklch(0.14 0.04 190);  // near-black tinted
```

**Guía de construcción:**
- **L (lightness):** 0.97 → 0.15 para tema light; 0.15 → 0.97 para tema dark
- **C (chroma):** pico en 500, menor en los extremos (50 y 900). Máximo ≈ 0.25
- **H (hue):** constante a lo largo de la escala (o pequeño shift para warmth/cool)

**Herramienta de referencia:** [oklch.com](https://oklch.com/) — visualización interactiva de escalas OKLCH.

---

### 3. La distribución 60/30/10

En cualquier componente o interfaz:
- **60%** → neutrales: fondos, superficies (`--semantic-color-bg-*`)
- **30%** → secundarios: texto de apoyo, bordes, estructurales
- **10%** → acción: botones primarios, enlaces, foco (`--semantic-color-primary`)

La escasez del 10% es lo que hace que el color de acción señale. Si el primario aparece en contextos no interactivos, el usuario aprende a ignorarlo.

**En SYX:** `--semantic-color-primary` solo en elementos interactivos. Badges informativos, separadores de categoría y decoraciones de sección usan neutrales.

---

### 4. Semántica: nombres de función, no de valor

```scss
// ✗ Nombre de valor — frágil
--semantic-color-blue-500: oklch(0.55 0.22 260);

// ✓ Nombre de función — estable entre temas
--semantic-color-primary: var(--primitive-color-brand-500);
```

El token `--semantic-color-primary` puede ser teal en un tema, coral en otro, azul en un tercero. El nombre describe qué hace, no qué color es.

---

### 5. Dark mode con OKLCH — inversión sistemática

OKLCH facilita el dark mode: para invertir la jerarquía de superficie, incrementar `L` en cada nivel en lugar de decrementar.

```scss
// capa: scss/themes/{nombre}/_theme.scss — aquí var(--primitive-*) es correcto (R01)
// Light: bg-primary = más claro
--semantic-color-bg-primary:   var(--primitive-color-brand-50);  // L=0.97
--semantic-color-bg-secondary: var(--primitive-color-brand-100); // L=0.92
--semantic-color-bg-tertiary:  var(--primitive-color-brand-200); // L=0.82

// Dark: bg-primary = más oscuro; los niveles superiores SON MÁS CLAROS
--semantic-color-bg-primary:   var(--primitive-color-brand-950); // L=0.10
--semantic-color-bg-secondary: var(--primitive-color-brand-900); // L=0.14
--semantic-color-bg-tertiary:  var(--primitive-color-brand-800); // L=0.20
```

Cada paso de 0.04–0.06 L produce la misma percepción de "un nivel más cerca del usuario" en dark y light mode.

**Error frecuente:** invertir los hex directamente — eso no mantiene la señal de elevación ni garantiza contraste. Usar la escala OKLCH con L invertido.

---

### 6. El grupo de estado es independiente de la marca

```scss
// Siempre verde para éxito, siempre rojo para error
// independientemente del color de marca
--semantic-color-state-success: oklch(0.65 0.17 150); // verde
--semantic-color-state-error:   oklch(0.60 0.22  25); // rojo
--semantic-color-state-warning: oklch(0.80 0.16  80); // ámbar
--semantic-color-state-info:    oklch(0.55 0.20 250); // azul
```

Verde = éxito y rojo = error son convenciones cognitivas universales (semáforo, señalización). No sobreescribirlos con el color de marca.

---

## checklist

- [ ] ¿Los primitivos usan `oklch()` (no hex, no hsl)?
- [ ] ¿La escala 50–900 tiene L progresivo (alto en 50, bajo en 900 para light theme)?
- [ ] ¿El chroma pica en el 500 y baja en los extremos?
- [ ] ¿Los tokens semánticos tienen nombres de función (no de valor)?
- [ ] ¿El color de acción ocupa ≈ 10% del espacio visual?
- [ ] ¿El dark mode tiene bg-primary como el más oscuro (L más bajo)?
- [ ] ¿Los tokens de estado son independientes del color de marca?
- [ ] ¿El contraste `text-primary` / `bg-primary` ≥ 4.5:1?
