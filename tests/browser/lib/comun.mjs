/**
 * SYX — Lo que comparten las pruebas en navegador
 * ───────────────────────────────────────────────
 * El servidor estático, el navegador, la lista de temas y la página que monta
 * TODOS los componentes del registro con su `usage`. run.mjs (axe y capturas),
 * foco.mjs y reflow.mjs miden sobre la misma página: si cada uno montara la
 * suya, un componente podría pasar una prueba en un marco que las otras no
 * ven. (Auditoría 2026-10 · acción 8)
 */

import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

export const AQUI = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const args = process.argv.slice(2);
export const arg = (n) => { const i = args.indexOf(n); return i === -1 ? null : args[i + 1] || ''; };
export const bandera = (n) => args.includes(n);
// --raiz: medir OTRO árbol (la rama base, en la CI) con este mismo arnés.
export const ROOT = arg('--raiz') ? path.resolve(arg('--raiz')) : path.resolve(AQUI, '../..');
export const MODOS = ['light', 'dark'];

export function componentes(root = ROOT) {
  const registro = JSON.parse(fs.readFileSync(path.join(root, 'component-registry.json'), 'utf8'));
  return ['atoms', 'molecules', 'organisms'].flatMap((k) => registro[k].filter((c) => c.usage));
}

/** Los temas compilados en css/, o los de --temas. */
export function temas(root = ROOT) {
  return (arg('--temas') || fs.readdirSync(path.join(root, 'css'))
    .filter((f) => /^styles-theme-.*\.css$/.test(f))
    .map((f) => f.replace(/^styles-theme-|\.css$/g, ''))
    .join(',')).split(',').filter(Boolean).sort();
}

export const scriptsSyx = (root = ROOT) => fs.readdirSync(path.join(root, 'js'))
  .filter((f) => /^syx-.*\.js$/.test(f)).sort();

// ─── La página de componentes ────────────────────────────────────────────────

/**
 * Una página con todos los componentes del registro, cada uno en su sección
 * `[data-componente]`, con las hojas de un tema y un modo.
 *   dir     'ltr' | 'rtl'
 *   hojas   rutas relativas a la raíz, con {tema} sustituido
 */
export function paginaComponentes({ tema, modo, dir = 'ltr', hojas = ['css/styles-theme-{tema}.css'], root = ROOT }) {
  const secciones = componentes(root).map((c) => `
    <section class="prueba" data-componente="${c.name}" aria-label="${c.name}">
      ${c.usage}
    </section>`).join('\n');
  return `<!doctype html>
<html lang="es" dir="${dir}" data-theme="${modo}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>SYX · ${tema} · ${modo} · ${dir}</title>
  <!-- Las rutas relativas de los usage (img/avatar-demo.svg) son relativas a
       la raíz del repositorio, como en docs.html; esta página vive en
       /__prueba/tema/modo y sin <base> darían 404. -->
  <base href="/">
${hojas.map((h) => `  <link rel="stylesheet" href="/${h.replaceAll('{tema}', tema)}">`).join('\n')}
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
    /* Los avisos (mol-toast) son fijos: el marco los contiene en su sección,
       como el de docs.html, y les deja sitio para no tapar su botón. */
    .prueba:has(.mol-toast) { contain: layout paint; min-height: 14rem; }
  </style>
</head>
<body class="syx">
  <main>
${secciones}
  </main>
  <script>
    for (const d of document.querySelectorAll('dialog:not([open])')) d.show();
    // Los popovers (la burbuja de mol-tooltip, la lista de mol-menu) llegan
    // cerrados, y axe no recorre lo que no se ve. Se les quita el atributo
    // popover ANTES de que carguen los módulos: así se pintan en el flujo,
    // junto a su disparador, con sus colores y su contraste, y cada uno sale
    // en su captura. Abrirlos con showPopover() no valdría: un "auto" cierra
    // a los demás y la capa superior los sacaría de su sección. El teclado y
    // la apertura real se prueban aparte, con los popovers intactos, en
    // interaccion.mjs.
    for (const p of document.querySelectorAll('[popover]')) p.removeAttribute('popover');
  </script>
${scriptsSyx(root).map((f) => `  <script type="module" src="/js/${f}"></script>`).join('\n')}
</body>
</html>`;
}

// ─── Servidor y navegador ────────────────────────────────────────────────────

const TIPOS = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.woff2': 'font/woff2', '.woff': 'font/woff', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.webp': 'image/webp', '.ico': 'image/x-icon', '.json': 'application/json', '.webmanifest': 'application/manifest+json',
};

/**
 * Sirve la raíz, y además /__prueba/<tema>/<modo> con la página de
 * componentes (con las opciones de `pagina`).
 */
export function servir({ root = ROOT, pagina = {} } = {}) {
  const srv = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://x');
    const m = url.pathname.match(/^\/__prueba\/([a-z0-9-]+)\/(light|dark)$/);
    if (m) {
      res.writeHead(200, { 'content-type': TIPOS['.html'] });
      return res.end(paginaComponentes({ tema: m[1], modo: m[2], root, ...pagina }));
    }
    const f = path.join(root, decodeURIComponent(url.pathname));
    if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'content-type': TIPOS[path.extname(f)] || 'application/octet-stream' });
    fs.createReadStream(f).pipe(res);
  });
  return new Promise((ok) => srv.listen(0, '127.0.0.1', () => ok({ srv, base: `http://127.0.0.1:${srv.address().port}` })));
}

// SYX_CHROMIUM: un Chromium ya instalado, cuando no se puede descargar el
// que trae esta versión de Playwright.
export const lanzar = () => chromium.launch(process.env.SYX_CHROMIUM ? { executablePath: process.env.SYX_CHROMIUM } : {});

/** Abre la página de componentes de un tema y modo, con las fuentes cargadas. */
export async function abrirComponentes(page, base, tema, modo) {
  await page.emulateMedia({ colorScheme: modo, reducedMotion: 'reduce' });
  await page.goto(`${base}/__prueba/${tema}/${modo}`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
}

/**
 * Las páginas del sitio, como las ve quien visita: tema y modo por
 * sessionStorage antes de cargar (el JS de la página cambia la hoja), y sin
 * peticiones a otros orígenes (vídeo e imágenes de ejemplo de docs.html), que
 * dependen de la red.
 */
export const PAGINAS = ['home', 'docs', 'why-syx', 'theme-builder'];
export async function contextoDePagina(navegador, base, { tema, modo, ancho, alto = 800 }) {
  const ctx = await navegador.newContext({ viewport: { width: ancho, height: alto }, deviceScaleFactor: 1, reducedMotion: 'reduce', colorScheme: modo });
  await ctx.addInitScript(([t, m]) => {
    try {
      if (t && t !== 'builder') sessionStorage.setItem('syx-theme', t);
      sessionStorage.setItem('syx-dark', m === 'dark' ? '1' : '0');
    } catch (e) { /* sin storage: el modo sale de colorScheme */ }
  }, [tema, modo]);
  await ctx.route('**/*', (r) => (r.request().url().startsWith(base) ? r.continue() : r.abort()));
  return ctx;
}

/** Agrupa filas por una clave y junta dónde aparece cada una. */
export function agrupar(filas, clave, donde) {
  const m = new Map();
  for (const f of filas) {
    const k = clave(f);
    if (!m.has(k)) m.set(k, { ...f, donde: new Set() });
    m.get(k).donde.add(donde(f));
  }
  return [...m.values()];
}
