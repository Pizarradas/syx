#!/usr/bin/env node
/**
 * SYX — Pruebas de interacción en navegador
 * ─────────────────────────────────────────
 * run.mjs pasa axe sobre todos los componentes, pero con los popovers abiertos
 * a la fuerza y sin tocar el teclado: comprueba cómo se ven, no cómo se usan.
 * Esto comprueba lo que solo existe al usarlos, que es justo lo que prometen
 * los js/syx-*.js (auditoría 2026-10, acción 15):
 *
 *   mol-menu      el patrón de botón de menú de APG: ↓/↑ abren en la primera o
 *                 la última, flechas con vuelta, Inicio/Fin, búsqueda por
 *                 letras, Escape y Tab devuelven el foco, aria-expanded al día,
 *                 clic fuera cierra, aria-disabled no actúa
 *   mol-tooltip   WCAG 1.4.13: aparece con el foco de teclado y con el
 *                 puntero, no tapa el disparador, se puede pasar a la burbuja,
 *                 Escape la cierra sin mover el foco
 *   mol-toast     el texto llega a la región viva, el foco no se mueve, la
 *                 cuenta atrás se pausa con el puntero encima y se cierra sola
 *   form-field    el contador escribe lo que queda, lo anuncia tras una pausa
 *                 y marca is-limit en el máximo
 *
 * La página se construye con el `usage` del registro, como en run.mjs, pero
 * con los popovers intactos y en un solo tema y modo: el comportamiento no
 * depende del tema.
 *
 * Uso (desde la raíz, con el CSS compilado):
 *   SYX_CHROMIUM=/ruta/a/chromium node tests/browser/interaccion.mjs
 */

import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(AQUI, '../..');
const registro = JSON.parse(fs.readFileSync(path.join(ROOT, 'component-registry.json'), 'utf8'));
const usage = (n) => ['atoms', 'molecules', 'organisms'].flatMap((k) => registro[k]).find((c) => c.name === n)?.usage || '';

const pagina = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>SYX · interacción</title>
  <base href="/">
  <link rel="stylesheet" href="/css/styles-theme-syx-sketch.css">
  <style>body { margin: 0; padding: 120px 24px 24px; } section { margin-block-end: 32px; }</style>
</head>
<body class="syx">
  <main>
    <button type="button" id="antes">Before</button>
    <section id="menu">${usage('menu')}</section>
    <section id="tooltip">${usage('tooltip')}</section>
    <!-- Lo que ven Safari y Firefox, que no conocen popover="hint" y lo
         tratan como "manual": sin cierre del navegador, Escape es del script. -->
    <section id="tooltip-manual">${usage('tooltip').replace(/popover="hint"/g, 'popover="manual"').replace(/\bid="([^"]+)"/g, 'id="$1-manual"').replace(/aria-describedby="([^"]+)"/g, 'aria-describedby="$1-manual"')}</section>
    <section id="toast">${usage('toast')}</section>
    <section id="campo">${usage('form-field')}</section>
    <p id="fuera">Outside</p>
  </main>
${fs.readdirSync(path.join(ROOT, 'js')).filter((f) => /^syx-.*\.js$/.test(f)).sort().map((f) => `  <script type="module" src="/js/${f}"></script>`).join('\n')}
</body>
</html>`;

const TIPOS = { '.css': 'text/css', '.js': 'text/javascript', '.woff2': 'font/woff2', '.svg': 'image/svg+xml' };
const srv = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://x');
  if (url.pathname === '/__interaccion') { res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); return res.end(pagina); }
  const f = path.join(ROOT, decodeURIComponent(url.pathname));
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': TIPOS[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
});
await new Promise((ok) => srv.listen(0, '127.0.0.1', ok));
const base = `http://127.0.0.1:${srv.address().port}`;

const navegador = await chromium.launch(process.env.SYX_CHROMIUM ? { executablePath: process.env.SYX_CHROMIUM } : {});
const page = await navegador.newPage({ viewport: { width: 1000, height: 800 } });
const erroresJs = [];
page.on('pageerror', (e) => erroresJs.push(e.message));

const casos = [];
const prueba = (nombre, fn) => casos.push({ nombre, fn });
const igual = (real, esperado, que) => {
  if (real !== esperado) throw new Error(`${que}: ${JSON.stringify(real)}, esperaba ${JSON.stringify(esperado)}`);
};
const cierto = (v, que) => { if (!v) throw new Error(que); };
const enfocado = () => page.evaluate(() => document.activeElement?.textContent.trim() || '');
const abierto = (sel) => page.locator(sel).evaluate((e) => e.matches(':popover-open'));
const espera = (ms) => page.waitForTimeout(ms);

async function cargar() {
  await page.goto(`${base}/__interaccion`, { waitUntil: 'networkidle' });
}

// ─── mol-menu ────────────────────────────────────────────────────────────────

const BOTON = '#menu .mol-menu__trigger';
const LISTA = '#menu .mol-menu__list';

prueba('menú: ↓ abre, enfoca la primera y pone aria-expanded="true"', async () => {
  await cargar();
  await page.focus(BOTON);
  await page.keyboard.press('ArrowDown');
  await espera(50);
  cierto(await abierto(LISTA), 'la lista no se abrió');
  igual(await page.getAttribute(BOTON, 'aria-expanded'), 'true', 'aria-expanded');
  igual(await enfocado(), 'Rename', 'foco');
});

prueba('menú: flechas con vuelta, Inicio y Fin, y la opción aria-disabled se recorre', async () => {
  const visto = [];
  for (const k of ['ArrowDown', 'ArrowDown', 'ArrowDown', 'ArrowDown', 'End', 'Home', 'ArrowUp']) {
    await page.keyboard.press(k);
    visto.push(await enfocado());
  }
  igual(visto.join(' › '), 'Duplicate › Move to folder › Delete › Rename › Delete › Rename › Delete', 'recorrido');
});

prueba('menú: una letra salta a la siguiente opción que empieza por ella', async () => {
  await page.keyboard.press('Home');
  await page.keyboard.press('d');
  igual(await enfocado(), 'Duplicate', 'primera «d»');
  await espera(600);
  await page.keyboard.press('d');
  igual(await enfocado(), 'Delete', 'segunda «d»');
});

prueba('menú: Escape cierra, devuelve el foco al botón y aria-expanded="false"', async () => {
  await page.keyboard.press('Escape');
  await espera(50);
  cierto(!(await abierto(LISTA)), 'la lista sigue abierta');
  igual(await page.getAttribute(BOTON, 'aria-expanded'), 'false', 'aria-expanded');
  cierto(await page.locator(BOTON).evaluate((b) => b === document.activeElement), 'el foco no volvió al botón');
});

prueba('menú: ↑ abre en la última y Tab cierra devolviendo el foco', async () => {
  await page.keyboard.press('ArrowUp');
  await espera(50);
  igual(await enfocado(), 'Delete', 'foco al abrir con ↑');
  await page.keyboard.press('Tab');
  await espera(50);
  cierto(!(await abierto(LISTA)), 'Tab no cerró');
  cierto(await page.locator(BOTON).evaluate((b) => b === document.activeElement), 'el foco no volvió al botón');
});

prueba('menú: clic abre, clic fuera cierra, aria-disabled no cierra y una opción sí', async () => {
  await page.click(BOTON);
  await espera(50);
  cierto(await abierto(LISTA), 'el clic no abrió');
  igual(await enfocado(), 'Rename', 'foco tras el clic');
  await page.click('#fuera');
  await espera(50);
  cierto(!(await abierto(LISTA)), 'el clic fuera no cerró');
  igual(await page.getAttribute(BOTON, 'aria-expanded'), 'false', 'aria-expanded tras clic fuera');
  await page.click(BOTON);
  await espera(50);
  await page.click(`${LISTA} [aria-disabled="true"]`, { force: true });
  await espera(50);
  cierto(await abierto(LISTA), 'una opción aria-disabled cerró el menú');
  await page.click(`${LISTA} >> text=Duplicate`);
  await espera(50);
  cierto(!(await abierto(LISTA)), 'activar una opción no cerró el menú');
});

// ─── mol-tooltip ─────────────────────────────────────────────────────────────

const DISPARADOR = '#tooltip [aria-describedby]';
const BURBUJA = '#tooltip .mol-tooltip__bubble';

prueba('tooltip: aparece con el foco de teclado y no tapa el disparador', async () => {
  await cargar();
  await page.focus('#antes');
  // Tab hasta el disparador: el foco programático no es :focus-visible.
  for (let i = 0; i < 12 && !(await page.locator(DISPARADOR).evaluate((b) => b === document.activeElement)); i++) await page.keyboard.press('Tab');
  await espera(50);
  cierto(await abierto(BURBUJA), 'no se abrió con el foco');
  const a = await page.locator(DISPARADOR).boundingBox();
  const b = await page.locator(BURBUJA).boundingBox();
  const solapan = a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
  cierto(!solapan, `la burbuja tapa el disparador (${JSON.stringify({ a, b })})`);
});

prueba('tooltip: Escape la cierra y el foco se queda en el disparador', async () => {
  await page.keyboard.press('Escape');
  await espera(50);
  cierto(!(await abierto(BURBUJA)), 'Escape no la cerró');
  cierto(await page.locator(DISPARADOR).evaluate((b) => b === document.activeElement), 'Escape movió el foco');
  await page.focus('#antes');
});

prueba('tooltip con popover="manual" (Safari, Firefox): Escape lo cierra el script', async () => {
  const d = '#tooltip-manual [aria-describedby]';
  const b = '#tooltip-manual .mol-tooltip__bubble';
  for (let i = 0; i < 12 && !(await page.locator(d).evaluate((x) => x === document.activeElement)); i++) await page.keyboard.press('Tab');
  await espera(50);
  cierto(await abierto(b), 'no se abrió con el foco');
  await page.keyboard.press('Escape');
  await espera(50);
  cierto(!(await abierto(b)), 'Escape no lo cerró');
  cierto(await page.locator(d).evaluate((x) => x === document.activeElement), 'Escape movió el foco');
  await page.focus('#antes');
});

prueba('tooltip: aparece con el puntero, se puede pasar a la burbuja y se va al salir', async () => {
  await page.hover(DISPARADOR);
  await espera(300);
  cierto(await abierto(BURBUJA), 'no se abrió con el puntero');
  const b = await page.locator(BURBUJA).boundingBox();
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 8 });
  await espera(300);
  cierto(await abierto(BURBUJA), 'se cerró al pasar el puntero a la burbuja (1.4.13, «hoverable»)');
  await page.mouse.move(5, 790, { steps: 4 });
  await espera(300);
  cierto(!(await abierto(BURBUJA)), 'no se cerró al salir el puntero');
});

// ─── mol-toast ───────────────────────────────────────────────────────────────

prueba('toast: el texto llega a la región viva y el foco no se mueve', async () => {
  await cargar();
  await page.focus('#antes');
  await page.evaluate(async () => {
    const { showToast } = await import('/js/syx-toast.js');
    showToast('Settings saved', { tone: 'success', duration: 800 });
  });
  await espera(300);
  igual((await page.textContent('#toast .mol-toast__live')).trim(), 'Settings saved', 'región viva');
  igual(await page.getAttribute('#toast .mol-toast__live', 'role'), 'status', 'rol de la región viva');
  igual(await page.evaluate(() => document.activeElement.id), 'antes', 'foco');
  igual(await page.locator('#toast .mol-toast__item').count(), 2, 'avisos en pantalla');
});

prueba('toast: se cierra solo al acabar su tiempo', async () => {
  await espera(1200);
  igual(await page.locator('#toast .mol-toast__item').count(), 1, 'avisos en pantalla');
});

prueba('toast: con el puntero encima la cuenta atrás se pausa', async () => {
  await page.evaluate(async () => {
    const { showToast } = await import('/js/syx-toast.js');
    showToast('Paused while hovered', { duration: 600 });
  });
  await espera(100);
  await page.hover('#toast .mol-toast__item:last-child');
  await espera(1200);
  igual(await page.locator('#toast .mol-toast__item').count(), 2, 'se cerró con el puntero encima');
  await page.mouse.move(5, 5);
  await espera(1200);
  igual(await page.locator('#toast .mol-toast__item').count(), 1, 'no se cerró al quitar el puntero');
});

prueba('toast: cerrar con el teclado devuelve el foco a donde estaba', async () => {
  await page.focus('#toast [data-syx-toast]');
  await page.keyboard.press('Tab');
  igual(await page.evaluate(() => document.activeElement.className), 'mol-toast__close', 'Tab llega al botón de cerrar');
  await page.keyboard.press('Enter');
  await espera(500);
  igual(await page.locator('#toast .mol-toast__item').count(), 0, 'el aviso no se cerró');
  cierto(await page.locator('#toast [data-syx-toast]').evaluate((b) => b === document.activeElement), 'el foco no volvió');
});

// ─── contador de caracteres ──────────────────────────────────────────────────

prueba('contador: escribe lo que queda, lo anuncia tras una pausa y marca el límite', async () => {
  await cargar();
  const campo = page.locator('#campo textarea');
  const cuenta = page.locator('#campo .mol-form-field__count');
  igual((await cuenta.textContent()).trim(), '160 characters left', 'al cargar');
  await campo.fill('Hello');
  igual((await cuenta.textContent()).trim(), '155 characters left', 'tras escribir');
  await espera(1000);
  igual((await page.textContent('#campo .mol-form-field__live')).trim(), '155 characters left', 'anuncio');
  await campo.fill('x'.repeat(160));
  cierto(await cuenta.evaluate((c) => c.classList.contains('is-limit')), 'sin is-limit en el máximo');
});

// ─── Resultado ───────────────────────────────────────────────────────────────

console.log('\n── SYX · INTERACCIÓN EN NAVEGADOR ─────────────────────────────\n');
let fallos = 0;
for (const c of casos) {
  try {
    await c.fn();
    console.log(`✅ ${c.nombre}`);
  } catch (e) {
    fallos++;
    console.log(`❌ ${c.nombre}\n     ${e.message.split('\n')[0]}`);
  }
}
if (erroresJs.length) {
  fallos++;
  console.log(`❌ errores de JavaScript en la página:\n     ${[...new Set(erroresJs)].join('\n     ')}`);
}
console.log(`\n   ${casos.length - Math.min(fallos, casos.length)}/${casos.length} comprobaciones\n`);
await navegador.close();
srv.close();
process.exitCode = fallos ? 1 : 0;
