#!/usr/bin/env node
/**
 * SYX — El runner de evaluación funciona sin red
 * ──────────────────────────────────────────────
 * scripts/eval-runner.js solo se ejecuta de verdad a mano o en el workflow
 * manual, con credenciales. Si se rompe —deja de interpretar la salida del
 * agente, de aislar la copia o de corregir— nadie lo nota hasta el día que
 * alguien quiere comparar dos modelos. Esto lo ejecuta con el agente simulado
 * (scripts/eval-agente-simulado.js) sobre dos modos y comprueba de punta a
 * punta:
 *
 *   1. con las referencias, cada tarea aprueba (C1–C4);
 *   2. con las anti-referencias, cada tarea suspende;
 *   3. la copia del agente no lleva las soluciones (el simulado falla si las ve);
 *   4. las tres salidas que el runner entiende (stream-json, json, texto) dan
 *      la misma nota;
 *   5. el árbol de trabajo real no cambia.
 *
 * Sin juez y sin red. Uso: node scripts/check-runner.js · npm run check:runner
 */

'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const MODOS = 'audit,theme';
const errores = [];

console.log('\n── RUNNER DE EVALUACIÓN (agente simulado) ─────────────────────\n');

const estado = () => spawnSync('git', ['status', '--porcelain'], { cwd: ROOT, encoding: 'utf8' }).stdout;
const antes = estado();
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'syx-check-runner-'));

function correr(simulado, formato, filtro = ['--modo', MODOS]) {
  const salida = path.join(tmp, `${simulado}-${formato}`);
  const r = spawnSync(process.execPath, [path.join(__dirname, 'eval-runner.js'), ...filtro, '--sin-juez', '--sin-git', '--paralelo', '4', '--salida', salida], {
    cwd: ROOT,
    encoding: 'utf8',
    env: { ...process.env, SYX_AGENT_CMD: `"${process.execPath}" "${path.join(__dirname, 'eval-agente-simulado.js')}"`, SYX_SIMULADO: simulado, SYX_SIMULADO_FORMATO: formato, SYX_JUEZ: '0' },
  });
  const f = path.join(salida, 'resumen.json');
  if (!fs.existsSync(f)) { errores.push(`${simulado}/${formato}: el runner no escribió resumen.json (${(r.stderr || r.stdout).slice(-300)})`); return null; }
  return JSON.parse(fs.readFileSync(f, 'utf8'));
}

const notas = {};
// El formato por defecto en los dos modos; los otros dos, en una tarea: lo que
// se comprueba ahí es la lectura de la salida, no el banco.
for (const formato of ['stream', 'json', 'texto']) {
  const ref = correr('referencia', formato, formato === 'stream' ? undefined : ['--id', 'audit-01']);
  if (ref) {
    for (const t of ref.tareas) {
      if (t.error) errores.push(`referencia/${formato} ${t.id}: ${t.error}`);
      else if (!t.veredicto.startsWith('aprueba')) errores.push(`referencia/${formato} ${t.id}: ${t.veredicto} (${t.auto}/8)`);
      notas[t.id] = notas[t.id] || new Set();
      notas[t.id].add(t.auto);
    }
  }
}
const anti = correr('anti', 'stream');
if (anti) {
  for (const t of anti.tareas) {
    if (t.error) errores.push(`anti ${t.id}: ${t.error}`);
    else if (t.veredicto.startsWith('aprueba')) errores.push(`anti ${t.id}: aprueba siendo dañina`);
  }
}
for (const [id, s] of Object.entries(notas)) if (s.size > 1) errores.push(`${id}: la nota cambia según el formato de salida (${[...s].join(', ')})`);
if (estado() !== antes) errores.push('el runner cambió el árbol de trabajo real');
fs.rmSync(tmp, { recursive: true, force: true });

for (const e of errores) console.log(`❌ ${e}`);
if (!errores.length) {
  console.log(`✅ ${Object.keys(notas).length} tareas (${MODOS}): las referencias aprueban en los tres formatos de salida`);
  console.log('✅ las anti-referencias suspenden, la copia no lleva las soluciones y el árbol real no cambia');
}
console.log('');
process.exitCode = errores.length ? 1 : 0;
