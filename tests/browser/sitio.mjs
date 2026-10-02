#!/usr/bin/env node
/**
 * SYX — Las páginas del sitio en axe, y el cajón móvil con el teclado
 * ───────────────────────────────────────────────────────────────────
 * run.mjs prueba los componentes sueltos sobre una página de pruebas. Las
 * cuatro páginas del sitio (home, docs, why-syx, theme-builder) les añaden
 * su maquetación, sus utilidades y sus estilos en línea, y ahí es donde la
 * auditoría de octubre de 2026 (acción 8) midió lo que nadie veía: dos
 * switches sin nombre y 49 fallos de contraste en theme-builder.html,
 * bloques de código con scroll que el teclado no alcanzaba y enlaces de 23,6
 * px de alto en docs.html. Esto lo comprueba:
 *
 *   AXE    WCAG 2.2 A y AA, con los incompletos medidos en píxeles igual que
 *          run.mjs, a 375 y a 1280 px, en claro y en oscuro, con el CSS de
 *          css/ que cargan las páginas (compilado desde scss/) y su tema por defecto. Las
 *          excepciones van en axe-excepciones.json con `componente` = la
 *          página ("docs.html") y `temas` = "<ancho>/<modo>" ("375/light";
 *          con el cajón abierto, "cajon-375/light").
 *   CAJÓN  el de org-site-header, a 375 px, con el teclado: cerrado no se
 *          enfoca nada de dentro; la hamburguesa lo abre y lleva el foco
 *          dentro, y ese foco se ve; Tab no sale de él; Escape lo cierra y
 *          devuelve el foco a la hamburguesa. Y axe con el cajón abierto.
 *
 * Uso (desde la raíz, con css/ compilado):
 *   node tests/browser/sitio.mjs [--paginas home,docs] [--solo-axe | --solo-cajon] [--proponer]
 */

import fs from 'node:fs';
import path from 'node:path';
import { ROOT, MODOS, arg, bandera, servir, lanzar, PAGINAS, contextoDePagina, agrupar } from './lib/comun.mjs';
import { cargarExcepciones, pasarAxe, medirIncompletos, excepcionPara, proponer } from './lib/axe.mjs';
import { cambioDeFoco, dosFotogramas } from './lib/pixeles.mjs';

const ANCHOS = [375, 1280];
const paginas = (arg('--paginas') || PAGINAS.join(',')).split(',').filter(Boolean);
if (!fs.existsSync(path.join(ROOT, 'css', 'styles-theme-syx-sketch.css'))) {
  console.error('❌ No hay css/styles-theme-*.css: npm run build:css en la raíz (o compila scss/ con Prepros).');
  process.exit(2);
}
let excepciones;
try { excepciones = cargarExcepciones(); } catch (e) { console.error(`❌ ${e.message}`); process.exit(2); }

const { srv, base } = await servir();
const navegador = await lanzar();
const sinCubrir = [];
const fallos = [];
const usadas = new Set();

async function abrir(pagina, modo, ancho) {
  const ctx = await contextoDePagina(navegador, base, { tema: null, modo, ancho });
  const page = await ctx.newPage();
  const errores = [];
  page.on('pageerror', (e) => errores.push(e.message));
  await page.goto(`${base}/${pagina}.html`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  return { ctx, page, errores };
}

async function axeEn(page, pagina, ancho, modo) {
  const nodos = (await pasarAxe(page, { pagina: `${pagina}.html`, dentros: excepciones.filter((e) => e.dentro).map((e) => e.dentro) })).map((v) => ({ ...v, tema: String(ancho), modo }));
  await medirIncompletos(page, nodos);
  const reales = nodos.filter((v) => {
    const e = excepcionPara(v, excepciones, String(ancho), modo);
    if (e) usadas.add(e);
    return !e;
  });
  sinCubrir.push(...reales);
  return { total: nodos.length, reales: reales.length };
}

// ─── axe ─────────────────────────────────────────────────────────────────────

if (!bandera('--solo-cajon')) {
  console.log(`\n── LAS PÁGINAS EN AXE · ${paginas.length} páginas × ${ANCHOS.join(' y ')} px × ${MODOS.length} modos ──\n`);
  for (const pagina of paginas) {
    for (const ancho of ANCHOS) {
      for (const modo of MODOS) {
        const { ctx, page, errores } = await abrir(pagina, modo, ancho);
        const r = await axeEn(page, pagina, ancho, modo);
        for (const e of errores) fallos.push({ prueba: 'js', componente: `${pagina}.html`, que: 'error de JavaScript', donde: `${ancho}/${modo}`, detalle: e });
        console.log(`${r.reales ? '❌' : '✅'} ${pagina.padEnd(14)} ${String(ancho).padStart(4)} ${modo.padEnd(5)} ${r.reales} sin revisar${r.total - r.reales ? ` · ${r.total - r.reales} revisado(s)` : ''}`);
        await ctx.close();
      }
    }
  }
}

// ─── El cajón móvil ──────────────────────────────────────────────────────────

const enCajon = () => document.activeElement && !!document.activeElement.closest('.org-site-nav-drawer');

async function cajon(pagina, modo) {
  const { ctx, page } = await abrir(pagina, modo, 375);
  const falla = (detalle) => fallos.push({ prueba: 'cajón', componente: `${pagina}.html`, que: '.org-site-nav-drawer', donde: `375/${modo}`, detalle });
  try {
    if (!(await page.$('.org-site-header__burger[aria-controls]'))) return falla('no hay hamburguesa con aria-controls');
    // Cerrado: Tab recorre la página entera sin entrar en el cajón.
    let entra = false, pasos = 0;
    for (; pasos < 600; pasos++) {
      await page.keyboard.press('Tab');
      const [dentro, fin] = await page.evaluate(() => [!!document.activeElement?.closest('.org-site-nav-drawer'), document.activeElement === document.body]);
      if (dentro) { entra = true; break; }
      if (fin) break;
    }
    if (entra) falla('cerrado, Tab entra en el cajón (debería ser inert)');

    // Abrir con el teclado desde la hamburguesa.
    await page.focus('.org-site-header__burger');
    const burger = await page.$('.org-site-header__burger');
    await page.keyboard.press('Enter');
    await dosFotogramas(page);
    if (!(await page.evaluate(() => document.body.hasAttribute('data-nav-open')))) return falla('Enter en la hamburguesa no abre el cajón');
    if ((await burger.getAttribute('aria-expanded')) !== 'true') falla('abierto, la hamburguesa no dice aria-expanded="true"');
    if (!(await page.evaluate(enCajon))) falla('al abrir, el foco no entra en el cajón');

    // El foco dentro del cajón se ve: foto del primer enlace sin foco y con él.
    const caja = await page.evaluate(() => {
      const r = document.activeElement.getBoundingClientRect();
      return { x: Math.max(0, r.x - 8), y: Math.max(0, r.y - 8), width: Math.min(innerWidth, r.width + 16), height: r.height + 16, perimetro: 2 * (r.width + r.height) };
    });
    const clip = { x: caja.x, y: caja.y, width: Math.min(caja.width, 375 - caja.x), height: caja.height };
    const con = await page.screenshot({ clip, animations: 'disabled', caret: 'hide' });
    await page.evaluate(() => { window.__syxFoco = document.activeElement; document.activeElement.blur(); });
    await dosFotogramas(page);
    const sin = await page.screenshot({ clip, animations: 'disabled', caret: 'hide' });
    await page.evaluate(() => { window.__syxFoco.focus(); });
    const { area } = cambioDeFoco(sin, con);
    if (area < 2 * caja.perimetro) falla(`el foco del primer enlace del cajón mide ${Math.round(area)} px con ≥ 3:1; hacen falta ${Math.round(2 * caja.perimetro)}`);

    // Tab no sale: todo lo demás está inerte salvo la hamburguesa.
    for (let k = 0; k < 40; k++) {
      await page.keyboard.press('Tab');
      const fuera = await page.evaluate(() => {
        const a = document.activeElement;
        if (!a || a === document.body || a.closest('.org-site-nav-drawer') || a.matches('.org-site-header__burger')) return null;
        return `${a.tagName.toLowerCase()}${a.id ? `#${a.id}` : ''}${[...a.classList].slice(0, 2).map((c) => `.${c}`).join('')}`;
      });
      if (fuera) { falla(`abierto, Tab sale del cajón a ${fuera}`); break; }
    }

    // axe con el cajón abierto (contraste del cajón, nombres de sus controles).
    const r = await axeEn(page, pagina, 'cajon-375', modo);
    if (r.reales) falla(`axe con el cajón abierto: ${r.reales} sin revisar (abajo)`);

    // Escape cierra y devuelve el foco a la hamburguesa.
    await page.keyboard.press('Escape');
    await dosFotogramas(page);
    if (await page.evaluate(() => document.body.hasAttribute('data-nav-open'))) falla('Escape no cierra el cajón');
    else if (!(await page.evaluate(() => document.activeElement?.matches('.org-site-header__burger')))) falla('al cerrar con Escape el foco no vuelve a la hamburguesa');
  } finally {
    await ctx.close();
  }
}

if (!bandera('--solo-axe')) {
  console.log('\n── EL CAJÓN MÓVIL CON EL TECLADO · 375 px ──\n');
  for (const pagina of paginas.filter((p) => p !== 'theme-builder')) {
    for (const modo of MODOS) {
      const antes = fallos.length;
      await cajon(pagina, modo);
      console.log(`${fallos.length > antes ? '❌' : '✅'} ${pagina.padEnd(14)} ${modo.padEnd(5)} ${fallos.length > antes ? `${fallos.length - antes} fallo(s)` : 'abre, enfoca, retiene y devuelve el foco'}`);
    }
  }
}

await navegador.close();
srv.close();

// ─── Informe ─────────────────────────────────────────────────────────────────

const completa = !arg('--paginas') && !bandera('--solo-axe') && !bandera('--solo-cajon');
const muertas = completa ? excepciones.filter((e) => /\.html$/.test(e.componente) && !usadas.has(e)) : [];
if (sinCubrir.length) {
  console.log('\n── axe: sin revisar ──');
  for (const v of agrupar(sinCubrir, (x) => `${x.tipo}|${x.componente}|${x.regla}|${x.objetivo}`, (x) => `${x.tema}/${x.modo}`)) {
    console.log(`\n❌ ${v.componente} · ${v.regla} · ${v.tipo}${v.impacto ? ` (${v.impacto})` : ''} — ${[...v.donde].join(', ')}`);
    console.log(`   ${v.objetivo}`);
    console.log(`   ${String(v.resumen).split('\n').slice(0, 3).join('\n   ')}`);
    if (v.medida) console.log(`   medido en píxeles: ${v.medida.error || `${v.medida.ratio}:1 (${v.medida.fg} sobre ${v.medida.bg}, mínimo ${v.medida.requerido}:1)`}`);
  }
}
if (fallos.length) {
  console.log('\n── Fallos ──');
  for (const f of agrupar(fallos, (x) => `${x.prueba}|${x.componente}|${x.detalle}`, (x) => x.donde)) {
    console.log(`\n❌ ${f.componente} · ${f.prueba} — ${[...f.donde].join(', ')}`);
    console.log(`   ${f.detalle}`);
  }
}
for (const e of muertas) console.log(`\n❌ axe-excepciones.json: la excepción ${e.regla} de ${e.componente} (${e.selector || e.dentro}) ya no cubre nada: bórrala.`);
if (bandera('--proponer')) {
  const caduca = new Date(Date.now() + 182 * 864e5).toISOString().slice(0, 10);
  console.log('\n── Propuestas para axe-excepciones.json (revísalas antes de pegarlas) ──\n');
  console.log(JSON.stringify(proponer(sinCubrir, caduca, { porAmbito: true }), null, 2));
}
// --json FICHERO: lo sin revisar, entero, para estudiarlo fuera.
if (arg('--json')) fs.writeFileSync(arg('--json'), JSON.stringify(sinCubrir, null, 1));
// En GitHub Actions, cada fallo también como anotación: las anotaciones se
// leen sin iniciar sesión (la API pública de check-runs), los logs no. Sin
// esto, un fallo que solo aparece con el Chromium de la CI no se podía ver
// desde fuera (octubre de 2026: Pages dejó de desplegar sin saberse por qué).
if (process.env.GITHUB_ACTIONS) {
  const anotar = (titulo, texto) => console.log(`::error title=${titulo}::${String(texto).replace(/%/g, '%25').replace(/\r?\n/g, '%0A')}`);
  for (const v of agrupar(sinCubrir, (x) => `${x.tipo}|${x.componente}|${x.regla}|${x.objetivo}`, (x) => `${x.tema}/${x.modo}`)) {
    anotar(`sitio · ${v.componente} · ${v.regla}`, `${v.tipo} — ${[...v.donde].join(', ')}\n${v.objetivo}\n${String(v.resumen).split('\n').slice(0, 3).join('\n')}${v.medida ? `\nmedido: ${v.medida.error || `${v.medida.ratio}:1 (${v.medida.fg} sobre ${v.medida.bg}, mínimo ${v.medida.requerido}:1)`}` : ''}`);
  }
  for (const f of agrupar(fallos, (x) => `${x.prueba}|${x.componente}|${x.detalle}`, (x) => x.donde)) {
    anotar(`sitio · ${f.componente} · ${f.prueba}`, `${[...f.donde].join(', ')}\n${f.detalle}`);
  }
  for (const e of muertas) anotar('sitio · axe-excepciones.json', `la excepción ${e.regla} de ${e.componente} (${e.selector || e.dentro}) ya no cubre nada`);
}
const total = sinCubrir.length + fallos.length + muertas.length;
console.log(total ? '' : '\n   Las cuatro páginas pasan axe a 375 y 1280 px en los dos modos, y el cajón móvil se usa con el teclado.\n');
process.exitCode = total ? 1 : 0;
