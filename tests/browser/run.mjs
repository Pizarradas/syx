#!/usr/bin/env node
/**
 * SYX — Pruebas en navegador
 * ──────────────────────────
 * Hasta la auditoría de septiembre de 2026, nada de SYX se había probado en un
 * navegador: `tests/` estaba vacía y el contraste se medía en una hoja de
 * cálculo de tokens, no en píxeles. Esto monta una página por tema y modo con
 * TODOS los componentes, tal como el registro dice que se usan (`usage`), y:
 *
 *   --axe            pasa axe-core (WCAG 2.2 A y AA) y falla si hay violaciones
 *                    que no estén justificadas en axe-excepciones.json
 *   --capturas DIR   guarda una captura por componente, tema y modo en DIR,
 *                    para que comparar.mjs la enfrente con otra rama
 *
 * La página se construye desde component-registry.json: un componente nuevo
 * entra en las pruebas el día que entra en el registro, sin tocar este fichero.
 *
 * Uso (desde la raíz del repositorio, con el CSS compilado):
 *   cd tests/browser && npm ci && npx playwright install chromium
 *   node run.mjs --axe
 *   node run.mjs --capturas out [--temas syx-sketch,example-01] [--raiz ../otro-arbol]
 *
 * (Auditoría 2026-09 · acción 17)
 */

import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { chromium } from 'playwright';

const require = createRequire(import.meta.url);
const AQUI = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const arg = (n) => { const i = args.indexOf(n); return i === -1 ? null : args[i + 1] || ''; };
// --raiz: fotografiar OTRO árbol (la rama base, en la CI) con este mismo
// arnés, para que las dos series de capturas salgan de la misma página.
const ROOT = arg('--raiz') ? path.resolve(arg('--raiz')) : path.resolve(AQUI, '../..');

const registro = JSON.parse(fs.readFileSync(path.join(ROOT, 'component-registry.json'), 'utf8'));
const componentes = ['atoms', 'molecules', 'organisms'].flatMap((k) => registro[k].filter((c) => c.usage));
const temas = (arg('--temas') || fs.readdirSync(path.join(ROOT, 'css'))
  .filter((f) => /^styles-theme-.*\.css$/.test(f))
  .map((f) => f.replace(/^styles-theme-|\.css$/g, ''))
  .join(',')).split(',').filter(Boolean).sort();
const MODOS = ['light', 'dark'];

// ─── La página de pruebas ────────────────────────────────────────────────────

function pagina(tema, modo) {
  const secciones = componentes.map((c) => `
    <section class="prueba" data-componente="${c.name}" aria-label="${c.name}">
      ${c.usage}
    </section>`).join('\n');
  return `<!doctype html>
<html lang="es" data-theme="${modo}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>SYX · ${tema} · ${modo}</title>
  <link rel="stylesheet" href="/css/styles-theme-${tema}.css">
  <style>
    /* Solo el andamio de la página de pruebas: separa las secciones para
       que cada captura recorte un componente y nada más. */
    body { margin: 0; padding: 24px; background: var(--semantic-color-bg-primary); }
    .prueba { display: flow-root; padding: 16px; margin: 0 0 16px; max-width: 720px; }
    /* Los diálogos llegan cerrados (su usage no lleva \`open\`: se abren
       con showModal()). Aquí se abren con show(), que es la misma apertura
       sin capa superior ni página inerte, y se dejan en el flujo para que
       axe los recorra y cada uno tenga su captura junto a los demás. */
    dialog[open] { position: static; margin: 0; }
  </style>
</head>
<body class="syx">
  <main>
${secciones}
  </main>
  <script>for (const d of document.querySelectorAll('dialog:not([open])')) d.show();</script>
${['syx-tabs', 'syx-site-nav'].filter((j) => fs.existsSync(path.join(ROOT, `js/${j}.js`))).map((j) => `  <script type="module" src="/js/${j}.js"></script>`).join('\n')}
</body>
</html>`;
}

// ─── Un servidor estático mínimo sobre la raíz ───────────────────────────────

const TIPOS = { '.css': 'text/css', '.js': 'text/javascript', '.woff2': 'font/woff2', '.woff': 'font/woff', '.svg': 'image/svg+xml', '.png': 'image/png' };

function servir() {
  const srv = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://x');
    const m = url.pathname.match(/^\/__prueba\/([a-z0-9-]+)\/(light|dark)$/);
    if (m) { res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); return res.end(pagina(m[1], m[2])); }
    const f = path.join(ROOT, decodeURIComponent(url.pathname));
    if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'content-type': TIPOS[path.extname(f)] || 'application/octet-stream' });
    fs.createReadStream(f).pipe(res);
  });
  return new Promise((ok) => srv.listen(0, '127.0.0.1', () => ok(srv)));
}

// ─── axe ─────────────────────────────────────────────────────────────────────

// Una excepción acota un fallo concreto, no una familia: regla, componente,
// selector, temas, razón medida (para contraste) y caducidad. Hasta octubre de
// 2026 bastaban regla y componente, y 50 violaciones vivían bajo cinco
// entradas sin fecha. La que no trae todo, o ya caducó, para la ejecución.
const excepciones = JSON.parse(fs.readFileSync(path.join(AQUI, 'axe-excepciones.json'), 'utf8')).excepciones;
const hoy = new Date().toISOString().slice(0, 10);
for (const e of excepciones) {
  const falta = ['regla', 'componente', 'selector', 'temas', 'caduca', 'porque']
    .concat(e.regla === 'color-contrast' ? ['ratioMinima'] : [])
    .filter((k) => !e[k]);
  if (falta.length) { console.error(`❌ axe-excepciones.json: a una excepción le falta ${falta.join(', ')}.`); process.exit(2); }
  if (e.caduca < hoy) { console.error(`❌ axe-excepciones.json: la excepción de ${e.componente} (${e.selector}) caducó el ${e.caduca}.`); process.exit(2); }
}
const exceptuada = (v) => excepciones.some((e) =>
  e.regla === v.regla &&
  e.componente === v.componente &&
  v.objetivo.includes(e.selector) &&
  e.temas.includes(`${v.tema}/${v.modo}`) &&
  // La razón medida es un suelo: si empeora, deja de estar cubierta.
  (e.ratioMinima === undefined || ((/contrast of ([\d.]+)/.exec(v.resumen) || [])[1] ?? 0) >= e.ratioMinima));

async function axe(page) {
  await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });
  return page.evaluate(async () => {
    const r = await window.axe.run(document, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] },
      resultTypes: ['violations'],
    });
    return r.violations.flatMap((v) => v.nodes.map((n) => {
      const el = document.querySelector(n.target[0]);
      const sec = el && el.closest('[data-componente]');
      return { regla: v.id, impacto: v.impact, componente: sec ? sec.dataset.componente : '(página)', objetivo: n.target.join(' '), resumen: n.failureSummary };
    }));
  });
}

// ─── Principal ───────────────────────────────────────────────────────────────

const conAxe = args.includes('--axe');
const dirCapturas = arg('--capturas');
if (!conAxe && !dirCapturas) {
  console.error('Uso: node run.mjs --axe | --capturas DIR [--temas a,b]');
  process.exit(2);
}
if (!fs.existsSync(path.join(ROOT, 'css', `styles-theme-${temas[0]}.css`))) {
  console.error('❌ No hay CSS compilado: npm run build en la raíz.');
  process.exit(2);
}

const srv = await servir();
const base = `http://127.0.0.1:${srv.address().port}`;
// SYX_CHROMIUM: un Chromium ya instalado, cuando no se puede descargar el
// que trae esta versión de Playwright.
const navegador = await chromium.launch(process.env.SYX_CHROMIUM ? { executablePath: process.env.SYX_CHROMIUM } : {});
const ctx = await navegador.newContext({ viewport: { width: 800, height: 600 }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
const page = await ctx.newPage();

let violaciones = [];
let exceptuadas = 0;
let capturas = 0;
console.log(`\n── SYX EN EL NAVEGADOR · ${componentes.length} componentes × ${temas.length} temas × ${MODOS.length} modos ──\n`);

for (const tema of temas) {
  for (const modo of MODOS) {
    await page.emulateMedia({ colorScheme: modo, reducedMotion: 'reduce' });
    await page.goto(`${base}/__prueba/${tema}/${modo}`, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);

    if (conAxe) {
      const vs = (await axe(page)).map((v) => ({ ...v, tema, modo }));
      const reales = vs.filter((v) => !exceptuada(v));
      violaciones.push(...reales);
      exceptuadas += vs.length - reales.length;
      console.log(`${reales.length ? '❌' : '✅'} ${tema.padEnd(12)} ${modo.padEnd(5)} ${reales.length} violación(es)${vs.length - reales.length ? ` · ${vs.length - reales.length} exceptuada(s)` : ''}`);
    }

    if (dirCapturas) {
      const dir = path.resolve(process.cwd(), dirCapturas, tema, modo);
      fs.mkdirSync(dir, { recursive: true });
      for (const c of componentes) {
        const sec = page.locator(`[data-componente="${c.name}"]`);
        await sec.screenshot({ path: path.join(dir, `${c.name}.png`), animations: 'disabled', caret: 'hide' });
        capturas++;
      }
    }
  }
}

await navegador.close();
srv.close();

if (dirCapturas) console.log(`\n   ${capturas} capturas en ${dirCapturas}/`);
if (conAxe) {
  if (violaciones.length) {
    console.log('\n── Violaciones ──');
    const porClave = new Map();
    for (const v of violaciones) {
      const k = `${v.componente} · ${v.regla}`;
      if (!porClave.has(k)) porClave.set(k, { ...v, donde: [] });
      porClave.get(k).donde.push(`${v.tema}/${v.modo}`);
    }
    for (const [k, v] of porClave) {
      console.log(`\n❌ ${k} (${v.impacto}) — ${[...new Set(v.donde)].join(', ')}`);
      console.log(`   ${v.objetivo}`);
      console.log(`   ${String(v.resumen).split('\n').slice(0, 3).join('\n   ')}`);
    }
  } else {
    console.log(`\n   0 violaciones sin justificar de WCAG 2.2 AA${exceptuadas ? ` · ${exceptuadas} aceptadas a sabiendas en axe-excepciones.json` : ''}.`);
  }
  process.exitCode = violaciones.length ? 1 : 0;
}
console.log('');
