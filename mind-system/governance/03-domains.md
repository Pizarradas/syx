# 03 — Dominios, tokens y contratos permanentes

---

## Dominios de autoridad

Cada sistema es soberano en su dominio. Ninguno sobreescribe al otro dentro de su área.

| Dominio | Sistema autoridad | Justificación |
|---|---|---|
| Quién puede escribir en qué fichero | **`contracts/trust.json`** | Ni Modes ni Atlas. Lo lee `scripts/lib/confianza.js` y lo responde `classify_change`. Está en tier `human` a propósito: un agente que pudiera ampliar sus permisos no tendría permisos, tendría una sugerencia |
| Token SCSS (primitivos, semánticos, componente) | **Modes** (TOKEN, UI) | Validador automatizado (`syx-validate.js`), contratos R01–R08 verificables |
| Nomenclatura de tokens en CSS | **Modes** | Prefijos `--primitive-*`, `--semantic-*`, `--component-*` auditados y consolidados |
| Escala de color (formato) | **Modes** | OKLCH en primitivos. Hex solo en fallbacks o POCs Atlas standalone |
| Naming de clases (BEM, prefijos) | **Compartido** | Ambos sistemas usan `.atom-`, `.mol-`, `.org-`. Sin conflicto |
| Jerarquía editorial (N1/N2/N3/N4) | **Atlas Rules** | Definida en `06.1`. No existe en Modes |
| Escala tipográfica → niveles editoriales | **Atlas Rules** | Definida en `10.0`. Modes implementa, Atlas asigna |
| Densidad, flujo y ritmo editorial | **Atlas Rules** | `06.2`. No existe en Modes |
| Publicidad integrada en layout | **Atlas Rules** | `06.3`. No existe en Modes |
| Decisión de qué construir y cómo se comporta | **UX mode** | Accesibilidad, estados, flujo de interacción |
| Implementación SCSS del componente | **UI mode** | Contratos R01–R04, mixins, `@layer` |
| Auditoría de código | **AUDIT mode + contratos Atlas** | Ver `05-audit.md` |

---

## Puente de tokens — alias legacy

Antes de la alineación de sistemas, `atlas-rules/` usaba nombres de token propios. Los alias legacy **no deben introducirse** en código nuevo. Si aparecen en archivos `atlas-rules/`, usar el token Modes correspondiente.

### Color

| Concepto | Token Modes (autoridad) | Alias legacy Atlas | Estado |
|---|---|---|---|
| Color de acción primaria | `--semantic-color-primary` | `--semantic-color-brand` | Eliminado |
| Hover del color primario | `--semantic-color-primary-hover` | `--semantic-color-brand-hover` | Eliminado |
| Fondo oscuro (cabecera/footer) | `--semantic-color-bg-inverse` | `--semantic-color-brand-dark` | Eliminado |
| Fondo de página | `--semantic-color-bg-primary` | `--semantic-color-bg` | Eliminado |
| Fondo de tarjeta/superficie | `--semantic-color-bg-secondary` | `--semantic-color-surface` | Eliminado |
| Hover de superficie | `--semantic-color-bg-tertiary` | `--semantic-color-surface-hover` | Eliminado |
| Texto principal | `--semantic-color-text-primary` | — | ✅ Sin alias |
| Texto secundario | `--semantic-color-text-secondary` | — | ✅ Sin alias |
| Texto muted | `--semantic-color-text-tertiary` | `--semantic-color-text-muted` | Eliminado |
| Borde suave | `--semantic-color-border-subtle` | `--semantic-color-border` | Eliminado |
| Borde fuerte | `--semantic-color-border-strong` | — | ✅ Sin alias |

### Spacing

| Concepto | Token Modes (autoridad) | Alias legacy Atlas | Estado |
|---|---|---|---|
| Padding interno (inset) | `--semantic-space-inset-xs/sm/md/lg/xl` | `--semantic-space-xs/sm/md/lg/xl` | Eliminado |
| Separación vertical (stack) | `--semantic-space-stack-xs…xl` | `--semantic-space-xl/2xl/3xl` | Eliminado |
| Separación horizontal (inline) | `--semantic-space-inline-xs…xl` | Sin equivalente legacy | ✅ Solo en Modes |

**Regla**: en implementación SCSS, usar siempre el token Modes. En MIGRATE, si la variable legacy era un alias Atlas, la tabla anterior es la referencia de reemplazo.

---

## Formato de color en primitivos

| Contexto | Formato autorizado |
|---|---|
| Implementación SCSS compilada (Modes) | OKLCH obligatorio |
| POC HTML/CSS de Atlas (portada, pocs/) | Hex permitido (no se compila a SCSS) |
| Documentación y tablas de contraste | Hex permitido como referencia legible |

**Regla**: ningún primitivo en hex puede migrarse a SCSS sin convertirlo a OKLCH. La conversión es responsabilidad de TOKEN mode.

---

## Reconciliación de `@layer`

| Sistema | Declaración | Ámbito |
|---|---|---|
| Modes (UI) | `@layer syx.atoms, syx.molecules, syx.organisms` | Implementación SCSS — **autorizado** |
| Atlas `09.0` | `@layer reset, base, tokens, atoms, molecules, organisms, utilities` | POCs HTML standalone — referencia conceptual |

El stack de Modes es el autorizado para toda implementación SCSS. El stack de Atlas `09.0` aplica solo a páginas HTML standalone que no forman parte del sistema compilado.

En POCs Atlas que se promuevan a SCSS, el stack se adapta al de Modes en el paso UI.

---

## Qué no cambia en cada sistema

**Lo que NO cambia en Modes:**
- R01–R08 se aplican siempre, con o sin Atlas activo.
- Las exenciones de SKETCH (valores hardcoded) y CREATIVE (sin contratos) se mantienen en su dominio técnico.
- `syx-validate.js` es el validador autorizado para SCSS.
- THEME mode usa OKLCH. Atlas no cambia esto.

**Lo que NO cambia en Atlas Rules:**
- Los 20 principios fundacionales de `01` son invariables.
- La jerarquía de arbitraje de `11.0` se mantiene.
- Los contratos de `09.0` son la referencia para HTML editorial standalone.
- El puente tipográfico de `10.0` es obligatorio en cualquier implementación editorial.

---

## Atlas es un dominio invitado

Atlas vive dentro del repositorio de SYX porque la gobernanza combinada necesita las dos mitades a mano, no porque forme parte del núcleo. Es un consumidor de SYX con un dominio propio que SYX no cubre. Tres límites se siguen de eso:

1. **No se publica.** `mind-system/` no entra en `package.json` → `files[]`. Quien instale `syx-design-system` recibe el motor y sus contratos, no las reglas editoriales de un producto concreto.
2. **No crea sistema.** Atlas no define tokens, ni contratos `R`, ni mixins. Puede *pedir* que existan — los crea TOKEN por la vía `pr`, y los aprueba una persona.
3. **No manda fuera de lo editorial.** Escalón 5 de la escalera de `../README.md`.

El corolario práctico para quien escriba una regla nueva en `atlas-rules/`: si la regla necesita un token, un mixin o una capa `@layer` que todavía no existe, la regla no puede crearlos. Nombra la necesidad y se abre el camino por TOKEN o por UI.
