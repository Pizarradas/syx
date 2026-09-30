#!/usr/bin/env node
/**
 * SYX — Las tareas de referencia de los modos se sostienen
 * ────────────────────────────────────────────────────────
 * Un banco de pruebas que nadie prueba se pudre igual que el código. Esto
 * comprueba el banco, no a los agentes:
 *
 *   1. Cada modo que hay en _agents/modes/ tiene al menos dos tareas.
 *   2. Cada tarea tiene enunciado, criterio, referencia y mutante bien formados,
 *      y su fixture existe si la cita.
 *   3. Cada referencia saca la nota automática completa: la tarea se puede
 *      resolver y el corrector no pide imposibles.
 *   4. Cada mutante (la referencia con un solo fallo sembrado) suspende: el
 *      corrector de verdad distingue una respuesta buena de una casi buena.
 *
 * Uso: node scripts/check-evals.js   ·   npm run check:evals
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { crearConsulta } = require('./lib/consulta');
const { evaluar } = require('./lib/evaluar');

const ROOT = path.join(__dirname, '..');
const EVALS = path.join(ROOT, '_agents/evals');
const { tareas } = JSON.parse(fs.readFileSync(path.join(EVALS, 'tareas.json'), 'utf8'));
const syx = crearConsulta({ root: ROOT });

const errores = [];
let ok = 0;

console.log('\n── TAREAS DE REFERENCIA DE LOS MODOS ──────────────────────────\n');

// 1 · cobertura, leída del directorio
const modos = fs.readdirSync(path.join(ROOT, '_agents/modes'))
  .filter((f) => f.endsWith('.md') && f !== 'README.md')
  .map((f) => f.replace(/\.md$/, ''));
for (const m of modos) {
  const n = tareas.filter((t) => t.modo === m).length;
  if (n < 2) errores.push(`el modo ${m} tiene ${n} tarea(s); mínimo 2`);
}
const huerfanas = tareas.filter((t) => !modos.includes(t.modo));
for (const t of huerfanas) errores.push(`${t.id}: el modo «${t.modo}» no existe en _agents/modes/`);

// 2 · forma
const ids = new Set();
for (const t of tareas) {
  if (ids.has(t.id)) errores.push(`${t.id}: id repetido`);
  ids.add(t.id);
  for (const k of ['enunciado', 'referencia', 'mutante', 'criterio', 'secciones']) {
    if (!t[k] || (Array.isArray(t[k]) && !t[k].length)) errores.push(`${t.id}: falta «${k}»`);
  }
  if (t.fixture && !fs.existsSync(path.join(EVALS, t.fixture))) errores.push(`${t.id}: no existe ${t.fixture}`);
  for (const d of [...(t.debe || []), ...(t.noDebe || [])]) {
    try { new RegExp(d.re, 'i'); } catch (e) { errores.push(`${t.id}: expresión inválida ${d.re}`); }
  }
}

// 3 y 4 · referencia aprueba, mutante suspende
for (const t of tareas) {
  const ruta = path.join(EVALS, t.referencia || '');
  if (!t.referencia || !fs.existsSync(ruta)) { errores.push(`${t.id}: no existe la referencia`); continue; }
  const ref = fs.readFileSync(ruta, 'utf8');
  const r = evaluar({ tarea: t, respuesta: ref, syx });
  if (!r.apruebaAuto) {
    const por = r.criterios.filter((c) => c.nota < c.max).map((c) => `${c.id}: ${c.detalle.join('; ')}`);
    errores.push(`${t.id}: la referencia no aprueba (${r.auto}/${r.max}) — ${por.join(' | ')}`);
    continue;
  }
  if (!t.mutante || !ref.includes(t.mutante.buscar)) {
    errores.push(`${t.id}: el mutante no encuentra «${t.mutante && t.mutante.buscar}» en la referencia`);
    continue;
  }
  const mut = evaluar({ tarea: t, respuesta: ref.split(t.mutante.buscar).join(t.mutante.poner), syx });
  if (mut.apruebaAuto) { errores.push(`${t.id}: el mutante aprueba — el corrector no ve ese fallo`); continue; }
  ok++;
}

for (const e of errores) console.log(`❌ ${e}`);
if (!errores.length) {
  console.log(`✅ ${modos.length} modos cubiertos · ${tareas.length} tareas`);
  console.log(`✅ ${ok}/${tareas.length} referencias aprueban y sus mutantes suspenden`);
}
console.log('');
process.exitCode = errores.length ? 1 : 0;
