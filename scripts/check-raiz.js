#!/usr/bin/env node
/**
 * SYX — La fuente raíz respeta la preferencia del usuario
 * ───────────────────────────────────────────────────────
 * Auditoría 2026-11, F0-09. `html { font: … 16px/18px … }` fijaba el rem en
 * 16 px para todo el mundo: quien sube el tamaño de letra del navegador a 20 px
 * (lo hace mucha gente con baja visión) no veía cambiar nada, porque todo SYX
 * se mide en rem desde esa raíz. Y un interlineado en px no crece con la letra.
 *
 * Comprueba en el CSS compilado de css/ que cada `--reset-html-font` y cada
 * `font`/`font-size` de `html` o `:root` da el tamaño en % (o rem/em) y el
 * interlineado sin unidad.
 *
 * Uso: node scripts/check-raiz.js   ·   npm run check:raiz
 */

'use strict';

const fs = require('fs');
const path = require('path');
const postcss = require('postcss');

const ROOT = path.join(__dirname, '..');
const CSS_DIR = path.join(ROOT, 'css');
const errores = [];
let vistas = 0;

/** Del atajo `font`: «tamaño/interlineado», el primer token con barra o con unidad de tamaño. */
function tamañoEInterlineado(valor) {
  const m = /(?:^|\s)([\d.]+[a-z%]*)(?:\/([\d.]+[a-z%]*))?\s+(?=["'a-z-]|var\()/i.exec(valor.replace(/^\s*(normal|italic|oblique)\s+(normal|small-caps)?\s*\d{3}\s+/i, ' '));
  return m ? { tamaño: m[1], interlineado: m[2] } : null;
}

for (const f of fs.readdirSync(CSS_DIR).filter((x) => x.endsWith('.css')).sort()) {
  postcss.parse(fs.readFileSync(path.join(CSS_DIR, f), 'utf8')).walkDecls((d) => {
    const raiz = d.parent && d.parent.selector && /^(html|:root)$/.test(d.parent.selector.trim());
    let valor = null;
    if (d.prop === '--reset-html-font') valor = d.value;
    else if (raiz && d.prop === 'font' && !/var\(/.test(d.value)) valor = d.value;
    else if (raiz && d.prop === 'font-size') {
      vistas++;
      if (/px\b/.test(d.value)) errores.push(`${f}: ${d.parent.selector} { font-size: ${d.value} } en px`);
      return;
    }
    if (valor === null) return;
    vistas++;
    const t = tamañoEInterlineado(valor);
    if (!t) { errores.push(`${f}: ${d.prop} no se puede leer: ${valor}`); return; }
    if (!/(%|r?em)$/.test(t.tamaño)) errores.push(`${f}: ${d.prop} da el tamaño en ${t.tamaño}: usa % (100% = la preferencia del navegador)`);
    if (t.interlineado && !/^[\d.]+$/.test(t.interlineado)) errores.push(`${f}: ${d.prop} da el interlineado en ${t.interlineado}: sin unidad, para que crezca con la letra`);
  });
}

if (!vistas) errores.push('no se encontró ninguna fuente raíz que medir: ¿ha cambiado el reset?');
if (errores.length) {
  console.error(`❌ check:raiz — ${errores.length} problema(s):\n${[...new Set(errores)].map((e) => `   · ${e}`).join('\n')}`);
  process.exit(1);
}
console.log(`✓ check:raiz — ${vistas} declaraciones de la fuente raíz en %, con interlineado sin unidad`);
