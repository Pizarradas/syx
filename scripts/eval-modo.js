#!/usr/bin/env node
/**
 * SYX — Corregir una respuesta de un modo contra su tarea de referencia
 * ────────────────────────────────────────────────────────────────────
 * Uso:
 *   node scripts/eval-modo.js <id-de-tarea> <respuesta.md> [--json]
 *   node scripts/eval-modo.js --lista
 *   npm run eval:modo -- ui-01 respuesta.md
 *
 * La respuesta es lo que el agente devolvió, tal cual, en Markdown. Sale la
 * nota de los criterios C1–C4 y las preguntas de C5 para quien corrige.
 * Termina con 1 si algún criterio automático no llega a 2.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { crearConsulta } = require('./lib/consulta');
const { evaluar } = require('./lib/evaluar');
const { cargarBanco } = require('./lib/banco');

const ROOT = path.join(__dirname, '..');
const { tareas, equivalentes } = cargarBanco(ROOT);

const args = process.argv.slice(2);
const flags = new Set(args.filter((a) => a.startsWith('--')));
const [id, fichero] = args.filter((a) => !a.startsWith('--'));

if (!id || flags.has('--lista')) {
  for (const t of tareas) console.log(`${t.id.padEnd(12)} ${t.modo.padEnd(9)} ${t.titulo}`);
  if (!flags.has('--lista')) console.log('\nUso: node scripts/eval-modo.js <id-de-tarea> <respuesta.md> [--json]');
  process.exit(flags.has('--lista') ? 0 : 1);
}

const tarea = tareas.find((t) => t.id === id);
if (!tarea) {
  console.error(`❌ No hay tarea «${id}». node scripts/eval-modo.js --lista`);
  process.exit(1);
}
if (!fichero || !fs.existsSync(fichero)) {
  console.error('❌ Falta la respuesta: node scripts/eval-modo.js <id> <respuesta.md>');
  console.error(`\nEnunciado de ${id}:\n  ${tarea.enunciado}`);
  process.exit(1);
}

const respuesta = fs.readFileSync(fichero, 'utf8');
const r = evaluar({ tarea, respuesta, syx: crearConsulta({ root: ROOT }), equivalentes });

if (flags.has('--json')) {
  console.log(JSON.stringify(r, null, 2));
} else {
  console.log(`\n── ${tarea.id} · ${tarea.modo.toUpperCase()} · ${tarea.titulo} ──\n`);
  for (const c of r.criterios) {
    console.log(`${c.nota === c.max ? '✅' : c.nota ? '⚠️ ' : '❌'} ${c.id} ${c.nombre.padEnd(14)} ${c.nota}/${c.max}`);
    for (const d of c.detalle) console.log(`      ${d}`);
  }
  console.log(`\n   Automático: ${r.auto}/${r.max}`);
  console.log('\n   C5 Criterio — para una persona o para AUDIT (0 no · 1 en parte · 2 sí):');
  for (const q of r.criterio) console.log(`     · ${q}`);
  console.log('');
}
process.exitCode = r.apruebaAuto ? 0 : 1;
