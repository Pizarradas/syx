#!/usr/bin/env node
/**
 * SYX — La publicación en Pages se puede montar desde un clon limpio
 * ─────────────────────────────────────────────────────────────────
 * En octubre de 2026 las páginas dejaron de depender de dist/ (que no se
 * versiona), pero pages.yml siguió copiando `dist` al montar el sitio: en un
 * clon, `cp: cannot stat 'dist'` y el despliegue fallaba en silencio para
 * todos los guardianes. Además el disparador solo miraba que la CI hubiera
 * terminado en verde, así que una PR desde un fork con una rama «main» podía
 * desplegar. Comprueba:
 *
 *   1. Cada ruta que copia el paso «Montar el sitio» (salvo los catálogos de
 *      storybook/, que ese mismo workflow construye) está versionada en git.
 *   2. El job de despliegue exige un push del propio repositorio, no solo
 *      una conclusión verde.
 *   3. Cada .html raíz que se publica solo enlaza ficheros versionados.
 *
 * Uso: node scripts/check-pages.js   ·   npm run check:pages
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const WF = path.join(ROOT, '.github/workflows/pages.yml');

const versionados = new Set(
  execFileSync('git', ['ls-files', '-z'], { cwd: ROOT, encoding: 'utf8' })
    .split('\0').filter(Boolean)
);
const estaVersionado = (rel) => {
  const r = rel.replace(/^\.\//, '').replace(/\/$/, '');
  if (versionados.has(r)) return true;
  for (const f of versionados) if (f.startsWith(r + '/')) return true;
  return false;
};
const globARegex = (g) => new RegExp('^' + g.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '[^/]*') + '$');

const fallos = [];
const yml = fs.readFileSync(WF, 'utf8');

// 1. Rutas copiadas por «Montar el sitio».
const paso = yml.split(/\n\s*- name: /).find((b) => b.startsWith('Montar el sitio'));
if (!paso) fallos.push('pages.yml: no encuentro el paso «Montar el sitio»');
else {
  const lineas = paso.split('\n').map((l) => l.trim()).filter((l) => /^cp\s/.test(l));
  for (const l of lineas) {
    const partes = l.split(/\s+/).slice(1).filter((p) => !p.startsWith('-'));
    const fuentes = partes.slice(0, -1);
    for (const f of fuentes) {
      if (f.startsWith('storybook/')) continue; // lo construye el propio workflow
      if (f.includes('*')) {
        const re = globARegex(f);
        if (![...versionados].some((v) => re.test(v))) fallos.push(`pages.yml copia «${f}» y no hay ningún fichero versionado que case`);
      } else if (!estaVersionado(f)) {
        fallos.push(`pages.yml copia «${f}», que no está versionado: en un clon limpio el cp falla`);
      }
    }
  }
}

// 2. El disparador.
const cond = (yml.match(/\n\s{4}if:\s*>?-?\s*\n?([\s\S]*?)\n\s{4}steps:/) || [])[1] || '';
if (!/workflow_run\.event\s*==\s*'push'/.test(cond)) fallos.push("pages.yml: el job no exige github.event.workflow_run.event == 'push'");
if (!/head_repository\.full_name\s*==\s*github\.repository/.test(cond)) fallos.push('pages.yml: el job no exige que el commit venga de este repositorio');

// 3. Lo que enlazan las páginas publicadas.
for (const html of fs.readdirSync(ROOT).filter((f) => f.endsWith('.html'))) {
  const src = fs.readFileSync(path.join(ROOT, html), 'utf8');
  const re = /\b(?:href|src)\s*=\s*["']?([^"'\s>]+)/gi;
  let m;
  while ((m = re.exec(src))) {
    const url = m[1].split(/[?#]/)[0];
    if (!url || /^(?:[a-z]+:|\/\/|#|\$\{|data:)/i.test(url) || url.startsWith('storybook/') || url.startsWith('node_modules/')) continue; // node_modules/: ejemplos para quien consume el paquete
    if (!/\.(?:css|js|mjs|woff2?|svg|png|jpe?g|webp|ico|webmanifest|json)$/i.test(url)) continue;
    if (!estaVersionado(url)) fallos.push(`${html} enlaza «${url}», que no está versionado`);
  }
}

if (fallos.length) {
  console.error('✗ check:pages');
  for (const f of fallos) console.error('  · ' + f);
  process.exit(1);
}
console.log('✓ check:pages — el sitio se monta con lo versionado y solo despliega un push propio');
