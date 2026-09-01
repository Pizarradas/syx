# 01 — Invocación y combinaciones

---

## El paquete de contexto editorial

Antes de que cualquier modo SYX ejecute, Atlas lee `atlas-rules/` y entrega este paquete estructurado:

```
Jerarquía editorial:
  N1: [elemento principal — exactamente 1]        → atom-headline--3xl / --xl
  N2: [stories secundarias — máx 4]               → atom-headline--lg
  N3: [grid de contenido — máx 9]                 → atom-headline--md / --sm
  N4: [metadatos, etiquetas, fechas — sin límite] → atom-headline--xs o body

Zona:        hero · grid-editorial · sidebar · zona-secundaria · footer
Densidad:    baja (N1) · media (N2) · alta (N3)
Proporción:  full-width · 2:1 (contenido/sidebar) · 3-col · libre
Mobile:      N1 primero en DOM · layout lineal base

Contratos Atlas activos (definidos en atlas-rules/09):
  CL-01 · CL-03 · CL-04 · CC-03 · CC-05 · CA-01 · CP-01 · CP-02
```

El modo SYX no calcula este paquete — lo recibe. Es lo que diferencia un modo standalone de ese mismo modo con `[ATLAS]:` activo.

---

## Orden de operación

```
1. Atlas determina (pasos 1–2):
   ¿qué nivel editorial? (N1/N2/N3/N4 — atlas-rules/06.1)
   ¿qué proporciones y densidad? (atlas-rules/04.x, 06.x)
   ¿qué restricciones context-first? (atlas-rules/05.x, 12.2)

2. Atlas entrega el paquete de contexto al primer modo SYX.

3. El modo SYX ejecuta con ese contexto ya resuelto.
   En un pipeline (→), cada modo recibe el output del anterior + el paquete Atlas.
   En una combinación evaluativa (+), ambos modos reciben el mismo input.
```

Atlas decide en los pasos 1–2. El modo SYX ejecuta en el paso 3. El modo nunca retrocede a tomar decisiones editoriales.

---

## Matriz de combinaciones por escenario

### Exploración

| Escenario | Combinación |
|---|---|
| Explorar una idea editorial rápida | `[ATLAS]: ... utilizando [SYX: SKETCH]` |
| Explorar y formalizar en el mismo flujo | `[ATLAS]: ... utilizando [SYX: SKETCH → UX]` |

### Diseño

| Escenario | Combinación |
|---|---|
| Diseñar estructura y jerarquía editorial | `[ATLAS]: ... utilizando [SYX: UX]` |
| Diseñar e implementar (sin tokens nuevos) | `[ATLAS]: ... utilizando [SYX: UX → UI]` |
| Flujo estándar de componente editorial | `[ATLAS]: ... utilizando [SYX: UX → TOKEN → UI]` |
| Flujo completo con verificación | `[ATLAS]: ... utilizando [SYX: UX → TOKEN → UI + AUDIT]` |

### Implementación

| Escenario | Combinación |
|---|---|
| Implementar componente con contexto editorial | `[ATLAS]: ... utilizando [SYX: UI]` |
| Implementar y verificar en un paso | `[ATLAS]: ... utilizando [SYX: UI + AUDIT]` |

### Tokens y temas

| Escenario | Combinación |
|---|---|
| Definir tokens para sistema editorial | `[ATLAS]: ... utilizando [SYX: TOKEN]` |
| Tokens con verificación de contratos | `[ATLAS]: ... utilizando [SYX: TOKEN + AUDIT]` |
| Crear tema editorial nuevo | `[ATLAS]: ... utilizando [SYX: TOKEN → THEME]` |
| Tema con verificación de cobertura | `[ATLAS]: ... utilizando [SYX: TOKEN → THEME + AUDIT]` |

### Auditoría y deuda técnica

| Escenario | Combinación |
|---|---|
| Auditar página o layout editorial | `[ATLAS]: ... utilizando [SYX: AUDIT]` |
| Auditar e iniciar migración | `[ATLAS]: ... utilizando [SYX: AUDIT → MIGRATE]` |

### Creativo → producción

| Escenario | Combinación |
|---|---|
| Experimento creativo con contexto editorial | `[ATLAS]: ... utilizando [SYX: CREATIVE → TOKEN → UI]` |
| Experimento con verificación completa | `[ATLAS]: ... utilizando [SYX: CREATIVE → TOKEN → UI + AUDIT]` |

---

## Reglas de operadores

### `→` pipeline secuencial

El output de cada modo es el input del siguiente. Si un paso intermedio no tiene trabajo (ej: TOKEN confirma que los tokens necesarios ya existen), **el pipeline continúa** con los recursos existentes y emite un handoff explícito:

```
[TOKEN — sin trabajo]: Los tokens necesarios ya existen:
  --semantic-color-primary, --semantic-space-stack-md.
  Handoff a UI: usar estos tokens directamente.
```

El pipeline no se detiene. La decisión de abortar pertenece al usuario.

### `+` evaluativa

Ambos modos operan sobre el mismo artefacto. Sus outputs se presentan juntos en la misma respuesta.

### Precedencia al mezclar `→` y `+`

`→` tiene mayor precedencia que `+`. La expresión se agrupa de derecha a izquierda sobre `+`:

```
[ATLAS]: ... utilizando [SYX: UX → UI + AUDIT]
  → se lee como: UX → (UI + AUDIT)

[ATLAS]: ... utilizando [SYX: UX → TOKEN → UI + AUDIT]
  → se lee como: UX → TOKEN → (UI + AUDIT)
```

Si se necesita una agrupación diferente, separar en turnos.

---

## Combinaciones inválidas con `[ATLAS]:`

| Combinación | Por qué no |
|---|---|
| `[ATLAS]: ... utilizando [SYX: SKETCH + AUDIT]` | SKETCH está exento de contratos. AUDIT sobre un sketch es contradictorio. |
| `[ATLAS]: ... utilizando [SYX: CREATIVE + AUDIT]` | CREATIVE está exento de R01–R08. Usar `CREATIVE → TOKEN → UI + AUDIT`. |
| `[ATLAS]:` sin modo SYX | `[ATLAS]:` es un wrapper, no un modo. Siempre necesita al menos un `[SYX: MODE]`. |
