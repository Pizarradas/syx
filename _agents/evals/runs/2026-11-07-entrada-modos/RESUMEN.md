# Evaluación A/B · entrada de los modos · 2026-11-07

Comparación del contexto de entrada de UI y UX antes y después de adelgazarlo
(rama `perf/entrada-modos`). Mismas cuatro tareas, mismo modelo, una ejecución
por tarea y brazo; corrector determinista (`eval-runner.js --recorregir … --sin-juez`),
C5 sin juez.

- **Agente:** subagente de Claude (Opus 5.5) con acceso de solo lectura a una copia
  del repositorio, sin el servidor MCP (usa las vías de respaldo de `CLAUDE.md`).
- **A** = `main` en `91292b4`. **B** = esta rama.
- **Límite del experimento:** los dos brazos veían además el `CLAUDE.md` antiguo,
  que la sesión inyecta, así que B también leyó `AI_GUIDELINES.md`. La comparación
  mide el efecto de mover contenido de los modos al córtex, no el ahorro de no leer
  `AI_GUIDELINES.md`.

| Tarea | A (antes) | B (después) | Nota |
|---|---|---|---|
| ui-01 | 6/8 · suspende (C1: R09, un mixin que no existe) | **8/8 · aprueba** | B cargó `syx/visual-principles.md` al hacer el Visual Quality Check |
| ui-02 | 6/8 · suspende (C1: un diff que no parsea) | 7/8 · suspende (C4: una línea del Why sin sus tres campos) | |
| ux-01 | 8/8 · aprueba | 8/8 · aprueba | |
| ux-02 | 8/8 · aprueba | 7/8 · suspende (C3) | Falso positivo del corrector: la línea dice «Foco inicial en Cancelar y Eliminar como `--danger`»; la regla lee «foco inicial … Eliminar» |
| **Total** | **28/32** | **30/32** | |

Entrada medida por `check:conocimiento` (tokens ≈ bytes / 3,5): UI 19,5k → 11,4k ·
UX 20,7k → 15,5k · el mayor (BRAND) 21k → 17,7k.

Hallazgos de las respuestas, corregidos en la misma rama: la tabla de breakpoints de
`ux.md` (sm 640 px) y la de `front/mobile-first.md` (tablet 800, desktop 1120) no
eran la escala; `ux.md` citaba un `is-loading` que `atom-btn` no tiene y cambiaba el
nombre del botón de mostrar contraseña al pulsarlo (la APG pide nombre fijo).
