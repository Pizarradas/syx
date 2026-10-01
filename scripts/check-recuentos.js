#!/usr/bin/env node
/**
 * SYX — Recuentos de componentes contra el registro
 * ────────────────────────────────────────────────
 * Busca en la documentación toda cifra escrita junto a «components»,
 * «atoms», «molecules», «organisms» (y sus formas en español) y la compara con
 * component-registry.json, que es la única fuente.
 *
 * POR QUÉ EXISTE
 * Medido en la auditoría de octubre de 2026 (acción 11), el mismo día y sobre
 * el mismo registro de 30 componentes: home y why-syx decían 26, docs 30 y 34,
 * el README «6 molecules», CLAUDE.md y AGENTS.md también 6, el README del
 * storybook 26 y why-syx, en otra tarjeta, 38. Cada cifra fue verdad el día que
 * se escribió; ninguna tenía quien la vigilara. Quien adopta SYX no sabe cuál
 * creer, y un agente que lee CLAUDE.md razona sobre un inventario que no existe.
 *
 * QUÉ CUENTA
 *   components · componentes        el total
 *   atoms · átomos                  la capa atoms
 *   molecules · moléculas           la capa molecules
 *   organism(s) · organismo(s)      la capa organisms
 * Solo con la cifra pegada al sustantivo («30 components», «19 atoms»): así
 * «2–5 atoms → molecule» (una regla, no un recuento) o «64 component tokens»
 * no entran. Una cifra que no es un recuento del sistema se reescribe para que
 * no lo parezca; no hay lista de excepciones, porque sería el sitio donde
 * volverían a esconderse las cifras viejas.
 *
 * DÓNDE MIRA
 * Las páginas raíz, los .md raíz salvo CHANGELOG (es historia: sus cifras
 * fueron verdad en su versión), scss/, _agents/, mind-system/ salvo los
 * DESIGN.md de terceros en knowledges/vendors, y el README y la portada del
 * storybook. docs/decisions/ tampoco: un ADR fecha lo que se decidió entonces.
 *
 * Uso:
 *   node scripts/check-recuentos.js         falla si alguna cifra no cuadra
 *   node scripts/check-recuentos.js --fix   las reescribe con las del registro
 */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const registro = JSON.parse(fs.readFileSync(path.join(ROOT, 'component-registry.json'), 'utf8'));
const cuenta = {
  atoms: (registro.atoms || []).length,
  molecules: (registro.molecules || []).length,
  organisms: (registro.organisms || []).length,
};
cuenta.total = cuenta.atoms + cuenta.molecules + cuenta.organisms;

const CAPA = {
  components: 'total', component: 'total', componentes: 'total', componente: 'total',
  atoms: 'atoms', atom: 'atoms', 'átomos': 'atoms', 'átomo': 'atoms',
  molecules: 'molecules', molecule: 'molecules', 'moléculas': 'molecules', 'molécula': 'molecules',
  organisms: 'organisms', organism: 'organisms', organismos: 'organisms', organismo: 'organisms',
};
// Cifra precedida de nada que la haga parte de un rango o de otra cifra
// («2–5», «v4.28», «1/2»), y sustantivo NO seguido de «token(s)».
const PATRON = /(?<![\d–\-.+/:#])\b(\d+)(\s+)(components?|componentes?|atoms?|átomos?|molecules?|moléculas?|organisms?|organismos?)(?![\p{L}\d-])(?!\s+tokens?\b)/giu;

function* recorrer(dir, filtro) {
  if (!fs.existsSync(dir)) return;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (['node_modules', 'storybook-static', 'vendors'].includes(e.name)) continue;
      yield* recorrer(p, filtro);
    } else if (filtro(e.name)) yield p;
  }
}

function ficheros() {
  const raiz = fs.readdirSync(ROOT)
    .filter((f) => (/\.html$/.test(f) || /\.md$/.test(f)) && f !== 'CHANGELOG.md')
    .map((f) => path.join(ROOT, f));
  const md = (n) => n.endsWith('.md');
  return [
    ...raiz,
    ...recorrer(path.join(ROOT, 'scss'), md),
    ...recorrer(path.join(ROOT, '_agents'), md),
    ...recorrer(path.join(ROOT, 'mind-system'), md),
    path.join(ROOT, 'storybook', 'README.md'),
    path.join(ROOT, 'storybook', 'site-index.html'),
  ].filter((f) => fs.existsSync(f));
}

const fix = process.argv.includes('--fix');
const fallos = [];
let vistos = 0;

for (const f of ficheros()) {
  const texto = fs.readFileSync(f, 'utf8');
  const nuevo = texto.replace(PATRON, (m, n, esp, sust, off) => {
    // «630 component, 59 other» es un adjetivo, no un recuento: el singular
    // solo cuenta con un 1 delante («1 organism»).
    if (+n !== 1 && !/s$/i.test(sust)) return m;
    vistos++;
    const capa = CAPA[sust.toLowerCase()];
    if (+n === cuenta[capa]) return m;
    const linea = texto.slice(0, off).split('\n').length;
    fallos.push(`${path.relative(ROOT, f)}:${linea}  «${m.replace(/\s+/g, ' ')}» — el registro dice ${cuenta[capa]}`);
    return `${cuenta[capa]}${esp}${sust}`;
  });
  if (fix && nuevo !== texto) fs.writeFileSync(f, nuevo);
}

console.log('\n── RECUENTOS DE COMPONENTES ────────────────────────────────────\n');
console.log(`   registro            ${cuenta.total} componentes · ${cuenta.atoms} átomos · ${cuenta.molecules} moléculas · ${cuenta.organisms} organismos`);
console.log(`   cifras leídas       ${vistos}\n`);

if (fallos.length) {
  console.log(`${fix ? '🔧 Reescritas' : '❌ No cuadran con el registro'} (${fallos.length}):`);
  for (const x of fallos) console.log(`   · ${x}`);
  if (!fix) console.log('\n   Corrige con: node scripts/check-recuentos.js --fix\n');
  process.exit(fix ? 0 : 1);
}
console.log('✅ Toda cifra de componentes escrita coincide con el registro.\n');
