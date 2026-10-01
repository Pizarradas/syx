#!/usr/bin/env node
/**
 * SYX — Prepros y npm compilan lo mismo, y las páginas enlazan lo compilado
 * ──────────────────────────────────────────────────────────────────────────
 * La regla del sistema: todo .css que enlazan las páginas sale de la
 * arquitectura SCSS, y se puede compilar con Prepros (lo usa quien mantiene
 * SYX) o con `npm run build:css`, con el mismo resultado. Hasta octubre de
 * 2026 no era así: prepros.config minificaba las hojas mientras el repositorio
 * las quiere expandidas, y las páginas llegaron a enlazar dist/site/, que no
 * sale de ningún punto de entrada SCSS sino de un script de Node. Comprueba:
 *
 *   1. Cada punto de entrada (scss/*.scss que no es parcial) está en
 *      prepros.config con autoprefixer y minify-css desactivados, y el tipo
 *      .scss los tiene desactivados por defecto: Prepros produce dart-sass
 *      expandido, igual que build:css.
 *   2. build:css no pasa por postcss/autoprefixer: el CSS canónico es lo que
 *      escribe Sass. Los prefijos que hacen falta van en el SCSS.
 *   3. Cada hoja que enlaza una página raíz (*.html) existe, está en css/ y
 *      sale de un punto de entrada de scss/. También las del selector de tema.
 *   4. El comparador normalizado de check-limpio ve igual un cambio de formato
 *      y distinto un cambio de valor.
 *
 * Uso: node scripts/check-prepros.js   ·   npm run check:prepros
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { normalizar } = require('./lib/css-normal');

const ROOT = path.join(__dirname, '..');
const casos = [];
const comprobar = (nombre, fn) => casos.push({ nombre, fn });

const entradas = fs.readdirSync(path.join(ROOT, 'scss'))
  .filter((f) => f.endsWith('.scss') && !f.startsWith('_'))
  .map((f) => `scss/${f}`).sort();

comprobar('prepros.config compila cada punto de entrada sin minificar ni prefijar', () => {
  const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, 'prepros.config'), 'utf8')).config;
  const malos = [];
  for (const t of cfg.fileTypes.sass.tasks) {
    if (['minify-css', 'autoprefixer'].includes(t.task) && t.enable) malos.push(`tipo .scss: ${t.task} activado por defecto`);
  }
  const porFichero = new Map((cfg.files || []).map((f) => [f.file, f.config?.tasks || {}]));
  for (const e of entradas) {
    const t = porFichero.get(e);
    if (!t) { malos.push(`${e} no está en prepros.config`); continue; }
    for (const k of ['minify-css', 'autoprefixer']) if (!t[k] || t[k].enable !== false) malos.push(`${e}: ${k} no está desactivado`);
  }
  for (const f of porFichero.keys()) if (!fs.existsSync(path.join(ROOT, f))) malos.push(`prepros.config cita ${f}, que no existe`);
  if (malos.length) throw new Error(malos.join(' · '));
  return `${entradas.length} puntos de entrada · expandido, sin autoprefixer`;
});

comprobar('build:css es solo Sass', () => {
  const b = require(path.join(ROOT, 'package.json')).scripts['build:css'];
  if (/postcss|autoprefixer/.test(b)) throw new Error(`build:css pasa por postcss: «${b}». Prepros no lo hace y el CSS saldría distinto`);
  return b.split('&&')[0].trim();
});

comprobar('las páginas enlazan solo hojas compiladas desde scss/', () => {
  const malos = [];
  let n = 0;
  for (const p of fs.readdirSync(ROOT).filter((f) => f.endsWith('.html'))) {
    const html = fs.readFileSync(path.join(ROOT, p), 'utf8');
    const hojas = new Set([
      ...[...html.matchAll(/<link[^>]+href="([^"]+\.css)"/g)].map((m) => m[1]),
      ...[...html.matchAll(/['"]((?:css|dist)\/[^'"]+\.css)['"]/g)].map((m) => m[1]),
    ]);
    for (const h of hojas) {
      if (/^https?:/.test(h)) continue;
      n++;
      const m = /^css\/([^/]+)\.css$/.exec(h);
      if (!m) { malos.push(`${p} enlaza ${h}, que no está en css/`); continue; }
      if (!entradas.includes(`scss/${m[1]}.scss`)) malos.push(`${p} enlaza ${h}, sin punto de entrada scss/${m[1]}.scss`);
      if (!fs.existsSync(path.join(ROOT, h))) malos.push(`${p} enlaza ${h}, que no existe (compila scss/)`);
    }
  }
  if (malos.length) throw new Error(malos.join(' · '));
  return `${n} enlaces, todos a css/ desde un punto de entrada`;
});

comprobar('el comparador normalizado distingue formato de contenido', () => {
  const a = '@charset "UTF-8";\n/* x */\n:root {\n  --a: 0.5rem;\n  --b: rgba(0, 0, 0, 0.1);\n}\n.c > .d,\n.e {\n  color: #FFF;\n}\n';
  const formato = ':root{--a:.5rem;--b:rgba(0,0,0,.1)}.c>.d,.e{color:#fff}';
  const valor = ':root{--a:.6rem;--b:rgba(0,0,0,.1)}.c>.d,.e{color:#fff}';
  if (normalizar(a) !== normalizar(formato)) throw new Error('un cambio solo de formato se ve distinto');
  if (normalizar(a) === normalizar(valor)) throw new Error('un valor distinto se ve igual');
  return 'formato igual · valor distinto';
});

console.log('\n── PREPROS, NPM Y LAS PÁGINAS ──────────────────────────────────\n');
let fallos = 0;
for (const c of casos) {
  try { console.log(`✅ ${c.nombre} — ${c.fn()}`); } catch (e) { fallos++; console.log(`❌ ${c.nombre}\n     ${e.message}`); }
}
console.log(`\n   ${casos.length - fallos}/${casos.length} comprobaciones\n`);
process.exitCode = fallos ? 1 : 0;
