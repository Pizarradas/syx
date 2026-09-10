#!/usr/bin/env node
/**
 * check-portabilidad.mjs — Fase 4 de la prueba de portabilidad.
 *
 * La tesis ("SYX se traslada a cualquier framework sin pérdida") convertida
 * en check: renderiza cada story en los tres Storybooks construidos (HTML,
 * React, Vue) y compara los píxeles. HTML es la línea base — renderiza el
 * usage del registro verbatim —; React y Vue lo compilan a componentes, así
 * que cualquier divergencia del compilador de wrappers aparece aquí como
 * píxeles rojos, no como una opinión.
 *
 * Requiere los tres builds hechos:
 *   npm run build
 *   npm --prefix frameworks/react run build
 *   npm --prefix frameworks/vue run build
 *
 * Salida: portability-report.json + diffs PNG de los fallos en
 * portability-diffs/. Sale con código 1 si algún par supera el umbral.
 */

import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync, createReadStream } from 'node:fs';
import { createServer } from 'node:http';
import { dirname, join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';

const HERE = dirname(fileURLToPath(import.meta.url));
const spec = JSON.parse(readFileSync(join(HERE, 'spec', 'spec.json'), 'utf8'));

const BUILDS = {
  html: join(HERE, 'storybook-static'),
  react: join(HERE, 'frameworks', 'react', 'storybook-static'),
  vue: join(HERE, 'frameworks', 'vue', 'storybook-static'),
};
for (const [name, dir] of Object.entries(BUILDS)) {
  if (!existsSync(join(dir, 'iframe.html'))) {
    console.error(`Falta el build de ${name} (${dir}). Constrúyelo antes de comparar.`);
    process.exit(2);
  }
}

// Umbral: proporción de píxeles distintos tolerada por story. No es cero
// porque el antialiasing de texto puede variar entre repintados; pixelmatch
// ya descuenta el antialiasing puro y esto cubre el resto.
const MAX_DIFF_RATIO = 0.001;
const VIEWPORT = { width: 1000, height: 600 };

const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.css': 'text/css', '.json': 'application/json', '.png': 'image/png',
  '.svg': 'image/svg+xml', '.woff': 'font/woff', '.woff2': 'font/woff2',
  '.ttf': 'font/ttf', '.eot': 'application/vnd.ms-fontobject',
};

function serve() {
  const server = createServer((req, res) => {
    const [, fw, ...rest] = req.url.split('?')[0].split('/');
    const root = BUILDS[fw];
    if (!root) { res.writeHead(404).end(); return; }
    const rel = rest.join('/') || 'index.html';
    const file = join(root, decodeURIComponent(rel));
    if (!file.startsWith(root) || !existsSync(file)) { res.writeHead(404).end(); return; }
    res.writeHead(200, { 'content-type': MIME[extname(file)] ?? 'application/octet-stream' });
    createReadStream(file).pipe(res);
  });
  return new Promise((ok) => server.listen(0, '127.0.0.1', () => ok(server)));
}

const LAYER_TITLE = { atom: 'Atoms', molecule: 'Molecules', organism: 'Organisms' };
const toId = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const pascal = (s) => s.replace(/(^|-)(\w)/g, (_, __, c) => c.toUpperCase());

function storyIds(C) {
  const title = toId(`${LAYER_TITLE[C.layer]}/${C.name}`);
  const names = ['Playground', ...Object.keys(C.axes).map(pascal)];
  if (C.flags.length) names.push('Flags');
  return names.map((n) => `${title}--${toId(n)}`);
}

const server = await serve();
const port = server.address().port;
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 1, reducedMotion: 'reduce' });

async function shoot(page, fw, id) {
  await page.goto(`http://127.0.0.1:${port}/${fw}/iframe.html?id=${id}&viewMode=story`, { waitUntil: 'networkidle' });
  await page.addStyleTag({ content: '*{animation:none!important;transition:none!important;caret-color:transparent!important}' });
  await page.waitForFunction(() => {
    const root = document.querySelector('#storybook-root');
    return root && root.childElementCount > 0 && document.fonts.status === 'loaded';
  }, { timeout: 15000 });
  await page.waitForTimeout(120);
  return PNG.sync.read(await page.screenshot());
}

function compare(a, b) {
  if (a.width !== b.width || a.height !== b.height) return { ratio: 1, diff: null };
  const diff = new PNG({ width: a.width, height: a.height });
  const n = pixelmatch(a.data, b.data, diff.data, a.width, a.height, { threshold: 0.1 });
  return { ratio: n / (a.width * a.height), diff };
}

const DIFF_DIR = join(HERE, 'portability-diffs');
rmSync(DIFF_DIR, { recursive: true, force: true });

const results = [];
const page = await context.newPage();
let done = 0;
// `node check-portabilidad.mjs 5` limita a las primeras 5 stories: para
// diagnosticar el arnés sin pagar la pasada completa.
const limit = Number(process.argv[2]) || Infinity;
const allIds = spec.components.flatMap(storyIds).slice(0, limit);

for (const id of allIds) {
  const row = { id, pairs: {} };
  try {
    const [html, react, vue] = [
      await shoot(page, 'html', id),
      await shoot(page, 'react', id),
      await shoot(page, 'vue', id),
    ];
    for (const [pair, [a, b]] of Object.entries({ 'html-react': [html, react], 'html-vue': [html, vue] })) {
      const { ratio, diff } = compare(a, b);
      row.pairs[pair] = ratio;
      if (ratio > MAX_DIFF_RATIO && diff) {
        mkdirSync(DIFF_DIR, { recursive: true });
        writeFileSync(join(DIFF_DIR, `${id}.${pair}.png`), PNG.sync.write(diff));
      }
    }
  } catch (e) {
    row.error = String(e.message ?? e).split('\n')[0];
  }
  results.push(row);
  done += 1;
  console.log(`  ${done}/${allIds.length} ${id}${row.error ? '  ⚠ ' + row.error : ''}`);
}

await browser.close();
server.close();

const failed = results.filter((r) => r.error || Object.values(r.pairs).some((v) => v > MAX_DIFF_RATIO));
const report = {
  generated: new Date().toISOString(),
  threshold: MAX_DIFF_RATIO,
  stories: results.length,
  failed: failed.length,
  results,
};
writeFileSync(join(HERE, 'portability-report.json'), JSON.stringify(report, null, 2) + '\n');

console.log(`\n${results.length} stories × (HTML↔React, HTML↔Vue)`);
if (failed.length === 0) {
  console.log('✅ PORTABILIDAD: 0 divergencias por encima del umbral. El traslado es sin pérdida.');
} else {
  console.log(`❌ ${failed.length} stories divergen (diffs en portability-diffs/):`);
  for (const f of failed) {
    console.log(`   ${f.id}  ${f.error ?? Object.entries(f.pairs).filter(([, v]) => v > MAX_DIFF_RATIO).map(([k, v]) => `${k}=${(v * 100).toFixed(2)}%`).join(' ')}`);
  }
  process.exit(1);
}
