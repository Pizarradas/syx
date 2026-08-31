#!/usr/bin/env node
// COMPROBADOR DE COHERENCIA DE VERSIÓN
// ===============================================
// La versión se cita en diez sitios y se habían desincronizado cuatro a la vez:
// package.json iba por 4.10.0 mientras el escudo del README decía 4.2.0 y los
// ficheros de entrada para agentes, 4.1.0. Ninguna regla lo veía porque no es
// un problema de CSS.
//
// Ojo con lo que NO comprueba: las citas HISTÓRICAS son correctas tal cual y
// deben quedarse quietas — la línea "Versions evaluated: SYX v4.2.0" de
// why-syx.html es la constancia de qué se evaluó en abril, no un distintivo de
// versión actual, y ya se rompió una vez por un reemplazo masivo.
// ===============================================

const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');
const strict = process.argv.includes('--strict');

const expected = JSON.parse(read('package.json')).version;

const first = (file, re, pick = 1) => {
  const m = read(file).match(re);
  return m ? m[pick] : null;
};

const citas = [
  ['package-lock.json (raíz)', () => JSON.parse(read('package-lock.json')).version],
  ['package-lock.json (packages[""])', () => JSON.parse(read('package-lock.json')).packages[''].version],
  ['README.md — escudo', () => first('README.md', /version-([0-9]+\.[0-9]+\.[0-9]+)-/)],
  ['CLAUDE.md — cabecera', () => first('CLAUDE.md', /design system \(v([0-9.]+)\)/)],
  ['AGENTS.md — cabecera', () => first('AGENTS.md', /design system \(v([0-9.]+)\)/)],
  ['CHANGELOG.md — última entrada', () => first('CHANGELOG.md', /^## \[([0-9.]+)\]/m)],
];
for (const f of ['home.html', 'docs.html', 'why-syx.html']) {
  citas.push([`${f} — pie`, () => first(f, /SYX Design System<\/strong> · v([0-9.]+)/)]);
}
citas.push(['home.html — píldora del hero', () => first('home.html', /SYX v([0-9.]+) ·/)]);
citas.push(['docs.html — galería', () => first('docs.html', /Component Gallery v([0-9.]+)/)]);

console.log('\n── COHERENCIA DE VERSIÓN ───────────────────────────────────────\n');
console.log(`   package.json declara ${expected}\n`);

let malas = 0;
for (const [nombre, get] of citas) {
  let v;
  try { v = get(); } catch (e) { v = null; }
  if (v === null) {
    malas++;
    console.log(`❌ ${nombre.padEnd(34)} no encontrada — ¿cambió el marcado?`);
    continue;
  }
  // La píldora del hero cita major.minor a propósito.
  const ok = v === expected || expected.startsWith(v + '.');
  if (ok) console.log(`✅ ${nombre.padEnd(34)} ${v}`);
  else { malas++; console.log(`❌ ${nombre.padEnd(34)} ${v}   (debería ser ${expected})`); }
}

console.log('');
if (malas) {
  console.log(`   ${malas} cita(s) fuera de sitio.\n`);
  if (strict) process.exit(1);
} else {
  console.log('   Las diez citas coinciden.\n');
}
