/**
 * SYX — CSS normalizado
 * ─────────────────────
 * Dos compilaciones del mismo SCSS pueden diferir en el formato sin diferir en
 * nada que el navegador vea: otra versión de dart-sass, o el minificador de
 * Prepros (que es como quien mantiene SYX publica css/ desde octubre de 2026).
 * Esto reduce una hoja a lo que significa —reglas, selectores, declaraciones y
 * valores, en su orden— para compararla con otra. Una regla, un selector o un
 * valor distinto siguen siendo distintos.
 *
 * VALORES (con postcss-value-parser, no con expresiones regulares)
 *   · espacios del formato fuera, y sin espacio alrededor de `,` `/` `:`
 *     dentro de un valor (`oklch(0 0 0 / .05)` = `oklch(0 0 0/.05)`);
 *   · ceros a la izquierda (0.5 = .5), hex en minúsculas, `rgba(0,0,0,0)` =
 *     `transparent` y sin espacios alrededor de `*` y `/` dentro de calc();
 *   · las CADENAS y el interior de `url()` se comparan tal cual: `"a  b"` y
 *     `"a b"` son contenidos distintos (la auditoría de octubre II encontró
 *     que el normalizador anterior los igualaba).
 *
 * SELECTORES (lo que hace el minificador de Prepros, y nada más)
 *   · el orden de una lista no cuenta: `strong,em` = `em,strong`;
 *   · `::before`/`::after`/`::first-line`/`::first-letter` = `:before`…;
 *   · el `*` implícito: `*::before` = `::before`, `*.a` = `.a`;
 *   · comillas de atributo innecesarias: `[type="radio"]` = `[type=radio]`;
 *   · `:nth-child(1)` = `:first-child` (y sus parientes), y en @keyframes
 *     `from` = `0%`, `to` = `100%`.
 *
 * Comentarios y @charset fuera. Se conserva el orden de reglas y de
 * declaraciones: si un minificador fusionara o reordenara reglas, eso SÍ es un
 * cambio que alguien debe mirar.
 */

'use strict';

const postcss = require('postcss');
const vp = require('postcss-value-parser');

const espacios = (s) => s.replace(/\s+/g, ' ').trim();
const UNIR = '\u0000';

function nodos(lista) {
  let out = '';
  for (const n of lista) {
    if (n.type === 'space' || n.type === 'comment') { out += ' '; continue; }
    if (n.type === 'div') { out = out.replace(/ $/, '') + n.value + UNIR; continue; }
    if (n.type === 'string') { out += n.quote + n.value + n.quote; continue; }
    if (n.type === 'function') {
      // url() y su contenido, tal cual (salvo los espacios de los bordes).
      if (n.value.toLowerCase() === 'url') { out += `url(${vp.stringify(n.nodes).trim()})`; continue; }
      out += `${n.value}(${nodos(n.nodes).trim()})`;
      continue;
    }
    let w = n.value;
    if (n.type === 'word') {
      w = w.replace(/^([+-]?)0+(?=\.\d)/, '$1');
      if (/^#[0-9a-f]{3,8}$/i.test(w)) w = w.toLowerCase();
    }
    out += w;
  }
  return out.replace(new RegExp(`${UNIR} ?`, 'g'), '');
}

// Lo que reescribe el estilo comprimido de dart-sass: `transparent` como
// `rgba(0,0,0,0)` y los espacios de `*` y `/` en calc() (que no significan
// nada; los de `+` y `-` sí, y se quedan).
const valor = (v) => nodos(vp(v).nodes).trim()
  .replace(/\brgba\(0,0,0,0\)/gi, 'transparent')
  .replace(/ ?([*/]) ?/g, (m, op, i, todo) => (dentroDeCalc(todo, i) ? op : m));

/** ¿La posición `i` está dentro de un calc()/min()/max()/clamp()? */
function dentroDeCalc(s, i) {
  let prof = 0;
  for (let j = i - 1; j >= 0; j--) {
    if (s[j] === ')') prof++;
    else if (s[j] === '(') {
      if (prof === 0) return /(?:calc|min|max|clamp)$/i.test(s.slice(Math.max(0, j - 5), j));
      prof--;
    }
  }
  return false;
}

/** Divide una lista de selectores por sus comas de primer nivel. */
function partir(sel) {
  const partes = [];
  let prof = 0, cad = null, ini = 0;
  for (let i = 0; i < sel.length; i++) {
    const c = sel[i];
    if (cad) { if (c === '\\') i++; else if (c === cad) cad = null; continue; }
    if (c === '"' || c === "'") cad = c;
    else if (c === '(' || c === '[') prof++;
    else if (c === ')' || c === ']') prof--;
    else if (c === ',' && prof === 0) { partes.push(sel.slice(ini, i)); ini = i + 1; }
  }
  partes.push(sel.slice(ini));
  return partes;
}

/** Sin espacios alrededor de las comas internas (`:is(a, b)`), fuera de comillas. */
function comasInternas(s) {
  let out = '', cad = null;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (cad) { out += c; if (c === '\\') out += s[++i] || ''; else if (c === cad) cad = null; continue; }
    if (c === '"' || c === "'") { cad = c; out += c; continue; }
    if (c === ',') { out = out.replace(/\s+$/, '') + ','; while (/\s/.test(s[i + 1] || '')) i++; continue; }
    out += c;
  }
  return out;
}

function unSelector(s) {
  return comasInternas(espacios(s))
    .replace(/\s*([>+~])\s*/g, '$1')
    .replace(/::(before|after|first-line|first-letter)\b/gi, ':$1')
    .replace(/:nth-child\(\s*1\s*\)/gi, ':first-child')
    .replace(/:nth-last-child\(\s*1\s*\)/gi, ':last-child')
    .replace(/:nth-of-type\(\s*1\s*\)/gi, ':first-of-type')
    .replace(/:nth-last-of-type\(\s*1\s*\)/gi, ':last-of-type')
    // `*` delante de algo que ya acota (clase, id, atributo, pseudo) sobra.
    .replace(/(^|[\s>+~(,])\*(?=[.#[:])/g, '$1')
    .replace(/\[\s*([\w-]+)\s*([~|^$*]?=)\s*(["'])([A-Za-z_-][\w-]*)\3\s*\]/g, '[$1$2$4]');
}

const selector = (s) => partir(s).map(unSelector).sort().join(',');

/** La hoja reducida a su significado, como texto comparable. */
function normalizar(css) {
  const root = postcss.parse(css);
  const out = [];
  root.walk((n) => {
    if (n.type === 'comment') return;
    let prof = 0;
    for (let p = n.parent; p && p.type !== 'root'; p = p.parent) prof++;
    if (n.type === 'atrule') {
      if (n.name === 'charset') return;
      out.push(`${prof}@${n.name} ${valor(n.params).replace(/\s*:\s*/g, ':')}`);
    } else if (n.type === 'rule') {
      // En @keyframes, `from` es 0% y `to` es 100%.
      const fotograma = n.parent && n.parent.type === 'atrule' && /keyframes$/i.test(n.parent.name);
      const sel = fotograma
        ? partir(n.selector).map((x) => ({ from: '0%', to: '100%' }[x.trim().toLowerCase()] || x.trim())).sort().join(',')
        : selector(n.selector);
      out.push(`${prof}R ${sel}`);
    } else if (n.type === 'decl') {
      out.push(`${prof}D ${n.prop.trim()}:${valor(n.value)}${n.important ? '!important' : ''}`);
    }
  });
  return out.join('\n');
}

module.exports = { normalizar };
