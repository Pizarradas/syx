#!/usr/bin/env node
/**
 * SYX — Guardián del soporte de navegadores
 * ─────────────────────────────────────────
 * SYX publica un soporte mínimo: Chrome 111 · Safari 16.2 · Firefox 121 ·
 * Edge 111. Vive en UN sitio, el `browserslist` de package.json; de ahí lo
 * leen Autoprefixer y este guardián, y why-syx.html y el README lo citan.
 *
 * Hasta la auditoría de octubre de 2026 esa cifra era una afirmación: el CSS
 * usaba 220 `oklch()`, 29 `color-mix()`, `dvh` y `:has()` sin que nada
 * comprobara que el mínimo los soporta, y el browserslist decía otra cosa
 * (Chrome 109, Opera Mini, KaiOS…). Aquí se pasa el CSS COMPILADO de css/
 * —lo que se sirve, con lo que Autoprefixer añadió o quitó— por
 * stylelint-no-unsupported-browser-features (doiuse + caniuse) contra ese
 * browserslist, y falla si algo no está soportado en el mínimo.
 *
 * QUÉ NO CUENTA, Y POR QUÉ
 * · Lo que va dentro de `@supports (…)`: es el patrón correcto para usar algo
 *   más nuevo que el mínimo (subgrid en feature-card), y doiuse no sabe leer
 *   la condición. Un `@supports not (…)` NO protege nada y sí cuenta.
 * · El soporte parcial (ignorePartialSupport): caniuse marca «parcial» por
 *   matices que doiuse no distingue en el CSS —llama «multicolumn» al
 *   `column-gap` de una rejilla, marca `mask-*` aunque vaya también con
 *   `-webkit-`, `clip-path` por las referencias url() a SVG que SYX no usa—.
 *   Con eso encendido el informe eran 300 avisos de ruido y ninguno real.
 * · IGNORADAS, abajo: rasgos que el mínimo «no soporta» pero cuya ausencia
 *   deja el comportamiento por defecto, que es correcto. Cada una con su porqué.
 *
 * LO QUE doiuse NO VE
 * doiuse solo conoce los rasgos de su tabla, y en ella no está `color-mix()`
 * —justo el que fija el mínimo— ni `@scope` ni las anclas. COMPLEMENTOS los
 * busca en el mismo árbol, con los datos de caniuse-lite cuando caniuse los
 * tiene y con las versiones de MDN escritas aquí cuando no. Solo entran los
 * que ROMPEN sin soporte (una declaración inválida se descarta entera; las
 * reglas de un @scope desconocido no se aplican). No entran `@starting-style`,
 * `text-wrap: balance` ni las view transitions: sin soporte, el diálogo
 * aparece sin animación y el titular corta donde corta hoy, que es lo que
 * deben hacer. SYX ya usa `@starting-style` en mol-dialog así, a propósito.
 *
 * Si añades una a IGNORADAS, que sea mejora progresiva de verdad: que sin
 * ella la página siga funcionando y viéndose bien. Si no, sube el mínimo
 * (browserslist + why-syx + README) o ponla tras un @supports.
 *
 * Uso: node scripts/check-soporte.js [ficheros.css…]   ·   npm run check:soporte
 * (Auditoría 2026-10 · acción 13)
 */

'use strict';

const fs = require('fs');
const path = require('path');
const postcss = require('postcss');

const ROOT = path.join(__dirname, '..');

const IGNORADAS = {
  'css3-cursors': 'Safari iOS no tiene puntero: `cursor` no hace nada en una pantalla táctil, y no hace falta que lo haga.',
  'css-selection': 'Safari iOS ignora ::selection y usa el resaltado del sistema, que es legible en los dos modos.',
  'css-resize': 'Safari iOS no muestra el tirador de `resize`; el textarea sigue creciendo con el contenido.',
  'css-autofill': ':-webkit-autofill solo existe para tapar el fondo amarillo que pinta Chrome al autocompletar; Firefox no lo pinta.',
};

// Rasgos que doiuse no detecta. `caniuse`: id de caniuse-lite; `minimo`:
// primera versión con soporte según MDN (browser-compat-data), para los que
// caniuse no recoge.
const COMPLEMENTOS = [
  { rasgo: 'color-mix()', en: (n) => n.type === 'decl' && /\bcolor-mix\(/i.test(n.value),
    minimo: { chrome: 111, edge: 111, firefox: 113, safari: 16.2, ios_saf: 16.2 } },
  { rasgo: '@scope', en: (n) => n.type === 'atrule' && n.name === 'scope', caniuse: 'css-cascade-scope' },
  { rasgo: 'anchor positioning', en: (n) => n.type === 'decl' && (/^(anchor-name|position-anchor|position-area|position-try.*)$/.test(n.prop) || /\banchor\(/.test(n.value)),
    caniuse: 'css-anchor-positioning' },
];

// Las versiones del mínimo, una a una ("chrome 111", "ios_saf 16.6-16.7"…),
// sin soporte para un complemento.
function sinSoporte(c, versiones) {
  let stats = null;
  if (c.caniuse) {
    const lite = require('caniuse-lite');
    stats = lite.feature(require(`caniuse-lite/data/features/${c.caniuse}`)).stats;
  }
  return versiones.filter((bv) => {
    const [b, v] = bv.split(' ');
    if (stats) return !/^[ya]/.test((stats[b] || {})[v] || 'n');
    const min = c.minimo[b];
    return min === undefined || parseFloat(v) < min;
  });
}

// "chrome 116, chrome 115 … chrome 111" → "chrome 111–116"
function resumir(versiones) {
  const por = new Map();
  for (const bv of versiones) {
    const [b, v] = bv.split(' ');
    if (!por.has(b)) por.set(b, []);
    por.get(b).push(v);
  }
  return [...por].map(([b, vs]) => {
    const o = vs.sort((x, y) => parseFloat(x) - parseFloat(y));
    return o.length > 1 ? `${b} ${o[0]}–${o[o.length - 1]}` : `${b} ${o[0]}`;
  }).join(', ');
}

const protegidoPorSupports = (n) => {
  for (let p = n && n.parent; p; p = p.parent) {
    if (p.type === 'atrule' && p.name === 'supports' && !/^\s*not\b/.test(p.params)) return true;
  }
  return false;
};

async function main() {
  const { default: stylelint } = await import('stylelint');
  const args = process.argv.slice(2);
  const ficheros = args.length
    ? args.map((f) => path.resolve(f))
    : fs.readdirSync(path.join(ROOT, 'css')).filter((f) => f.endsWith('.css')).sort().map((f) => path.join(ROOT, 'css', f));

  console.log('\n── SOPORTE DE NAVEGADORES ──────────────────────────────────────\n');
  if (!ficheros.length) {
    console.log('❌ No hay CSS compilado en css/: npm run build.');
    process.exit(1);
  }

  const browsers = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8')).browserslist;
  const { results } = await stylelint.lint({
    files: ficheros,
    cwd: ROOT,
    config: {
      plugins: ['stylelint-no-unsupported-browser-features'],
      rules: {
        'plugin/no-unsupported-browser-features': [true, {
          browsers,
          ignore: Object.keys(IGNORADAS),
          ignorePartialSupport: true,
          severity: 'error',
        }],
      },
    },
  });

  const fallos = [];
  let protegidos = 0;
  for (const r of results) {
    if (!r.warnings.length) continue;
    const raiz = postcss.parse(fs.readFileSync(r.source, 'utf8'), { from: r.source });
    const nodos = [];
    raiz.walk((n) => { if (n.source && n.source.start) nodos.push(n); });
    for (const w of r.warnings) {
      // El nodo más interno que empieza en esa línea y columna.
      const n = nodos.filter((x) => x.source.start.line === w.line && x.source.start.column === w.column).pop();
      if (protegidoPorSupports(n)) { protegidos++; continue; }
      const texto = w.text.replace(/\s*\(plugin\/no-unsupported-browser-features\)\s*$/, '');
      fallos.push({ fichero: path.relative(ROOT, r.source), linea: w.line, rasgo: (texto.match(/feature "([^"]+)"/) || [])[1] || '?', texto });
    }
  }

  // Complementos: lo que doiuse no ve.
  const versiones = require('browserslist')(browsers);
  const faltan = new Map(COMPLEMENTOS.map((c) => [c, sinSoporte(c, versiones)]));
  for (const f of ficheros) {
    postcss.parse(fs.readFileSync(f, 'utf8'), { from: f }).walk((n) => {
      for (const c of COMPLEMENTOS) {
        if (!faltan.get(c).length || !c.en(n)) continue;
        if (protegidoPorSupports(n)) { protegidos++; continue; }
        fallos.push({ fichero: path.relative(ROOT, f), linea: n.source.start.line, rasgo: c.rasgo, texto: `${c.rasgo} no está soportado en ${resumir(faltan.get(c))}` });
      }
    });
  }

  console.log(`   mínimo: ${browsers.join(' · ')}`);
  console.log(`   ${ficheros.length} hoja(s) · ${protegidos} uso(s) tras @supports · ${Object.keys(IGNORADAS).length} rasgo(s) ignorados con motivo · ${COMPLEMENTOS.length} complementos\n`);
  if (fallos.length) {
    for (const f of fallos.slice(0, 40)) console.log(`❌ ${f.fichero}:${f.linea}  ${f.texto}`);
    if (fallos.length > 40) console.log(`   … y ${fallos.length - 40} más`);
    const por = {};
    for (const f of fallos) por[f.rasgo] = (por[f.rasgo] || 0) + 1;
    console.log(`\n   por rasgo: ${Object.entries(por).sort((a, b) => b[1] - a[1]).map(([r, n]) => `${r} ${n}`).join(' · ')}`);
    console.log(`   ${fallos.length} uso(s) sin soporte en el mínimo publicado. Ponlos tras @supports,`);
    console.log('   o sube el mínimo en package.json (y en why-syx.html y el README).\n');
    process.exit(1);
  }
  console.log('✅ Todo el CSS compilado funciona en el mínimo publicado\n');
}

main().catch((e) => { console.error(`❌ ${e.message}`); process.exit(1); });
