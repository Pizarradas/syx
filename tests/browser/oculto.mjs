#!/usr/bin/env node
/**
 * SYX — El atributo `hidden` oculta cualquier componente
 * ──────────────────────────────────────────────────────
 * Hasta octubre de 2026 `[hidden]{display:none}` vivía en @layer syx.reset y
 * perdía frente al display de las capas de componentes: 31 de 42 clases lo
 * ignoraban y un `<div class="mol-alert" hidden>` salía visible (auditoría
 * 2026-10 II). Ahora es el único !important del sistema (base/_hidden.scss).
 *
 * Comprueba, en cada hoja que se publica:
 *   1. Cada clase de componente que define el CSS (atom-, mol-, org-, layout-
 *      y las utilidades syx-), sola y con cada uno de sus modificadores, sobre
 *      un elemento con `hidden`, da display:none.
 *   2. El marcado de `usage` de cada componente del registro, con `hidden` en
 *      su raíz, da display:none.
 *   3. `hidden="until-found"` no se fuerza a display:none (el navegador lo
 *      oculta con content-visibility para que la búsqueda lo encuentre).
 *
 * Uso (desde la raíz, con el CSS compilado):
 *   SYX_CHROMIUM=/ruta/a/chromium node tests/browser/oculto.mjs
 */

import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(AQUI, '../..');
const registro = JSON.parse(fs.readFileSync(path.join(ROOT, 'component-registry.json'), 'utf8'));
const usos = ['atoms', 'molecules', 'organisms'].flatMap((k) => registro[k] || [])
  .filter((c) => c.usage).map((c) => ({ nombre: c.name, html: c.usage }));

// Las hojas que se publican: las del sitio y, si se ha construido, el core del
// paquete (no lleva utilidades, así que es donde un [hidden] en otra capa
// fallaría).
const hojas = ['css/styles-theme-syx-sketch.css', 'css/styles-theme-example-01.css'];
for (const f of ['dist/example-01.core.min.css', 'dist/example-01.full.min.css']) {
  if (fs.existsSync(path.join(ROOT, f))) hojas.push(f);
}

const TIPOS = { '.css': 'text/css', '.js': 'text/javascript', '.woff2': 'font/woff2', '.svg': 'image/svg+xml' };
const srv = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://x');
  if (url.pathname === '/__oculto') {
    const hoja = url.searchParams.get('hoja');
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    return res.end(`<!doctype html><html lang="en"><head><meta charset="utf-8"><link rel="stylesheet" href="/${hoja}"></head><body class="syx"><main id="m"></main></body></html>`);
  }
  const f = path.join(ROOT, decodeURIComponent(url.pathname));
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': TIPOS[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
});
await new Promise((ok) => srv.listen(0, '127.0.0.1', ok));
const base = `http://127.0.0.1:${srv.address().port}`;

const navegador = await chromium.launch(process.env.SYX_CHROMIUM ? { executablePath: process.env.SYX_CHROMIUM } : {});
const page = await navegador.newPage();

console.log('\n── SYX · [hidden] OCULTA ──────────────────────────────────────\n');
let fallos = 0;
for (const hoja of hojas) {
  const css = fs.readFileSync(path.join(ROOT, hoja), 'utf8');
  const clases = new Set();
  for (const m of css.matchAll(/\.((?:atom|mol|org|layout|syx)-[a-z0-9_-]+)/g)) {
    const c = m[1];
    const i = c.indexOf('--');
    if (i > 0) clases.add(`${c.slice(0, i)} ${c}`); // el modificador va con su bloque
    else clases.add(c);
  }
  await page.goto(`${base}/__oculto?hoja=${encodeURIComponent(hoja)}`);
  const r = await page.evaluate(({ clases, usos }) => {
    const m = document.getElementById('m');
    const malas = [];
    for (const c of clases) {
      for (const tag of ['div', 'span', 'button', 'a', 'ul']) {
        const e = document.createElement(tag);
        e.className = c;
        e.hidden = true;
        m.append(e);
        const d = getComputedStyle(e).display;
        e.remove();
        if (d !== 'none') { malas.push(`<${tag} class="${c}" hidden> → display:${d}`); break; }
      }
    }
    for (const u of usos) {
      m.innerHTML = u.html;
      const raiz = m.firstElementChild;
      if (!raiz) continue;
      raiz.hidden = true;
      const d = getComputedStyle(raiz).display;
      if (d !== 'none') malas.push(`usage de ${u.nombre} con hidden → display:${d}`);
    }
    m.innerHTML = '<div class="mol-alert" hidden="until-found">x</div>';
    const hasta = getComputedStyle(m.firstElementChild).display;
    m.innerHTML = '';
    return { malas, hasta, n: clases.length };
  }, { clases: [...clases], usos });
  const problemas = [...r.malas];
  if (r.hasta === 'none') problemas.push('hidden="until-found" queda en display:none: la búsqueda en la página no lo encontraría');
  if (problemas.length) {
    fallos++;
    console.log(`❌ ${hoja} — ${problemas.length} casos\n     ${problemas.slice(0, 15).join('\n     ')}`);
  } else {
    console.log(`✅ ${hoja} — ${r.n} clases y modificadores, ${usos.length} usages`);
  }
}
console.log(`\n   ${hojas.length - fallos}/${hojas.length} hojas\n`);
await navegador.close();
srv.close();
process.exitCode = fallos ? 1 : 0;
