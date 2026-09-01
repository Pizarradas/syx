# Governance — ATLAS + SYX

Sistema de gobernanza que define cómo operan juntos los dos sistemas de reglas:

- **SYX Modes** (`_agents/modes/`) — autoridad de implementación: SCSS, tokens, componentes, temas.
- **Atlas Rules** (`../atlas-rules/`) — autoridad estructural: jerarquía editorial, layout, densidad, contexto, proporciones.

> **Dónde encaja esto.** Este sistema es el escalón 4 de la escalera de precedencia de `../README.md`. Está por debajo de `contracts/trust.json`, de `contracts/rules.json` y del bloque `Trust` de cada modo, que son los tres escalones que comprueba una máquina. Ninguna regla de esta carpeta puede levantar un permiso que el contrato no dé, ni excusar una violación de R01–R08. Atlas es autoridad de dominio, no de rango: ver `04-conflicts.md`.

---

## Modelo

```
[ATLAS]:        decide QUÉ construir y POR QUÉ
                → nivel editorial, zona, densidad, proporciones, context-first

[SYX: MODE]:    decide CÓMO construirlo
                → HTML, SCSS, tokens, auditoría, migración
```

Atlas no es un igual de los modes. Es la capa que los envuelve y les da contexto.
Cuando `[ATLAS]:` está activo, el mode SYX recibe las decisiones editoriales ya tomadas.

---

## Sintaxis

```
[SYX: MODE]:                                              → standalone
[SYX: A → B → C]:                                        → pipeline secuencial
[SYX: A + B]:                                            → evaluativa (mismo artefacto)
[ATLAS]: tarea utilizando [SYX: MODE]                    → con contexto editorial
[ATLAS]: tarea utilizando [SYX: A → B]                   → ATLAS + pipeline
[ATLAS]: tarea utilizando [SYX: A + B]                   → ATLAS + evaluativa
[ATLAS]: tarea utilizando [SYX: A → B + C]               → ATLAS + mixta (A → (B + C))
```

---

## Archivos de este sistema

| Archivo | Qué contiene | Cuándo consultarlo |
|---|---|---|
| `01-invocation.md` | Paquete de contexto editorial · Orden de operación · Matriz de combinaciones · Reglas de operadores | Al invocar cualquier combinación `[ATLAS]+[SYX]` |
| `02-mode-delta.md` | Qué hace cada modo de forma diferente con `[ATLAS]:` vs standalone | Al cambiar un modo de standalone a contexto Atlas |
| `03-domains.md` | Dominios de autoridad · Puente de tokens (alias legacy) · Reconciliación `@layer` · Qué no cambia | Al resolver una duda sobre quién decide qué |
| `04-conflicts.md` | Resolución de conflictos entre sistemas | Cuando una regla de Modes y una de Atlas parecen contradecirse |
| `05-audit.md` | Protocolo AUDIT combinado · Formato de reporte · Ejemplos de invocación completos | Al ejecutar `[ATLAS]: ... utilizando [SYX: AUDIT]` o cualquier combinación con AUDIT |

---

## Mantenimiento

Este sistema se actualiza cuando:

- Se añade un modo nuevo a `_agents/modes/` → actualizar `02-mode-delta.md`
- Se añade una sección nueva a `atlas-rules/` que interactúa con Modes → revisar `03-domains.md` y `04-conflicts.md`
- Se detecta un conflicto no cubierto → documentar en `04-conflicts.md` y escalar a `atlas-rules/11.0`
- Se corrige el naming de un token → actualizar `03-domains.md`
- Se añade o modifica un operador de composición → actualizar `01-invocation.md`

**Responsable**: quien modifique cualquiera de los dos sistemas verifica si este sistema de gobernanza necesita revisión.

**Versión**: 2.0 — reestructurado de GOVERNANCE.md + ATLAS-SYX.md en carpeta `governance/`.
