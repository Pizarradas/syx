#!/usr/bin/env node
/**
 * SYX — Toda la cadena de `npm run check`, sin pararse en el primer fallo
 * ──────────────────────────────────────────────────────────────────────
 * `npm run check` encadena sus pasos con `&&`: el primero que falla para la
 * cadena. En la CI es lo que se quiere —rojo pronto, sin ruido—, y por eso
 * se queda así. En local, cuando se toca algo transversal (un tema nuevo, por
 * ejemplo), convierte la jornada en un bucle: arreglar, relanzar 40 pasos,
 * fallar en el siguiente, arreglar… y no hay forma de saber de antemano
 * cuántas vueltas quedan.
 *
 * Esto ejecuta LOS MISMOS pasos, en el mismo orden —los lee del script
 * `check` de package.json, no de una lista propia que envejecería—, todos
 * aunque alguno falle, y al final dice cuáles fallaron. No sustituye a
 * `check`: el orden importa (validate:report escribe contratos que otros
 * leen), y un paso que falla puede hacer fallar a los siguientes en cadena;
 * el resumen es un mapa, no un veredicto. El veredicto sigue siendo
 * `npm run check`.
 *
 * Uso: node scripts/check-todo.js   ·   npm run check:todo
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));

// Cada eslabón de `check` tiene que ser `npm run <script>`: si alguien mete
// otra cosa, se dice en vez de adivinar cómo ejecutarla.
const pasos = pkg.scripts.check.split('&&').map((p) => p.trim());
const raros = pasos.filter((p) => !/^npm run [\w:.-]+$/.test(p));
if (raros.length) {
  console.error(`❌ el script check tiene pasos que no son \`npm run <script>\`: ${raros.join(' · ')}`);
  process.exit(1);
}
const scripts = pasos.map((p) => p.replace(/^npm run /, ''));
const ausentes = scripts.filter((s) => !pkg.scripts[s]);
if (ausentes.length) {
  console.error(`❌ el script check cita scripts que no existen: ${ausentes.join(', ')}`);
  process.exit(1);
}

const fallidos = [];
const inicio = Date.now();
scripts.forEach((s, i) => {
  console.log(`\n── [${i + 1}/${scripts.length}] npm run ${s}`);
  // En Windows npm es npm.cmd y sin shell no se encuentra (ENOENT); con shell,
  // Node pide la orden en una sola cadena. `s` es un nombre de script.
  const r = process.platform === 'win32'
    ? spawnSync(`npm run --silent ${s}`, { cwd: ROOT, stdio: 'inherit', shell: true })
    : spawnSync('npm', ['run', '--silent', s], { cwd: ROOT, stdio: 'inherit' });
  if (r.status !== 0) fallidos.push(s);
});

const seg = Math.round((Date.now() - inicio) / 1000);
console.log(`\n── RESUMEN DE LA CADENA check ${'─'.repeat(36)}\n`);
console.log(`   ${scripts.length - fallidos.length}/${scripts.length} pasos en verde · ${seg} s`);
for (const f of fallidos) console.log(`   ❌ ${f}`);
if (fallidos.length > 1) console.log('\n   Un fallo puede arrastrar a los siguientes: arregla el primero y vuelve a mirar.');
console.log('');
process.exit(fallidos.length ? 1 : 0);
