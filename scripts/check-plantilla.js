#!/usr/bin/env node
/**
 * SYX — La plantilla de temas, compilada y revisada como un tema más
 * ──────────────────────────────────────────────────────────────────
 * scss/themes/_template/ es de donde sale cada tema nuevo, y hasta octubre de
 * 2026 no la compilaba nada: el guion bajo la dejaba fuera de todos los
 * guardianes de temas. Compilada a mano salía SIN modo oscuro (cero bloques
 * prefers-color-scheme), con 17 de sus 72 declaraciones sin lector —los dos
 * colores de marca que decía «customize these» incluidos— y con trece líneas
 * de texto mal codificado. Todo tema nuevo heredaba eso.
 *
 * QUÉ HACE
 * Copia el árbol a un directorio temporal (scss/, scripts/, contracts/ y lo
 * que leen los guardianes; node_modules enlazado), instancia la plantilla
 * como un tema más siguiendo sus propias instrucciones —copiar la carpeta y
 * cambiar «template» por el nombre— y la compila dos veces:
 *
 *   plantilla-prueba   tal cual, como la usaría un producto (sin la capa del
 *                      sitio). Sobre ella:
 *       · check:themes --strict     las dos entradas al modo oscuro
 *       · check:modo-claro          elegir modo no depende del SO
 *       · check:contraste           WCAG 2.2 AA en los cuatro estados
 *       · cada declaración de la plantilla la lee el sistema (sin la
 *         excepción de API de check:consumidores: la plantilla es el
 *         contrato MÍNIMO, y una línea que solo sirve a una aplicación
 *         hipotética no es mínima)
 *       · no falta nada de lo que declaran TODOS los temas reales y el
 *         sistema lee (iconos, grosor del foco…)
 *   plantilla-sitio    con la capa del sitio activada como dice su _setup:
 *       · check:setups --temas example-01,plantilla-sitio   las mismas
 *         clases que un tema real
 *
 * Los guardianes se ejecutan desde la COPIA (sus propios scripts/, con su
 * ROOT), así que miden la plantilla y nada más: en el css/ de la copia solo
 * están las hojas de la plantilla.
 *
 * Uso: node scripts/check-plantilla.js [--conservar]   ·   npm run check:plantilla
 * (Auditoría 2026-10 · acción 14)
 */

'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const sass = require('sass');
const { revisarTema, vivosEn } = require('./lib/consumo-tema');
const postcss = require('postcss');

const conservar = process.argv.includes('--conservar');
const TEMA = 'plantilla-prueba';
const SITIO = 'plantilla-sitio';
const REFERENCIA = 'example-01';

// ─── 1 · Copia del árbol ─────────────────────────────────────────────────────

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'syx-plantilla-'));
for (const d of ['scss', 'scripts', 'contracts', 'js']) fs.cpSync(path.join(ROOT, d), path.join(tmp, d), { recursive: true });
for (const f of ['package.json']) fs.copyFileSync(path.join(ROOT, f), path.join(tmp, f));
fs.symlinkSync(path.join(ROOT, 'node_modules'), path.join(tmp, 'node_modules'), 'dir');
fs.mkdirSync(path.join(tmp, 'css'));

// ─── 2 · Instanciar la plantilla, como dice ella misma ──────────────────────

const PLANTILLA = path.join(tmp, 'scss', 'themes', '_template');
function instanciar(nombre, { sitio }) {
  const dir = path.join(tmp, 'scss', 'themes', nombre);
  fs.mkdirSync(dir);
  for (const f of ['_theme.scss', '_setup.scss']) {
    let s = fs.readFileSync(path.join(PLANTILLA, f), 'utf8').replace(/\btemplate\b/g, nombre);
    if (sitio) {
      // Las dos líneas que el _setup de la plantilla dice descomentar.
      s = s.replace(/^\/\/ (@use '\.\.\/\.\.\/site\/bundle-site' as \*;)/m, '$1')
        .replace(new RegExp(`^// (@include syx-bundle-site\\(${nombre}\\);)`, 'm'), '$1');
    }
    fs.writeFileSync(path.join(dir, f), s);
  }
  // Punto de entrada, igual que los de los temas reales.
  const entrada = fs.readFileSync(path.join(ROOT, 'scss', `styles-theme-${REFERENCIA}.scss`), 'utf8').replaceAll(REFERENCIA, nombre);
  fs.writeFileSync(path.join(tmp, 'scss', `styles-theme-${nombre}.scss`), entrada);
}
instanciar(TEMA, { sitio: false });
instanciar(SITIO, { sitio: true });
// El tema real de referencia, para compararle las clases.
fs.copyFileSync(path.join(ROOT, 'scss', `styles-theme-${REFERENCIA}.scss`), path.join(tmp, 'scss', `styles-theme-${REFERENCIA}.scss`));

const casos = [];
const comprobar = (nombre, fn) => casos.push({ nombre, fn });
let cssTema = null;

comprobar('la plantilla compila como un tema', () => {
  const r = sass.compile(path.join(tmp, 'scss', `styles-theme-${TEMA}.scss`), { style: 'expanded', loadPaths: [path.join(tmp, 'scss')] });
  cssTema = r.css;
  fs.writeFileSync(path.join(tmp, 'css', `styles-theme-${TEMA}.css`), cssTema);
  const oscuros = (cssTema.match(/@media\s*\(prefers-color-scheme:\s*dark\)/g) || []).length;
  if (!oscuros) throw new Error('0 bloques prefers-color-scheme: la plantilla no trae modo oscuro');
  return `${(cssTema.length / 1024).toFixed(0)} KB · ${oscuros} bloque(s) de oscuro automático`;
});

// ─── 3 · Los guardianes de los temas, sobre la copia ────────────────────────

function guardian(script, args = []) {
  const r = spawnSync(process.execPath, [path.join(tmp, 'scripts', script), ...args], { cwd: tmp, encoding: 'utf8' });
  if (r.status !== 0) {
    const salida = `${r.stdout || ''}${r.stderr || ''}`.split('\n').filter((l) => /❌|⚠️|→|Error|^\s*(falta|sobra)\s/.test(l)).slice(0, 12).join('\n      ');
    throw new Error(`${script} falla:\n      ${salida || '(sin detalle)'}`);
  }
  // El resumen: la línea que habla de la plantilla, o la última.
  const lineas = (r.stdout || '').trim().split('\n').filter(Boolean);
  const propia = lineas.find((l) => l.includes(TEMA) || l.includes(SITIO));
  return (propia || lineas.pop() || '').replace(/^\s*✅\s*/, '').trim();
}

comprobar('check:themes --strict — las dos entradas al modo oscuro', () => guardian('check-theme-symmetry.js', ['--strict']));
comprobar('check:modo-claro — elegir modo no depende del sistema operativo', () => guardian('check-modo-claro.js'));
comprobar('check:contraste — WCAG 2.2 AA en los cuatro estados', () => guardian('check-contraste.js'));
comprobar(`check:setups — las mismas clases que ${REFERENCIA} (con la capa del sitio)`, () => guardian('check-setups.js', ['--temas', `${REFERENCIA},${SITIO}`]));

// ─── 4 · Cada línea de la plantilla tiene lector ────────────────────────────

comprobar('cada declaración de la plantilla la lee el sistema', () => {
  if (!cssTema) throw new Error('no compiló');
  // Sin páginas ni excepción de API: el contrato mínimo se mide contra el
  // sistema solo (ver la cabecera).
  const r = revisarTema({ root: tmp, dirTema: path.join(tmp, 'scss', 'themes', TEMA), css: cssTema, externos: new Set(), api: new Set() });
  if (r.sinConsumidor.length) {
    throw new Error(`${r.sinConsumidor.length} sin lector: ${r.sinConsumidor.map((x) => `${x.token} (${x.file.replace(TEMA, '_template')}:${x.line})`).join(', ')}`);
  }
  return `${r.declaradas} declaraciones, todas con lector`;
});

// ─── 5 · No le falta nada de lo que declaran todos los temas ────────────────

comprobar('no le falta nada que declaren todos los temas reales y el sistema lea', () => {
  if (!cssTema) throw new Error('no compiló');
  const declarados = (css) => {
    const s = new Set();
    postcss.parse(css).walkDecls((d) => { if (d.prop.startsWith('--')) s.add(d.prop); });
    return s;
  };
  const reales = fs.readdirSync(path.join(ROOT, 'css')).filter((f) => /^styles-theme-.+\.css$/.test(f));
  if (!reales.length) throw new Error('no hay temas compilados en css/: ejecuta npm run build');
  const porTema = reales.map((f) => declarados(fs.readFileSync(path.join(ROOT, 'css', f), 'utf8')));
  const enTodos = [...porTema[0]].filter((t) => porTema.every((s) => s.has(t)));
  const propios = declarados(cssTema);
  const leidos = vivosEn(cssTema);
  const faltan = enTodos.filter((t) => !propios.has(t) && leidos.has(t));
  if (faltan.length) throw new Error(`el sistema los lee y la plantilla no los declara: ${faltan.join(', ')}`);
  return `de los ${enTodos.filter((t) => leidos.has(t)).length} que declaran los ${reales.length} temas y el sistema lee, no falta ninguno`;
});

// ─── Informe ────────────────────────────────────────────────────────────────

console.log('\n── LA PLANTILLA DE TEMAS, COMO UN TEMA MÁS ─────────────────────\n');
let fallos = 0;
for (const c of casos) {
  try {
    const d = c.fn();
    console.log(`✅ ${c.nombre}${d ? ` — ${d}` : ''}`);
  } catch (e) {
    fallos++;
    console.log(`❌ ${c.nombre}\n      ${e.message}`);
  }
}
if (conservar) console.log(`\n   Copia conservada en ${tmp}`);
else fs.rmSync(tmp, { recursive: true, force: true });
console.log(`\n   ${casos.length - fallos}/${casos.length} comprobaciones\n`);
process.exit(fallos ? 1 : 0);
