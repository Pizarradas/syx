# Crítica de movimiento

## meta

| Campo | Valor |
|-------|-------|
| **Dominio** | motion — crítica · revisión, diagnóstico y rúbrica |
| **Fuente** | Figma — *Principles in Motion* (vocabulario de equipo); síntesis propia sobre las fuentes del dominio |
| **Objetivo** | Revisar una animación, traducir el vocabulario subjetivo a parámetros y cerrar el bucle |
| **Agent tags** | `#motion` `#critique` `#review` `#rubric` |

---

## concepts

Cierra el bucle del sistema. Una animación no se da por terminada hasta que pasa esta revisión (en recorrido rápido o completo, según `motion/01-direccion/direccion.md`).

### Encaje con AUDIT

Cuando AUDIT usa este módulo, lo que encuentra es **asesor**, con el mismo estatus que `branding/perception-of-prestige.rules.md`: no lleva número R, no aparece en la capa 1 del informe y no convierte por sí solo un PASS en FAIL. La excepción es lo que ya es contrato por otra vía: un `transition:` en crudo es R03 aunque lo encuentre esta rúbrica. La nota de Accesibilidad = 5 como umbral es criterio de este dominio, no un R.

---

## rules

### 1. Protocolo de visionado

1. **1x, en contexto real** (dispositivo, tamaño y contenido reales). ¿Se entiende lo que pasa? ¿Se siente como se pretendía?
2. **Repetido 5 veces seguidas**: ¿cansa? Lo que es encantador una vez puede ser irritante a la quinta (la frecuencia importa).
3. **A 0,25x**: orden, solapes, jerarquía, pops, frames muertos.
4. **Frame a frame en los extremos** (primeros y últimos 3–5 frames): saltos, parpadeos, subpíxel, cambios de capa (z-index), recortes.
5. **Gráfica de velocidad** (AE, Cavalry, Blender, o muestreo en JS): ¿hay saltos de velocidad? ¿La velocidad llega a 0 donde debe?
6. **Interrupción (UI)**: doble clic, "atrás" a mitad, cambio de tamaño de ventana. ¿Salta? ¿Se bloquea?
7. **Reduced motion activado**: ¿existe la variante? ¿Sigue comunicando?
8. **Sin sonido y con sonido** (vídeo): ¿funciona en silencio? ¿Los acentos caen en el beat?
9. **Peor escenario**: n máximo de elementos, dispositivo modesto, red lenta, lector lento.
10. **Rendimiento**: frames perdidos (DevTools Performance, contador de FPS), layout thrashing, peso del asset.

**Recorrido rápido:** solo 1, 3, 6 y 7, más cinco preguntas: ¿propósito? ¿token? ¿interrumpible? ¿reducida? ¿≤ 3 destellos/s?

### 2. Vocabulario subjetivo → diagnóstico

| Dicen… | Causa probable | Corrección |
|---|---|---|
| "Robótico", "too linear" | Easing lineal o simétrico en todo; todo empieza y acaba a la vez | ease-out en las entradas; follow-through y offsets de 30–60 ms; arcos |
| "Lento", "pesado", "perezoso" | Duración excesiva para la frecuencia; ease-in en una entrada | Bajar un nivel de token; ease-out; revisar el stagger total |
| "Brusco", "se corta" | Sin ease al final; velocidad ≠ 0 al llegar; salto al interrumpir | Ease-out o spring; partir del valor actual al interrumpir |
| "Floaty", "gelatinoso" | Demasiado bounce o poco damping; duración larga en spatial | bounce ≤ 0,15; más stiffness; menos duración |
| "Dead on arrival" | Llega y se para en seco, sin settle | Micro-overshoot o spring con bounce 0,05–0,1; hold tras la llegada |
| "Barato", "de plantilla" | Fade-up genérico, todo con la misma curva y sin idea | Volver a `motion/03-creativa/`: verbo, material, movimiento firma |
| "Caótico", "no sé dónde mirar" | Varios protagonistas a la vez; stagger sin jerarquía | Staging: un hero por beat; ordenar por lectura; calmar el fondo |
| "Mareante" | Zoom, parallax o traslaciones grandes; rotación | Reducir la amplitud; variante reducida; revisar `motion/07-accesibilidad/` |
| "Infantil" | Bounce alto o squash en contexto formal | Bajar la elasticidad y la exageración; estilo productive |
| "Sin vida", "plano" | Sin anticipación ni follow-through; sin secondary | Añadir un principio cada vez: overlap → anticipación → secondary |
| "Tarda en responder" | Retardo inicial o ease-in en la respuesta a una interacción | Delay 0; ease-out; feedback en < 100 ms |
| "Parpadea", "hace pop" | Elemento que aparece antes de su transición; FOUC; will-change mal gestionado; texto dividido tarde | Estado inicial definido (`@starting-style`, `from` inmediato); dividir antes de pintar |
| "Va a tirones" (jank) | Animar layout (width/top); demasiadas capas; blur caro | Solo transform/opacity; FLIP; menos filtros; comprobar el presupuesto de frame |
| "No se lee" | Hold insuficiente; animación por carácter en texto largo | Hold en el peor escenario; unidad palabra/línea |
| "Fuera de ritmo" | Acentos fuera del beat; todo sincronizado (mecánico) | Acentos en el beat o 1–2 f antes; dejar movimientos libres |

Vocabulario de equipo (Figma) para pedir cambios: *zippy* (más rápido y enérgico), *snappier* (respuesta más seca), *dreamy* (lento, suave, overlap), *chunky* (con peso, holds, steps), *floaty* (ingrávido; a menudo un defecto).

### 3. Rúbrica (1–5 por criterio)

| Criterio | 1 | 5 |
|---|---|---|
| **Propósito** | Decorativo, sobra | Comunica algo imprescindible |
| **Claridad** | No se entiende qué pasa | Se entiende a la primera, a 1x |
| **Timing y ritmo** | Lento, uniforme o arrítmico | Tempo adecuado a la frecuencia; contraste y holds |
| **Física y credibilidad** | Saltos de velocidad, sin peso | Continuidad de velocidad y masa coherente con el material |
| **Coreografía** | Todo a la vez o secuencia eterna | Jerarquía clara, solape justo y tope respetado |
| **Carácter** | Genérico | Reconocible y coherente con la marca |
| **Coherencia de sistema** | Valores sueltos | Tokens o excepciones documentadas |
| **Accesibilidad** | Sin variante; destellos; sin pausa | Todas las reglas duras cumplidas y variante probada |
| **Rendimiento** | Jank o asset pesado | 60/120 fps estables, asset ligero |

**Umbral de aprobado:** ninguna nota por debajo de 3, y **Accesibilidad = 5** (no es negociable).

### 4. Formato del informe

```markdown
## Crítica: [id]
**Veredicto:** ✅ aprobado · ⚠️ ajustes menores · ❌ rehacer desde [módulo]
**Rúbrica:** Propósito 4 · Claridad 5 · Timing 3 · Física 3 · Coreografía 4 · Carácter 3 · Sistema 5 · A11y 5 · Rendimiento 4

### Lo que funciona
- …

### Ajustes (por prioridad)
1. [Síntoma] → [causa] → [corrección concreta con valor/token] (módulo responsable)
2. …

### Siguiente iteración
Qué probar para subir de nivel (opcional; aquí entra `motion/03-creativa/` si hay margen)
```

**Principios del feedback:** específico (valores, frames, tokens), priorizado (primero lo que rompe) y atribuido al estrato responsable para saber a dónde volver. Se señala también lo que funciona.

---

## checklist

- [ ] Visionado a 1x, 0,25x y frame a frame en los extremos
- [ ] Probado con reduced motion activo
- [ ] Peor escenario: n máximo, dispositivo modesto, red lenta
- [ ] Ninguna nota por debajo de 3 y Accesibilidad = 5
- [ ] Cada ajuste atribuido al estrato responsable
