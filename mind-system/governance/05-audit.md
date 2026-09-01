# 05 — Protocolo AUDIT combinado

Cuando se invoca `[ATLAS]: ... utilizando [SYX: AUDIT]`, el modo AUDIT ejecuta tres capas.

---

## Capa 1 — Contratos Modes (R01–R08)

Igual que el comportamiento estándar de AUDIT mode. Sin cambios.
Ver `_agents/modes/audit.md` para la tabla completa de reglas R01–R08.

---

## Capa 2 — Contratos Atlas

Aplica cuando el archivo bajo auditoría es una página editorial (portada, sección, layout).
Las definiciones normativas de cada contrato están en `atlas-rules/09-contratos/09.0-contratos-y-validacion.md`.

| Contrato | Verificación |
|---|---|
| `CL-01` — Sin anchos fijos en columnas | `grid-template-columns` no debe usar `px` absolutos |
| `CL-03` — `@layer` declarado | Buscar `@layer` en el CSS. Si ausente → violación |
| `CL-04` — Sin `!important` | Ya cubierto por R02. Sin duplicación |
| `CC-03` — Sin nth-child para layout | Buscar `nth-child` con índices concretos controlando bordes o columnas |
| `CC-05` — Controles interactivos con JS | Verificar que botones con `cursor: pointer` tienen comportamiento JS |
| `CT-02` — Sin hex crudos | Ya cubierto por R01+R07. En contexto Atlas verificar también en CSS inline |
| `CA-01` — Jerarquía de headings | Mapear `<hN>` del documento y verificar secuencia |
| `CP-01` — Publicidad en el grid | `.mol-publicidad` no usa `position: absolute/fixed` fuera del flujo |
| `CP-02` — Publicidad etiquetada | `.mol-publicidad__label` presente en cada bloque publicitario |

---

## Capa 3 — Jerarquía editorial

Verificar que la tipografía implementada corresponde a los niveles editoriales definidos por Atlas (según `atlas-rules/10.0`):

- Un único elemento N1 en la página. Solo `atom-headline--3xl` o `--xl` puede ser N1.
- N2: máximo 4 elementos con `atom-headline--lg`.
- Metadatos y etiquetas (N4): usan `atom-headline--xs` o body type, nunca headings de alto nivel.

---

## Formato de reporte

```
## Capa 1 — Contratos Modes (R01–R08)
| Archivo | Línea | Regla | Severidad | Violación | Fix |
|---|---|---|---|---|---|

## Capa 2 — Contratos Atlas
| Contrato | Archivo | Línea | Violación | Fix |
|---|---|---|---|---|

## Capa 3 — Jerarquía editorial detectada
N1: [elemento encontrado — debe ser exactamente 1]
N2: [elementos encontrados — máximo esperado: 4]
N3: [elementos encontrados — máximo esperado: 9]
Problemas: [si hay más de 1 N1, o si atom-headline no corresponde al nivel]

## Verdict
PASS / FAIL / PASS WITH WARNINGS
(el veredicto incluye las tres capas)
```

---

## Ejemplos de invocación

### Portada de noticias económicas (flujo completo)

```
[ATLAS]: Diseña la portada de la sección de economía con ticker de mercados,
hero de apertura y grid de noticias secundarias utilizando [SYX: UX → TOKEN → UI + AUDIT]
```

1. Atlas determina: N1 = titular apertura, N2 = máx 4 noticias destacadas, N3 = grid estándar, proporción 2:1 con sidebar de datos, densidad media.
2. UX produce HTML: `org-hero-principal` (N1), `org-grid-editorial` (N2 + sidebar), `org-zona-secundaria` (N3). `atom-headline--3xl` solo en N1.
3. TOKEN verifica `10.0`, define tokens ausentes, registra en `tokens.json`.
4. UI implementa SCSS con proporciones `fr`/`clamp()`, sin `nth-child` de layout. AUDIT verifica R01–R08 + contratos Atlas sobre ese mismo SCSS simultáneamente.

---

### Auditoría de layout editorial existente

```
[ATLAS]: Audita portada-economia.html y portada-economia.scss utilizando [SYX: AUDIT]
```

1. Atlas identifica que es una página editorial: activa contratos Atlas.
2. AUDIT ejecuta las tres capas.
3. Reporte con secciones: errores Modes, violaciones Atlas, jerarquía editorial detectada.

---

### Exploración rápida de módulo de análisis

```
[ATLAS]: Explora un módulo de análisis de opinión con autor, foto y extracto utilizando [SYX: SKETCH → UX]
```

1. Atlas determina: N3 (opinión en zona de análisis), densidad baja, sin sidebar.
2. SKETCH produce boceto grayscale con handoff editorial anotado.
3. UX recibe el boceto + el paquete Atlas y formaliza HTML, ARIA y estados.

---

### Tema nuevo para producto editorial

```
[ATLAS]: Crea el tema visual para el producto de economía de mercados utilizando [SYX: TOKEN → THEME + AUDIT]
```

1. Atlas determina escala tipográfica, densidad de producto, paleta funcional (alza/baja).
2. TOKEN verifica cobertura de semánticos contra `08.0`, crea primitivos OKLCH alineados a `10.0`.
3. THEME construye `_theme.scss` con los 12 tokens de superficie. AUDIT verifica cobertura simultáneamente.
