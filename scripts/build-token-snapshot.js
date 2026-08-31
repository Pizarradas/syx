#!/usr/bin/env node
/**
 * SYX — Snapshot de tokens resueltos por tema y por modo
 * ──────────────────────────────────────────────────────
 * Emite contracts/resolved-tokens.json: para cada tema y cada modo, el valor
 * REAL de cada token, con la cadena de `var()` ya resuelta.
 *
 * POR QUÉ EXISTE
 * tokens.json es un registro de NOMBRES, no de valores: 608 de sus 788 entradas
 * guardan una referencia `var(--otro-token)` sin resolver, y 318 tokens cambian
 * de valor entre claro y oscuro contra un esquema que solo tiene un campo
 * `value` por token. O sea que no es que esté desactualizado: estructuralmente
 * no puede responder "¿qué valor tiene este token en este tema y este modo?".
 * Este fichero sí.
 *
 * POR QUÉ SIN NAVEGADOR
 * La tentación es cargar el CSS en Chromium y leer getComputedStyle, que da el
 * valor final ya evaluado. Se descartó: obliga a un navegador en la máquina y
 * en CI, y SYX presume de no arrastrar dependencias. Resolviendo la cascada a
 * mano se cubre el 100 % de los dos problemas de arriba —la cadena de alias y
 * la dimensión de modo— sin instalar nada. Lo que NO hace es evaluar
 * `color-mix()`, `oklch(from …)` o `calc()`: esos quedan como expresión con
 * todas sus variables ya sustituidas, que para un contrato es incluso más
 * honesto que un sRGB final, porque conserva la intención de quien lo escribió.
 * El campo `expr` de cada token marca cuáles son.
 *
 * Uso:
 *   node scripts/build-token-snapshot.js            genera el snapshot
 *   node scripts/build-token-snapshot.js --check    falla si está desfasado
 */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const CSS_DIR = path.join(ROOT, 'css');
const OUT = path.join(ROOT, 'contracts', 'resolved-tokens.json');
const MODES = ['light', 'dark'];
const OFFICIAL = /^--(primitive|semantic|component|theme|icon|layout|reset)-/;

// ─── 1 · Trocear el CSS en bloques que declaran custom properties ────────────
// Emparejando llaves y arrastrando la pila de at-rules, porque el contexto
// (@media, @supports) decide después si el bloque cuenta para un modo u otro.

function parseBlocks(css) {
  const out = [];
  let order = 0;

  function walk(src, at) {
    let i = 0;
    while (i < src.length) {
      const open = src.indexOf('{', i);
      if (open === -1) break;

      let head = src.slice(i, open);
      // Un at-rule SIN bloque (`@layer a, b;`, `@charset …;`) se cuela dentro
      // del `head` del bloque siguiente y le pega su texto al selector. Se
      // recorta quedándose con lo que hay tras el último `;`.
      const lastSemi = head.lastIndexOf(';');
      if (lastSemi !== -1) head = head.slice(lastSemi + 1);
      head = head.trim();

      let k = open + 1;
      let depth = 1;
      while (k < src.length && depth > 0) {
        const c = src[k];
        if (c === '{') depth++;
        else if (c === '}') depth--;
        k++;
      }
      const body = src.slice(open + 1, k - 1);

      if (head.startsWith('@')) {
        walk(body, at.concat(head));
      } else {
        const decls = readDecls(body);
        if (Object.keys(decls).length) out.push({ at, sel: head, decls, order: order++ });
      }
      i = k;
    }
  }

  walk(css, []);
  return out;
}

// Las declaraciones se leen a mano y no con un split por `;`, porque un valor
// puede llevar `;` dentro de un data URI y paréntesis anidados en color-mix().
function readDecls(body) {
  const decls = {};
  const re = /(--[A-Za-z0-9_-]+)\s*:/g;
  let m;
  while ((m = re.exec(body))) {
    let i = m.index + m[0].length;
    let depth = 0;
    let quote = null;
    let end = body.length;
    for (; i < body.length; i++) {
      const c = body[i];
      if (quote) { if (c === quote && body[i - 1] !== '\\') quote = null; continue; }
      if (c === '"' || c === "'") { quote = c; continue; }
      if (c === '(') depth++;
      else if (c === ')') depth--;
      else if (c === ';' && depth === 0) { end = i; break; }
    }
    decls[m[1]] = body.slice(m.index + m[0].length, end).trim();
    re.lastIndex = end;
  }
  return decls;
}

// ─── 2 · Decidir qué bloques valen para cada modo ────────────────────────────

function appliesTo(block, mode) {
  for (const at of block.at) {
    // Sin espacios y en minúsculas: el CSS de entrada puede venir expandido o
    // minificado, y `@media (prefers-color-scheme: dark)` se convierte en
    // `@media(prefers-color-scheme:dark)` al minificar. Comparar el texto tal
    // cual hacía que en un build minificado NO se detectaran los bloques de
    // modo oscuro y el snapshot saliera mal en silencio.
    const a = at.toLowerCase().replace(/\s+/g, '');
    if (a.includes('prefers-color-scheme:dark') && mode !== 'dark') return false;
    if (a.includes('prefers-color-scheme:light') && mode !== 'light') return false;
    // La preferencia de movimiento reducido no es el estado por defecto.
    if (a.includes('prefers-reduced-motion:reduce')) return false;
    // @supports: se asume navegador moderno, que es donde este sistema vive.
    // Cualquier otra media query (anchura) se ignora: el snapshot describe el
    // estado base, no un breakpoint concreto.
    if (a.startsWith('@media') && !a.includes('prefers-color-scheme')) return false;
  }
  const sel = block.sel.replace(/\s+/g, '');
  if (!sel.startsWith(':root')) return false;
  const forced = sel.match(/\[data-theme=["']?([a-z]+)["']?\]/);
  if (forced) return forced[1] === mode;
  return true;
}

// :root vale 0,1,0; :root:root y :root[data-theme=x] valen 0,2,0. A igualdad,
// gana el último en aparecer.
function specificity(sel) {
  const s = sel.replace(/\s+/g, '');
  return (s.match(/:root/g) || []).length + (s.match(/\[/g) || []).length;
}

function declaredFor(blocks, mode) {
  const winners = new Map(); // token → { value, spec, order }
  for (const b of blocks) {
    if (!appliesTo(b, mode)) continue;
    const spec = specificity(b.sel);
    for (const [name, value] of Object.entries(b.decls)) {
      const prev = winners.get(name);
      if (!prev || spec > prev.spec || (spec === prev.spec && b.order > prev.order)) {
        winners.set(name, { value, spec, order: b.order });
      }
    }
  }
  const flat = {};
  for (const [k, v] of winners) flat[k] = v.value;
  return flat;
}

// ─── 3 · Resolver las cadenas de var() ───────────────────────────────────────

const VAR = /^var\(\s*(--[A-Za-z0-9_-]+)\s*(?:,([\s\S]*))?\)$/;

// Encuentra el primer var() completo del valor y devuelve sus tramos.
function nextVar(value, from) {
  const open = value.indexOf('var(', from);
  if (open === -1) return null;
  let depth = 0;
  for (let i = open + 3; i < value.length; i++) {
    if (value[i] === '(') depth++;
    else if (value[i] === ')') {
      depth--;
      if (depth === 0) return { open, close: i, text: value.slice(open, i + 1) };
    }
  }
  return null;
}

/**
 * Resolución recursiva con memoria y camino explícito.
 *
 * El primer intento llevaba un único conjunto de "tokens ya vistos" para toda
 * la resolución, y daba 281 falsos ciclos: un valor como
 * `calc(var(--x) / 2) calc(var(--x) / 2)` cita el mismo token dos veces y la
 * segunda se tomaba por recursión. El camino tiene que ser POR RAMA, no global,
 * y lo ya resuelto se memoriza en vez de re-visitarse.
 */
function makeResolver(map) {
  const memo = new Map();
  const faltan = new Set();   // sin declarar Y sin fallback: rompen de verdad
  const cubiertos = new Set(); // sin declarar pero con fallback: previsto
  const ciclos = new Set();

  function token(name, path) {
    if (memo.has(name)) return memo.get(name);
    if (path.has(name)) { ciclos.add(name); return null; }
    if (!Object.prototype.hasOwnProperty.call(map, name)) return null;
    path.add(name);
    const value = expand(map[name], path);
    path.delete(name);
    memo.set(name, value);
    return value;
  }

  function expand(value, path) {
    let out = value;
    let guard = 0;
    let hit;
    while ((hit = nextVar(out, 0)) && guard++ < 200) {
      const m = hit.text.match(VAR);
      let repl;
      if (!m) {
        repl = hit.text; // var() con forma rara: se deja tal cual
      } else {
        const fallback = m[2] !== undefined ? m[2].trim() : null;
        const declarado = Object.prototype.hasOwnProperty.call(map, m[1]);
        const resolved = token(m[1], path);
        if (resolved !== null) repl = resolved;
        else if (fallback !== null) {
          if (!declarado) cubiertos.add(m[1]);
          repl = expand(fallback, path);
        } else {
          if (!declarado) faltan.add(m[1]);
          repl = `/* ${m[1]} sin declarar */`;
        }
      }
      if (repl === hit.text) break; // sin avance: se corta para no ciclar
      out = out.slice(0, hit.open) + repl + out.slice(hit.close + 1);
    }
    return out;
  }

  return {
    all() {
      const out = {};
      for (const name of Object.keys(map)) {
        const v = token(name, new Set());
        out[name] = (v === null ? '' : v).replace(/\s+/g, ' ').trim();
      }
      return out;
    },
    faltan, cubiertos, ciclos,
  };
}

// Un valor que sigue llevando una función CSS no evaluable se marca, para que
// quien consuma el snapshot sepa que es una expresión y no un literal.
const FN = /\b(color-mix|calc|clamp|min|max|light-dark)\s*\(|\b(oklch|rgb|hsl|lab|lch)\(\s*from\b/;
const isExpr = (v) => FN.test(v);

// Para el índice inverso solo interesan los valores que alguien podría escribir
// a pelo en una hoja de estilos: colores y medidas. Indexarlo todo duplicaba el
// fichero sin dar nada a cambio.
const INDEXABLE = /^(#[0-9a-f]{3,8}|(oklch|rgb|rgba|hsl|hsla|oklab|lab|lch)\(|[0-9.]+(rem|px|em|%)$|transparent$|currentColor$)/i;

// Los iconos van como data URI y son 180 valores —el 2 % de las entradas— que
// se llevaban el 56 % del fichero, repetidos idénticos en los siete temas. Se
// internan en un almacén común y el token guarda una referencia.
const ASSET = '@asset/';
function makeAssetPool() {
  const porValor = new Map();
  const pool = {};
  let n = 0;
  return {
    ref(value) {
      if (!value.includes('data:')) return value;
      let id = porValor.get(value);
      if (!id) {
        id = 'a' + (++n).toString(36).padStart(3, '0');
        porValor.set(value, id);
        pool[id] = value;
      }
      return ASSET + id;
    },
    pool,
    get size() { return n; },
  };
}

// ─── 4 · Construir ───────────────────────────────────────────────────────────

function themeFiles() {
  return fs.readdirSync(CSS_DIR)
    .filter((f) => /^styles-theme-.+\.css$/.test(f))
    .sort()
    .map((f) => ({ name: f.replace(/^styles-theme-|\.css$/g, ''), file: path.join(CSS_DIR, f) }));
}

function build() {
  const themes = themeFiles();
  if (!themes.length) {
    console.error('No hay CSS de temas en css/. Ejecuta antes: npm run build:css');
    process.exit(1);
  }

  const out = {
    _meta: {
      generatedAt: new Date().toISOString(),
      generator: 'scripts/build-token-snapshot.js',
      source: 'css/styles-theme-*.css',
      shape: 'Tres capas que se apilan. `base` lleva los tokens que valen lo mismo en TODOS los temas; themes[tema].light solo lo propio del tema; themes[tema].dark solo lo que cambia en oscuro. Valor en claro: { ...base, ...light }. En oscuro: { ...base, ...light, ...dark }. Un valor que empiece por "@asset/" se resuelve contra el mapa `assets`. El índice inverso valor → tokens no se guarda: se deriva de esto en una pasada. `unresolved` lista los tokens que computan a vacío y por qué.',
      note: 'Cascada resuelta sin navegador. Los tokens listados en `expressions` conservan funciones CSS sin evaluar (color-mix, calc, oklch(from …)) con todas sus variables ya sustituidas: son expresiones, no literales.',
      modes: MODES,
      themes: themes.map((t) => t.name),
    },
    base: {},
    themes: {},
    assets: {},
  };

  const assets = makeAssetPool();
  const stats = { porTema: 0, delta: 0, expresiones: 0, sinValor: 0, faltan: new Set(), cubiertos: new Set(), ciclos: new Set() };

  for (const t of themes) {
    const blocks = parseBlocks(fs.readFileSync(t.file, 'utf8'));
    const perMode = {};
    const sinValor = {};
    const exprs = new Set();

    for (const mode of MODES) {
      const r = makeResolver(declaredFor(blocks, mode));
      const todo = r.all();
      const official = {};
      for (const [k, v] of Object.entries(todo)) {
        if (!OFFICIAL.test(k)) continue; // las legacy sin prefijo no son contrato
        official[k] = assets.ref(v);
        if (isExpr(v)) exprs.add(k);
      }
      perMode[mode] = official;

      // Un token puede quedarse SIN valor por tres vías, y el navegador las
      // representa todas igual —cadena vacía—, así que no se distinguen mirando
      // el resultado. Aquí se dice cuál fue y quién tiene la culpa.
      const vacios = {};
      for (const [k, v] of Object.entries(official)) {
        const m = v.match(/\/\* (--[a-z0-9-]+) sin declarar \*\//);
        if (m) vacios[k] = 'referencia sin declarar: ' + m[1];
        else if (v === 'initial') vacios[k] = 'initial — en una custom property computa a vacío';
        else if (v === 'inherit') vacios[k] = 'inherit desde :root — no hay de quién heredar, computa a vacío';
      }
      sinValor[mode] = vacios;

      for (const f of r.faltan) if (OFFICIAL.test(f)) stats.faltan.add(f);
      for (const c of r.cubiertos) if (OFFICIAL.test(c)) stats.cubiertos.add(c);
      for (const c of r.ciclos) if (OFFICIAL.test(c)) stats.ciclos.add(c);
    }

    // El oscuro se guarda como delta contra el claro. Con el mapa entero por
    // modo el fichero se iba a 2,7 MB para decir dos veces casi lo mismo.
    const delta = {};
    for (const [k, v] of Object.entries(perMode.dark)) if (perMode.light[k] !== v) delta[k] = v;

    // El listado de "sin valor" solo se guarda si difiere entre modos; casi
    // siempre es el mismo y repetirlo era ruido.
    const mismoEnAmbos = JSON.stringify(sinValor.light) === JSON.stringify(sinValor.dark);
    out.themes[t.name] = {
      light: perMode.light,
      dark: delta,
      expressions: [...exprs].sort(),
      unresolved: mismoEnAmbos ? sinValor.light : { light: sinValor.light, dark: sinValor.dark },
    };
    stats.sinValor += Object.keys(sinValor.light).length;

    stats.porTema = Object.keys(perMode.light).length;
    stats.delta += Object.keys(delta).length;
    stats.expresiones += exprs.size;
  }

  // Lo que vale igual en TODOS los temas sube a `base`, y cada tema se queda
  // solo con lo suyo.
  const nombres = new Set();
  for (const t of Object.values(out.themes)) for (const k of Object.keys(t.light)) nombres.add(k);
  const temas = Object.values(out.themes);
  for (const k of nombres) {
    const primero = temas[0].light[k];
    const comun = temas.every((t) => t.light[k] === primero);
    if (!comun) continue;
    out.base[k] = primero;
    for (const t of temas) delete t.light[k];
  }
  stats.base = Object.keys(out.base).length;

  out.assets = assets.pool;
  out._meta.assets = `${assets.size} data URI internados; un valor "${ASSET}xxx" se resuelve contra el mapa \`assets\`.`;
  return { out, stats, themes };
}

// El snapshot se compara sin su marca de tiempo: lo que importa es si el
// CONTENIDO cambió, no cuándo se generó.
const sinFecha = (o) => JSON.stringify({ ...o, _meta: { ...o._meta, generatedAt: null } });

function main() {
  const check = process.argv.includes('--check');
  const { out, stats, themes } = build();

  if (check) {
    console.log('\n── SNAPSHOT DE TOKENS RESUELTOS ────────────────────────────────\n');
    if (!fs.existsSync(OUT)) {
      console.log('❌ contracts/resolved-tokens.json no existe.');
      console.log('   Ejecuta: npm run build:tokens\n');
      process.exit(1);
    }
    const previo = JSON.parse(fs.readFileSync(OUT, 'utf8'));
    if (sinFecha(previo) !== sinFecha(out)) {
      console.log('❌ El snapshot no coincide con el CSS compilado.');
      console.log('   Alguien cambió tokens y no lo regeneró. Ejecuta: npm run build:tokens\n');
      process.exit(1);
    }
    console.log(`✅ Al día · ${themes.length} temas × ${MODES.length} modos · ${stats.porTema} tokens por tema\n`);
    return;
  }

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(out, null, 2) + '\n');

  console.log('\n── SNAPSHOT DE TOKENS RESUELTOS ────────────────────────────────\n');
  console.log(`   temas × modos                      ${themes.length} × ${MODES.length}`);
  console.log(`   tokens por tema                    ${stats.porTema}`);
  console.log(`   comunes a los 7 temas (base)       ${stats.base}`);
  console.log(`   cambian entre claro y oscuro       ${Math.round(stats.delta / themes.length)} de media`);
  console.log(`   expresiones sin evaluar            ${Math.round(stats.expresiones / themes.length)} de media`);
  console.log(`   se quedan SIN valor                ${Math.round(stats.sinValor / themes.length)} de media (ver \`unresolved\`)`);
  console.log(`   data URI internados                ${Object.keys(out.assets).length}`);
  console.log(`   contracts/resolved-tokens.json     ${Math.round(fs.statSync(OUT).size / 1024)} KB`);

  if (stats.faltan.size) {
    console.log(`\n⚠️  ${stats.faltan.size} token(s) referenciados y NUNCA declarados — quien los use se queda sin valor:`);
    for (const f of [...stats.faltan].sort()) console.log(`   → ${f}`);
  }
  if (stats.ciclos.size) {
    console.log(`\n⚠️  ${stats.ciclos.size} referencia(s) circular(es):`);
    for (const c of [...stats.ciclos].sort()) console.log(`   → ${c}`);
  }
  if (stats.cubiertos.size) {
    console.log(`\n   ${stats.cubiertos.size} token(s) sin declarar pero siempre citados con fallback — previsto, no roto:`);
    for (const c of [...stats.cubiertos].sort()) console.log(`     · ${c}`);
  }
  if (!stats.faltan.size && !stats.ciclos.size) console.log('\n   Ninguna cadena de alias rota.');
  console.log('');
}

main();
