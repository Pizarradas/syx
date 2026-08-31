#!/usr/bin/env node
/**
 * SYX — Tokens huérfanos
 * ──────────────────────
 * Un token huérfano es un `var(--x)` SIN FALLBACK cuyo `--x` no declara nadie.
 * No falla, no avisa, no rompe la compilación: la propiedad simplemente no se
 * aplica y el elemento se queda con lo que tuviera el navegador. Es el fallo
 * más caro que puede tener un sistema de tokens, porque no deja rastro.
 *
 * POR QUÉ NO LO PILLABA NADA
 * Lo pillaba a medias, que es peor. `build-token-snapshot.js` ya listaba trece
 * tokens que computan a vacío —el peso 900 de los titulares entre ellos— en cada
 * compilación, como AVISO. Un aviso que sale siempre y no tumba nada deja de
 * leerse a la segunda semana; llevaba versiones ahí.
 *
 * Y solo veía la mitad: el grafo de tokens (`--a: var(--b)`), no el uso en
 * propiedades. Un `font-family: var(--semantic-font-family-body)` dentro de un
 * componente no es una declaración de token, así que siete componentes pidiendo
 * una familia inexistente no aparecían por ninguna parte.
 *
 * De ahí las dos decisiones de este fichero: mirar **de la referencia hacia
 * dentro**, incluidas las propiedades; y **fallar**, no avisar.
 *
 * DÓNDE SE MIDE
 * En el CSS COMPILADO, bundle por bundle, no en el SCSS. Un token puede estar
 * declarado en un fichero que ese bundle no incluye, y entonces está declarado
 * para el repositorio y huérfano para el navegador, que es el único que
 * importa. Se mide además el SCSS, que atrapa el fallo antes de compilar.
 *
 * QUÉ FALLA Y QUÉ SOLO SE CUENTA
 * Falla lo que lleva prefijo oficial —lo que el sistema declara suyo—. Las
 * variables heredadas sin prefijo (`--icon-logo`, `--filter-primary`) se
 * cuentan y se nombran, pero no tumban nada: son deuda anterior a que hubiera
 * con qué medirla, y son justo el trabajo del modo MIGRATE. Cuando lleguen a
 * cero, `--fallar-si-legado` convierte esto en un guardián completo; ese día
 * será una decisión y no un descuido.
 *
 * Uso: node scripts/check-huerfanos.js [--fallar-si-legado]
 *      npm run check:huerfanos
 */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const OFICIALES = ['--primitive-', '--semantic-', '--component-', '--theme-', '--lc-icon-'];
const esOficial = (t) => OFICIALES.some((p) => t.startsWith(p));

const sinComentarios = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '');

/** Lo que un texto CSS declara, y lo que pide con y sin red debajo. */
function analizar(texto) {
  const t = sinComentarios(texto);
  const declarados = new Set([...t.matchAll(/(--[a-z0-9-]+)\s*:/g)].map((m) => m[1]));
  const sinFallback = new Set([...t.matchAll(/var\(\s*(--[a-z0-9-]+)\s*\)/g)].map((m) => m[1]));
  const conFallback = new Set([...t.matchAll(/var\(\s*(--[a-z0-9-]+)\s*,/g)].map((m) => m[1]));
  return { declarados, sinFallback, conFallback };
}

const huerfanos = ({ declarados, sinFallback }) =>
  [...sinFallback].filter((t) => !declarados.has(t)).sort();

console.log('\n── TOKENS HUÉRFANOS ────────────────────────────────────────────\n');

// ─── 1 · El CSS compilado, bundle por bundle ─────────────────────────────────

const bundles = fs
  .readdirSync(path.join(ROOT, 'css'))
  .filter((f) => f.endsWith('.css'))
  .sort();

let oficiales = 0;
let legado = 0;
const legadoVistos = new Set();

for (const f of bundles) {
  const a = analizar(fs.readFileSync(path.join(ROOT, 'css', f), 'utf8'));
  const h = huerfanos(a);
  const of = h.filter(esOficial);
  const le = h.filter((t) => !esOficial(t));
  oficiales += of.length;
  legado += le.length;
  le.forEach((t) => legadoVistos.add(t));

  if (of.length) {
    console.log(`❌ ${f}`);
    for (const t of of) console.log(`     ${t}  — se pide sin fallback y no lo declara este bundle`);
  } else {
    console.log(`✅ ${f}${le.length ? `  (${le.length} heredado${le.length > 1 ? 's' : ''})` : ''}`);
  }
}

// ─── 2 · El SCSS, que lo dice antes de compilar ──────────────────────────────

function scssCompleto(dir, acumulado = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) scssCompleto(p, acumulado);
    else if (e.name.endsWith('.scss')) acumulado.push([path.relative(ROOT, p), fs.readFileSync(p, 'utf8')]);
  }
  return acumulado;
}

const ficheros = scssCompleto(path.join(ROOT, 'scss'));
// Se juntan todos: un token declarado en `semantic/` y usado en `atoms/` es
// correcto, así que la pregunta solo tiene sentido sobre el conjunto.
const fuente = analizar(ficheros.map(([, t]) => t).join('\n'));
const enFuente = huerfanos(fuente);
const ofFuente = enFuente.filter(esOficial);

console.log('');
if (ofFuente.length) {
  console.log(`❌ scss/ — ${ofFuente.length} con prefijo oficial:`);
  for (const t of ofFuente) {
    const donde = ficheros
      .filter(([, texto]) => new RegExp(`var\\(\\s*${t}\\s*\\)`).test(sinComentarios(texto)))
      .map(([f]) => f);
    console.log(`     ${t}\n       ${donde.slice(0, 4).join('\n       ')}`);
  }
} else {
  console.log('✅ scss/ — ninguna referencia oficial sin declarar');
}

// ─── 3 · Los que viven de su fallback ────────────────────────────────────────
// No son un fallo: un fallback es una decisión. Pero conviene saber cuáles son,
// porque un fallback que se queda ahí para siempre es un token que nunca llegó.

const deFallback = [...fuente.conFallback].filter((t) => !fuente.declarados.has(t) && esOficial(t)).sort();

console.log('');
if (legadoVistos.size) {
  console.log(`⚠️  ${legadoVistos.size} variables heredadas sin declarar (R07, trabajo del modo MIGRATE):`);
  console.log(`     ${[...legadoVistos].sort().join(', ')}`);
}
if (deFallback.length) {
  console.log(`ℹ️  ${deFallback.length} tokens oficiales que solo existen por su fallback:`);
  console.log(`     ${deFallback.join(', ')}`);
}

const fallarLegado = process.argv.includes('--fallar-si-legado');
console.log(
  `\n   ${bundles.length} bundles · ${oficiales} huérfano(s) oficial(es) · ${legado} referencia(s) heredada(s)\n`
);

process.exit(oficiales || ofFuente.length || (fallarLegado && legado) ? 1 : 0);
