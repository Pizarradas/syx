#!/usr/bin/env node
/**
 * SYX — Una sola escala de breakpoints
 * ────────────────────────────────────
 * Plan de mejora 2026-11, paso 2. Hasta la 5.1 convivían tres escalas: los
 * primitivos (37,5 / 48 / 64 / 80 / 90em), el mapa con nombre del mixin
 * `breakpoint()` (tablet 50em, desktop 70em) y literales sueltos (861px en el
 * Theme Builder). Una página cambiaba de layout a 768px por la rejilla y otra
 * vez a 800px por el app-shell.
 *
 * Comprueba:
 *   1. En el CSS compilado de css/, toda media query de anchura usa un valor
 *      de la escala de tokens/primitives/_breakpoints.scss.
 *   2. En scss/, fuera de esa escala y del mixin, nadie escribe un breakpoint
 *      literal: `min-screen(48em)`, `@media (min-width: 768px)`…
 *   3. El mapa con nombre de _media-queries.scss solo lee esa escala.
 *
 * Uso: node scripts/check-breakpoints.js   ·   npm run check:breakpoints
 */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const ESCALA = path.join(ROOT, 'scss', 'abstracts', 'tokens', 'primitives', '_breakpoints.scss');
const MIXIN = path.join(ROOT, 'scss', 'abstracts', 'mixins', '_media-queries.scss');
const errores = [];

const escala = new Set([...fs.readFileSync(ESCALA, 'utf8').matchAll(/^\$token-breakpoint-[a-z]+:\s*([\d.]+em)\s*;/gm)].map((m) => m[1]));
if (escala.size < 4) errores.push(`la escala de ${path.relative(ROOT, ESCALA)} tiene ${escala.size} valores: ¿ha cambiado su formato?`);

// 1 · El CSS compilado
let consultas = 0;
for (const f of fs.readdirSync(path.join(ROOT, 'css')).filter((x) => x.endsWith('.css')).sort()) {
  const css = fs.readFileSync(path.join(ROOT, 'css', f), 'utf8');
  for (const m of css.matchAll(/@media[^{]*?\((?:min|max)-width:\s*([\d.]+[a-z]+)\)/g)) {
    consultas++;
    if (!escala.has(m[1])) errores.push(`css/${f}: @media con ${m[1]}, fuera de la escala (${[...escala].join(', ')})`);
  }
}

// 2 · Literales en el SCSS
function scssDe(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? scssDe(p) : e.name.endsWith('.scss') ? [p] : [];
  });
}
for (const f of scssDe(path.join(ROOT, 'scss'))) {
  if (f === ESCALA || f === MIXIN) continue;
  const lineas = fs.readFileSync(f, 'utf8').split('\n');
  lineas.forEach((l, i) => {
    const sinComentario = l.replace(/\/\/.*$/, '');
    if (/\b(min-screen|max-screen|screen)\(\s*[\d.]+[a-z]+/.test(sinComentario)
      || /@media[^{]*\((?:min|max)-width:\s*[\d.]+[a-z]+/.test(sinComentario)) {
      errores.push(`${path.relative(ROOT, f).replace(/\\/g, '/')}:${i + 1} breakpoint literal: usa breakpoint(sm|md|lg|xl|xxl) o $token-breakpoint-*`);
    }
  });
}

// 3 · El mapa con nombre
const mixin = fs.readFileSync(MIXIN, 'utf8');
const mapa = /\$syx-breakpoints:\s*\(([\s\S]*?)\)\s*!default/.exec(mixin);
if (!mapa) errores.push('no se encuentra $syx-breakpoints en _media-queries.scss');
else {
  for (const m of mapa[1].matchAll(/'([\w-]+)':\s*\((?:min|max)-width:\s*([^)]+)\)/g)) {
    if (!/^bp\.\$token-breakpoint-[a-z]+$/.test(m[2].trim())) errores.push(`_media-queries.scss: '${m[1]}' vale ${m[2].trim()}, no un token de la escala`);
  }
}

if (errores.length) {
  console.error(`❌ check:breakpoints — ${errores.length} problema(s):\n${errores.map((e) => `   · ${e}`).join('\n')}`);
  process.exit(1);
}
console.log(`✓ check:breakpoints — ${consultas} media queries en css/, todas en la escala ${[...escala].join(' · ')}`);
