# 02 — Delta de comportamiento por modo

Lo que cada modo hace de forma diferente con `[ATLAS]:` activo frente a su comportamiento standalone.

---

## SKETCH

| Standalone | Con `[ATLAS]:` |
|---|---|
| Paleta grayscale, sin restricciones editoriales | Añade handoff editorial en comentario HTML |
| Exento de contratos | Exento de contratos — no cambia |

Añadir al final del output de SKETCH en contexto Atlas:

```html
<!-- Handoff a [ATLAS + SYX: UI]:
     Nivel editorial: N[X]
     Tipografía: atom-headline--[variante] (según atlas-rules/10.0)
     Contratos Atlas a verificar en promoción: CL-03, CC-03, CC-05 -->
```

---

## UX

| Standalone | Con `[ATLAS]:` |
|---|---|
| Decide jerarquía por criterio UX | Recibe N1/N2/N3/N4 ya asignados — aplica `atom-headline` según `10.0` |
| Elige layout libremente | Usa proporción 2:1 si hay sidebar de datos |
| HTML mobile-first | HTML mobile-first + N1 primero en DOM obligatorio |
| Documenta estados | Documenta estados + densidad por nivel |

Pasos adicionales antes de escribir HTML cuando `[ATLAS]:` está activo:
1. Identificar el nivel editorial del contenido (N1/N2/N3/N4 según `06.1`).
2. Asignar `atom-headline` según la tabla de `10.0`.
3. Contemplar proporción 2:1 si hay sidebar de datos.
4. Incluir los 4 niveles de densidad de `04.4` en la documentación de estados.

---

## CREATIVE

| Standalone | Con `[ATLAS]:` |
|---|---|
| Exento de R01–R08 y contratos técnicos | Exento de R01–R08 — no cambia |
| Sin restricciones de accesibilidad | Sujeto a CA-01–CA-04. La exención es técnica, no editorial ni de accesibilidad. |
| Libre en jerarquía visual | Debe mantener un N1 claro — no puede producir una página sin jerarquía identificable |

---

## TOKEN

| Standalone | Con `[ATLAS]:` |
|---|---|
| Crea tokens según necesidad del componente | Consulta `10.0` para tokens tipográficos por nivel editorial |
| Libre en naming semántico | Verifica contra `08.0` para no duplicar tokens existentes del sistema Atlas |
| Primitivos con escala matemática | Primitivos con escala matemática + alineados a niveles N1–N4 |

Regla adicional: si la petición incluye conceptos editoriales (nivel, zona), consultar `10.0` antes de definir valores de `font-size`, y `08.0` antes de nombrar tokens nuevos.

---

## THEME

| Standalone | Con `[ATLAS]:` |
|---|---|
| 12 tokens de superficie obligatorios | 12 tokens de superficie obligatorios — no cambia |
| Paleta OKLCH libre | Paleta OKLCH que respeta la proporción cromática del sistema editorial |
| — | No puede introducir variantes tipográficas que contradigan la escala de `10.0` |

---

## UI

| Standalone | Con `[ATLAS]:` |
|---|---|
| Layout con `fr`, `%`, `clamp()` recomendado | Layout con `fr`, `%`, `clamp()` **obligatorio** — sin `px` fijos en columnas (CL-01) |
| `nth-child` con índices permitido con justificación | `nth-child` con índices concretos para layout → violación CC-03 |
| Pre-flight estándar | Pre-flight + verificar proporciones antes de escribir código |

Verificaciones adicionales antes del pre-flight estándar:
- ¿El layout usa `fr`, `%` o `clamp()` en columnas? Si usa `px` → violación CL-01.
- ¿Hay `nth-child` con índices numéricos controlando layout? Si sí → reemplazar por `:last-child` o lógica de grid (CC-03).

---

## AUDIT

| Standalone | Con `[ATLAS]:` |
|---|---|
| Capa 1: contratos R01–R08 | Capa 1: contratos R01–R08 — no cambia |
| — | Capa 2: contratos Atlas (CL-03, CL-04, CC-03, CC-05, CT-02, CA-01, CP-01, CP-02) |
| — | Capa 3: jerarquía editorial — mapear N1/N2/N3/N4, verificar tipografía contra `10.0` |
| Veredicto: PASS / FAIL | Veredicto: PASS / FAIL / PASS WITH WARNINGS (incluye las tres capas) |

Ver protocolo completo en `05-audit.md`.

---

## MIGRATE

| Standalone | Con `[ATLAS]:` |
|---|---|
| Variable a variable según `lint-contract.json` | Variable a variable + verificación de alias legacy Atlas (`03-domains.md` tabla de color) |
| Reemplazo por token Modes autorizado | Si la variable era un alias Atlas (`--semantic-color-brand`) → reemplazar por el equivalente Modes (`--semantic-color-primary`) |
