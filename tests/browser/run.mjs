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
 *                    o resultados incompletos que no estén revisados en
 *                    axe-excepciones.json. Los incompletos de contraste se
 *                    miden en píxeles (lib/pixeles.mjs). (Auditoría 2026-10 ·
 *                    acción 8)
 *   --proponer       con --axe: imprime, listas para revisar y pegar en
 *                    axe-excepciones.json, las entradas de los incompletos de
 *                    contraste que SÍ cumplen medidos en píxeles
 *   --capturas DIR   guarda una captura por componente, tema y modo en DIR,
 *                    para que comparar.mjs la enfrente con otra rama
 *   --rtl            monta la página con dir="rtl" (árabe, hebreo…): axe y
 *                    capturas en el sentido de derecha a izquierda. Las
 *                    capturas de --rtl contra las de una ejecución sin él
 *                    deben verse espejadas; contra --rtl de la rama base,
 *                    iguales. (Auditoría 2026-10 · acción 13)
 *   --hojas LISTA    pinta con otras hojas en vez de css/styles-theme-{tema}.css:
 *                    rutas separadas por comas, relativas a la raíz, con
 *                    {tema} sustituido. Sirve para fotografiar dist/ y probar
 *                    que podar y separar tokens no cambia un píxel:
 *                      --hojas dist/{tema}.full.min.css
 *                      --hojas dist/syx.components.min.css,dist/{tema}.tokens.min.css
 *
 * La página se construye desde component-registry.json (lib/comun.mjs): un
 * componente nuevo entra en las pruebas el día que entra en el registro, sin
 * tocar este fichero. foco.mjs y reflow.mjs miden sobre la misma página.
 *
 * Uso (desde la raíz del repositorio, con el CSS compilado):
 *   cd tests/browser && npm ci && npx playwright install chromium
 *   node run.mjs --axe
 *   node run.mjs --capturas out [--temas syx-sketch,example-01] [--raiz ../otro-arbol]
 *   node run.mjs --axe --rtl
 *   node run.mjs --capturas out-dist --hojas dist/{tema}.full.min.css
 *
 * (Auditoría 2026-09 · acción 17)
 */

import fs from 'node:fs';
import path from 'node:path';
import { ROOT, MODOS, arg, bandera, componentes as leerComponentes, temas as leerTemas, servir, lanzar, abrirComponentes, agrupar } from './lib/comun.mjs';
import { cargarExcepciones, pasarAxe, medirIncompletos, excepcionPara, proponer } from './lib/axe.mjs';

const componentes = leerComponentes();
const temas = leerTemas();
// Dirección del texto de la página. SYX escribe sus lados con propiedades
// lógicas (margin-inline-start, inset-inline-end…): en RTL los componentes
// se espejan solos, y esta opción es la forma de comprobarlo.
const DIR = bandera('--rtl') ? 'rtl' : 'ltr';
const HOJAS = (arg('--hojas') || 'css/styles-theme-{tema}.css').split(',').map((h) => h.trim()).filter(Boolean);
const hojasDe = (tema) => HOJAS.map((h) => h.replaceAll('{tema}', tema));

const conAxe = bandera('--axe');
const dirCapturas = arg('--capturas');
if (!conAxe && !dirCapturas) {
  console.error('Uso: node run.mjs --axe [--proponer] | --capturas DIR [--temas a,b] [--rtl]');
  process.exit(2);
}
const faltan = temas.flatMap(hojasDe).filter((h) => !fs.existsSync(path.join(ROOT, h)));
if (faltan.length) {
  console.error(`❌ No hay CSS compilado (${faltan[0]}): npm run build en la raíz.`);
  process.exit(2);
}
let excepciones = [];
try { excepciones = conAxe ? cargarExcepciones() : []; } catch (e) { console.error(`❌ ${e.message}`); process.exit(2); }

const { srv, base } = await servir({ pagina: { dir: DIR, hojas: HOJAS } });
const navegador = await lanzar();
const ctx = await navegador.newContext({ viewport: { width: 800, height: 600 }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
const page = await ctx.newPage();

const sinCubrir = [];
const usadas = new Set();
let exceptuadas = 0;
let capturas = 0;
console.log(`\n── SYX EN EL NAVEGADOR · ${componentes.length} componentes × ${temas.length} temas × ${MODOS.length} modos · ${DIR.toUpperCase()} ──\n`);

for (const tema of temas) {
  for (const modo of MODOS) {
    await abrirComponentes(page, base, tema, modo);

    if (conAxe) {
      const nodos = (await pasarAxe(page)).map((v) => ({ ...v, tema, modo }));
      await medirIncompletos(page, nodos);
      const reales = nodos.filter((v) => {
        const e = excepcionPara(v, excepciones, tema, modo);
        if (e) usadas.add(e);
        return !e;
      });
      sinCubrir.push(...reales);
      exceptuadas += nodos.length - reales.length;
      const nv = reales.filter((v) => v.tipo === 'violacion').length, ni = reales.length - nv;
      console.log(`${reales.length ? '❌' : '✅'} ${tema.padEnd(12)} ${modo.padEnd(5)} ${nv} violación(es) · ${ni} incompleto(s) sin revisar${nodos.length - reales.length ? ` · ${nodos.length - reales.length} revisado(s)` : ''}`);
      await page.evaluate(() => window.scrollTo(0, 0));
    }

    if (dirCapturas) {
      const dir = path.resolve(process.cwd(), dirCapturas, tema, modo);
      fs.mkdirSync(dir, { recursive: true });
      for (const c of componentes) {
        // Recorte de la página entera, no captura del elemento: la del
        // elemento desplaza la página hasta él, y un componente con
        // `position: sticky` (org-site-header) salía con medio píxel de
        // diferencia según desde dónde se hubiera desplazado. Con la página
        // entera no hay desplazamiento y dos ejecuciones dan los mismos bytes.
        const caja = await page.locator(`[data-componente="${c.name}"]`).boundingBox();
        const y0 = await page.evaluate(() => window.scrollY);
        await page.screenshot({
          path: path.join(dir, `${c.name}.png`), fullPage: true, animations: 'disabled', caret: 'hide',
          clip: { x: caja.x, y: caja.y + y0, width: caja.width, height: caja.height },
        });
        capturas++;
      }
    }
  }
}

await navegador.close();
srv.close();

if (dirCapturas) console.log(`\n   ${capturas} capturas en ${dirCapturas}/`);
if (conAxe) {
  // Una excepción que en una ejecución completa no cubre nada es un agujero:
  // la próxima violación con ese selector pasaría sin que nadie la mire.
  const completa = !arg('--temas') && !arg('--hojas') && DIR === 'ltr';
  const muertas = completa ? excepciones.filter((e) => !usadas.has(e) && !/\.html$/.test(e.componente)) : [];
  if (sinCubrir.length) {
    console.log('\n── Sin revisar ──');
    for (const v of agrupar(sinCubrir, (x) => `${x.tipo}|${x.componente}|${x.regla}|${x.objetivo}`, (x) => `${x.tema}/${x.modo}`)) {
      console.log(`\n❌ ${v.componente} · ${v.regla} · ${v.tipo}${v.impacto ? ` (${v.impacto})` : ''} — ${[...v.donde].join(', ')}`);
      console.log(`   ${v.objetivo}`);
      console.log(`   ${String(v.resumen).split('\n').slice(0, 3).join('\n   ')}`);
      if (v.medida) console.log(`   medido en píxeles: ${v.medida.error || `${v.medida.ratio}:1 (${v.medida.fg} sobre ${v.medida.bg}, mínimo ${v.medida.requerido}:1)`}`);
    }
  }
  for (const e of muertas) console.log(`\n❌ axe-excepciones.json: la excepción ${e.regla} de ${e.componente} (${e.selector}) ya no cubre nada: bórrala.`);
  if (bandera('--proponer')) {
    const caduca = new Date(Date.now() + 182 * 864e5).toISOString().slice(0, 10);
    console.log('\n── Propuestas para axe-excepciones.json (revísalas antes de pegarlas) ──\n');
    console.log(JSON.stringify(proponer(sinCubrir, caduca), null, 2));
  }
  if (!sinCubrir.length && !muertas.length) {
    console.log(`\n   0 violaciones ni incompletos sin revisar de WCAG 2.2 AA${exceptuadas ? ` · ${exceptuadas} revisado(s) en axe-excepciones.json` : ''}.`);
  }
  process.exitCode = sinCubrir.length || muertas.length ? 1 : 0;
}
console.log('');
