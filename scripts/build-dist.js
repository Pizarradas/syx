#!/usr/bin/env node
/**
 * build-dist.js — hojas que pesan lo que usan
 * ----------------------------------------------------------------------------
 * Compila, minifica (Sass compressed + autoprefixer) y publica en dist/ las
 * hojas que se recomiendan a quien consume SYX y las que cargan las páginas
 * del propio sitio.
 *
 * POR QUÉ ASÍ (auditoría 2026-10, acción 12)
 * Medido sobre example-01 full: el `:root` sin capa era el 56 % del fichero
 * (62 % en gzip) y 514 de sus 1320 custom properties no las leía nadie. Y
 * cada tema repetía todo el CSS de componentes: 900 de 902 reglas con capa
 * eran idénticas byte a byte en los siete temas, así que cambiar de tema en
 * la web volvía a bajar 406 KB. Este script separa las dos cosas y poda:
 *
 *   1. COMPONENTES COMPARTIDOS. Todo lo que va dentro de @layer es igual en
 *      los siete temas (el script lo COMPRUEBA y falla si deja de serlo: un
 *      `@if $theme` en un mixin partiría el fichero compartido). Se publica
 *      una vez, sin tokens de tema.
 *   2. TOKENS POR TEMA. Lo que va fuera de capa —:root, sus variantes de modo
 *      claro/oscuro, @supports y @font-face— es el tema. Un token cuyas
 *      declaraciones son idénticas en los siete temas (valor y contexto) no es
 *      del tema: va al fichero compartido, dentro de `@layer syx.tokens`, y
 *      así cualquier :root sin capa de un tema —también uno hecho por un
 *      consumidor— lo pisa sin depender del orden de carga. El fichero del
 *      tema queda con lo que de verdad cambia: cambiar de tema es cambiar UN
 *      fichero pequeño.
 *   3. PODA. Solo se emiten los custom properties alcanzables —por var(),
 *      transitivamente— desde las reglas del bundle, MÁS la API pública: TODOS
 *      los --semantic-* (y lo que necesiten) se conservan siempre, porque son
 *      lo que un consumidor puede usar en su propio CSS. Se podan los
 *      --component-*, --primitive-* y alias heredados que nada lee. Quien
 *      necesite todo tiene <tema>.tokens.all.min.css.
 *
 * QUÉ SALE
 *   Paquete npm (exports en package.json):
 *     syx.components.min.css        componentes de full + utilidades, compartido
 *     syx.components.core.min.css   el core: base, formularios, layout mínimo
 *     syx.utilities.min.css         helpers + utilidades .syx-* (para el core)
 *     <tema>.tokens.min.css         tokens del tema, podados contra full
 *     <tema>.tokens.all.min.css     todos los tokens del tema, sin podar
 *     <tema>.full.min.css           todo en uno (compatibilidad): tokens + full
 *     <tema>.core.min.css           todo en uno (compatibilidad): tokens + core
 *   Sitio, en dist/site/ (no viaja en el paquete; las páginas lo cargan, y
 *   en una subcarpeta para que ningún export —`./bundles/*`— lo prometa):
 *     site.min.css                  sistema + capa site/, compartido
 *     site.<tema>.tokens.min.css    tokens del tema + del sitio, podados contra
 *                                   las reglas MÁS lo que citan los HTML y js/
 *     site.builder.min.css          theme-builder.html, minificado SIN podar:
 *                                   el editor reescribe primitivos y semánticos
 *                                   desde JS y necesita la cascada entera
 *   sizes.json                      tamaños raw/gzip/brotli de todo lo anterior
 *                                   y de lo que descarga cada página
 *
 * QUÉ TEMAS ENTRAN EN CADA FAMILIA
 * full y core, todos los temas (carpeta con _theme.scss): cada uno trae su
 * bundle-docs.scss y su bundle-core.scss, también los que salen de la
 * plantilla. El sitio, solo los que llevan su capa sin comentar en el
 * _setup.scss (`@include syx-bundle-site(...)`): un tema para un producto no
 * la lleva —la plantilla la deja comentada a propósito—, y exigirle el mismo
 * CSS con capa que a los temas del sitio tumbaba el build, `npm pack` y la
 * instalación desde git (octubre de 2026, al crear un tema de producto desde
 * la plantilla). La igualdad del CSS con capa se sigue exigiendo entre TODOS
 * los temas en full y core, y entre los del sitio en el sitio.
 *
 * Las cifras de tamaño de la documentación salen de aquí (`npm run build:dist`
 * o dist/sizes.json); no se escriben a mano.
 *
 * dist/ no se commitea: se genera en `prepare` (npm pack, npm publish e
 * instalación desde GitHub), en `npm run build` y en el despliegue de Pages.
 * Las url() de fuentes son relativas a dist/, al mismo nivel que css/; en
 * dist/site/ se reescriben un nivel más arriba.
 *
 * Uso: node scripts/build-dist.js [--quiet]
 * ----------------------------------------------------------------------------
 */
'use strict';
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const sass = require('sass');
const postcss = require('postcss');
const autoprefixer = require('autoprefixer');
const { llevaCapaSitio } = require('./lib/plantilla-tema');

const ROOT = path.resolve(__dirname, '..');
const SCSS = path.join(ROOT, 'scss');
const DIST = path.join(ROOT, 'dist');
const quiet = process.argv.includes('--quiet');

// Lo que se conserva aunque ninguna regla lo lea: la API de tokens que un
// consumidor puede usar en su propio CSS. Se documenta en el README.
const API_PUBLICA = /^--semantic-/;
// Páginas del sitio cuyas referencias a tokens (estilos en línea, <style>,
// scripts) cuentan como uso al podar los tokens del sitio.
const PAGINAS_SITIO = ['home.html', 'docs.html', 'why-syx.html'];

// ─── Compilar ────────────────────────────────────────────────────────────────

async function compilar(fuente) {
  const opts = { loadPaths: [SCSS], style: 'compressed' };
  const { css } = fuente.fichero ? sass.compile(fuente.fichero, opts) : sass.compileString(fuente, opts);
  return (await postcss([autoprefixer]).process(css, { from: undefined })).css;
}

// ─── Partir: orden de capas · reglas con capa · tokens sin capa ──────────────

// :root y sus variantes de modo (:root[data-theme="dark"],
// :root:not([data-theme="light"])), también repetido para ganar
// especificidad (:root:root, ver semantic/_motion.scss).
const esRoot = (sel) => /^:root(:root|\[[^\]]+\]|:not\([^)]*\))*$/.test(sel.trim());

function partir(css, quien) {
  const raiz = postcss.parse(css);
  const orden = [];
  const capas = [];
  const tokens = [];
  raiz.each((n) => {
    if (n.type === 'comment') return;
    if (n.type === 'atrule' && n.name === 'layer') (n.nodes ? capas : orden).push(n);
    else tokens.push(n);
  });
  // Lo que va fuera de capa tiene que ser tema: :root (en sus variantes de
  // modo), envuelto o no en @media/@supports, y @font-face. Una regla de
  // componente sin capa rompería la separación —y la cascada de SYX—, así
  // que se para aquí en vez de colarla en el fichero de tokens.
  for (const n of tokens) {
    if (n.type === 'atrule' && n.name === 'font-face') continue;
    const reglas = n.type === 'rule' ? [n] : [];
    if (n.type === 'atrule') n.walkRules((r) => reglas.push(r));
    const ajena = n.type === 'atrule' && !['media', 'supports'].includes(n.name)
      ? `@${n.name}` : reglas.find((r) => !esRoot(r.selector))?.selector;
    if (ajena) throw new Error(`${quien}: «${ajena}» va fuera de @layer y no es un token`);
  }
  return { orden: orden.map((n) => `@layer ${n.params};`), capas, tokens };
}

// ─── Grafo de tokens ─────────────────────────────────────────────────────────

const refs = (v) => [...String(v).matchAll(/var\(\s*(--[\w-]+)/g)].map((m) => m[1]);

function contexto(d) {
  const c = [];
  for (let p = d.parent; p && p.type !== 'root'; p = p.parent) c.unshift(p.type === 'rule' ? p.selector : `@${p.name} ${p.params}`);
  return c.join(' > ');
}

/** nombre → [{ctx, valor}] en orden de aparición, de los nodos de tokens. */
function declaraciones(tokens) {
  const m = new Map();
  for (const n of tokens) {
    n.walkDecls((d) => {
      if (!d.prop.startsWith('--')) return;
      if (!m.has(d.prop)) m.set(d.prop, []);
      m.get(d.prop).push({ ctx: contexto(d), valor: d.value });
    });
  }
  return m;
}

/** Une los grafos de todos los temas: si un tema hace que A lea B, B vive. */
function unir(declsPorTema) {
  const m = new Map();
  for (const d of declsPorTema) for (const [k, v] of d) m.set(k, (m.get(k) || []).concat(v));
  return m;
}

/** Cierre transitivo por var() desde las raíces, sobre el grafo de tokens. */
function alcanzables(raices, decls) {
  const vistos = new Set();
  const pila = [...raices];
  while (pila.length) {
    const t = pila.pop();
    if (vistos.has(t)) continue;
    vistos.add(t);
    for (const { valor } of decls.get(t) || []) pila.push(...refs(valor));
  }
  return vistos;
}

/** var() citados por las reglas con capa (propiedades y tokens locales). */
function usadosPorReglas(capas) {
  const s = new Set();
  for (const c of capas) c.walkDecls((d) => refs(d.value).forEach((r) => s.add(r)));
  return s;
}

/** Tokens cuyas declaraciones (contexto y valor, en orden) son las mismas en todos los temas. */
function invariantes(declsPorTema) {
  const [primero, ...resto] = declsPorTema;
  const firma = (lista) => JSON.stringify(lista);
  const s = new Set();
  for (const [nombre, lista] of primero) {
    const f = firma(lista);
    if (resto.every((m) => m.has(nombre) && firma(m.get(nombre)) === f)) s.add(nombre);
  }
  return s;
}

// ─── Filtrar y escribir ──────────────────────────────────────────────────────

/** Copia los nodos de tokens quedándose con las declaraciones que pasan el filtro. */
function filtrar(tokens, conservar, { fuentes }) {
  const out = [];
  for (const n of tokens) {
    if (n.type === 'atrule' && n.name === 'font-face') { if (fuentes) out.push(n.clone()); continue; }
    const c = n.clone();
    c.walkDecls((d) => { if (!conservar(d.prop)) d.remove(); });
    let vacio = true;
    while (vacio) {
      vacio = false;
      c.walk((x) => { if ((x.type === 'rule' || x.type === 'atrule') && x.nodes && x.nodes.length === 0) { x.remove(); vacio = true; } });
    }
    if (c.nodes && c.nodes.length) out.push(c);
  }
  return out;
}

const texto = (nodos) => { const r = postcss.root(); nodos.forEach((n) => r.append(n.clone())); return r.toString(); };
const capaTokens = (nodos) => (nodos.length ? `@layer syx.tokens{${texto(nodos)}}` : '');
const contar = (nodos) => { const s = new Set(); nodos.forEach((n) => n.walkDecls((d) => d.prop.startsWith('--') && s.add(d.prop))); return s.size; };

// ─── Principal ───────────────────────────────────────────────────────────────

async function main() {
  const temas = fs.readdirSync(path.join(SCSS, 'themes'))
    .filter((d) => !d.startsWith('_') && fs.existsSync(path.join(SCSS, 'themes', d, '_theme.scss')))
    .sort();
  // El sitio solo con los temas que llevan su capa (ver la cabecera).
  const temasSitio = temas.filter((t) => llevaCapaSitio(path.join(SCSS, 'themes', t)));
  if (!temasSitio.length) throw new Error('ningún tema lleva la capa del sitio (`@include syx-bundle-site(...)` en su _setup.scss): las páginas no tendrían hoja');
  fs.rmSync(DIST, { recursive: true, force: true });
  fs.mkdirSync(DIST, { recursive: true });
  const salidas = new Map(); // fichero → contenido
  const poda = {};

  // Una familia = un bundle compilado en sus temas (todos, por defecto) y
  // partido en piezas.
  async function familia(nombre, fuentePorTema, extra = [], deTemas = temas) {
    const piezas = [];
    for (const tema of deTemas) piezas.push({ tema, ...partir(await compilar(fuentePorTema(tema)), `${nombre}/${tema}`) });
    // El CSS con capa tiene que ser el mismo en todos los temas: es lo que se
    // publica una vez. Si un mixin vuelve a decidir por tema al compilar, se
    // para aquí con el bloque que difiere.
    const ref = piezas[0].capas.map((n) => n.toString());
    for (const p of piezas.slice(1)) {
      const otro = p.capas.map((n) => n.toString());
      const i = ref.findIndex((b, k) => b !== otro[k]);
      if (i !== -1 || otro.length !== ref.length) {
        const k = i === -1 ? ref.length : i;
        throw new Error(`${nombre}: el CSS con capa de ${p.tema} difiere del de ${piezas[0].tema} (bloque ${k}: ${(ref[k] || otro[k] || '').slice(0, 120)}…). `
          + 'Lo que cambia entre temas tiene que salir de tokens, no de `@if $theme` al compilar.');
      }
    }
    const capas = piezas[0].capas;
    const decls = piezas.map((p) => declaraciones(p.tokens));
    const invariante = invariantes(decls);
    // Raíces de la poda: lo que leen las reglas, la API pública y lo extra
    // (en el sitio, lo que citan las páginas).
    const raices = new Set([...usadosPorReglas(capas), ...extra]);
    for (const d of decls) for (const n of d.keys()) if (API_PUBLICA.test(n)) raices.add(n);
    const vivos = alcanzables(raices, unir(decls));
    // Un token que una regla CON capa declara en :root/html ganaría o
    // perdería distinto si su valor por defecto pasa a @layer syx.tokens.
    for (const c of capas) {
      c.walkDecls((d) => {
        if (d.prop.startsWith('--') && invariante.has(d.prop) && /(^|[\s,]):root|(^|[\s,])html\b/.test(d.parent.selector || '')) {
          throw new Error(`${nombre}: ${d.parent.selector} declara ${d.prop} dentro de una capa; moverlo a @layer syx.tokens cambiaría quién gana`);
        }
      });
    }
    const compartido = filtrar(piezas[0].tokens, (p) => p.startsWith('--') && vivos.has(p) && invariante.has(p), { fuentes: false });
    const delTema = (p) => filtrar(p.tokens, (prop) => !prop.startsWith('--') || (vivos.has(prop) && !invariante.has(prop)), { fuentes: true });
    return {
      piezas,
      orden: piezas[0].orden.join(''),
      // Sin el orden de capas: cada hoja lo antepone, porque el primer
      // @layer que ve el navegador fija la precedencia, y las hojas se
      // pueden cargar en cualquier orden.
      compartido: capaTokens(compartido) + texto(capas),
      nCompartido: contar(compartido),
      delTema,
    };
  }

  // ── Consumidores: full, core y utilidades ──
  const full = await familia('full', (t) => `@use 'themes/${t}/bundle-docs';\n@use 'utilities/index' as *;\n`);
  const core = await familia('core', (t) => `@use 'themes/${t}/bundle-core';\n`);
  const helpers = partir(await compilar(`@use 'themes/_shared/core' as *;\n@include syx-helpers();\n`), 'helpers');
  const utilidades = partir(await compilar(`@use 'utilities/index' as *;\n`), 'utilities');

  salidas.set('syx.components.min.css', full.orden + full.compartido);
  salidas.set('syx.components.core.min.css', core.orden + core.compartido);
  salidas.set('syx.utilities.min.css', full.orden + texto(helpers.capas) + texto(utilidades.capas));

  for (const p of full.piezas) {
    const pc = core.piezas.find((x) => x.tema === p.tema);
    const tokensFull = full.delTema(p);
    const tokensCore = core.delTema(pc);
    salidas.set(`${p.tema}.tokens.min.css`, texto(tokensFull));
    salidas.set(`${p.tema}.tokens.all.min.css`, texto(p.tokens));
    salidas.set(`${p.tema}.full.min.css`, full.orden + texto(tokensFull) + full.compartido);
    salidas.set(`${p.tema}.core.min.css`, core.orden + texto(tokensCore) + core.compartido);
    poda[p.tema] = {
      declarados: contar(p.tokens),
      full: contar(tokensFull) + full.nCompartido,
      core: contar(tokensCore) + core.nCompartido,
    };
  }

  // ── Sitio: sistema + capa site/, con lo que citan las páginas ──
  const citados = new Set();
  const fuentesSitio = PAGINAS_SITIO.map((f) => path.join(ROOT, f))
    .concat(fs.readdirSync(path.join(ROOT, 'js')).filter((f) => f.endsWith('.js')).map((f) => path.join(ROOT, 'js', f)));
  for (const f of fuentesSitio) {
    if (!fs.existsSync(f)) continue;
    for (const m of fs.readFileSync(f, 'utf8').matchAll(/--[a-z][\w-]*/g)) citados.add(m[0]);
  }
  const site = await familia('site', (t) => ({ fichero: path.join(SCSS, `styles-theme-${t}.scss`) }), citados, temasSitio);
  // Un nivel más hondo que dist/: las url() relativas (las fuentes) suben uno más.
  const enSite = (css) => css.replace(/url\((["']?)\.\.\//g, 'url($1../../');
  salidas.set('site/site.min.css', enSite(site.orden + site.compartido));
  for (const p of site.piezas) salidas.set(`site/site.${p.tema}.tokens.min.css`, enSite(texto(site.delTema(p))));
  salidas.set('site/site.builder.min.css', enSite(await compilar({ fichero: path.join(SCSS, 'setup-builder.scss') })));

  fs.mkdirSync(path.join(DIST, 'site'), { recursive: true });
  for (const [f, css] of salidas) fs.writeFileSync(path.join(DIST, f), css);

  // ── Tamaños ──
  const medir = (css) => ({
    raw: Buffer.byteLength(css),
    gzip: zlib.gzipSync(css, { level: 9 }).length,
    brotli: zlib.brotliCompressSync(css, { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 11 } }).length,
  });
  const hojas = {};
  for (const [f, css] of salidas) hojas[f] = medir(css);
  const suma = (lista) => lista.reduce((a, f) => ({ raw: a.raw + hojas[f].raw, gzip: a.gzip + hojas[f].gzip, brotli: a.brotli + hojas[f].brotli }), { raw: 0, gzip: 0, brotli: 0 });
  const paginas = {};
  for (const t of temasSitio) {
    const lista = ['site/site.min.css', `site/site.${t}.tokens.min.css`];
    paginas[`páginas · ${t}`] = { hojas: lista, ...suma(lista) };
  }
  for (const t of temasSitio) paginas[`cambiar a ${t}`] = { hojas: [`site/site.${t}.tokens.min.css`], ...suma([`site/site.${t}.tokens.min.css`]) };
  paginas['theme-builder'] = { hojas: ['site/site.builder.min.css'], ...suma(['site/site.builder.min.css']) };
  // Referencia: lo que cargaban las páginas antes, la hoja showroom de css/.
  const referencia = {};
  for (const t of temasSitio) {
    const f = path.join(ROOT, 'css', `styles-theme-${t}.css`);
    if (fs.existsSync(f)) referencia[`css/styles-theme-${t}.css`] = medir(fs.readFileSync(f));
  }
  fs.writeFileSync(path.join(DIST, 'sizes.json'), JSON.stringify({
    _nota: 'Generado por scripts/build-dist.js. Bytes. No se edita a mano.',
    apiPublica: String(API_PUBLICA),
    hojas, paginas, poda, referencia,
  }, null, 2) + '\n');

  if (!quiet) {
    const kb = (b) => (b / 1024).toFixed(1).padStart(6);
    const fila = (f, m) => console.log(`   ${f.padEnd(34)} ${kb(m.raw)} KB · ${kb(m.gzip)} gz · ${kb(m.brotli)} br`);
    console.log('\n── DIST ' + '─'.repeat(68) + '\n');
    for (const f of salidas.keys()) fila(f, hojas[f]);
    console.log('\n   lo que descarga cada página');
    for (const [p, m] of Object.entries(paginas)) fila(p, m);
    console.log('\n   antes: la hoja showroom de css/ que cargaban las páginas');
    for (const [f, m] of Object.entries(referencia)) fila(f.replace('css/styles-theme-', ''), m);
    console.log('\n   custom properties: declarados → emitidos');
    for (const [t, p] of Object.entries(poda)) console.log(`   ${t.padEnd(12)} ${p.declarados} → full ${p.full} · core ${p.core}`);
    console.log(`\n   ${salidas.size} hojas en dist/ · tamaños en dist/sizes.json\n`);
  }
}

main().catch((e) => { console.error(`❌ ${e.message}`); process.exit(1); });
