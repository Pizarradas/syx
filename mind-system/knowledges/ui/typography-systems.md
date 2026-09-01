# Typography Systems — Sistemas tipográficos para interfaces

## meta

| Campo | Valor |
|-------|-------|
| **Dominio** | UI — tipografía de pantalla y sistemas tipográficos |
| **Fuente** | Richard Rutter — *Web Typography* (2017); Tim Brown — *More Meaningful Typography* (A List Apart, 2011); Utopia.fyi |
| **Objetivo** | Fundamentar las reglas de line-height, letter-spacing, escalas tipográficas y fluid type en el modo `[SYX: UI]:` |
| **Agent tags** | `#ui` `#typography` `#line-height` `#letter-spacing` `#fluid-type` `#clamp` |

---

## concepts

La tipografía en pantalla tiene reglas específicas que difieren de la tipografía impresa. La resolución, la distancia de lectura, el tamaño variable del viewport y la naturaleza scrollable del contenido generan requisitos distintos. Un sistema tipográfico resuelve jerarquía, ritmo y escalabilidad de forma consistente.

---

## rules

### 1. Escalas modulares — por qué son matemáticas

El sistema usa una escala modular basada en la razón **1.25** (Major Third):

```
0.75rem  (12px) → xs
0.875rem (14px) → sm
1rem     (16px) → base
1.25rem  (20px) → md
1.5rem   (24px) → lg
2rem     (32px) → xl
2.5rem   (40px) → 2xl
3.25rem  (52px) → 3xl
```

**Por qué una razón matemática:** el ojo percibe diferencias relativas, no absolutas. La diferencia entre 16px y 20px (×1.25) se percibe igual que entre 20px y 25px (×1.25). Si los valores son arbitrarios, el contraste entre niveles es inconsistente y la jerarquía se percibe aleatoria.

---

### 2. Line-height — la propiedad más frecuentemente mal implementada

| Rol tipográfico | `line-height` | Por qué |
|-----------------|---------------|---------|
| Display / hero | 1.05–1.15 | A tamaños grandes, line-height estándar crea espacio excesivo — el ojo pierde la siguiente línea |
| Heading h2–h3 | 1.2–1.3 | Balance entre cohesión del bloque y legibilidad |
| Heading h4–h5 | 1.3–1.4 | Más espacio necesario a menor tamaño |
| Body / paragraph | 1.5–1.65 | El ojo necesita este espacio para encontrar la siguiente línea en textos largos |
| UI label / caption | 1.3–1.4 | Etiquetas son cortas — no necesitan tanto interlineado |
| Overline | 1.2 | Siempre una sola línea |
| Monospace / code | 1.6 | Código denso necesita espacio extra para distinguir líneas |

**Nunca usar `line-height` en `px`:** no escala con el tamaño de fuente y viola WCAG 1.4.12 (Text Spacing). Solo valores unitless o tokens semánticos.

---

### 3. Letter-spacing — la regla de los negativos en titulares

| Rol | `letter-spacing` | Por qué |
|-----|-----------------|---------|
| Display / hero | −0.03em a −0.05em | El kern óptico de las fuentes no escala con el tamaño — a tamaños grandes el espacio entre caracteres parece excesivo |
| Heading h2–h3 | −0.02em a −0.03em | Mismo principio, menor compensación |
| Body | 0 | El kern óptico está calibrado para tamaño de cuerpo |
| UI label / caption | +0.01em a +0.02em | A tamaños pequeños con peso 600–700, los caracteres se "pegan" visualmente |
| Overline | +0.08em a +0.12em | El espaciado generoso + uppercase aumenta legibilidad en texto muy pequeño |

---

### 4. Fluid type con `clamp()` — cuándo y por qué

**Obligatorio en:**
- Titulares N1 y N2 en contextos editoriales
- Cualquier heading en un hero o display context

```scss
// En la CAPA DE TOKENS — scss/abstracts/tokens/components/_{nombre}.scss
// El clamp() se escribe una vez, aquí, y el componente solo lo consume.
--component-hero-headline-font-size: clamp(2.5rem, 7vw, 5rem);

// En el COMPONENTE — scss/atoms|molecules|organisms/_{nombre}.scss
font-size: var(--component-hero-headline-font-size);
```

**Dónde va el `clamp()` importa.** En un fichero de componente, `font-size` solo puede leer `var(--component-*)` o `var(--semantic-*)`: escribir ahí un `clamp()` con literales esconde dos valores de diseño fuera del registro de tokens, y hacerlo con `var(--primitive-*)` viola R01 directamente. Cuando el titular no necesita rampa fluida, la escala semántica ya la cubre: `--semantic-font-size-h1` … `--semantic-font-size-h6`.

**Anatomía de `clamp(min, preferred, max)`:**
- `min`: valor mínimo (mobile) — se aplica cuando `preferred` es menor
- `preferred`: valor relativo al viewport (vw) — escala con el viewport
- `max`: valor máximo (desktop) — nunca se supera

**Por qué no solo breakpoints:** dos breakpoints (mobile/desktop) producen un salto de tamaño en un punto concreto. En viewports intermedios (tablet), el tamaño puede ser incorrecto. `clamp()` produce una curva continua.

**Por qué no `clamp()` en el body:** el texto de cuerpo a 1rem (16px) está en el rango óptimo de legibilidad para todos los viewports comunes (14px–18px). Hacerlo fluido introduce variabilidad en la longitud de línea que puede perjudicar la legibilidad.

**Referencia:** [Utopia.fyi](https://utopia.fyi/) — herramienta de referencia para fluid type y fluid space.

---

### 5. Font stacks — por qué el sistema usa los que usa

**Titulares editoriales: `'Georgia', 'Times New Roman', serif`**

Georgia fue diseñada específicamente para pantallas (Matthew Carter, 1993) — x-height alto, trazos robustos, serif legible a tamaños intermedios. En contexto editorial (prensa, revistas), la serif comunica autoridad y peso informativo.

**UI y cuerpo: `system-ui, -apple-system, sans-serif`**

Usa la fuente del sistema operativo del usuario:
- macOS/iOS: San Francisco
- Windows: Segoe UI
- Android: Roboto

Ventajas: cero descarga de fuente (rendimiento óptimo), máxima legibilidad en cada plataforma (hinted para esa pantalla), coherencia con el OS.

---

## checklist

- [ ] ¿`line-height` es unitless o token semántico (nunca en px)?
- [ ] ¿Los titulares tienen `line-height` < 1.3?
- [ ] ¿El body tiene `line-height` 1.5–1.65?
- [ ] ¿Los titulares tienen `letter-spacing` negativo?
- [ ] ¿Las etiquetas y overlines tienen `letter-spacing` positivo?
- [ ] ¿Los titulares N1/N2 usan `clamp()` para fluid type?
- [ ] ¿El body usa font-size fijo (no clamp)?
- [ ] ¿Los font-size son múltiplos de la escala modular 1.25×?
- [ ] ¿Los font-stacks usan Georgia para titulares editoriales y system-ui para UI?
