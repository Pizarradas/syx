# Evaluación de los modos · 2026-10-01 · recorregida el 2026-10-01

- **Agente:** `claude -p` · modelo `claude-opus-5-5`
- **Juez:** cli (el de la CLI)
- **Tareas:** 18 · 5 aprueban · 0 con error

Rúbrica en `_agents/evals/README.md`. «Auto» es C1–C4 deterministas; «Juez C3» y «C5» los pone el juez si hubo credenciales.

| Tarea | Modo | Auto | Juez C3 | C5 | Veredicto | Fallos |
|---|---|---|---|---|---|---|
| ui-01 | ui | 7/8 | 2/2 | 0 · 2 · 2 | suspende | C4: 6 líneas en el Why; el techo es 5 · C5 no: ¿Comprobó en el registro que no existía ya un componente equivalente (get_component)? |
| ui-02 | ui | 8/8 | 1/2 | 0 · 2 | suspende | juez C3: Afirma «Lo he comprobado con `validate_snippet`» para marcar R01–R04 ✅ y a la vez dice que no ha compilado ni ejecutado nada: recita conformidad sin sostenerla. Además deja el cambio «sin commitear sobre `master`» en vez de entregarlo para revisión. · C5 no: ¿Se ve el foco en modo de alto contraste (forced-colors)? |
| token-01 | token | 7/8 | 2/2 | 1 · 2 | suspende | C4: línea del Why sin sus tres campos: «**Nivel 3 y fichero nuevo, no meterlos en `_pills.scss` o `_…» |
| token-02 | token | 3/8 | 2/2 | 2 | suspende | C2: --component-form-field-error-msg-font-size no existe (¿--semantic-space-component-xs, --semantic-space-component-sm?) · C3: falta: se pregunta al servidor antes de crear · C4: línea del Why sin sus tres campos: «**Reasignar en vez de crear:** el color ya tiene un token he…» |
| theme-01 | theme | 5/8 | 1/2 | 2 · 1 | suspende | C2: --semantic-color-primary-hover no existe (¿--semantic-font-size-overline, --semantic-font-size-caption?) · C3: falta: el tema se mide contra contracts/contrast.json · juez C3: La regla pide medir el tema contra contracts/contrast.json. La respuesta no nombra ese fichero ni manda pasar `npm run check:contraste`. Los contrastes son cálculos propios («Mis números son cálculos»). La «Compilation Check» lista build, syx-validate, check:modo-claro y check-theme-symmetry, y la verificación del contraste queda en `get_token`. |
| theme-02 | theme | 5/8 | 1/2 | 2 | suspende | C3: falta: el primario se usa como texto y como borde de foco · C4: falta la sección «Color Brief»; falta la sección «Files for a person to create»; falta la sección «Compilation Check» · juez C3: No sostiene que `--semantic-color-border-focus` siga al primario. El diff no toca el foco y la respuesta dice «Siguen en coral… `--semantic-focus-ring-color`». Solo lo deja como recomendación opcional («al menos el anillo de foco y la selección»), así que el borde de foco queda en coral. |
| ux-01 | ux | 8/8 | 2/2 | 2 · 2 | aprueba | — |
| ux-02 | ux | 8/8 | 2/2 | 2 · 2 | aprueba | — |
| audit-01 | audit | 8/8 | 2/2 | 2 | aprueba | — |
| audit-02 | audit | 7/8 | 1/2 | 2 | suspende | C3: falta: un primario más claro puede bajar de 4,5:1 · juez C3: No sostiene la regla «un primario más claro puede bajar de 4,5:1». La respuesta nunca menciona el contraste ni `check:contraste`. Solo objeta que `teal-400` no existe y que «la recomendación debe usar un primitivo que exista», sin advertir de que un primario más claro puede bajar de 4,5:1. |
| migrate-01 | migrate | 8/8 | 2/2 | 1 | aprueba | — |
| migrate-02 | migrate | 6/8 | 2/2 | 2 | suspende | C2: --semantic-color-overlay no existe (¿--semantic-font-size-overline, --semantic-font-size-caption?) |
| sketch-01 | sketch | 8/8 | 1/2 | 2 | suspende | juez C3: Dice "No he ... consultado `tokens.json` ni `component-registry.json`" y usa `#2563eb`, system-ui y nombres de componentes inventados: no se apoya en el tema ni en las clases que ya existen, incumple el debe. |
| sketch-02 | sketch | 6/8 | 1/2 | 0 | suspende | C2: --semantic-color-bg no existe (¿--semantic-font-size-overline, --semantic-font-size-caption?); --semantic-color-bg-subtle no existe (¿--semantic-font-size-overline, --semantic-font-size-caption?); --semantic-color-border no existe (¿--semantic-font-size-overline, --semantic-font-size-caption?); --semantic-color-text-muted no existe (¿--semantic-font-size-overline, --semantic-font-size-caption?); --semantic-color-text no existe (¿--semantic-font-size-overline, --semantic-font-size-caption?) · juez C3: No sostiene «usa los componentes que ya hay»: nombra mol-metric-card, mol-data-table, etc. sin consultar el registro y admite «podrían existir ya», así que los nombres son supuestos. · C5 no: ¿Marca qué datos son de mentira? |
| creative-01 | creative | 8/8 | 2/2 | 2 · 0 | suspende | C5 no: ¿Las duraciones caen en la escala de motion/06-sistema? |
| creative-02 | creative | 7/8 | 2/2 | 2 | suspende | C3: falta: cita el estrato del córtex que usa |
| brand-01 | brand | 6/8 | 2/2 | 2 | suspende | C4: falta la sección «Buildability»; falta la sección «Handover to THEME» |
| brand-02 | brand | 8/8 | 2/2 | 2 | aprueba | — |

Un modo aprueba si aprueban todas sus tareas.

| Modo | Tareas | Veredicto |
|---|---|---|
| ui | 0/2 | suspende |
| token | 0/2 | suspende |
| theme | 0/2 | suspende |
| ux | 2/2 | aprueba |
| audit | 1/2 | suspende |
| migrate | 1/2 | suspende |
| sketch | 0/2 | suspende |
| creative | 0/2 | suspende |
| brand | 1/2 | suspende |
