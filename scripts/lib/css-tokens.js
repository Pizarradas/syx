/**
 * SYX — Motor de lectura de tokens desde CSS compilado
 * ────────────────────────────────────────────────────
 * Analiza el CSS, decide qué declaraciones ganan en cada modo y resuelve las
 * cadenas de `var()`. Vive aquí y no dentro de un script porque lo usan dos:
 * el generador del snapshot (`build-token-snapshot.js`) y el servidor MCP, que
 * necesita además la CADENA de alias para poder responder no solo qué vale un
 * token, sino de dónde le viene el valor.
 *
 * Tenerlo duplicado habría garantizado que los dos se desincronizaran, que es
 * exactamente el problema que esta tanda de trabajo vino a arreglar.
 */

'use strict';

const crypto = require('crypto');

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
        out[name] = canonico(v === null ? '' : v);
      }
      return out;
    },
    faltan, cubiertos, ciclos,
  };
}

/**
 * Forma canónica de un valor.
 *
 * El snapshot se versiona y se compara, así que dos builds del MISMO CSS tienen
 * que producir el mismo texto. No lo hacían: al minificar desaparece el espacio
 * detrás de las comas —`Arial, sans-serif` pasa a `Arial,sans-serif` y
 * `clamp(a, b, c)` a `clamp(a,b,c)`— y colapsar espacios no devuelve los que ya
 * no están. 118 tokens salían distintos entre un build expandido y uno
 * minificado del mismo código, y `check:tokens` fallaba por FORMATO, que es la
 * peor manera de gastar la atención de quien lo ejecuta.
 *
 * Se quitan los espacios que en CSS no significan nada: los de detrás de una
 * coma, los pegados a un paréntesis y los que rodean a la barra —`oklch(0 0 0 / 0.05)` y `oklch(0 0 0/0.05)`
 * son el mismo color, y el minificador escribe el segundo—. NO se tocan los que
 * rodean a `+` ni a `-`: dentro de `calc()` son obligatorios y borrarlos
 * cambiaría el significado. Y se respeta lo que va entre comillas, donde una
 * coma es texto y no un separador.
 */
function canonico(v) {
  let out = '';
  let quote = null;
  const s = String(v).replace(/\s+/g, ' ').trim();
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (quote) {
      out += c;
      if (c === quote && s[i - 1] !== '\\') quote = null;
      continue;
    }
    if (c === '"' || c === "'") { quote = c; out += c; continue; }
    if (c === ' ' && (out.endsWith(',') || out.endsWith('/') || out.endsWith('('))) continue;
    if (c === ' ' && (s[i + 1] === '/' || s[i + 1] === ')')) continue;
    out += c;
  }
  return out;
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
  const pool = {};
  return {
    // El identificador sale del CONTENIDO, no de un contador. Con un contador
    // por orden de aparición, añadir un icono o reordenar los temas desplazaba
    // el identificador de todos los siguientes y el diff del fichero versionado
    // se llenaba de cambios que no eran cambios.
    ref(value) {
      if (!value.includes('data:')) return value;
      const id = crypto.createHash('sha1').update(value).digest('hex').slice(0, 10);
      pool[id] = value;
      return ASSET + id;
    },
    pool,
    get size() { return Object.keys(pool).length; },
  };
}
/**
 * La cadena de alias de un token: por qué vale lo que vale.
 *
 * El snapshot guarda el valor final; esto reconstruye el camino. Es lo que
 * convierte una respuesta en una explicación: no "vale este azul" sino "vale
 * este azul porque lo hereda de --semantic-color-primary, que a su vez sale de
 * --primitive-color-blue-500".
 */
function cadenaDeAlias(declaraciones, nombre, tope = 12) {
  const cadena = [];
  const vistos = new Set();
  let actual = nombre;
  while (actual && !vistos.has(actual) && cadena.length < tope) {
    vistos.add(actual);
    const bruto = declaraciones[actual];
    if (bruto === undefined) break;
    cadena.push({ token: actual, declarado: canonico(bruto) });
    const m = String(bruto).trim().match(/^var\(\s*(--[A-Za-z0-9_-]+)/);
    actual = m ? m[1] : null;
  }
  return cadena;
}

module.exports = {
  MODES,
  OFFICIAL,
  parseBlocks,
  readDecls,
  appliesTo,
  specificity,
  declaredFor,
  makeResolver,
  canonico,
  isExpr,
  makeAssetPool,
  ASSET,
  INDEXABLE,
  cadenaDeAlias,
};
