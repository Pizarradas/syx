#!/usr/bin/env node
/**
 * SYX — El registro de capacidades sigue siendo cierto
 * ────────────────────────────────────────────────────
 * contracts/capabilities.json dice qué hace ya SYX, y el modo ROADMAP lo usa
 * para no proponer lo que existe. Un registro así envejece en silencio: alguien
 * renombra `_fluid.scss` y la entrada sigue afirmando «done» con una prueba que
 * ya no está. Este guardián lo impide:
 *
 *   1. Forma: id único, estado válido, tres alias como mínimo, `gap` en lo
 *      parcial y lo abierto, `decision` en lo descartado.
 *   2. Evidencia: cada fichero existe y contiene su expresión.
 *   3. Búsqueda: las preguntas con las que nació —las seis propuestas de una
 *      revisión externa que ya estaban resueltas o descartadas— siguen
 *      llevando a su entrada. Si alguien poda un alias, se ve aquí.
 *
 * Uso: node scripts/check-capacidades.js   ·   npm run check:capacidades
 */

'use strict';

const path = require('path');
const { leer, buscar, verificar } = require('./lib/capacidades');

const ROOT = path.join(__dirname, '..');

// Pregunta → la entrada que tiene que salir primero. Redactadas como las
// escribiría alguien que no conoce SYX, que es a quien sirve el registro.
const PREGUNTAS = [
  ['Adoptar container queries (@container) en .mol-card', 'container-queries'],
  ['Sustituir valores fijos de tipografía por escalado fluido con clamp()', 'fluid-typography'],
  ['color-mix() para estados hover y borders dinámicos', 'color-mix-states'],
  ['Escala fluida --semantic-space-fluid-sm y --semantic-space-fluid-lg', 'fluid-spacing'],
  ['Contrato de tipografía semántica --semantic-type-heading-1', 'typography-presets'],
  ['Regla de Stylelint que prohíba #fff, 16px y red', 'hardcoded-value-lint'],
  ['Style Dictionary: tokens JSON de Figma a _primitives.scss y _semantic.scss', 'figma-to-scss-import'],
  ['usar la unidad lh', 'lh-unit'],
];

console.log('\n── REGISTRO DE CAPACIDADES ─────────────────────────────────────\n');

const fallos = verificar(ROOT);
const registro = fallos.length ? null : leer(ROOT);

if (registro) {
  for (const [q, id] of PREGUNTAS) {
    const r = buscar(registro, q);
    if (r[0]?.id !== id) fallos.push(`«${q}» lleva a ${r[0]?.id || 'nada'}, no a ${id}`);
  }
}

if (fallos.length) {
  for (const f of fallos) console.log(`❌ ${f}`);
  console.log('');
  process.exit(1);
}

const porEstado = registro.capabilities.reduce((a, c) => ({ ...a, [c.status]: (a[c.status] || 0) + 1 }), {});
console.log(`✅ ${registro.capabilities.length} capacidades con su evidencia en disco (${Object.entries(porEstado).map(([k, v]) => `${v} ${k}`).join(' · ')})`);
console.log(`✅ ${PREGUNTAS.length}/${PREGUNTAS.length} preguntas de referencia llevan a su entrada\n`);
