#!/usr/bin/env node
/**
 * SYX — Prueba de humo del Quick Start
 * ────────────────────────────────────
 * Hace lo que el README manda hacer a quien adopta SYX, y comprueba que sale
 * lo que el README promete:
 *
 *   1. empaqueta el repositorio (`npm pack`, que corre `prepare` y genera dist/)
 *   2. lo instala en un proyecto vacío FUERA del repositorio, junto a Vite
 *   3. copia de README.md, LITERALMENTE, los bloques marcados con
 *      `<!-- quickstart:<ruta> -->` (hoy src/main.js e index.html)
 *   4. `vite build`, el build de producción, el que hace tree-shaking
 *   5. sirve dist/ y abre la página en Chromium: un token resuelto no vacío,
 *      el botón pintado, la segunda pestaña muestra su panel al pulsarla y con
 *      las flechas, data-theme="dark" cambia los tokens, y ninguna petición
 *      (fuentes incluidas) falla
 *
 * POR QUÉ EXISTE
 * Auditoría de octubre de 2026, acción 11. Adoptando SYX de verdad —npm pack,
 * proyecto Vite, tema por su export, una pantalla de ajustes— el README pedía
 * clases en <body> que ningún CSS declara, mandaba abrir un index.html que no
 * existe, y `import 'syx-design-system/js/syx-tabs.js'` desaparecía en
 * `vite build` porque `sideEffects` no lo declaraba: en desarrollo funcionaba,
 * en producción las pestañas estaban muertas. Ninguna de las tres cosas la
 * podía ver un guardián que lee ficheros; solo un build y un navegador.
 *
 * POR QUÉ LOS BLOQUES SALEN DEL README
 * Porque lo que se prueba tiene que ser lo que se lee. Una página de prueba
 * escrita aquí podría seguir verde mientras el README se pudre.
 *
 * POR QUÉ NO ESTÁ EN `npm run check`
 * Necesita red (instala Vite en el proyecto temporal), un Chromium, y tarda
 * del orden de un minuto. Corre en el job `entrega` de la CI, en cada PR,
 * junto a check:consumible. En local:
 *
 *   npm ci --prefix tests/browser        # Playwright, una vez
 *   npm run check:quickstart             # SYX_CHROMIUM=/ruta/a/chrome si no
 *                                        # se puede descargar el de Playwright
 *   node scripts/check-quickstart.js --conservar   deja el proyecto temporal
 *
 * Vite NO es dependencia del repositorio: se instala solo en el temporal.
 */

'use strict';

const { execFileSync } = require('child_process');
const fs = require('fs');
const http = require('http');
const os = require('os');
const path = require('path');
const { createRequire } = require('module');

const ROOT = path.join(__dirname, '..');
const PKG = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
const VITE = 'vite@^6';
const conservar = process.argv.includes('--conservar');
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';

const fallar = (msg) => { console.log(`❌ ${msg}\n`); process.exit(1); };

// ─── Los bloques del README ──────────────────────────────────────────────────

function bloquesDelReadme() {
  const readme = fs.readFileSync(path.join(ROOT, 'README.md'), 'utf8');
  const bloques = [...readme.matchAll(/<!--\s*quickstart:([^\s]+)\s*-->\s*\n```[a-z]*\n([\s\S]*?)\n```/g)]
    .map((m) => ({ ruta: m[1], contenido: m[2] + '\n' }));
  const rutas = bloques.map((b) => b.ruta);
  for (const necesaria of ['index.html', 'src/main.js']) {
    if (!rutas.includes(necesaria)) fallar(`README.md no tiene el bloque <!-- quickstart:${necesaria} --> seguido de un bloque de código`);
  }
  return bloques;
}

// ─── Playwright, del arnés de tests/browser ──────────────────────────────────

function cargarPlaywright() {
  try {
    return createRequire(path.join(ROOT, 'tests', 'browser', 'package.json'))('playwright');
  } catch (e) {
    fallar('no encuentro Playwright. Instálalo una vez con: npm ci --prefix tests/browser');
  }
}

function servir(dir) {
  const tipos = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf', '.svg': 'image/svg+xml', '.eot': 'application/vnd.ms-fontobject' };
  const srv = http.createServer((req, res) => {
    const rel = decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, '') || 'index.html';
    const f = path.join(dir, rel);
    if (!f.startsWith(dir) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'content-type': tipos[path.extname(f)] || 'application/octet-stream' });
    fs.createReadStream(f).pipe(res);
  });
  return new Promise((ok) => srv.listen(0, '127.0.0.1', () => ok(srv)));
}

// ─── La prueba ───────────────────────────────────────────────────────────────

(async () => {
  console.log('\n── QUICK START, DE PRINCIPIO A FIN ─────────────────────────────\n');
  const bloques = bloquesDelReadme();
  const { chromium } = cargarPlaywright();

  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'syx-quickstart-'));
  let srv;
  let navegador;
  let fallos = 0;
  const comprobar = (nombre, ok, detalle = '') => {
    if (ok) console.log(`✅ ${nombre}`);
    else { fallos++; console.log(`❌ ${nombre}${detalle ? `\n     ${detalle}` : ''}`); }
  };

  try {
    const salida = execFileSync(npm, ['pack', '--pack-destination', tmp, '--json'], {
      cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], shell: process.platform === 'win32',
    });
    const tarball = path.join(tmp, JSON.parse(salida)[0].filename);
    console.log(`   empaquetado         ${path.basename(tarball)}`);

    fs.writeFileSync(path.join(tmp, 'package.json'),
      JSON.stringify({ name: 'adopcion-de-prueba', version: '1.0.0', private: true, type: 'module' }, null, 2));
    execFileSync(npm, ['install', '--no-audit', '--no-fund', '--silent', tarball, VITE], {
      cwd: tmp, stdio: ['ignore', 'ignore', 'pipe'], shell: process.platform === 'win32',
    });
    console.log(`   instalado con       ${VITE} en ${tmp}`);

    for (const b of bloques) {
      const destino = path.join(tmp, b.ruta);
      fs.mkdirSync(path.dirname(destino), { recursive: true });
      fs.writeFileSync(destino, b.contenido);
    }
    console.log(`   del README          ${bloques.map((b) => b.ruta).join(', ')}`);

    execFileSync(process.execPath, [path.join(tmp, 'node_modules', 'vite', 'bin', 'vite.js'), 'build', '--logLevel', 'error'], {
      cwd: tmp, stdio: ['ignore', 'ignore', 'pipe'],
    });
    console.log('   vite build          hecho\n');

    srv = await servir(path.join(tmp, 'dist'));
    const url = `http://127.0.0.1:${srv.address().port}/`;
    navegador = await chromium.launch(process.env.SYX_CHROMIUM ? { executablePath: process.env.SYX_CHROMIUM } : {});
    const page = await navegador.newPage();
    const rotas = [];
    const errores = [];
    page.on('requestfailed', (r) => rotas.push(r.url()));
    page.on('response', (r) => { if (r.status() >= 400) rotas.push(`${r.status()} ${r.url()}`); });
    page.on('pageerror', (e) => errores.push(e.message));
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts && document.fonts.ready);

    const token = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--semantic-color-primary').trim());
    comprobar('el tema pinta: --semantic-color-primary resuelve', !!token, 'vacío: la hoja del tema no llegó al build');

    const fondo = await page.evaluate(() => getComputedStyle(document.querySelector('.atom-btn--primary')).backgroundColor);
    comprobar('el botón primario tiene fondo', fondo && !/rgba\(0, 0, 0, 0\)|transparent/.test(fondo), `background-color: ${fondo}`);

    const vis = () => page.evaluate(() => ['panel-1', 'panel-2'].map((id) => !document.getElementById(id).hidden && document.getElementById(id).offsetParent !== null));
    const [ini1, ini2] = await vis();
    comprobar('al cargar se ve el primer panel y no el segundo', ini1 && !ini2, `panel-1 ${ini1} · panel-2 ${ini2}`);

    await page.click('#tab-2');
    const [c1, c2] = await vis();
    const sel = await page.getAttribute('#tab-2', 'aria-selected');
    comprobar('pulsar la segunda pestaña muestra su panel (el JS sobrevivió al build)', !c1 && c2 && sel === 'true',
      `panel-1 ${c1} · panel-2 ${c2} · aria-selected ${sel}: si nada cambió, el import de js/ se perdió en el tree-shaking`);

    await page.keyboard.press('ArrowLeft');
    const [k1, k2] = await vis();
    const foco = await page.evaluate(() => document.activeElement && document.activeElement.id);
    comprobar('la flecha izquierda vuelve a la primera, con el foco', k1 && !k2 && foco === 'tab-1', `panel-1 ${k1} · panel-2 ${k2} · foco en ${foco}`);

    const claro = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--semantic-color-bg-primary').trim());
    await page.evaluate(() => { document.documentElement.dataset.theme = 'dark'; });
    const oscuro = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--semantic-color-bg-primary').trim());
    comprobar('data-theme="dark" en <html> cambia los tokens', claro && oscuro && claro !== oscuro, `claro ${claro} · oscuro ${oscuro}`);

    comprobar('ninguna petición falla (fuentes incluidas)', !rotas.length, rotas.slice(0, 3).join('\n     '));
    comprobar('sin errores de JavaScript', !errores.length, errores.slice(0, 3).join('\n     '));
  } catch (e) {
    fallos++;
    console.log(`❌ ${String(e.stderr || e.message).split('\n').slice(0, 6).join('\n     ')}`);
  } finally {
    if (navegador) await navegador.close();
    if (srv) srv.close();
    if (conservar) console.log(`\n   proyecto conservado en ${tmp}`);
    else try { fs.rmSync(tmp, { recursive: true, force: true }); } catch (e) { /* es /tmp */ }
  }

  console.log(fallos ? `\n   ${fallos} fallo(s): el Quick Start del README no funciona tal cual.\n` : `\n✅ El Quick Start de ${PKG.name}@${PKG.version} funciona tal cual, en producción.\n`);
  process.exit(fallos ? 1 : 0);
})();
