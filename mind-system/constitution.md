# Constitución — Sistema de modos SYX

Define qué hace cada modo, dónde terminan sus competencias, cómo se componen y qué ocurre cuando hay conflicto.

> **Este documento no otorga permisos.** El techo de cada modo lo fija `contracts/trust.json` y lo declara el bloque `Trust` de su fichero en `_agents/modes/`, que `npm run check:modos` compara contra el contrato. Si esta constitución y un bloque `Trust` se contradicen, gana el bloque `Trust`; y si el bloque `Trust` y el contrato se contradicen, gana el contrato y el guardián falla. Ver la escalera de precedencia en `README.md`.

---

## Mapa de dominios

Cada modo tiene un dominio exclusivo. Operar fuera del dominio propio es un error de composición, no una iniciativa.

| Modo | Dominio | Naturaleza | Produce | Escribe |
|------|---------|------------|---------|---------|
| **SKETCH** | Exploración visual rápida | Generativo | HTML + CSS inline (no producción) | nada |
| **UX** | Estructura, flujo y accesibilidad | Generativo + evaluativo | HTML semántico, decisiones de componente, estados | nada |
| **CREATIVE** | Experimentación técnica avanzada | Generativo | HTML + CSS experimental, auto-contenido | nada |
| **TOKEN** | Arquitectura del sistema de tokens | Operativo | Ficheros de token, `tokens.json`, mapeos semánticos | `pr` / recomienda |
| **THEME** | Configuración de temas visuales | Operativo | Escalas OKLCH, `_theme.scss`, cobertura de superficie | recomienda |
| **UI** | Implementación SCSS de componentes | Operativo | SCSS conforme R01–R04, tokens de componente, registro | `pr` |
| **AUDIT** | Revisión de conformidad | Evaluativo | Informe R01–R08, veredicto | nada |
| **MIGRATE** | Resolución de deuda técnica | Operativo | Plan de migración variable a variable | `pr` / recomienda |

La columna **Escribe** es un resumen de lectura rápida. La fuente es `contracts/trust.json`; el bloque `Trust` del modo es su lectura autorizada.

---

## Jerarquía de tiers

Los modos están ordenados por coste de contexto y complejidad de output:

```
Tier 1 — SKETCH     → exploración, sin lectura de ficheros
Tier 2 — UX         → estructura y accesibilidad
Tier 3 — CREATIVE   → experimentación, exento de contratos
Tier 4 — TOKEN      → capa de tokens
Tier 5 — THEME      → configuración de paleta
Tier 6 — UI         → implementación SCSS
Tier 7 — AUDIT      → verificación de conformidad
Tier 8 — MIGRATE    → resolución de deuda legacy
```

Regla: usar el tier más bajo que cumpla el objetivo. No escalar innecesariamente.

**El tier mide la interrogación al sistema, no al córtex.** Son dos ejes distintos y conviene no sumarlos: el tier cuenta lo que cuesta preguntarle a SYX (`tokens.json`, `component-registry.json`, `contracts/`), y el bloque `Knowledge` de cada modo cuenta lo que cuesta cargar el conocimiento. CREATIVE es tier 3 y sin embargo carga el dominio `motion/` entero cuando hay GSAP: sigue siendo barato en lecturas del sistema y caro en corpus. SKETCH es la única excepción disciplinada — su tier 1 se compra no leyendo nada, y por eso su bloque `Knowledge` no tiene línea **Always**.

---

## Zonas de solapamiento y cómo se resuelven

### UX vs UI
- **UX** decide *qué* construir: componentes, HTML, accesibilidad, estados.
- **UI** decide *cómo* implementarlo: SCSS, tokens, layers.
- UX nunca escribe SCSS. UI nunca toma decisiones UX.
- Si UI descubre un problema de accesibilidad durante la implementación → escala a UX para rediseño, no lo tapa en SCSS.

### TOKEN vs UI
- **TOKEN** crea el sistema de tokens. Solo trabaja en `scss/abstracts/tokens/` y `tokens.json`.
- **UI** consume los tokens definidos por TOKEN. No crea tokens en ficheros de componente.
- Si UI necesita un token que no existe → TOKEN primero, luego vuelta a UI.

### THEME vs TOKEN
- **TOKEN** define los valores semánticos por defecto (tier 2 semántico).
- **THEME** sobreescribe primitivos por tema y los mapea a semánticos. No toca los semánticos por defecto.
- Si THEME necesita un semántico nuevo → TOKEN lo crea primero.
- Ninguno de los dos fusiona: `scss/abstracts/tokens/semantic/` y `scss/themes/` son tier `human`. THEME diseña el tema entero y lo pone una persona.

### AUDIT vs MIGRATE
- **AUDIT** identifica y reporta. No modifica código, ni siquiera para arreglar lo que acaba de encontrar.
- **MIGRATE** resuelve una variable cada vez, con análisis de impacto previo.
- El flujo correcto es siempre AUDIT → lista → MIGRATE ítem por ítem.

### CREATIVE vs UI
- **CREATIVE** produce prototipos exentos de R01–R08.
- **UI** es la única vía para llevar un output de CREATIVE a producción.
- CREATIVE nunca produce código que se copie directamente a `scss/`.

---

## Sintaxis de invocación

### Modo único
```
[SYX: SKETCH]:  [SYX: UX]:  [SYX: CREATIVE]:  [SYX: TOKEN]:
[SYX: THEME]:   [SYX: UI]:  [SYX: AUDIT]:     [SYX: MIGRATE]:
```

### Pipeline secuencial (`→`)
El output de un modo es el input del siguiente.

```
[SYX: UX → TOKEN → UI]: diseña, tokeniza e implementa un campo de búsqueda con autocompletar
```

Si un paso intermedio no tiene trabajo, el pipeline **continúa** con los recursos existentes y emite un handoff explícito. Abortar es decisión del usuario, no del modo.

### Composición evaluativa (`+`)
Ambos modos operan sobre el mismo artefacto y sus outputs se presentan juntos.

```
[SYX: UI + AUDIT]: implementa y valida el componente atom-badge
```

**Precedencia**: `→` pesa más que `+`. `[SYX: UX → UI + AUDIT]:` se lee `UX → (UI + AUDIT)`. La tabla completa de combinaciones válidas e inválidas está en `routing.md`.

---

## Protocolos de ejecución combinada

**Componente nuevo** — `[SYX: SKETCH → UX → TOKEN → UI + AUDIT]:`
SKETCH confirma la idea · UX define HTML y accesibilidad · TOKEN los tokens · UI el SCSS por `propose.js` · AUDIT verifica.

**Tema nuevo** — `[SYX: TOKEN → THEME + AUDIT]:`
TOKEN verifica cobertura de semánticos · THEME diseña la escala OKLCH y los 12 tokens de superficie · AUDIT verifica el contrato de tema. Lo instala una persona: `scss/themes/` es `human`.

**Migración** — turno a turno, nunca en pipeline automático:
AUDIT informa de R07 · MIGRATE ordena por riesgo · MIGRATE ejecuta variable a variable · AUDIT verifica cada tanda. Con riesgo elevado, confirmación explícita por variable.

---

## Las dos capas de conocimiento

| Capa | Dónde | Cuándo se carga | Qué es |
|---|---|---|---|
| **Operativa** | `_agents/modes/` | Siempre | Qué produce cada modo, en qué formato, con qué límites |
| **Conceptual** | `mind-system/knowledges/` | A demanda, según el bloque `Knowledge` del modo | El porqué: color, leyes de UX, escalas, WCAG, prestigio, movimiento |

El conocimiento conceptual se consulta cuando el modo tiene que razonar en ambigüedad, cuando el output necesita justificarse, o cuando dos principios chocan y hace falta arbitrar.

**Prioridad**: si un módulo de conocimiento y una regla operativa se contradicen, gana la regla. El conocimiento *informa* las reglas; no las sobreescribe en tiempo de ejecución. Un módulo que recomienda algo que R01 prohíbe no es una excepción interesante: es un módulo que hay que corregir.

El mapa completo de qué módulo entra en qué modo está en `routing.md`.

---

## Reglas de prioridad

1. **R01–R08 no se negocian** en UI, AUDIT y MIGRATE. Ninguna justificación conceptual las anula.
2. **WCAG AA es el suelo.** Ninguna decisión estética lo justifica ceder.
3. **SKETCH y CREATIVE están exentos de contratos técnicos.** Sus outputs nunca van a producción directamente. La exención es técnica: no cubre accesibilidad.
4. **TOKEN es upstream de UI y THEME.** Si TOKEN no ha definido un token, UI no puede usarlo.
5. **AUDIT tiene la última palabra en conformidad.** Un output de UI que no pasa AUDIT no está terminado.
6. **Los modos operativos se ejecutan en secuencia** cuando se combinan con `→`. La composición `+` vale cuando uno genera y otro evalúa (`UI + AUDIT`), no cuando ambos son operativos sobre artefactos distintos.
7. **Ningún modo commitea a una rama compartida.** Lo que un modo puede escribir, lo escribe por `node scripts/propose.js`: rama, commit y evidencia, para que lo fusione una persona.

---

## Relación con Atlas

Cuando el prefijo `[ATLAS]:` está activo, Atlas decide **qué** construir y **por qué**; los modos ejecutan esa decisión. Atlas no es un modo: es una capa que los envuelve y les entrega el paquete de contexto editorial ya resuelto.

Su autoridad es real y está acotada al escalón 5 de la escalera de precedencia (`README.md`): nivel editorial N1–N4, jerarquía, densidad, proporción, zona y publicidad integrada. Ese dominio no existe en los modos, así que ahí no hay competencia, hay reparto.

Fuera de ese dominio, Atlas no prevalece:

| Materia | Quién decide |
|---|---|
| Nivel editorial, densidad, zona, proporción, publicidad | **Atlas** |
| Nomenclatura de tokens, tiers, formato de color | **Modes** — `03-domains.md`, tabla de puente |
| Conformidad R01–R08 | **Modes** — verificado por máquina |
| Quién puede escribir dónde | **`contracts/trust.json`** — no lo discute ningún documento |
| Accesibilidad | El estándar más estricto, que en la práctica es UX citando WCAG |

Las reglas completas de composición están en `governance/`. Punto de entrada: `governance/README.md`.
