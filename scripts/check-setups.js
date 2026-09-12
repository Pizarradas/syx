#!/usr/bin/env node
/**
 * check-setups.js — guard del esquema de setups generados.
 *
 * La promesa del esquema _setup.scss → syx-bundle-full es que los siete
 * temas compilan EXACTAMENTE el mismo conjunto de clases (solo cambian los
 * valores). Este check la convierte en compilación: compila los siete
 * entry points de raíz con la API de Sass y compara los conjuntos de
 * selectores de nivel de regla entre temas. Cualquier selector que exista
 * en un tema y no en otro es una asimetría — la clase de fallo que
 * documenta _shared/_core.scss ("ningún bundle compilaba en ningún tema")
 * y que antes solo se descubría mirando el CSS.
 *
 * También falla si algún bundle-*.scss vuelve a declarar @font-face a mano
 * (@include font-family fuera de _theme.scss): la lista de fuentes vive en
 * theme-x-fonts(), una vez por tema.
 *
 * Uso: node scripts/check-setups.js   (npm run check:setups)
 */
const fs = require('fs');
const path = require('path');
const sass = require('sass');

const ROOT = path.resolve(__dirname, '..');
const THEMES = ['example-01', 'example-02', 'example-03', 'example-04', 'example-05', 'example-06', 'syx-sketch'];

function selectorSet(css) {
  const set = new Set();
  css
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/([^{}@;]+)\{/g, (m, sel) => {
      set.add(sel.trim().replace(/\s+/g, ' '));
      return '';
    });
  return set;
}

console.log('\n── SIMETRÍA DE SETUPS ──────────────────────────────────────\n');

let failures = 0;

// 1. Ningún bundle-*.scss con @font-face a mano
const bundleOffenders = [];
for (const t of THEMES) {
  const dir = path.join(ROOT, 'scss', 'themes', t);
  for (const f of fs.readdirSync(dir).filter((f) => /^bundle-.*\.scss$/.test(f))) {
    const c = fs.readFileSync(path.join(dir, f), 'utf8');
    if (/^\s*@include font-family\(/m.test(c)) bundleOffenders.push(`themes/${t}/${f}`);
  }
}
if (bundleOffenders.length) {
  failures++;
  console.log('❌ bundles con @include font-family a mano (la lista vive en theme-x-fonts()):');
  bundleOffenders.forEach((f) => console.log('   → ' + f));
} else {
  console.log('✅ 0 bundles con @font-face a mano — las fuentes viven en theme-x-fonts()');
}

// 2. Mismo conjunto de selectores en los siete entry points
const sets = {};
for (const t of THEMES) {
  const entry = path.join(ROOT, 'scss', `styles-theme-${t}.scss`);
  const result = sass.compile(entry, { style: 'expanded', loadPaths: [path.join(ROOT, 'scss')] });
  sets[t] = selectorSet(result.css);
}
const ref = sets[THEMES[0]];
let asym = 0;
for (const t of THEMES.slice(1)) {
  const missing = [...ref].filter((s) => !sets[t].has(s));
  const extra = [...sets[t]].filter((s) => !ref.has(s));
  // Los preludios de at-rule (@media de modo oscuro, @supports de color
  // relativo…) son identidad del tema y pueden variar; la promesa del
  // esquema es sobre los SELECTORES: mismas clases en todos los temas.
  const atRule = (s) => /^(media|supports|container|layer)\b/.test(s);
  const realMissing = missing.filter((s) => !atRule(s));
  const realExtra = extra.filter((s) => !atRule(s));
  if (realMissing.length || realExtra.length) {
    asym++;
    failures++;
    console.log(`❌ ${t} vs ${THEMES[0]}:`);
    realMissing.slice(0, 5).forEach((s) => console.log('   falta  ' + s));
    realExtra.slice(0, 5).forEach((s) => console.log('   sobra  ' + s));
  }
}
if (!asym) {
  console.log(`✅ ${THEMES.length} temas × ${ref.size} selectores — conjuntos idénticos (solo cambian los valores)`);
}

console.log('');
process.exit(failures ? 1 : 0);
