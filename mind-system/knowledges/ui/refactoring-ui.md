# Refactoring UI — Principios de diseño visual para interfaces

## meta

| Campo | Valor |
|-------|-------|
| **Dominio** | UI — composición visual, spacing, jerarquía |
| **Fuente** | Adam Wathan & Steve Schoger — *Refactoring UI* (2018) |
| **Objetivo** | Fundamentar las reglas de spacing, jerarquía visual y composición en el modo `[SYX: UI]:` |
| **Agent tags** | `#ui` `#spacing` `#hierarchy` `#composition` `#visual-design` |

---

## concepts

Refactoring UI es la referencia práctica más directamente aplicable al desarrollo de componentes de sistema de diseño. Sus principios resuelven los errores más frecuentes de implementación visual: spacing inconsistente, jerarquía débil, color mal distribuido.

---

## rules

### 1. Start with too much white space, then remove
El error más común en implementación es añadir espaciado insuficiente. El punto de partida debe ser generoso — es más fácil reducir que añadir.

**En SYX:**
- El token `--semantic-space-inset-md` (16px) es el espaciado mínimo para contenedores de contenido
- Entre secciones: `--semantic-space-stack-xl` (32px) o mayor
- Entre elementos relacionados dentro de una sección: `--semantic-space-stack-sm` (12px) o `--semantic-space-stack-md` (16px)

---

### 2. Establish a spacing and sizing system
No usar valores arbitrarios. Todo el spacing resuelve en múltiplos de 4px (el 4px grid).

```
4px  → micro: gaps entre iconos y texto
8px  → xs: espaciado dentro de componentes compactos
12px → sm: padding de inputs, gap entre elementos tight
16px → md: padding estándar, gap entre elementos normales
24px → lg: espaciado entre secciones pequeñas
32px → xl: espaciado entre secciones principales
48px → 2xl: secciones de landing page
64px → 3xl: hero sections, grandes bloques editoriales
```

**Regla:** si un valor no cae en este grid, es señal de que el diseño necesita ajuste o de que falta un token.

---

### 3. You don't have to fill the whole screen
El instinto de llenar el espacio disponible produce interfaces saturadas. El contenido debe tener el ancho que le corresponde por su tipo — no expandirse para llenar el viewport.

**En SYX:**
- Las líneas de texto de cuerpo tienen máximo 65–75 caracteres (≈ 40rem)
- Los formularios no ocupan el ancho completo en pantallas grandes
- Las tarjetas tienen su tamaño natural, no se estiran para llenar una grid

---

### 4. Grays are your friend
El uso excesivo de color hace que los elementos de color pierdan su señal. Los grises neutros hacen el trabajo pesado de la jerarquía visual.

**En SYX:**
- `--semantic-color-bg-secondary` y `-tertiary` para crear profundidad sin usar color de marca
- `--semantic-color-text-secondary` para texto de apoyo (metadatos, hints)
- `--semantic-color-text-tertiary` para elementos de menor jerarquía
- El color de marca solo en elementos interactivos y acciones primarias (regla 10%)

---

### 5. Don't use grey text on colored backgrounds
Texto gris sobre fondo de color produce un contraste impredecible. En su lugar, usar texto blanco con opacidad o texto con el mismo tono que el fondo pero más oscuro.

```scss
// ✗ Problemático — el contraste depende de qué tan oscuro es el background
color: #6b7280; // sobre un background azul, puede fallar WCAG

// ✗ También problemático en SYX — hex crudo y opacidad sin tokenizar (R01/R07)
color: rgba(255, 255, 255, 0.75);

// ✓ En un fichero de componente — el rol semántico ya resuelve el contraste
color: var(--semantic-color-text-inverse);   // sobre fondo de color
color: var(--semantic-color-text-primary);   // sobre fondo claro
```

**Por qué el principio no cambia pero el código sí.** La regla de Wathan y Schoger —- nunca gris sobre color, sino blanco con opacidad o el mismo tono más oscuro —- sigue siendo cierta. Lo que cambia es dónde se decide: en SYX esa decisión ya está tomada en la capa semántica, y el componente solo elige el rol. Si el par de colores que necesitas no tiene rol semántico, el arreglo no es escribir el valor en el componente: es pedirle a TOKEN que lo cree. Un `--primitive-*` en un fichero de componente viola R01 aunque el tono sea el correcto.

---

### 6. Emphasize by de-emphasizing
Para hacer que algo destaque, a veces la solución es hacer que lo que está alrededor sea menos prominente — no hacer el elemento principal más llamativo.

**Aplicación en jerarquía editorial:**
- `atom-title` tiene el contraste máximo (`--semantic-color-text-primary`)
- Los metadatos (fecha, autor, sección) tienen contraste reducido (`--semantic-color-text-tertiary`)
- La diferencia crea la jerarquía — no es necesario agrandar el título

---

### 7. Labels are a last resort
En muchas interfaces, los labels añaden noise sin añadir información que no sea obvia del contexto.

```
✗ "Precio: $24.99"        → el label no añade información
✓ "$24.99"                → el contexto (precio en una tarjeta de producto) es suficiente

✓ Usar labels cuando:
  - El valor podría ser confundido con otro dato sin el label
  - El campo está fuera de su contexto natural
  - El usuario necesita comparar múltiples instancias del mismo dato
```

**En SYX:** los componentes `atom-data-label` y sus pares se usan cuando el contexto no es suficiente — no como default para todo dato visible.

---

### 8. Separate visual hierarchy from document hierarchy
La jerarquía visual (tamaño, peso, contraste) y la jerarquía del documento (h1, h2, h3) son independientes. El heading h1 no tiene por qué ser el elemento visualmente más grande en todas las páginas.

**Ejemplo en SYX:**
- Una tarjeta puede tener un `<h3>` con font-size pequeño pero peso 600 y contraste alto
- Un elemento decorativo grande puede ser `<p>` con font-size grande pero peso ligero y contraste bajo
- Lo que importa es la señal visual que el usuario recibe, no el tag HTML

---

## checklist

- [ ] ¿Todo el spacing es múltiplo de 4px?
- [ ] ¿El espaciado inicial es generoso (luego se puede reducir)?
- [ ] ¿El contenido tiene el ancho apropiado para su tipo (no se estira para llenar la pantalla)?
- [ ] ¿Los grises hacen el trabajo de jerarquía visual secundaria?
- [ ] ¿El texto sobre fondos de color tiene contraste predecible (no gris sobre color)?
- [ ] ¿La jerarquía usa de-énfasis tanto como énfasis?
- [ ] ¿Los labels están justificados (el contexto no es suficiente sin ellos)?
- [ ] ¿La jerarquía visual está separada de la jerarquía de documento cuando corresponde?
