#!/usr/bin/env node
/**
 * SYX — Capturas de las páginas del sitio
 * ───────────────────────────────────────
 * run.mjs fotografía los componentes del registro sobre una página de pruebas;
 * esto fotografía las PÁGINAS de verdad (home, docs, why-syx, theme-builder)
 * tal como las sirve el sitio, por tema y por modo, de arriba abajo.
 *
 * POR QUÉ EXISTE
 * Auditoría de octubre de 2026, acción 12: las páginas dejan de cargar
 * css/styles-theme-*.css (406 KB sin minificar, todo el sistema por tema) y
 * pasan a cargar las piezas de dist/ (componentes compartidos + tokens del
 * tema, podados). Un cambio así solo se puede dar por bueno si las páginas
 * pintan EXACTAMENTE lo mismo antes y después, y eso se ve en píxeles, no
 * leyendo CSS. Con --raiz se fotografía otro árbol (la rama base, o una copia
 * del árbol antes del cambio) con este mismo guion, y comparar.mjs --exacto
 * enfrenta las dos series.
 *
 * Las peticiones a otros orígenes (el vídeo y la imagen de ejemplo de
 * docs.html) se cortan: dependen de la red y harían que dos series de la
 * misma página no fueran comparables. Solo cuentan como fallo las propias.
 *
 * El tema y el modo se eligen como los elige quien visita: sessionStorage
 * (`syx-theme`, `syx-dark`) antes de cargar, y el JS de la página cambia la
 * hoja. Así se prueba también el selector de tema, no solo la hoja por defecto.
 *
 * Uso (desde la raíz del repositorio, con el CSS y dist/ generados):
 *   node tests/browser/paginas.mjs --capturas DIR [--temas a,b] [--paginas home,docs]
 *                                  [--raiz ../otro-arbol]
 * (Auditoría 2026-10 · acción 12)
 */

import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const arg = (n) => { const i = args.indexOf(n); return i === -1 ? null : args[i + 1] || ''; };
const ROOT = arg('--raiz') ? path.resolve(arg('--raiz')) : path.resolve(AQUI, '../..');
const dirCapturas = arg('--capturas');
if (!dirCapturas) {
  console.error('Uso: node paginas.mjs --capturas DIR [--temas a,b] [--paginas home,docs] [--raiz DIR]');
  process.exit(2);
}
const TEMAS = (arg('--temas') || 'syx-sketch,example-01,example-02,example-03,example-04,example-05,example-06').split(',').filter(Boolean);
const PAGINAS = (arg('--paginas') || 'home,docs,why-syx,theme-builder').split(',').filter(Boolean);
const MODOS = ['light', 'dark'];

const TIPOS = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon', '.json': 'application/json', '.webmanifest': 'application/manifest+json' };

function servir() {
  const srv = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://x');
    const f = path.join(ROOT, decodeURIComponent(url.pathname));
    if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'content-type': TIPOS[path.extname(f)] || 'application/octet-stream' });
    fs.createReadStream(f).pipe(res);
  });
  return new Promise((ok) => srv.listen(0, '127.0.0.1', () => ok(srv)));
}

const ALTO = 800;

async function porTramos(page, dir) {
  const total = await page.evaluate(() => document.documentElement.scrollHeight);
  fs.mkdirSync(dir, { recursive: true });
  let n = 0;
  for (let y = 0; y < total; y += ALTO, n++) {
    // El último tramo se alinea con el final de la página: la ventana no
    // puede bajar más, así que repite parte del anterior. Da igual: las dos
    // series repiten lo mismo.
    await page.evaluate((top) => new Promise((ok) => {
      window.scrollTo(0, top);
      requestAnimationFrame(() => requestAnimationFrame(ok));
    }), Math.min(y, Math.max(0, total - ALTO)));
    await page.screenshot({ path: path.join(dir, `${String(n).padStart(4, '0')}.png`), animations: 'disabled', caret: 'hide' });
  }
  return n;
}

const srv = await servir();
const base = `http://127.0.0.1:${srv.address().port}`;
const navegador = await chromium.launch(process.env.SYX_CHROMIUM ? { executablePath: process.env.SYX_CHROMIUM } : {});
let capturas = 0;
let tramos = 0;
const rotas = [];

for (const pagina of PAGINAS) {
  // theme-builder no tiene selector de tema: se pinta con su propia hoja.
  const temas = pagina === 'theme-builder' ? ['builder'] : TEMAS;
  for (const tema of temas) {
    for (const modo of MODOS) {
      const ctx = await navegador.newContext({ viewport: { width: 1280, height: ALTO }, deviceScaleFactor: 1, reducedMotion: 'reduce', colorScheme: modo });
      await ctx.addInitScript(([t, m]) => {
        try {
          if (t !== 'builder') sessionStorage.setItem('syx-theme', t);
          sessionStorage.setItem('syx-dark', m === 'dark' ? '1' : '0');
        } catch (e) { /* sin storage: el modo sale de colorScheme */ }
      }, [tema, modo]);
      await ctx.route('**/*', (r) => (r.request().url().startsWith(base) ? r.continue() : r.abort()));
      const page = await ctx.newPage();
      page.on('response', (r) => { if (r.status() >= 400) rotas.push(`${r.status()} ${r.url()}`); });
      page.on('requestfailed', (r) => { if (r.url().startsWith(base)) rotas.push(`falló ${r.url()}`); });
      await page.goto(`${base}/${pagina}.html`, { waitUntil: 'networkidle' });
      await page.evaluate(() => document.fonts.ready);
      const dir = path.resolve(process.cwd(), dirCapturas, pagina);
      fs.mkdirSync(dir, { recursive: true });
      // Por tramos del alto de la ventana, uno por fichero. La
      // captura de página completa (fullPage) de docs.html mide más de 100 000
      // px y Chromium la compone por teselas: entre dos ejecuciones de la
      // MISMA hoja devolvía a veces alguna sin pintar (media línea de texto),
      // y ni repitiéndola hasta tener dos iguales seguidas se estabilizaba.
      // Desplazar la ventana y capturar lo visible sí da los mismos bytes.
      // La cabecera sticky sale en cada tramo: igual en las dos series.
      // (Un solo PNG cosido de docs.html pesaba 600 MB en memoria.)
      tramos += await porTramos(page, path.join(dir, `${tema}-${modo}`));
      capturas++;
      await ctx.close();
    }
  }
}

await navegador.close();
srv.close();
console.log(`\n   ${capturas} capturas de página (${tramos} tramos de ${ALTO} px) en ${dirCapturas}/`);
if (rotas.length) {
  console.log(`\n❌ ${rotas.length} petición(es) fallida(s):\n   ${[...new Set(rotas)].slice(0, 10).join('\n   ')}`);
  process.exitCode = 1;
}
console.log('');
