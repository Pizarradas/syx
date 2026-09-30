#!/usr/bin/env node
/**
 * check-modo-claro.js — la elección de modo no depende del sistema operativo
 * ----------------------------------------------------------------------------
 * Un tema tiene seis estados: el usuario no elige, elige claro o elige oscuro,
 * cada uno con el sistema operativo en claro o en oscuro. Dos invariantes:
 *
 *   1. Lo que el usuario elige manda. Con `data-theme="light"` la página pinta
 *      lo mismo con el SO en claro que en oscuro; ídem con "dark".
 *   2. Elegir un modo es pedir el que ya hay. Si sin elección y con el SO en
 *      claro el tema es claro, elegir «claro» no cambia nada; ídem con oscuro.
 *
 * El fallo que lo motiva: los temas activaban el oscuro con
 * `@media (prefers-color-scheme: dark) { :root { … } }` y luego intentaban
 * revertirlo a mano en `:root[data-theme="light"]`. El bloque de reversión
 * nunca cubría todo lo que el oscuro cambiaba (entre 38 y 179 tokens según el
 * tema) y en example-01 además traía otra paleta: texto púrpura a 4,06:1.
 * check-theme-symmetry.js solo miraba las entradas al oscuro.
 *
 * Trabaja sobre el CSS compilado y resuelve var() hasta el valor final, porque
 * dos cadenas distintas pueden pintar lo mismo. Compara solo tokens que cambian
 * con el modo (color, fondo, texto, borde, sombra, superficie…).
 *
 * Uso: node scripts/check-modo-claro.js [--json]
 * ----------------------------------------------------------------------------
 */
'use strict';
const fs = require('fs');
const path = require('path');
const postcss = require('postcss');

const ROOT = path.resolve(__dirname, '..');
const CSS_DIR = path.join(ROOT, 'css');
const RELEVANTE = /^--(semantic|component|btn)-.*(color|bg|text|border|shadow|surface|link|fill|stroke|focus|tone)/;

/** A qué estados (eleccion × so) se aplica un selector de :root, o null si no es uno de ellos. */
function predicado(selector) {
  // Sin comillas: el CSS compilado a veces las quita (`[data-theme=dark]`).
  const s = selector.replace(/\s+/g, '').replace(/["']/g, '');
  const tabla = {
    ':root': () => true,
    ':root:root': () => true,
    ':root[data-theme=light]': (e) => e === 'light',
    ':root[data-theme=dark]': (e) => e === 'dark',
    ':root:not([data-theme=light])': (e) => e !== 'light',
    ':root:not([data-theme=dark])': (e) => e !== 'dark',
  };
  return tabla[s] || null;
}
const especificidad = (sel) => (sel.match(/:root|\[|:not/g) || []).length - (sel.match(/:not/g) || []).length;

function declaraciones(css) {
  const out = [];
  let orden = 0;
  postcss.parse(css).walkRules((rule) => {
    const pred = predicado(rule.selector);
    if (!pred) return;
    let so = null, descartar = false;
    for (let p = rule.parent; p && p.type !== 'root'; p = p.parent) {
      if (p.type !== 'atrule' || p.name !== 'media') continue;
      if (/prefers-color-scheme:\s*dark/.test(p.params)) so = 'dark';
      else if (/prefers-color-scheme:\s*light/.test(p.params)) so = 'light';
      else descartar = true; // reduced motion, anchos: no cambian con el modo
    }
    if (descartar) return;
    const spec = especificidad(rule.selector.replace(/\s+/g, ''));
    rule.walkDecls((d) => {
      if (d.prop.startsWith('--')) out.push({ prop: d.prop, value: d.value.trim(), pred, so, spec, orden: orden++ });
    });
  });
  return out;
}

function estado(decls, eleccion, so) {
  const vars = {};
  decls
    .filter((d) => d.pred(eleccion) && (d.so === null || d.so === so))
    .sort((a, b) => a.spec - b.spec || a.orden - b.orden)
    .forEach((d) => { vars[d.prop] = d.value; });
  return vars;
}

function resolver(vars, valor, prof = 0) {
  if (prof > 30 || valor === undefined) return valor ?? '';
  return valor.replace(/var\(\s*(--[\w-]+)\s*(?:,\s*([^()]*(?:\([^()]*\))*[^()]*))?\)/g, (m, nombre, fallback) => {
    if (vars[nombre] !== undefined) return resolver(vars, vars[nombre], prof + 1);
    return fallback !== undefined ? resolver(vars, fallback.trim(), prof + 1) : m;
  }).replace(/\s+/g, ' ').trim();
}

/** Luminosidad OKLCH aproximada del fondo principal, para saber si un estado es claro u oscuro. */
function esClaro(vars) {
  const v = resolver(vars, vars['--semantic-color-bg-primary']);
  const m = /oklch\(\s*([\d.]+)(%?)/.exec(v || '');
  if (!m) return /white|#fff/i.test(v || '');
  return (m[2] ? +m[1] / 100 : +m[1]) > 0.5;
}

function comparar(a, b) {
  const difs = [];
  const claves = new Set([...Object.keys(a), ...Object.keys(b)].filter((k) => RELEVANTE.test(k)));
  for (const k of [...claves].sort()) {
    const va = resolver(a, a[k]), vb = resolver(b, b[k]);
    if (va !== vb) difs.push({ token: k, a: va, b: vb });
  }
  return difs;
}

function revisarTema(css) {
  const d = declaraciones(css);
  const E = {};
  for (const e of ['none', 'light', 'dark']) for (const so of ['light', 'dark']) E[`${e}/${so}`] = estado(d, e, so);
  const tieneEleccion = { light: d.some((x) => x.pred('light') && !x.pred('none')), dark: d.some((x) => x.pred('dark') && !x.pred('none')) };
  const fallos = [];
  for (const e of ['light', 'dark']) {
    const difs = comparar(E[`${e}/light`], E[`${e}/dark`]);
    if (difs.length) fallos.push({ regla: `elegir ${e === 'light' ? 'claro' : 'oscuro'} depende del SO`, difs });
  }
  // Invariante 2: elegir el modo que ya hay no cambia nada.
  for (const [e, so] of [['light', 'light'], ['dark', 'dark']]) {
    const sinEleccion = E[`none/${so}`];
    if ((e === 'light') !== esClaro(sinEleccion)) continue; // tema que no es de ese modo por defecto
    const difs = comparar(sinEleccion, E[`${e}/${so}`]);
    if (difs.length) fallos.push({ regla: `elegir ${e === 'light' ? 'claro' : 'oscuro'} cambia el ${e === 'light' ? 'claro' : 'oscuro'} por defecto`, difs });
  }
  return { fallos, tieneEleccion };
}

function main() {
  const json = process.argv.includes('--json');
  const ficheros = fs.readdirSync(CSS_DIR).filter((f) => /^styles-theme-.+\.css$/.test(f)).sort();
  const informe = {};
  let total = 0;
  if (!json) console.log('\n── LA ELECCIÓN DE MODO NO DEPENDE DEL SO ' + '─'.repeat(23) + '\n');
  for (const f of ficheros) {
    const tema = f.replace(/^styles-theme-|\.css$/g, '');
    const r = revisarTema(fs.readFileSync(path.join(CSS_DIR, f), 'utf8'));
    informe[tema] = r.fallos;
    const n = r.fallos.reduce((s, x) => s + x.difs.length, 0);
    total += n;
    if (json) continue;
    if (!n) { console.log(`✅ ${tema.padEnd(12)} elegir claro u oscuro pinta lo mismo con cualquier SO`); continue; }
    console.log(`❌ ${tema.padEnd(12)} ${n} diferencia(s)`);
    for (const fa of r.fallos) {
      console.log(`     ${fa.regla}: ${fa.difs.length} token(s)`);
      for (const x of fa.difs.slice(0, 4)) console.log(`       ${x.token}\n         ${x.a || '(sin valor)'}\n         ${x.b || '(sin valor)'}`);
    }
  }
  if (json) console.log(JSON.stringify(informe, null, 2));
  else console.log(`\n   ${ficheros.length} temas · ${total} diferencia(s)\n`);
  process.exitCode = total ? 1 : 0;
}

if (require.main === module) main();
module.exports = { declaraciones, estado, resolver, revisarTema };
