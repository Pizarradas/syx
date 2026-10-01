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
 *      prepros.config, sin autoprefixer (lo que haga el fichero, o su tipo
 *      por defecto), y todos se minifican o ninguno. Minificar lo decide
 *      quien mantiene SYX (desde octubre de 2026, sí); el minificador de
 *      Prepros solo cambia formato, y check-limpio compara normalizado.
 *   2. build:css es scripts/build-css.js: Sass sin postcss, que no reescribe
 *      una hoja que ya significa lo mismo (no ensucia el árbol de quien
 *      compila con Prepros).
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

comprobar('prepros.config compila cada punto de entrada, sin prefijar y todos igual', () => {
  const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, 'prepros.config'), 'utf8')).config;
  const malos = [];
  const porTipo = Object.fromEntries(cfg.fileTypes.sass.tasks.map((t) => [t.task, !!t.enable]));
  const porFichero = new Map((cfg.files || []).map((f) => [f.file, f.config?.tasks || {}]));
  // Lo que Prepros hace de verdad con un fichero: su ajuste, o el del tipo.
  const efectivo = (e, k) => {
    const t = porFichero.get(e) || {};
    return t[k] && typeof t[k].enable === 'boolean' ? t[k].enable : !!porTipo[k];
  };
  const minifica = new Set();
  for (const e of entradas) {
    if (!porFichero.has(e)) malos.push(`${e} no está en prepros.config`);
    // Sin autoprefixer: npm no lo pasa, y los prefijos que hacen falta van en
    // el SCSS. Con él, Prepros y npm producirían hojas distintas.
    if (efectivo(e, 'autoprefixer')) malos.push(`${e}: autoprefixer activado`);
    minifica.add(efectivo(e, 'minify-css'));
  }
  // Minificar o no es decisión de quien mantiene SYX; mezclar, no.
  if (minifica.size > 1) malos.push('unos puntos de entrada se minifican y otros no');
  // Un fichero que ya no existe no compila nada: Prepros guarda su lista y lo
  // vuelve a escribir al abrir el proyecto, así que se avisa sin fallar.
  const fantasmas = [...porFichero.keys()].filter((f) => !fs.existsSync(path.join(ROOT, f)));
  if (malos.length) throw new Error(malos.join(' · '));
  return `${entradas.length} puntos de entrada · sin autoprefixer · ${[...minifica][0] ? 'minificados' : 'expandidos'}`
    + (fantasmas.length ? ` · aviso: prepros.config recuerda ${fantasmas.join(', ')}, que no existe (inofensivo)` : '');
});

comprobar('build:css compila con Sass y no pisa lo que ya significa lo mismo', () => {
  const b = require(path.join(ROOT, 'package.json')).scripts['build:css'];
  if (/postcss|autoprefixer/.test(b)) throw new Error(`build:css pasa por postcss: «${b}». Prepros no lo hace y el CSS saldría distinto`);
  if (!/scripts\/build-css\.js/.test(b)) throw new Error(`build:css no usa scripts/build-css.js: «${b}»`);
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
  // Lo que hace el minificador de Prepros es formato; lo de dentro de una
  // cadena o de url(), no (auditoría 2026-10 II).
  const iguales = [
    ['a::before,b{x:oklch(0 0 0 / 0.5)}', 'b,a:before{x:oklch(0 0 0/.5)}'],
    ['li:nth-child(1){x:1}@keyframes k{from{x:0}to{x:1}}', 'li:first-child{x:1}@keyframes k{0%{x:0}100%{x:1}}'],
    [':is(a, b) [type="radio"]{x:1}', ':is(a,b) [type=radio]{x:1}'],
  ];
  const distintos = [
    ['a{content:"a  b"}', 'a{content:"a b"}'],
    ['a{background:url(img/0.5x.png)}', 'a{background:url(img/.5x.png)}'],
    ['[title="a , b"]{x:1}', '[title="a,b"]{x:1}'],
    ['a{font-family:"My  Font"}', 'a{font-family:"My Font"}'],
  ];
  for (const [x, y] of iguales) if (normalizar(x) !== normalizar(y)) throw new Error(`se ven distintos y son lo mismo: ${x} · ${y}`);
  for (const [x, y] of distintos) if (normalizar(x) === normalizar(y)) throw new Error(`se ven iguales y son distintos: ${x} · ${y}`);
  return `formato igual · valor distinto · ${iguales.length} equivalencias del minificador · ${distintos.length} cadenas y url() intactas`;
});

console.log('\n── PREPROS, NPM Y LAS PÁGINAS ──────────────────────────────────\n');
let fallos = 0;
for (const c of casos) {
  try { console.log(`✅ ${c.nombre} — ${c.fn()}`); } catch (e) { fallos++; console.log(`❌ ${c.nombre}\n     ${e.message}`); }
}
console.log(`\n   ${casos.length - fallos}/${casos.length} comprobaciones\n`);
process.exitCode = fallos ? 1 : 0;
