#!/usr/bin/env node
/**
 * SYX — La cadena de `npm run check` no se vigilaba a sí misma
 * ─────────────────────────────────────────────────────────────
 * Quitar check:compilado de `check`, o dejarlo en `node -e 0`, daba verde: el
 * verde no decía qué se había ejecutado. Y `ignoreFiles: ["scss/**"]` en stylelint
 * dejaba el lint mirando cero ficheros. Esto exige que estén los pasos que no se
 * negocian, que cada uno ejecute un script de scripts/ que exista, y que el lint
 * mire scss/.
 *
 * Añadir un paso es libre. Quitar uno de esta lista obliga a tocar este fichero,
 * que se ve en el diff y es de nivel humano.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
const lint = JSON.parse(fs.readFileSync(path.join(ROOT, '.stylelintrc.json'), 'utf8'));

const IMPRESCINDIBLES = [
  'lint', 'check:contratos', 'validate:report', 'check:reglas', 'check:compilado', 'check:contraste',
  'check:themes', 'check:huerfanos', 'check:usage', 'check:registry', 'check:tokens', 'check:mcp',
  'check:modos', 'check:clasificacion', 'check:codeowners', 'check:recuentos', 'check:evals', 'check:conocimiento',
];
const LINT = 'stylelint "scss/**/*.scss" --config .stylelintrc.json';

const pasos = pkg.scripts.check.split('&&').map((p) => p.trim().replace(/^npm run /, ''));
const fallos = [];

for (const p of IMPRESCINDIBLES) if (!pasos.includes(p)) fallos.push(`falta en \`check\`: ${p}`);

for (const p of pasos) {
  const orden = pkg.scripts[p] || '';
  if (p === 'lint') {
    if (orden !== LINT) fallos.push(`lint no es \`${LINT}\`: ${orden}`);
    continue;
  }
  if (p === 'build') continue; // encadena otros scripts; lo cubre check:limpio
  const m = /^node (scripts\/[\w.-]+\.js)( [^&|;]+)?$/.exec(orden);
  if (!m) fallos.push(`${p} no ejecuta un script de scripts/: ${orden || '(vacío)'}`);
  else if (!fs.existsSync(path.join(ROOT, m[1]))) fallos.push(`${p} apunta a un fichero que no existe: ${m[1]}`);
}

if (lint.ignoreFiles) fallos.push('.stylelintrc.json declara ignoreFiles: el lint puede estar mirando cero ficheros');

console.log('\n── LA CADENA DE CHECK ──────────────────────────────────────────\n');
if (fallos.length) {
  for (const f of fallos) console.log(`❌ ${f}`);
  console.log('');
  process.exit(1);
}
console.log(`✅ ${pasos.length} pasos: ${IMPRESCINDIBLES.length} imprescindibles presentes, y todos ejecutan lo que dicen.\n`);
