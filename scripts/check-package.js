#!/usr/bin/env node
/**
 * SYX — Guardián del paquete publicable
 * ─────────────────────────────────────
 * Comprueba que lo que `npm pack` metería en el tarball es exactamente lo que
 * `exports`, `bin` y `main` prometen, y que el CSS que viaja no apunta a
 * ficheros que se quedan fuera.
 *
 * POR QUÉ HACE FALTA UN GUARDIÁN PARA ESTO
 * Porque el error de empaquetado es silencioso por naturaleza: aquí todo
 * funciona —los ficheros están en el disco— y solo se rompe en la máquina de
 * quien instala, que es donde nadie está mirando. `main` llevaba versiones
 * apuntando a un CSS de un tema concreto y nada lo dijo nunca.
 *
 * QUÉ ES ERROR Y QUÉ ES AVISO
 * Error: algo que el paquete promete y no entrega —una ruta de `exports` que no
 * viaja, un `bin` ausente, una fuente que está en el repositorio pero se queda
 * fuera del tarball.
 * Aviso: algo que ya falta en el repositorio —una familia tipográfica que el
 * CSS cita y que aquí no está. Eso no lo causa el empaquetado y no es este
 * guardián quien debe decidir arreglarlo, pero callarlo sería peor.
 *
 * Uso: node scripts/check-package.js   ·   npm run check:package
 */

'use strict';

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));

const errores = [];
const avisos = [];

// ─── Qué viajaría ────────────────────────────────────────────────────────────
// Se le pregunta a npm en vez de reimplementar sus reglas: `files`, .gitignore,
// .npmignore y los ficheros que npm incluye siempre interactúan de formas que
// no merece la pena replicar — y replicarlas sería, otra vez, tener dos copias
// del mismo criterio.

let manifiesto;
try {
  const salida = execFileSync('npm', ['pack', '--dry-run', '--json'], {
    cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'],
  });
  manifiesto = JSON.parse(salida)[0];
} catch (e) {
  console.error('No se pudo ejecutar `npm pack --dry-run`: ' + e.message);
  process.exit(1);
}

const dentro = new Set(manifiesto.files.map((f) => f.path));
const viaja = (rel) => dentro.has(rel.replace(/^\.\//, ''));

// ─── 1. Todo lo que `exports` promete, viaja ─────────────────────────────────
// Los patrones con `*` se comprueban expandiéndolos contra el disco: un
// `exports` que apunta a una carpeta vacía es una promesa igual de rota.

function expandir(destino) {
  const limpio = destino.replace(/^\.\//, '');
  if (!limpio.includes('*')) return [limpio];
  const [ini, fin] = limpio.split('*');
  // `css/*` tiene prefijo terminado en barra y sufijo vacío; `css/styles-theme-*.css`
  // tiene las dos partes. La diferencia solo está en dónde corta el nombre.
  const dir = path.join(ROOT, ini.endsWith('/') ? ini : path.dirname(ini));
  if (!fs.existsSync(dir)) return [];
  const prefijoDir = ini.endsWith('/') ? ini : path.posix.dirname(ini) + '/';
  const prefijoNombre = ini.endsWith('/') ? '' : path.posix.basename(ini);
  return fs
    .readdirSync(dir)
    .filter((f) => f.startsWith(prefijoNombre) && f.endsWith(fin))
    // Solo ficheros: un patrón `css/*` abarca también las carpetas que la
    // compilación deja ahí, y esas no son entregables ni viajan.
    .filter((f) => fs.statSync(path.join(dir, f)).isFile())
    .map((f) => prefijoDir + f);
}

for (const [sub, destino] of Object.entries(pkg.exports || {})) {
  const reales = expandir(destino);
  if (!reales.length) {
    errores.push(`exports["${sub}"] → ${destino} no corresponde a ningún fichero`);
    continue;
  }
  const fuera = reales.filter((r) => !viaja(r));
  if (fuera.length) {
    errores.push(`exports["${sub}"] promete ${fuera.length} fichero(s) que no viajan: ${fuera.slice(0, 3).join(', ')}`);
  }
}

// ─── 2. main y bin ───────────────────────────────────────────────────────────

if (!pkg.main) errores.push('sin `main`');
else if (!viaja(pkg.main)) errores.push(`main (${pkg.main}) no viaja en el paquete`);
else if (/\.(css|scss)$/.test(pkg.main)) errores.push(`main (${pkg.main}) apunta a una hoja de estilos: \`require()\` fallaría`);

for (const [nombre, destino] of Object.entries(pkg.bin || {})) {
  if (!viaja(destino)) { errores.push(`bin["${nombre}"] → ${destino} no viaja`); continue; }
  const primera = fs.readFileSync(path.join(ROOT, destino), 'utf8').split('\n')[0];
  if (!primera.startsWith('#!')) errores.push(`bin["${nombre}"] → ${destino} sin shebang: no arrancaría`);
}

// ─── 3. El CSS que viaja no apunta a nada que se quede fuera ─────────────────
// Es la comprobación que más valor da: las url() de las fuentes son relativas y
// nadie las mira nunca. Se distingue entre «está en el repositorio pero no
// viaja» (culpa del empaquetado, error) y «no está en el repositorio» (bug
// anterior, aviso).

const hojas = manifiesto.files.map((f) => f.path).filter((p) => /^css\/[^/]+\.css$/.test(p));
const referencias = new Map(); // ruta relativa al paquete → hojas que la citan

for (const hoja of hojas) {
  const css = fs.readFileSync(path.join(ROOT, hoja), 'utf8');
  for (const m of css.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/g)) {
    const ref = m[1].trim();
    if (/^(data:|https?:|#)/.test(ref)) continue;
    const limpia = ref.split(/[?#]/)[0];
    const rel = path.posix.normalize(path.posix.join(path.posix.dirname(hoja), limpia));
    if (!referencias.has(rel)) referencias.set(rel, new Set());
    referencias.get(rel).add(path.basename(hoja));
  }
}

const familiasAusentes = new Map();
let refsRotasPorEmpaquetado = 0;

for (const [rel, hojasQueLaCitan] of referencias) {
  const existe = fs.existsSync(path.join(ROOT, rel));
  if (existe && !viaja(rel)) {
    refsRotasPorEmpaquetado++;
    if (refsRotasPorEmpaquetado <= 3) {
      errores.push(`el CSS cita ${rel}, que está en el repositorio pero no viaja`);
    }
  }
  if (!existe) {
    const familia = rel.split('/').slice(0, 2).join('/');
    if (!familiasAusentes.has(familia)) familiasAusentes.set(familia, { ficheros: 0, hojas: new Set() });
    const f = familiasAusentes.get(familia);
    f.ficheros++;
    for (const h of hojasQueLaCitan) f.hojas.add(h);
  }
}
if (refsRotasPorEmpaquetado > 3) {
  errores.push(`… y ${refsRotasPorEmpaquetado - 3} referencia(s) más que no viajan`);
}
for (const [familia, f] of familiasAusentes) {
  avisos.push(`${familia} no está en el repositorio · ${f.ficheros} url() sin destino, en ${[...f.hojas].sort().join(', ')}`);
}

// ─── 4. Nada derivable ni pesado de más ──────────────────────────────────────

const derivables = [...dentro].filter((f) => f.startsWith('contracts/dtcg/'));
if (derivables.length) {
  errores.push(`contracts/dtcg/ viaja (${derivables.length} ficheros) y es enteramente derivable de resolved-tokens.json`);
}
const sobra = [...dentro].filter((f) => /^(node_modules|css\/prod)\//.test(f) || /\.(log|tar|tgz)$/.test(f));
if (sobra.length) errores.push(`viajan ${sobra.length} fichero(s) que no deberían: ${sobra.slice(0, 3).join(', ')}`);

// ─── 5. Los artefactos que la API necesita para responder ────────────────────
// index.js sin ellos es una cáscara: instala, importa y falla en la primera
// llamada. Es el modo de fallo más caro porque parece que el paquete funciona.

for (const necesario of ['contracts/resolved-tokens.json', 'component-registry.json', 'tokens.json', 'contracts/rules.json']) {
  if (!viaja(necesario)) errores.push(`falta ${necesario}: la API instalada no podría responder`);
}

// ─── Informe ─────────────────────────────────────────────────────────────────

console.log('\n── PAQUETE PUBLICABLE ──────────────────────────────────────────\n');
console.log(`   nombre              ${pkg.name}@${pkg.version}`);
console.log(`   ficheros            ${manifiesto.entryCount}`);
console.log(`   comprimido          ${(manifiesto.size / 1048576).toFixed(1)} MB   ·   desempaquetado ${(manifiesto.unpackedSize / 1048576).toFixed(1)} MB`);
console.log(`   rutas de exports    ${Object.keys(pkg.exports || {}).length}`);
console.log(`   hojas de tema       ${hojas.length}`);
console.log(`   assets referidos    ${referencias.size} desde el CSS\n`);

if (avisos.length) {
  console.log('⚠️  Anterior al empaquetado, pero conviene saberlo:');
  for (const a of avisos) console.log(`   → ${a}`);
  console.log('');
}

if (errores.length) {
  console.log(`❌ ${errores.length} problema(s) de empaquetado:`);
  for (const e of errores) console.log(`   · ${e}`);
  console.log('');
  process.exit(1);
}

console.log('✅ Lo que el paquete promete es lo que el paquete entrega.\n');
