#!/usr/bin/env node
/**
 * SYX — Registro de métricas del sistema, una vez por versión
 * ───────────────────────────────────────────────────────────────────────────
 * Plan de mejora 2026-11, F1-08. Lo que depende solo de SYX, medido igual en
 * cada versión, para que una mejora se pueda demostrar y una regresión se vea:
 *
 *   paquete    ficheros, comprimido y desempaquetado (npm pack --dry-run)
 *   css        cada hoja de dist/, en gzip (dist/sizes.json, de build-dist)
 *   fuentes    bytes de woff2 que carga cada tema (las url() de su hoja)
 *   escaner    avisos de syx-scan sobre la plantilla de tema, por gravedad
 *   guardianes pasos de `npm run check` y casos de la suite de mutación
 *
 * No mide el tiempo de CI: eso solo lo sabe GitHub (F2-06).
 *
 * Se guarda en metrics/<versión>.json y se commitea con la release: antes de
 * etiquetar, `npm run build:metricas`. release.yml lo comprueba con --check
 * (lo commiteado tiene que ser lo que mide el árbol que se publica). Al
 * escribir, imprime la diferencia con la versión anterior que haya en metrics/.
 *
 * Uso: node scripts/build-metricas.js [--check] [--salida <fichero>]
 * ───────────────────────────────────────────────────────────────────────────
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync, spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const DIR = path.join(ROOT, 'metrics');
const arg = (n) => { const i = process.argv.indexOf(n); return i === -1 ? null : process.argv[i + 1]; };

function paquete() {
  const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const salida = execFileSync(npm, ['pack', '--dry-run', '--json', '--ignore-scripts'], { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], shell: process.platform === 'win32' });
  const p = JSON.parse(salida.slice(salida.indexOf('[')))[0];
  return { ficheros: p.entryCount, comprimidoBytes: p.size, desempaquetadoBytes: p.unpackedSize };
}

function css() {
  const f = path.join(ROOT, 'dist', 'sizes.json');
  if (!fs.existsSync(f)) throw new Error('falta dist/sizes.json: npm run build:dist');
  const hojas = JSON.parse(fs.readFileSync(f, 'utf8')).hojas;
  return Object.fromEntries(Object.keys(hojas).sort().map((h) => [h, hojas[h].gzip]));
}

function fuentes() {
  const dir = path.join(ROOT, 'css');
  const out = {};
  for (const f of fs.readdirSync(dir).filter((x) => /^styles-theme-.+\.css$/.test(x)).sort()) {
    const urls = new Set([...fs.readFileSync(path.join(dir, f), 'utf8').matchAll(/url\(\s*["']?([^"')]+\.woff2)["']?\s*\)/g)].map((m) => m[1]));
    let bytes = 0;
    for (const u of urls) {
      const p = path.resolve(dir, u);
      if (fs.existsSync(p)) bytes += fs.statSync(p).size;
    }
    out[f.replace(/^styles-theme-|\.css$/g, '')] = { ficheros: urls.size, bytes };
  }
  return out;
}

function escaner() {
  const r = spawnSync(process.execPath, [path.join(ROOT, 'scripts', 'scan-drift.js'), '--json', 'scss/themes/_template/_theme.scss'], { cwd: ROOT, encoding: 'utf8' });
  const j = JSON.parse(r.stdout.slice(r.stdout.indexOf('{')));
  const s = j.bySeverity || {};
  return { objetivo: 'scss/themes/_template/_theme.scss', alta: s.alta || 0, media: s.media || 0, baja: s.baja || 0 };
}

function guardianes() {
  const check = require(path.join(ROOT, 'package.json')).scripts.check || '';
  const casos = path.join(ROOT, 'tests', 'mutacion', 'casos');
  let mutacion = 0;
  if (fs.existsSync(casos)) {
    for (const f of fs.readdirSync(casos).filter((x) => x.endsWith('.js'))) mutacion += require(path.join(casos, f)).length;
  }
  return { pasosDeCheck: check.split('&&').length, casosDeMutacion: mutacion };
}

function medir() {
  const version = require(path.join(ROOT, 'package.json')).version;
  return {
    _nota: 'Generado por scripts/build-metricas.js. Bytes salvo que diga otra cosa. No se edita a mano.',
    version,
    paquete: paquete(),
    css: css(),
    fuentes: fuentes(),
    escaner: escaner(),
    guardianes: guardianes(),
  };
}

const kb = (b) => `${(b / 1024).toFixed(1)} KB`;
function diferencias(antes, ahora) {
  const filas = [];
  const fila = (nombre, a, b, fmt = String) => {
    if (a === undefined || a === b) return;
    const d = b - a;
    filas.push(`   ${nombre.padEnd(44)} ${fmt(a).padStart(10)} → ${fmt(b).padStart(10)}  (${d > 0 ? '+' : ''}${fmt === kb ? kb(d) : d})`);
  };
  fila('paquete · desempaquetado', antes.paquete.desempaquetadoBytes, ahora.paquete.desempaquetadoBytes, kb);
  fila('paquete · ficheros', antes.paquete.ficheros, ahora.paquete.ficheros);
  for (const h of Object.keys(ahora.css)) fila(`css · ${h} (gzip)`, antes.css[h], ahora.css[h], kb);
  for (const t of Object.keys(ahora.fuentes)) fila(`fuentes · ${t}`, antes.fuentes[t] && antes.fuentes[t].bytes, ahora.fuentes[t].bytes, kb);
  for (const g of ['alta', 'media', 'baja']) fila(`escáner · avisos de gravedad ${g}`, antes.escaner[g], ahora.escaner[g]);
  fila('guardianes · pasos de check', antes.guardianes.pasosDeCheck, ahora.guardianes.pasosDeCheck);
  fila('guardianes · casos de mutación', antes.guardianes.casosDeMutacion, ahora.guardianes.casosDeMutacion);
  return filas;
}

const porVersion = (a, b) => {
  const pa = a.replace(/\.json$/, '').split('.').map(Number), pb = b.replace(/\.json$/, '').split('.').map(Number);
  for (let i = 0; i < 3; i++) if (pa[i] !== pb[i]) return pa[i] - pb[i];
  return 0;
};

function main() {
  const check = process.argv.includes('--check');
  const m = medir();
  const destino = arg('--salida') ? path.resolve(arg('--salida')) : path.join(DIR, `${m.version}.json`);
  const texto = JSON.stringify(m, null, 2) + '\n';
  if (check) {
    if (!fs.existsSync(destino)) {
      console.error(`❌ check:metricas — falta ${path.relative(ROOT, destino)}: npm run build:metricas antes de etiquetar`);
      process.exit(1);
    }
    if (fs.readFileSync(destino, 'utf8').replace(/\r\n/g, '\n') !== texto) {
      console.error(`❌ check:metricas — ${path.relative(ROOT, destino)} no es lo que mide este árbol: npm run build:metricas`);
      process.exit(1);
    }
    console.log(`✓ check:metricas — ${path.relative(ROOT, destino)} al día`);
    return;
  }
  // Las métricas de una versión ya etiquetada son historia: no se reescriben
  // con lo que mide un árbol posterior que todavía lleva ese número.
  if (!arg('--salida') && fs.existsSync(destino) && fs.readFileSync(destino, 'utf8').replace(/\r\n/g, '\n') !== texto) {
    let etiquetada = false;
    try { etiquetada = execFileSync('git', ['tag', '-l', `v${m.version}`], { cwd: ROOT, encoding: 'utf8' }).trim() !== ''; } catch { /* sin git */ }
    if (etiquetada) {
      console.error(`❌ build:metricas — v${m.version} ya está publicada y ${path.relative(ROOT, destino)} es su registro. Sube la versión (npm version …) antes de medir.`);
      process.exit(1);
    }
  }
  fs.mkdirSync(path.dirname(destino), { recursive: true });
  fs.writeFileSync(destino, texto);
  console.log(`✓ build:metricas — ${path.relative(ROOT, destino).replace(/\\/g, '/')}`);
  const previas = fs.existsSync(DIR) ? fs.readdirSync(DIR).filter((f) => /^\d+\.\d+\.\d+\.json$/.test(f) && porVersion(f, `${m.version}.json`) < 0).sort(porVersion) : [];
  if (previas.length) {
    const antes = JSON.parse(fs.readFileSync(path.join(DIR, previas.at(-1)), 'utf8'));
    const filas = diferencias(antes, m);
    console.log(`\n   Frente a ${antes.version}:${filas.length ? '' : ' sin cambios'}`);
    filas.forEach((f) => console.log(f));
  }
}

if (require.main === module) main();
module.exports = { medir, diferencias };
