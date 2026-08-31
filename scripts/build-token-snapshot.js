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
const { MODES, OFFICIAL } = require('./lib/css-tokens');

// El motor de análisis y resolución vive en lib/css-tokens.js: lo comparte con
// el servidor MCP, que necesita lo mismo más la cadena de alias.
const {
  parseBlocks, declaredFor, makeResolver, canonico, isExpr, makeAssetPool, ASSET,
} = require('./lib/css-tokens');


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

// Qué difiere exactamente entre el snapshot guardado y el que sale del CSS.
function diferencias(a, b) {
  const muestra = [];
  const todas = [];
  let total = 0;
  const cmp = (x, y, ruta) => {
    for (const k of new Set([...Object.keys(x || {}), ...Object.keys(y || {})])) {
      if ((x || {})[k] === (y || {})[k]) continue;
      total++;
      todas.push({ a: (x || {})[k], b: (y || {})[k] });
      if (muestra.length < 5) {
        muestra.push({ ruta: ruta + k, a: corta((x || {})[k]), b: corta((y || {})[k]) });
      }
    }
  };
  const corta = (v) => (v === undefined ? '(no está)' : String(v).slice(0, 68));
  cmp(a.base, b.base, 'base/');
  for (const t of b._meta.themes) {
    if (!a.themes[t]) { total++; continue; }
    cmp(a.themes[t].light, b.themes[t].light, `${t}/light/`);
    cmp(a.themes[t].dark, b.themes[t].dark, `${t}/dark/`);
  }
  cmp(a.assets, b.assets, 'assets/');
  return { total, muestra, todas };
}

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
      const difs = diferencias(previo, out);

      // Este guardián vigila el CONTENIDO. Si al quitar TODO el espacio en
      // blanco los dos lados coinciden, lo único que cambia es cómo viene
      // formateado el CSS de partida —minificado frente a expandido— y eso no
      // es motivo para parar a nadie. Perseguir cada transformación de un
      // minificador es una carrera que no se gana: ya van tres rondas.
      const soloFormato = difs.total > 0 && difs.todas.every(
        (d) => String(d.a).replace(/\s/g, '') === String(d.b).replace(/\s/g, '')
      );
      if (soloFormato) {
        console.log(`⚠️  ${difs.total} valor(es) difieren SOLO en espacios en blanco.\n`);
        console.log('   El contenido es idéntico, así que no se falla. Pasa cuando el');
        console.log('   css/ de tu copia está minificado y el snapshot se generó desde');
        console.log('   uno expandido, o al revés.');
        console.log('   Para dejar el fichero igual que tu build: npm run build:tokens\n');
        return;
      }

      console.log('❌ El snapshot no coincide con el CSS compilado.\n');
      console.log(`   ${difs.total} valor(es) distinto(s). Los primeros:\n`);
      for (const d of difs.muestra) {
        console.log(`   ${d.ruta}`);
        console.log(`     en el fichero: ${d.a}`);
        console.log(`     en el CSS    : ${d.b}`);
      }
      console.log('\n   Si los cambios son tuyos: npm run build:tokens');
      console.log('   Si solo cambia el formato (espacios, comas), el CSS de tu copia');
      console.log('   no es el que produce `npm run build:css` — compílalo de nuevo.\n');
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
