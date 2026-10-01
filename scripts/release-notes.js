#!/usr/bin/env node
/**
 * SYX — Notas de una versión, sacadas del CHANGELOG
 * ─────────────────────────────────────────────────
 * El CHANGELOG es la única fuente: la release de GitHub copia su sección y no
 * se escribe a mano en otro sitio. Si la versión no tiene sección, falla —
 * publicar una versión sin decir qué cambia es justo lo que esto evita.
 *
 * Con --verificar comprueba además lo que una release exige y que antes nadie
 * miraba (auditoría 2026-10, acción 10): etiquetar `v4.28.0` con cuatro
 * componentes nuevos en [Unreleased] habría publicado las notas de agosto.
 *   · la sección de la versión lleva fecha: «## [x.y.z] — AAAA-MM-DD»;
 *   · [Unreleased] está vacía: lo que se publica está en su sección, no fuera.
 *
 * Uso: node scripts/release-notes.js [versión] [--verificar]
 *      (por defecto, la versión de package.json)
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

// Problemas que impiden publicar `version` con este CHANGELOG.
function verificar(version, changelog) {
  const lineas = changelog.split(/\r?\n/);
  const problemas = [];
  const v = version.replace(/\./g, '\\.');
  const cab = lineas.find((l) => new RegExp(`^## \\[${v}\\]`).test(l));
  if (!cab) problemas.push(`no hay sección «## [${version}]»`);
  else if (!/\d{4}-\d{2}-\d{2}/.test(cab)) problemas.push(`la sección de ${version} no tiene fecha: «${cab.trim()}»`);
  const ini = lineas.findIndex((l) => /^## \[Unreleased\]/i.test(l));
  if (ini !== -1) {
    let fin = lineas.findIndex((l, i) => i > ini && /^## \[/.test(l));
    if (fin === -1) fin = lineas.length;
    const resto = lineas.slice(ini + 1, fin).filter((l) => l.trim() && !/^-{3,}$/.test(l.trim()));
    if (resto.length) problemas.push(`[Unreleased] tiene ${resto.length} línea(s): muévelas a la sección de ${version} antes de etiquetar`);
  }
  return problemas;
}

module.exports = { notas, verificar };

if (require.main === module) {
  const args = process.argv.slice(2);
  const version = args.find((a) => !a.startsWith('--')) || require(path.join(ROOT, 'package.json')).version;
  const changelog = fs.readFileSync(path.join(ROOT, 'CHANGELOG.md'), 'utf8');
  if (args.includes('--verificar')) {
    const problemas = verificar(version, changelog);
    if (problemas.length) {
      for (const p of problemas) console.error(`❌ ${p}`);
      process.exit(1);
    }
  }
  const texto = notas(version, changelog);
  if (!texto) {
    console.error(`❌ CHANGELOG.md no tiene sección «## [${version}]». Escríbela antes de etiquetar.`);
    process.exit(1);
  }
  process.stdout.write(texto + '\n');
}
