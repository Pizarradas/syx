#!/usr/bin/env node
/**
 * SYX — Notas de una versión, sacadas del CHANGELOG
 * ─────────────────────────────────────────────────
 * El CHANGELOG es la única fuente: la release de GitHub copia su sección y no
 * se escribe a mano en otro sitio. Si la versión no tiene sección, falla —
 * publicar una versión sin decir qué cambia es justo lo que esto evita.
 *
 * Uso: node scripts/release-notes.js [versión]   (por defecto, la de package.json)
 */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

function notas(version, changelog) {
  const lineas = changelog.split(/\r?\n/);
  const cabecera = new RegExp(`^## \\[${version.replace(/\./g, '\\.')}\\]`);
  const inicio = lineas.findIndex((l) => cabecera.test(l));
  if (inicio === -1) return null;
  let fin = lineas.findIndex((l, i) => i > inicio && /^## \[/.test(l));
  if (fin === -1) fin = lineas.length;
  return lineas.slice(inicio + 1, fin).join('\n').replace(/\n-{3,}\s*$/, '').trim();
}

module.exports = { notas };

if (require.main === module) {
  const version = process.argv[2] || require(path.join(ROOT, 'package.json')).version;
  const texto = notas(version, fs.readFileSync(path.join(ROOT, 'CHANGELOG.md'), 'utf8'));
  if (!texto) {
    console.error(`❌ CHANGELOG.md no tiene sección «## [${version}]». Escríbela antes de etiquetar.`);
    process.exit(1);
  }
  process.stdout.write(texto + '\n');
}
