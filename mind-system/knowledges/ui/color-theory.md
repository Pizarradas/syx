# Color Theory — Teoría del color para interfaces

## meta

| Campo | Valor |
|-------|-------|
| **Dominio** | UI — teoría y uso del color en sistemas de diseño |
| **Fuente** | Refactoring UI (Wathan & Schoger, 2018); Josef Albers — *Interaction of Color* (1963); Material Design Color System |
| **Objetivo** | Fundamentar la distribución 60/30/10, la semántica de los tokens de color, y las decisiones de paleta en SYX |
| **Agent tags** | `#ui` `#color` `#tokens` `#palette` `#contrast` |

---

## concepts

El color en interfaces sirve a tres funciones:
1. **Jerarquía:** comunicar qué elemento es más importante
2. **Señal:** comunicar el estado o tipo de un elemento (error, éxito, interactivo)
3. **Marca:** comunicar la identidad visual de la publicación

El error más frecuente es usar el color de marca para las tres funciones simultáneamente — lo que produce saturación visual y pérdida de señal.

---

## rules

### 1. La distribución 60/30/10

Dentro de cualquier interfaz o componente, el color se distribuye:

- **60%** → colores neutros: fondos, superficies (`--semantic-color-bg-*`)
- **30%** → secundarios: texto de apoyo, bordes, elementos estructurales
- **10%** → color de acción: botones primarios, enlaces, indicadores de foco

**Por qué funciona:** la escasez hace que el color de acción señale. Si el color primario está en el 40% de la interfaz, el usuario aprende a ignorarlo. Cuando aparece en un botón de CTA, ya no destaca.

**Violación frecuente:** usar el color de marca como fondo de secciones, badges decorativos, o separadores de categoría. Cuando el color de acción aparece en contextos no interactivos, pierde su función de señal.

**Regla en SYX:** `--semantic-color-primary` solo en elementos interactivos. Los badges informativos, decoraciones de sección y separadores usan neutrales.

---

### 2. Nombres de función, no de valor

Los tokens semánticos se nombran por su función, no por su color:

```scss
// ✗ Nombre de valor — frágil
--semantic-color-blue-500: oklch(0.55 0.22 260);

// ✓ Nombre de función — estable entre temas
--semantic-color-primary: var(--primitive-color-brand-500);
```

Un token llamado `primary` puede ser azul en un tema, rojo en otro, y verde en un tercero. El nombre es invariante; el valor cambia por tema.

---

### 3. El grupo de estado es independiente de la marca

Los tokens de estado (`--semantic-color-state-success`, `--semantic-color-state-error`) son siempre verde y rojo, independientemente del color de marca.

Verde para éxito y rojo para error son convenciones cognitivas universales (semáforo, señalización). Sobreescribirlos con el color de marca genera confusión — especialmente en usuarios con condiciones médicas o déficit cognitivo.

**Regla:** el color de marca nunca se usa para comunicar estado de error o éxito.

---

### 4. Contraste como información estructural

El contraste entre elementos no es solo un requisito WCAG — es la herramienta principal para comunicar jerarquía sin usar tamaño.

**Sistema de tres niveles en SYX:**
```
Alto contraste   → N1 editorial, acciones primarias
Medio contraste  → N2, N3, texto de cuerpo secundario
Bajo contraste   → Metadatos, hints, decoraciones
```

Cuando todos los elementos tienen el mismo contraste, la jerarquía desaparece. El diseño se percibe plano.

**Ratios mínimos (WCAG 2.1 AA):**
- Texto normal (< 18pt regular / < 14pt bold): **4.5:1**
- Texto grande (≥ 18pt / ≥ 14pt bold): **3:1**
- Componentes UI (bordes de input, iconos activos, focus ring): **3:1**

---

### 5. No usar gris sobre fondos de color

El gris sobre color produce contraste impredecible. El valor `#6b7280` (4.6:1 sobre blanco) puede caer a 1.8:1 sobre un fondo azul de marca.

**Alternativas para texto muted sobre fondos de color:**
- Blanco con opacidad: `rgba(255,255,255, 0.75)` — perceptualmente muted, contraste predecible
- Mismo tono más oscuro: `var(--primitive-color-brand-800)` sobre `brand-100` — mismo tono, mayor L

---

### 6. Dark mode — no es invertir los colores

El error más frecuente en dark mode es invertir la paleta directamente. Esto produce:
- Fondo muy oscuro pero tarjetas igual de oscuras → pérdida de profundidad
- Texto blanco puro sobre negro puro → contraste excesivo (causa fatiga visual nocturna)

**El patrón correcto:**
- Las superficies más elevadas (tarjetas, modales) son **más claras** que el fondo
- El texto primario es near-white (no `#ffffff` puro — `oklch(0.95 0 0)` o similar)
- El color de acción puede necesitar un paso más claro en dark mode para mantener el contraste sobre fondos oscuros

---

## checklist

- [ ] ¿El color de acción ocupa aproximadamente el 10% del espacio visual?
- [ ] ¿Los tokens semánticos tienen nombres de función, no de valor?
- [ ] ¿Los tokens de estado (error, éxito) son independientes del color de marca?
- [ ] ¿Los tres niveles de contraste son visibles (alto/medio/bajo)?
- [ ] ¿El texto normal tiene ≥ 4.5:1 de contraste con su fondo?
- [ ] ¿El texto sobre fondos de color usa blanco con opacidad o mismo tono más oscuro?
- [ ] ¿El dark mode tiene profundidad (superficies elevadas más claras que el fondo)?
- [ ] ¿`--semantic-color-primary` solo se usa en elementos interactivos?
