#!/usr/bin/env node
/**
 * SYX — Compila css/ desde los puntos de entrada de scss/, sin pisar a Prepros
 * ───────────────────────────────────────────────────────────────────────────
 * Quien mantiene SYX compila con Prepros, minificando (octubre de 2026). npm
 * tiene que poder producir lo mismo —en la CI, en un clon, para quien no usa
 * Prepros— sin que cada `npm run build` reescriba css/ con otro formato y deje
 * el árbol sucio.
 *
 * Así que compila cada punto de entrada (scss/*.scss que no es parcial; nunca
 * los index.scss ni los bundle-* anidados, que no se publican) con dart-sass
 * expandido —la forma canónica: el comprimido de Sass reescribe algunos
 * colores (`oklch(100% 0 0deg)` → `oklch(1 0 0)`) y no se podría comparar con
 * lo que escribe Prepros—, y:
 *   · si la hoja que ya hay en css/ significa lo mismo (scripts/lib/
 *     css-normal.js: mismo contenido, otro formato o el minificador de
 *     Prepros), NO la toca;
 *   · si no existe o significa otra cosa, la escribe.
 * Prepros y npm compilan lo mismo; lo que se commitea es lo que haya
 * escrito cualquiera de los dos, y check-limpio lo compara normalizado.
 *
 * Uso: node scripts/build-css.js   ·   npm run build:css
 */

'use strict';

const fs = require('fs');
const path = require('path');
const sass = require('sass');
const { normalizar } = require('./lib/css-normal');

const ROOT = path.join(__dirname, '..');
const entradas = fs.readdirSync(path.join(ROOT, 'scss'))
  .filter((f) => f.endsWith('.scss') && !f.startsWith('_'))
  .sort();

let escritas = 0, iguales = 0;
for (const f of entradas) {
  const salida = path.join(ROOT, 'css', f.replace(/\.scss$/, '.css'));
  const css = sass.compile(path.join(ROOT, 'scss', f), { style: 'expanded', sourceMap: false }).css + '\n';
  if (fs.existsSync(salida) && normalizar(fs.readFileSync(salida, 'utf8')) === normalizar(css)) { iguales++; continue; }
  fs.mkdirSync(path.dirname(salida), { recursive: true });
  fs.writeFileSync(salida, css);
  escritas++;
  console.log(`   escrita  css/${path.basename(salida)}`);
}
console.log(`✓ build:css — ${entradas.length} puntos de entrada · ${escritas} escrita(s) · ${iguales} ya al día`);
