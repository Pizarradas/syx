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
 * (@include font-family o syx-font fuera de _theme.scss): la lista vive en
 * theme-x-fonts(), una vez por tema.
 *
 * Y falla si un tema nombra en --semantic-font-family-* una familia que no
 * carga. La primera familia de cada pila (ya resuelta, var() a var()) tiene
 * que venir de syx-font() / font-family() —hay un @font-face suyo en el CSS—,
 * de syx-font-external() —la marca «syx-font-external» que deja en el CSS
 * expandido, con su respaldo detrás en el token— o ser genérica o del
 * sistema. Las demás son respaldo y no se exigen, salvo «<Familia> Fallback»,
 * que solo existe si syx-font() la declaró.
 *
 * Uso: node scripts/check-setups.js [--temas a,b,…]   (npm run check:setups)
 *
 * --temas compara solo esos (el primero es la referencia). Lo usa
 * check:plantilla para enfrentar la plantilla, instanciada como un tema más
 * en una copia del árbol, con un tema real.
 */
const fs = require('fs');
const path = require('path');
const sass = require('sass');
const postcss = require('postcss');

const ROOT = path.resolve(__dirname, '..');
const iTemas = process.argv.indexOf('--temas');
const THEMES = iTemas !== -1
  ? process.argv[iTemas + 1].split(',').map((t) => t.trim()).filter(Boolean)
  : ['example-01', 'example-02', 'example-03', 'example-04', 'example-05', 'example-06', 'syx-sketch'];

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
    if (/^\s*@include (font-family|syx-font)\(/m.test(c)) bundleOffenders.push(`themes/${t}/${f}`);
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
const compilados = {};
for (const t of THEMES) {
  const entry = path.join(ROOT, 'scss', `styles-theme-${t}.scss`);
  const result = sass.compile(entry, { style: 'expanded', loadPaths: [path.join(ROOT, 'scss')] });
  compilados[t] = result.css;
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

// 3. Toda familia que nombra --semantic-font-family-* se carga o es del sistema
// Genéricas de CSS y familias que trae el sistema operativo (o sus alias):
// no hay nada que cargar. La lista es corta a propósito: una familia que no
// está aquí y se quiere usar sin cargar es justo lo que el guardián vigila.
const GENERICAS = new Set(['serif', 'sans-serif', 'monospace', 'cursive', 'fantasy', 'system-ui',
  'ui-serif', 'ui-sans-serif', 'ui-monospace', 'ui-rounded', 'math', 'emoji', 'fangsong']);
const SISTEMA = new Set(['-apple-system', 'blinkmacsystemfont', 'segoe ui', 'arial', 'arial narrow',
  'helvetica', 'helvetica neue', 'verdana', 'tahoma', 'trebuchet ms', 'impact', 'georgia',
  'times new roman', 'times', 'courier new', 'courier', 'menlo', 'monaco', 'consolas',
  'sf mono', 'sfmono-regular', 'lucida console', 'liberation sans', 'liberation serif', 'liberation mono']);

const sinComillas = (f) => f.trim().replace(/^(["'])(.*)\1$/, '$2').trim();
const pila = (valor) => valor.split(',').map(sinComillas).filter(Boolean);
const clave = (f) => f.toLowerCase();

function fuentesDelTema(css) {
  const root = postcss.parse(css);
  const caras = new Set();
  const externas = new Map(); // familia → respaldo registrado
  const enRaiz = new Map();   // --prop → último valor en :root
  const enOtros = [];         // [selector, --prop, valor] fuera de :root
  root.walkAtRules('font-face', (a) => a.walkDecls('font-family', (d) => caras.add(clave(sinComillas(d.value)))));
  root.walkComments((c) => {
    const m = /^syx-font-external:\s*(.+?);\s*fallback:\s*([^;]+)/.exec(c.text.trim());
    if (m) externas.set(clave(sinComillas(m[1])), pila(m[2]));
  });
  root.walkDecls(/^--/, (d) => {
    if (d.parent.type === 'rule' && d.parent.selector.trim() === ':root') enRaiz.set(d.prop, d.value);
    else if (/^--semantic-font-family-/.test(d.prop)) enOtros.push([d.parent.selector || '@' + d.parent.name, d.prop, d.value]);
  });
  const resolver = (valor) => {
    for (let i = 0; i < 10 && /var\(/.test(valor); i++) {
      valor = valor.replace(/var\(\s*(--[\w-]+)\s*(?:,\s*([^()]*))?\)/g, (m, prop, resp) =>
        enRaiz.has(prop) ? enRaiz.get(prop) : (resp !== undefined ? resp : m));
    }
    return valor;
  };
  const tokens = [...enRaiz].filter(([p]) => /^--semantic-font-family-/.test(p)).map(([p, v]) => [':root', p, v]).concat(enOtros);
  return { caras, externas, tokens, resolver };
}

let sinCargar = 0;
for (const t of THEMES) {
  const { caras, externas, tokens, resolver } = fuentesDelTema(compilados[t]);
  const fallos = [];
  for (const [sel, prop, valor] of tokens) {
    const resuelto = resolver(valor);
    const donde = sel === ':root' ? prop : `${prop} (${sel})`;
    if (/var\(/.test(resuelto)) { fallos.push(`${donde}: no se resuelve (${resuelto})`); continue; }
    const familias = pila(resuelto);
    const [primera] = familias;
    const k = clave(primera || '');
    const antes = fallos.length;
    if (!primera) fallos.push(`${donde}: pila vacía`);
    else if (externas.has(k)) {
      const resp = externas.get(k);
      const cola = familias.slice(1).map(clave).slice(-resp.length);
      if (cola.join(',') !== resp.map(clave).join(',')) {
        fallos.push(`${donde}: «${primera}» se registró con syx-font-external() y el respaldo «${resp.join(', ')}», pero el token acaba en «${familias.slice(1).join(', ')}»`);
      }
    } else if (!caras.has(k) && !GENERICAS.has(k) && !SISTEMA.has(k)) {
      fallos.push(`${donde}: nombra «${primera}» y el tema no la carga — syx-font() si está en $syx-fonts, syx-font-external() si se carga fuera`);
    }
    // Si la primera ya falló, su «Fallback» falla con ella: no se repite.
    for (const f of familias.slice(1)) {
      if (fallos.length > antes && clave(f) === k + ' fallback') continue;
      if (/ fallback$/i.test(f) && !caras.has(clave(f))) {
        fallos.push(`${donde}: «${f}» no existe — la declara syx-font("${f.replace(/ fallback$/i, '')}") y el tema no la llama`);
      }
    }
  }
  if (fallos.length) {
    sinCargar++;
    failures++;
    console.log(`❌ ${t}: familias tipográficas que el tema no carga`);
    fallos.forEach((f) => console.log('   → ' + f));
  }
}
if (!sinCargar) {
  console.log(`✅ ${THEMES.length} temas — toda familia de --semantic-font-family-* se carga (syx-font / syx-font-external) o es del sistema`);
}

console.log('');
process.exit(failures ? 1 : 0);
