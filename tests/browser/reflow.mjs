#!/usr/bin/env node
/**
 * SYX — Reflow a 320 px y tamaño de los objetivos
 * ───────────────────────────────────────────────
 * WCAG 1.4.10 pide que el contenido se lea a 320 px CSS de ancho (un móvil
 * pequeño, o 1280 px al 400 % de zoom) sin desplazarse en dos direcciones.
 * axe no lo mide: no cambia el ancho de la ventana. Hasta octubre de 2026
 * tampoco lo medía nada aquí, y docs.html medía 720 px de ancho en una
 * ventana de 320 (auditoría 2026-10, acción 8). Esto comprueba:
 *
 *   REFLOW (1.4.10)  a 320 px, ni la página de componentes (cada `usage`, en
 *                    cada tema) ni las cuatro páginas del sitio se desplazan
 *                    en horizontal. Lo único que puede desbordar es lo que
 *                    vive DENTRO de un contenedor con scroll previsto
 *                    (overflow-x: auto | scroll que cabe él mismo): una tabla
 *                    responsiva, un bloque de código, la fila de pestañas.
 *                    1.4.10 los exime: su contenido necesita dos dimensiones.
 *   OBJETIVOS (2.5.8) a 320 px, la regla target-size de axe (24 × 24 px o
 *                    su excepción de espaciado), que en run.mjs solo se pasa
 *                    al ancho de escritorio.
 *
 * Uso (desde la raíz, con el CSS y dist/ generados):
 *   node tests/browser/reflow.mjs [--temas a,b] [--solo-componentes | --solo-paginas]
 *                                 [--ancho N]   (otro ancho; 320 es el de WCAG)
 */

import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { ROOT, MODOS, arg, bandera, temas as leerTemas, servir, lanzar, abrirComponentes, PAGINAS, contextoDePagina, agrupar } from './lib/comun.mjs';

const require = createRequire(import.meta.url);
const ANCHO = Number(arg('--ancho')) || 320;
const temas = leerTemas();
const fallos = [];

/**
 * Lo que sale del ancho de la ventana sin estar dentro de un contenedor con
 * scroll previsto. Devuelve el ancho del documento y los culpables (los más
 * internos: de una celda que desborda no se acusa también a su tabla).
 */
const desbordes = (page) => page.evaluate((ancho) => {
  const conScroll = (el) => {
    const cs = getComputedStyle(el);
    return /(auto|scroll)/.test(cs.overflowX) && el.getBoundingClientRect().right <= ancho + 1;
  };
  const culpables = [];
  for (const el of document.body.querySelectorAll('*')) {
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    // Lo que desborda puede ser texto, no una caja: una palabra larga dentro
    // de una celda no tiene rectángulo propio, pero ensancha la página. Se
    // cuenta el desborde del contenido de cada elemento que no lo recorta.
    const derecha = Math.max(r.right, cs.overflowX === 'visible' ? r.left + el.scrollWidth : 0);
    if (r.width === 0 || derecha <= ancho + 1) continue;
    if (cs.position === 'fixed' && cs.visibility === 'hidden') continue;
    // Dentro de un contenedor con scroll o recortado (overflow hidden/clip):
    // no ensancha la página.
    let p = el.parentElement, contenido = false;
    while (p && p !== document.body) {
      const pcs = getComputedStyle(p);
      if (conScroll(p) || (/(hidden|clip)/.test(pcs.overflowX) && p.getBoundingClientRect().right <= ancho + 1)) { contenido = true; break; }
      p = p.parentElement;
    }
    if (contenido) continue;
    culpables.push({ el, r: { right: derecha } });
  }
  // Los más internos: si una celda desborda, también desbordan su fila, su
  // tabla y su sección, pero la culpa es de la celda.
  const internos = culpables.filter((c) => !culpables.some((o) => o !== c && c.el.contains(o.el)));
  culpables.length = 0;
  culpables.push(...internos);
  return {
    ancho: document.documentElement.scrollWidth,
    culpables: culpables.slice(0, 8).map(({ el, r }) => {
      const sec = el.closest('[data-componente]');
      const id = el.id ? `#${el.id}` : '';
      return { componente: sec ? sec.dataset.componente : null, que: `${el.tagName.toLowerCase()}${id}${[...el.classList].slice(0, 2).map((c) => `.${c}`).join('')}`, derecha: Math.round(r.right) };
    }),
  };
}, ANCHO);

async function objetivos(page) {
  await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });
  return page.evaluate(async () => {
    const r = await window.axe.run(document, { runOnly: { type: 'rule', values: ['target-size'] }, resultTypes: ['violations'] });
    return r.violations.flatMap((v) => v.nodes.map((n) => {
      const el = document.querySelector(n.target[0]);
      const sec = el && el.closest('[data-componente]');
      return { componente: sec ? sec.dataset.componente : null, que: n.target.join(' '), detalle: (n.any[0] || {}).message || n.failureSummary };
    }));
  });
}

const { srv, base } = await servir();
const navegador = await lanzar();

// ─── Componentes ─────────────────────────────────────────────────────────────

if (!bandera('--solo-paginas')) {
  console.log(`\n── REFLOW A ${ANCHO} PX · componentes · ${temas.length} temas × ${MODOS.length} modos ──\n`);
  const page = await navegador.newPage({ viewport: { width: ANCHO, height: 640 }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
  for (const tema of temas) {
    for (const modo of MODOS) {
      await abrirComponentes(page, base, tema, modo);
      // El andamio de la página de pruebas (24 px de margen y 16 de relleno
      // por sección) dejaba 240 px: a 320 una página real deja un margen,
      // no tres. Se deja el de una sección.
      await page.addStyleTag({ content: 'body { padding: 0 !important; } .prueba { padding: 16px !important; }' });
      const antes = fallos.length;
      const d = await desbordes(page);
      for (const c of d.culpables) fallos.push({ prueba: 'reflow', donde: `${tema}/${modo}`, componente: c.componente || '(página)', que: c.que, detalle: `llega a ${c.derecha} px en una ventana de ${ANCHO}` });
      for (const o of await objetivos(page)) fallos.push({ prueba: 'objetivo', donde: `${tema}/${modo}`, componente: o.componente || '(página)', que: o.que, detalle: o.detalle });
      console.log(`${fallos.length > antes ? '❌' : '✅'} ${tema.padEnd(12)} ${modo.padEnd(5)} ancho del documento ${d.ancho} px${fallos.length > antes ? ` · ${fallos.length - antes} fallo(s)` : ''}`);
    }
  }
  await page.close();
}

// ─── Páginas del sitio ───────────────────────────────────────────────────────

if (!bandera('--solo-componentes')) {
  if (!fs.existsSync(path.join(ROOT, 'dist', 'site', 'site.min.css'))) {
    console.error('❌ No hay dist/site/: npm run build (o build:dist) en la raíz.');
    process.exit(2);
  }
  console.log(`\n── REFLOW A ${ANCHO} PX · páginas del sitio ──\n`);
  for (const pagina of PAGINAS) {
    for (const modo of MODOS) {
      const ctx = await contextoDePagina(navegador, base, { tema: null, modo, ancho: ANCHO, alto: 640 });
      const page = await ctx.newPage();
      await page.goto(`${base}/${pagina}.html`, { waitUntil: 'networkidle' });
      await page.evaluate(() => document.fonts.ready);
      const antes = fallos.length;
      const d = await desbordes(page);
      for (const c of d.culpables) fallos.push({ prueba: 'reflow', donde: modo, componente: `${pagina}.html`, que: c.que, detalle: `llega a ${c.derecha} px en una ventana de ${ANCHO}` });
      if (d.ancho > ANCHO && !d.culpables.length) fallos.push({ prueba: 'reflow', donde: modo, componente: `${pagina}.html`, que: 'documento', detalle: `mide ${d.ancho} px de ancho` });
      for (const o of await objetivos(page)) fallos.push({ prueba: 'objetivo', donde: modo, componente: `${pagina}.html`, que: o.que, detalle: o.detalle });
      console.log(`${fallos.length > antes ? '❌' : '✅'} ${pagina.padEnd(14)} ${modo.padEnd(5)} ancho del documento ${d.ancho} px${fallos.length > antes ? ` · ${fallos.length - antes} fallo(s)` : ''}`);
      await ctx.close();
    }
  }
}

await navegador.close();
srv.close();

if (fallos.length) {
  console.log('\n── Fallos ──');
  for (const f of agrupar(fallos, (x) => `${x.prueba}|${x.componente}|${x.que}`, (x) => x.donde)) {
    console.log(`\n❌ ${f.componente} · ${f.que} · ${f.prueba} — ${[...f.donde].join(', ')}`);
    console.log(`   ${f.detalle}`);
  }
  console.log('');
  process.exitCode = 1;
} else {
  console.log(`\n   Nada se desplaza en horizontal a ${ANCHO} px y todos los objetivos miden 24 × 24 o tienen su espacio.\n`);
}
