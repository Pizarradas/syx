#!/usr/bin/env node
/**
 * SYX — Las reglas de contrato, sobre el CSS que Sass emite
 * ─────────────────────────────────────────────────────────
 * El motor de reglas (lib/rules.js) lee el SCSS: es lo que permite avisar a
 * un agente ANTES de escribir y señalar la línea exacta. Pero el SCSS no es
 * lo que se entrega, y Sass puede disfrazarlo: en la auditoría de octubre II
 * pasaron toda la cadena `position: $p`, `#{'transition'}: …`,
 * `unquote('!important')`, `var(--#{'primitive'}-…)`, un mapa recorrido con
 * @each que emite primitivos, `rebeccapurple` o un `oklch(from …)` con los
 * tres canales a mano. Ninguna de esas formas sobrevive a la compilación: en
 * el CSS emitido son `position: sticky`, `transition: …`, `!important`…
 *
 * Así que esto compila cada punto de entrada CON MAPA DE FUENTES y aplica
 * R01, R02, R03, R04 y R11 a cada declaración emitida, con los mismos
 * comparadores del motor (lib/rules.js, leídos de contracts/rules.json). Los
 * permisos siguen siendo los del contrato y se deciden en el ORIGEN de la
 * declaración, que da el mapa: una `transition` que escribe el mixin
 * transition() nace en scss/abstracts/mixins/ (R03.allowedIn) y vale; la
 * misma `transition` interpolada en un átomo nace en el átomo y no. Una
 * excepción en línea (`// syx-allow Rxx: porqué`) vale si está encima de la
 * línea de origen, como en el fuente.
 *
 * No escribe nada: compila en memoria, no toca css/.
 *
 * Uso: node scripts/check-compilado.js [--entrada scss/x.scss]   ·   npm run check:compilado
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { pathToFileURL, fileURLToPath } = require('url');
const sass = require('sass');
const postcss = require('postcss');
const { SourceMapConsumer } = require('source-map-js');
const { crearMotor } = require('./lib/rules');

const ROOT = path.join(__dirname, '..');
const REGLAS = ['R01', 'R02', 'R03', 'R04', 'R11'];

const args = process.argv.slice(2);
const entradaArg = args.includes('--entrada') ? args[args.indexOf('--entrada') + 1] : null;
const entradas = entradaArg
  ? [entradaArg]
  : fs.readdirSync(path.join(ROOT, 'scss'))
    .filter((f) => f.endsWith('.scss') && !f.startsWith('_'))
    .map((f) => `scss/${f}`).sort();

const motor = crearMotor({ root: ROOT });
const reglas = REGLAS.map((id) => motor.porId[id]);
const directiva = motor.exc.directive;

// Las líneas de cada fuente, para buscar la excepción en línea encima del origen.
const lineasDe = new Map();
function lineas(rel) {
  if (!lineasDe.has(rel)) {
    const f = path.join(ROOT, rel);
    lineasDe.set(rel, fs.existsSync(f) ? fs.readFileSync(f, 'utf8').split('\n') : []);
  }
  return lineasDe.get(rel);
}
/** ¿Hay un `// syx-allow <id>: …` en el comentario justo encima de la línea? */
function excusadaEnLinea(rel, linea, id) {
  const ls = lineas(rel);
  for (let i = linea - 2; i >= 0; i--) {
    const t = ls[i].trim();
    if (!t) continue;
    if (!t.startsWith('//') && !t.startsWith('/*') && !t.startsWith('*')) return false;
    if (new RegExp(`${directiva}\\s+${id}\\s*:`).test(t)) return true;
  }
  return false;
}

/** La capa `@layer` que envuelve un nodo, o «(sin capa)». */
function capaDe(nodo) {
  const capas = [];
  for (let p = nodo.parent; p; p = p.parent) if (p.type === 'atrule' && p.name === 'layer') capas.unshift(p.params);
  return capas.join('.') || '(sin capa)';
}
const selectorDe = (nodo) => {
  for (let p = nodo.parent; p; p = p.parent) if (p.type === 'rule') return p.selector;
  return ':root';
};

const fallos = [];
let declaraciones = 0;

for (const entrada of entradas) {
  const abs = path.join(ROOT, entrada);
  const r = sass.compile(abs, { sourceMap: true, sourceMapIncludeSources: false, style: 'expanded', silenceDeprecations: ['import'] });
  const mapa = new SourceMapConsumer(r.sourceMap);
  const raiz = postcss.parse(r.css);
  raiz.walkDecls((decl) => {
    declaraciones++;
    const pos = decl.source && decl.source.start;
    const o = pos ? mapa.originalPositionFor({ line: pos.line, column: pos.column - 1 }) : null;
    let origen = null;
    if (o && o.source) {
      const f = o.source.startsWith('file:') ? fileURLToPath(o.source) : path.resolve(path.dirname(abs), o.source);
      origen = path.relative(ROOT, f).split(path.sep).join('/');
    }
    // El nodo emitido, con lo que el motor necesita ver.
    const nodo = { type: 'decl', prop: decl.prop, value: decl.value, important: decl.important, parent: null };
    for (const regla of reglas) {
      const motivo = motor.comprobarNodo(regla, nodo);
      if (!motivo) continue;
      if (!origen) { fallos.push({ entrada, regla: regla.id, motivo, donde: `${capaDe(decl)} ${selectorDe(decl)}`, origen: '(sin mapa)' }); continue; }
      // R11 en el fuente solo mira la capa de tokens de componente y los temas
      // (appliesIn). En lo emitido mira TODO --component-* que se entrega, venga
      // de donde venga (un átomo que declara uno con un literal es el mismo
      // atajo), salvo la capa del sitio, que tiene su propia regla.
      if (regla.id === 'R11' ? origen.startsWith('scss/site/') : !motor.aplicaA(regla, origen)) continue;
      if (motor.permitidoEn(regla, origen)) continue;
      if (regla.inlineException && excusadaEnLinea(origen, o.line, regla.id)) continue;
      fallos.push({ entrada, regla: regla.id, motivo, donde: `${capaDe(decl)} ${selectorDe(decl)}`, origen: `${origen}:${o.line}` });
    }
  });
}

// Una misma declaración de origen sale en todos los temas: se agrupa.
const grupos = new Map();
for (const f of fallos) {
  const k = `${f.regla}|${f.origen}|${f.motivo}`;
  if (!grupos.has(k)) grupos.set(k, { ...f, entradas: new Set() });
  grupos.get(k).entradas.add(path.basename(f.entrada));
}

if (grupos.size) {
  console.error(`✗ check:compilado — ${grupos.size} declaraciones emitidas incumplen el contrato\n`);
  for (const g of grupos.values()) {
    console.error(`  ${g.regla} ${g.origen} — ${g.motivo}`);
    console.error(`      en ${g.donde} · ${[...g.entradas].join(', ')}`);
  }
  process.exit(1);
}
console.log(`✓ check:compilado — ${entradas.length} puntos de entrada, ${declaraciones} declaraciones emitidas; ${REGLAS.join(', ')} se cumplen en lo que se entrega`);
