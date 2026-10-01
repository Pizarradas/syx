#!/usr/bin/env node
/**
 * SYX — tokens.json generado desde el SCSS
 * ────────────────────────────────────────
 * tokens.json es el registro de NOMBRES del sistema: se publica en npm y lo
 * leen el servidor MCP (para saber qué tokens existen), scripts/propose.js
 * (para negar un valor que cite un token inexistente) y R05/R06/R08 de
 * scripts/syx-validate.js. Este script lo escribe a partir de la fuente.
 *
 * POR QUÉ EXISTE
 * Hasta octubre de 2026 se mantenía a mano (en septiembre se le añadieron 51
 * entradas con un script de un solo uso) y nadie lo comparaba con el SCSS:
 * 80 tokens de componente y 18 semánticos tenían un `rawValue` que ya no era
 * el del SCSS —`--component-button-font-size-sm` figuraba como
 * `var(--primitive-space-2)` cuando _buttons.scss dice
 * `var(--semantic-font-size-body-sm)`—, y quien lo consultaba recibía, con
 * toda la autoridad de un contrato publicado, un valor que no existía. Un
 * fichero que se puede editar a mano y que nadie compara diverge: la única
 * salida es que no se edite a mano.
 *
 * DE DÓNDE SALE CADA SECCIÓN (en orden de cascada; la última declaración
 * incondicional gana, y un bloque @supports la sustituye porque es lo que
 * aplica un navegador actual)
 *   primitives  scss/abstracts/tokens/primitives/*.scss
 *   semantic    scss/abstracts/tokens/semantic/*.scss
 *   component   scss/abstracts/tokens/components/*.scss
 *   reset       scss/base/_reset-tokens.scss
 *   layout      scss/base/_deprecated-aliases.scss  (también --theme-* y el
 *   theme                                            alias --semantic-border-focus)
 *   icon        scss/themes/_base/_universal.scss
 *   + CONTRATO DE TEMA: los tokens que el árbol común no declara pero que
 *     declaran TODOS los temas compilados (iconos de interfaz, filtros de
 *     estado, --primitive-color-disabled, --semantic-border-width…). Son
 *     parte de lo que cualquier componente puede citar, así que van, con una
 *     nota que lo dice. Los que solo declaran ALGUNOS temas (su paleta propia:
 *     coral, forest, midnight…) no van: son privados de ese tema y ningún
 *     componente común debe citarlos. Su valor por tema está en
 *     contracts/resolved-tokens.json.
 *   Se ignoran @media (prefers-reduced-motion…) y el mixin de modo oscuro:
 *   son variantes del mismo token, no su valor de partida.
 *
 * QUÉ SE DERIVA Y QUÉ SE CONSERVA
 *   Derivado:   key, type, value, rawValue, layer, y el orden.
 *   Derivado de la FUENTE desde octubre de 2026: status deprecated y
 *               replacedBy, de un comentario en la línea de encima de la
 *               declaración:
 *                 // @deprecated --semantic-color-state-error: por qué
 *                 --semantic-color-error: var(--semantic-color-state-error);
 *               Antes se conservaban del tokens.json anterior, que nadie
 *               edita: una deprecación no tenía dónde escribirse. Ahora el
 *               SCSS manda, y quitar el comentario quita la deprecación.
 *   Conservado del tokens.json anterior, por nombre (no está en el SCSS):
 *               note, status reserved, aliasOf.
 *   Un token que desaparece del SCSS desaparece de aquí: lo deprecado se
 *   documenta mientras existe, no después.
 *
 *   `type` usa los tipos de variable de Figma, que es de donde viene el
 *   esquema: ALIAS (un `var()` solo; `value` es el nombre), COLOR (literal de
 *   color), FLOAT (número sin unidad, en px o en rem, o `calc(N * var(--x))` con
 *   --x numérico; `value` es el número en px, a 16 px el rem) y STRING (todo lo demás). Los data
 *   URI se abrevian a `url("data:image/svg+xml,...")`: el SVG está en el CSS.
 *
 * DOBLES DEFINICIONES
 *   Si un token se declara de forma incondicional en dos sitios del árbol
 *   común, la primera es código muerto: el valor escrito no es el que se ve.
 *   Así estuvieron once tokens de superficie hasta octubre de 2026. Se falla.
 *
 * Sin marca de tiempo a propósito: el fichero solo cambia cuando cambia su
 * contenido, y --check compara contenido.
 *
 * Uso:
 *   node scripts/build-tokens-json.js           escribe tokens.json
 *   node scripts/build-tokens-json.js --check   falla si está desfasado
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { leerDeclaraciones, sinComentarios: sinComentariosScss } = require('./lib/scss-tokens');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'tokens.json');
const SCSS = path.join(ROOT, 'scss');
const relRoot = (p) => path.relative(ROOT, p).split(path.sep).join('/');

const SECCION = {
  primitive: 'primitives', semantic: 'semantic', component: 'component',
  reset: 'reset', layout: 'layout', theme: 'theme', icon: 'icon',
};
const OFICIAL = /^--(primitive|semantic|component|reset|layout|theme|icon)-/;

const LAYERS = [
  { name: 'primitive', prefix: '--primitive-', description: 'Raw values: colors, sizes, typography scales, icon data-URIs, filter values' },
  { name: 'semantic', prefix: '--semantic-', description: 'Contextual aliases: what a value means, not what it is' },
  { name: 'component', prefix: '--component-', description: 'Component-specific overrides, scoped to a single component' },
  { name: 'layout', prefix: '--layout-', description: 'Structural layout tokens: max-width, gaps, paddings' },
  { name: 'reset', prefix: '--reset-', description: 'Base browser reset defaults wired to semantic tokens' },
  { name: 'icon', prefix: '--icon-', description: 'Semantic icon aliases (point to primitive-icon-*)' },
  { name: 'theme', prefix: '--theme-', description: 'Architectural configuration tokens: focus, radius, border' },
];

// ─── 1 · Fuentes, en el orden en que llegan al CSS ──────────────────────────

// El orden de los parciales lo dicta el index.scss de cada capa (@forward).
function parcialesDe(dir) {
  const idx = fs.readFileSync(path.join(dir, 'index.scss'), 'utf8');
  return [...idx.matchAll(/@forward\s+['"]([^'"]+)['"]/g)]
    .map((m) => path.join(dir, `_${m[1]}.scss`))
    .filter((f) => fs.existsSync(f));
}

function fuentesComunes() {
  const T = path.join(SCSS, 'abstracts', 'tokens');
  return [
    ...parcialesDe(path.join(T, 'primitives')),
    ...parcialesDe(path.join(T, 'semantic')),
    ...parcialesDe(path.join(T, 'components')),
    path.join(SCSS, 'base', '_reset-tokens.scss'),
    path.join(SCSS, 'base', '_deprecated-aliases.scss'),
    path.join(SCSS, 'themes', '_base', '_universal.scss'),
  ];
}

// Temas compilados: los que tienen punto de entrada styles-theme-<x>.scss.
function temas() {
  return fs.readdirSync(SCSS)
    .filter((f) => /^styles-theme-.+\.scss$/.test(f))
    .map((f) => f.replace(/^styles-theme-|\.scss$/g, ''))
    .filter((t) => fs.existsSync(path.join(SCSS, 'themes', t)))
    .sort();
}

// Qué cuenta como valor de partida. Un @mixin cualquiera se incluye en :root
// (universal-values, theme-<x>), salvo el de modo oscuro.
function clase(contexto) {
  if (contexto.some((c) => /^@media\b/.test(c) || /^@mixin dark-mode-tokens\b/.test(c))) return 'variante';
  if (contexto.some((c) => /^:root\[|:not\(/.test(c))) return 'variante';
  if (contexto.some((c) => /^@supports\b/.test(c))) return 'supports';
  return 'base';
}

// ─── 2 · Recoger ────────────────────────────────────────────────────────────

// `// @deprecated --sustituto: por qué` en la línea justo encima.
const DEPRECADO = /^\s*\/\/\s*@deprecated\s+(--[\w-]+)\s*(?::\s*(.*\S))?\s*$/;

function recoger() {
  const decl = new Map(); // nombre → { valor, fichero, linea }
  const dobles = [];
  const deprecados = new Map(); // nombre → { replacedBy, porque, donde }
  for (const f of fuentesComunes()) {
    const texto = fs.readFileSync(f, 'utf8');
    const lineas = texto.replace(/\r\n?/g, '\n').split('\n');
    for (const d of leerDeclaraciones(texto)) {
      if (!OFICIAL.test(d.name)) continue;
      const dep = DEPRECADO.exec(lineas[d.line - 2] || '');
      if (dep) deprecados.set(d.name, { replacedBy: dep[1], porque: dep[2] || null, donde: `${relRoot(f)}:${d.line}` });
      const c = clase(d.contexto);
      if (c === 'variante') continue;
      const previo = decl.get(d.name);
      if (c === 'base' && previo && previo.clase === 'base') {
        dobles.push({ token: d.name, a: `${relRoot(previo.fichero)}:${previo.linea}`, b: `${relRoot(f)}:${d.line}` });
      }
      // Un @supports mejora el valor base; no se deja pisar por él al revés.
      if (c === 'base' && previo && previo.clase === 'supports') continue;
      decl.set(d.name, { valor: d.value, fichero: f, linea: d.line, clase: c });
    }
  }

  // Contrato de tema: lo que declaran TODOS los temas y el árbol común no.
  const lista = temas();
  const porTema = lista.map((t) => {
    const m = new Map();
    const dir = path.join(SCSS, 'themes', t);
    for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.scss')).sort()) {
      for (const d of leerDeclaraciones(fs.readFileSync(path.join(dir, f), 'utf8'))) {
        if (!OFICIAL.test(d.name) || clase(d.contexto) !== 'base') continue;
        if (!m.has(d.name)) m.set(d.name, d.value);
      }
    }
    return m;
  });
  const plantilla = new Map();
  const tpl = path.join(SCSS, 'themes', '_template', '_theme.scss');
  if (fs.existsSync(tpl)) {
    for (const d of leerDeclaraciones(fs.readFileSync(tpl, 'utf8'))) {
      if (OFICIAL.test(d.name) && clase(d.contexto) === 'base' && !plantilla.has(d.name)) plantilla.set(d.name, d.value);
    }
  }
  const contrato = new Map();
  if (porTema.length) {
    for (const [nombre] of porTema[0]) {
      if (decl.has(nombre) || !porTema.every((m) => m.has(nombre))) continue;
      const valores = new Set(porTema.map((m) => m.get(nombre)));
      contrato.set(nombre, {
        valor: valores.size === 1 ? [...valores][0] : (plantilla.get(nombre) || porTema[0].get(nombre)),
        varia: valores.size > 1,
      });
    }
  }
  return { decl, dobles, contrato, temas: lista, deprecados };
}

// ─── 3 · Tipar ──────────────────────────────────────────────────────────────

function abreviar(v) {
  if (/data:|#\{\$icon-path\}/.test(v)) return 'url("data:image/svg+xml,...")';
  return v;
}

const NUM = /^-?(?:\d+\.?\d*|\.\d+)$/;
// rem → px con la base del navegador. Es la que asume todo el sistema
// (los comentarios «// 8px» de primitives/_spacing.scss, el export a Figma).
const REM_PX = 16;

function tipar(raw, numericos) {
  const alias = /^var\(\s*(--[\w-]+)\s*\)$/.exec(raw);
  if (alias) return { type: 'ALIAS', value: alias[1] };
  if (!/var\(/.test(raw) && /^(?:#[0-9a-f]{3,8}|(?:oklch|oklab|lch|lab|rgba?|hsla?|color)\()/i.test(raw)) {
    return { type: 'COLOR', value: raw };
  }
  const px = /^(-?(?:\d+\.?\d*|\.\d+))(px|rem)?$/.exec(raw);
  if (px) return { type: 'FLOAT', value: Math.round(Number(px[1]) * (px[2] === 'rem' ? REM_PX : 1) * 1000) / 1000 };
  // calc(N * var(--x)) o calc(var(--x) * N), con --x numérico: el resultado.
  const m = /^calc\(\s*(?:(-?[\d.]+)\s*\*\s*var\((--[\w-]+)\)|var\((--[\w-]+)\)\s*\*\s*(-?[\d.]+))\s*\)$/.exec(raw);
  if (m) {
    const n = Number(m[1] ?? m[4]);
    const base = numericos.get(m[2] ?? m[3]);
    if (NUM.test(String(n)) && typeof base === 'number') {
      return { type: 'FLOAT', value: Math.round(n * base * 1000) / 1000 };
    }
  }
  return { type: 'STRING', value: raw };
}

// ─── 4 · Construir ──────────────────────────────────────────────────────────

const CONSERVADOS = ['status', 'aliasOf', 'note'];

function construir(previo) {
  const { decl, dobles, contrato, temas: lista, deprecados } = recoger();
  const anteriores = new Map();
  for (const [s, v] of Object.entries(previo || {})) {
    if (s === '_meta' || !v || typeof v !== 'object') continue;
    for (const [k, e] of Object.entries(v)) anteriores.set(k, e);
  }

  const todos = [
    ...[...decl].map(([n, d]) => ({ nombre: n, raw: abreviar(d.valor), deTema: false })),
    ...[...contrato].map(([n, d]) => ({ nombre: n, raw: abreviar(d.valor), deTema: true, varia: d.varia })),
  ];

  // Primero los numéricos, para que un calc() pueda multiplicar por su base.
  // Hasta que nada cambie: un FLOAT puede salir de otro FLOAT (space-1 sale de
  // space-base; space-2 de… space-base también, pero no hay que suponerlo).
  const numericos = new Map();
  for (let vuelta = 0; vuelta < 4; vuelta++) {
    for (const t of todos) {
      const r = tipar(t.raw, numericos);
      if (r.type === 'FLOAT') numericos.set(t.nombre, r.value);
      if (r.type === 'ALIAS' && numericos.has(r.value)) numericos.set(t.nombre, numericos.get(r.value));
    }
  }

  const out = {
    _meta: {
      source: 'SYX Design System — scss/abstracts/tokens/ (+ base/_reset-tokens, base/_deprecated-aliases, themes/_base/_universal y el contrato de tema)',
      generator: 'scripts/build-tokens-json.js',
      generated: 'No se edita a mano: npm run build lo regenera y npm run check:tokens-json falla si está desfasado. Las notas, el status deprecated/reserved, aliasOf y replacedBy se conservan por nombre de la versión anterior.',
      baseFontPx: REM_PX,
      baseSpacePx: numericos.get('--primitive-space-base') ?? null,
      types: 'Tipos de variable de Figma: ALIAS (un var() solo; value = nombre del token), COLOR (literal), FLOAT (número sin unidad, px, rem o calc(N * var(--x)) con --x numérico; value en px, a 16 px el rem) y STRING (lo demás).',
      themeContract: `Tokens que el árbol común no declara pero que declaran los ${lista.length} temas compilados (${lista.join(', ')}). Llevan una nota que lo dice; su valor por tema está en contracts/resolved-tokens.json. Lo que declaran solo algunos temas es privado de ese tema y no figura aquí.`,
      layers: LAYERS,
    },
  };
  for (const s of Object.values(SECCION)) out[s] = {};

  for (const t of todos) {
    const capa = OFICIAL.exec(t.nombre)[1];
    const { type, value } = tipar(t.raw, numericos);
    const e = { key: t.nombre.slice(capa.length + 3), type, value, rawValue: t.raw, status: 'active' };
    const ant = anteriores.get(t.nombre);
    if (ant) for (const c of CONSERVADOS) if (ant[c] !== undefined) e[c] = ant[c];
    // La deprecación sale del SCSS, no del fichero anterior (ver cabecera).
    if (e.status === 'deprecated') e.status = 'active';
    const dep = deprecados.get(t.nombre);
    if (dep) {
      e.status = 'deprecated';
      e.replacedBy = dep.replacedBy;
      e.note = `Deprecado: usa ${dep.replacedBy}${dep.porque ? ` (${dep.porque})` : ''}.`;
    }
    if (t.deTema) {
      // La nota de origen se añade a la que hubiera, una sola vez (al
      // regenerar, la nota conservada ya la trae).
      const origen = t.varia
        ? 'Lo declara cada tema, no el árbol común, y su valor varía por tema: consulta contracts/resolved-tokens.json.'
        : 'Lo declara cada tema, no el árbol común (hoy todos con este mismo valor).';
      const previa = (e.note || '').replace(/\s*Lo declara cada tema, no el árbol común[^]*$/, '');
      e.note = previa ? `${previa} ${origen}` : origen;
    }
    e.layer = capa;
    out[SECCION[capa]][t.nombre] = e;
  }

  const desaparecidos = [...anteriores.keys()].filter((k) => !todos.some((t) => t.nombre === k));
  return { out, dobles, desaparecidos, contrato, deprecados, nombres: new Set(todos.map((t) => t.nombre)) };
}

// ─── 5 · Escribir o comprobar ───────────────────────────────────────────────

function main() {
  const check = process.argv.includes('--check');
  const previo = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : null;
  const { out, dobles, desaparecidos, contrato, deprecados, nombres } = construir(previo);
  const texto = JSON.stringify(out, null, 2) + '\n';
  const cuenta = Object.entries(out).filter(([k]) => k !== '_meta')
    .map(([k, v]) => `${k} ${Object.keys(v).length}`).join(' · ');

  console.log('\n── TOKENS.JSON DESDE EL SCSS ───────────────────────────────────\n');

  if (dobles.length) {
    console.log(`❌ ${dobles.length} token(s) declarados dos veces en el árbol común. La primera`);
    console.log('   declaración es código muerto: el valor escrito no es el que se ve.\n');
    for (const d of dobles) console.log(`   ${d.token}\n     ${d.a}  (tapada por)  ${d.b}`);
    console.log('\n   Deja una sola: la que hoy gana, en la capa que le corresponde.\n');
    process.exit(1);
  }

  // Una deprecación tiene que apuntar a algo que exista y no esté deprecado, y
  // el propio sistema no puede seguir usando lo que deprecó: ni leerlo en un
  // componente ni declararlo en un tema (desde octubre de 2026 los alias
  // deprecados SIGUEN al canónico; un tema que declara el alias ya no cambia
  // nada).
  const malDeprecados = [];
  for (const [n, d] of deprecados) {
    if (!nombres.has(d.replacedBy)) malDeprecados.push(`${n} → ${d.replacedBy}: el sustituto no existe (${d.donde})`);
    else if (deprecados.has(d.replacedBy)) malDeprecados.push(`${n} → ${d.replacedBy}: el sustituto también está deprecado (${d.donde})`);
  }
  if (deprecados.size) {
    const leer = new RegExp(`var\\(\\s*(${[...deprecados.keys()].join('|')})\\s*[,)]`);
    const declarar = new RegExp(`^\\s*(${[...deprecados.keys()].join('|')})\\s*:`);
    const andar = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
      const p = path.join(dir, e.name);
      return e.isDirectory() ? andar(p) : e.name.endsWith('.scss') ? [p] : [];
    });
    for (const f of andar(SCSS)) {
      const rel = relRoot(f);
      const enTema = rel.startsWith('scss/themes/') && !rel.startsWith('scss/themes/_base/');
      sinComentariosScss(fs.readFileSync(f, 'utf8')).split('\n').forEach((l, i) => {
        const r = leer.exec(l);
        if (r) malDeprecados.push(`${rel}:${i + 1} lee ${r[1]} (deprecado): usa ${deprecados.get(r[1]).replacedBy}`);
        const dcl = enTema && declarar.exec(l);
        if (dcl) malDeprecados.push(`${rel}:${i + 1} declara ${dcl[1]} (deprecado): declara ${deprecados.get(dcl[1]).replacedBy}`);
      });
    }
  }
  if (malDeprecados.length) {
    console.log(`❌ ${malDeprecados.length} problema(s) con los tokens deprecados:\n`);
    for (const m of malDeprecados) console.log(`   ${m}`);
    console.log('');
    process.exit(1);
  }

  if (check) {
    const actual = fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8') : '';
    if (actual !== texto) {
      const a = previo || {};
      const difs = [];
      for (const s of Object.values(SECCION)) {
        const x = a[s] || {};
        const y = out[s];
        for (const k of new Set([...Object.keys(x), ...Object.keys(y)])) {
          if (JSON.stringify(x[k]) !== JSON.stringify(y[k])) {
            difs.push(`${k}: ${x[k] ? `rawValue ${JSON.stringify(x[k].rawValue)}` : '(no está)'} → ${y[k] ? JSON.stringify(y[k].rawValue) : '(ya no existe en el SCSS)'}`);
          }
        }
      }
      console.log('❌ tokens.json no coincide con el SCSS.\n');
      console.log(`   ${difs.length} entrada(s) distinta(s)${difs.length ? '. Las primeras:' : ' (cambia _meta o el orden)'}\n`);
      for (const d of difs.slice(0, 8)) console.log(`   ${d}`);
      console.log('\n   tokens.json no se edita a mano. Ejecuta: npm run build:tokens-json\n');
      process.exit(1);
    }
    console.log(`✅ Al día · ${cuenta}\n`);
    return;
  }

  fs.writeFileSync(OUT, texto);
  console.log(`   ${cuenta}`);
  console.log(`   contrato de tema (lo declaran todos los temas)  ${contrato.size}`);
  console.log(`   deprecados (// @deprecated en el SCSS)          ${deprecados.size}`);
  if (desaparecidos.length) {
    console.log(`\n   ${desaparecidos.length} entrada(s) del tokens.json anterior ya no existen en el SCSS y salen:`);
    for (const d of desaparecidos) console.log(`     · ${d}`);
  }
  console.log('');
}

main();
