#!/usr/bin/env node
/**
 * SYX — Los workflows no ejecutan código que pueda cambiar sin revisión
 * ─────────────────────────────────────────────────────────────────────
 * Auditoría 2026-11, F0-05 y F0-06. Comprueba sobre .github/:
 *
 *   1. Cada `uses:` va fijado a un SHA de 40 caracteres con su versión en un
 *      comentario (`@<sha> # v4.4.0`). Una etiqueta (`@v4`) la puede mover
 *      quien controla la action, y el trabajo ejecutaría otro código con sus
 *      permisos y sus secretos.
 *   2. Dependabot vigila `github-actions`, para que fijar no sea congelar.
 *   3. Toda CLI que se instala con `npm install -g` lleva versión.
 *   4. release.yml: sin permisos por defecto, y el trabajo que publica en
 *      npm no hace checkout ni `npm ci` (ninguna devDependency se ejecuta con
 *      permiso de publicar), no usa token guardado (OIDC) y publica el .tgz
 *      de la release con --ignore-scripts.
 *
 * Uso: node scripts/check-acciones.js   ·   npm run check:acciones
 */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const WF = path.join(ROOT, '.github', 'workflows');
const errores = [];

const workflows = fs.readdirSync(WF).filter((f) => /\.ya?ml$/.test(f)).sort();
let usos = 0;
for (const f of workflows) {
  const lineas = fs.readFileSync(path.join(WF, f), 'utf8').split(/\r?\n/);
  lineas.forEach((l, i) => {
    const u = /^\s*-?\s*uses:\s*([^\s#]+)\s*(#\s*(\S+))?/.exec(l);
    if (u) {
      usos++;
      if (u[1].startsWith('./')) return; // action local: es código del repo
      const [, ref] = u[1].split('@');
      if (!/^[0-9a-f]{40}$/.test(ref || '')) errores.push(`${f}:${i + 1} ${u[1]} no va fijada a un SHA`);
      else if (!u[3]) errores.push(`${f}:${i + 1} ${u[1]} sin la versión en un comentario (# vX.Y.Z)`);
    }
    const g = /npm (?:install|i) -g\s+(\S+)/.exec(l);
    if (g && !/^(@[^/]+\/)?[^@]+@\d/.test(g[1])) errores.push(`${f}:${i + 1} npm install -g ${g[1]} sin versión`);
  });
}

const dependabot = path.join(ROOT, '.github', 'dependabot.yml');
if (!fs.existsSync(dependabot) || !/package-ecosystem:\s*['"]?github-actions/.test(fs.readFileSync(dependabot, 'utf8'))) {
  errores.push('.github/dependabot.yml no vigila github-actions');
}

// ─── release.yml ─────────────────────────────────────────────────────────────
const release = fs.readFileSync(path.join(WF, 'release.yml'), 'utf8');
if (!/^permissions:\s*\{\s*\}\s*$/m.test(release)) errores.push('release.yml: los permisos por defecto no están vacíos (`permissions: {}`)');
const inicio = release.search(/^ {2}npm:\s*$/m);
if (inicio === -1) errores.push('release.yml: no hay trabajo `npm`');
else {
  const resto = release.slice(inicio + 1);
  const fin = resto.search(/^ {2}[\w-]+:\s*$/m);
  const npm = fin === -1 ? resto : resto.slice(0, fin);
  if (/actions\/checkout@/.test(npm)) errores.push('release.yml: el trabajo `npm` hace checkout del repositorio');
  if (/\bnpm (ci|install)\b/.test(npm)) errores.push('release.yml: el trabajo `npm` instala dependencias');
  if (/NPM_TOKEN|NODE_AUTH_TOKEN/.test(npm)) errores.push('release.yml: el trabajo `npm` usa un token guardado (debe ser OIDC)');
  if (!/id-token:\s*write/.test(npm)) errores.push('release.yml: el trabajo `npm` no pide id-token: write (OIDC)');
  const pub = /npm publish\s+([^\n]+)/.exec(npm);
  if (!pub) errores.push('release.yml: el trabajo `npm` no publica');
  else {
    if (!/\.tgz|\$\{?TGZ/.test(pub[1])) errores.push('release.yml: `npm publish` no publica el .tgz de la release');
    if (!/--ignore-scripts/.test(pub[1])) errores.push('release.yml: `npm publish` sin --ignore-scripts');
  }
  if (!/sha256sum -c/.test(npm)) errores.push('release.yml: el trabajo `npm` no comprueba el sha256 del .tgz');
}

if (errores.length) {
  console.error(`❌ check:acciones — ${errores.length} problema(s):\n${errores.map((e) => `   · ${e}`).join('\n')}`);
  process.exit(1);
}
console.log(`✓ check:acciones — ${workflows.length} workflows · ${usos} uses: fijados por SHA · release con permisos mínimos`);
