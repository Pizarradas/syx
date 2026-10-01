/**
 * SYX — Lector de declaraciones de custom properties en el SCSS fuente
 * ────────────────────────────────────────────────────────────────────
 * Hermano de css-tokens.js, pero mirando la FUENTE y no el CSS compilado.
 * Hace falta para lo que el compilado ya no sabe: en qué fichero y en qué
 * contexto (:root, @supports, @media, @mixin) se escribió cada token. Con eso
 * se genera tokens.json y se detectan las dobles definiciones, que en el CSS
 * compilado ya no se ven porque la segunda tapa a la primera sin avisar.
 *
 * No es un compilador de Sass: solo entiende lo que hay en las capas de tokens
 * —bloques, comentarios, comillas e interpolaciones `#{…}`—, que es justo lo
 * que hace falta para no partir un data URI por un `;` o un `//` de su interior.
 */

'use strict';

// Quita los comentarios respetando comillas y url(…), donde `//` es parte del
// valor (http://www.w3.org/2000/svg) y no un comentario. Conserva los saltos
// de línea para que los números de línea sigan valiendo.
function sinComentarios(src) {
  let out = '';
  let i = 0;
  let quote = null;
  let enUrl = 0;
  while (i < src.length) {
    const c = src[i];
    const d = src[i + 1];
    if (quote) {
      out += c;
      if (c === '\\') { out += d || ''; i += 2; continue; }
      if (c === quote) quote = null;
      i++;
      continue;
    }
    if (c === '"' || c === "'") { quote = c; out += c; i++; continue; }
    if (/url\($/i.test(out.slice(-4))) enUrl++;
    if (enUrl && c === ')') enUrl--;
    if (!enUrl && c === '/' && d === '*') {
      const fin = src.indexOf('*/', i + 2);
      const trozo = src.slice(i, fin === -1 ? src.length : fin + 2);
      out += trozo.replace(/[^\n]/g, '');
      i += trozo.length;
      continue;
    }
    if (!enUrl && c === '/' && d === '/') {
      while (i < src.length && src[i] !== '\n') i++;
      continue;
    }
    out += c;
    i++;
  }
  return out;
}

/**
 * Devuelve cada declaración `--nombre: valor` con su pila de contextos (las
 * cabeceras de los bloques que la envuelven, de fuera adentro) y su línea.
 */
function leerDeclaraciones(src) {
  const s = sinComentarios(src.replace(/\r\n?/g, '\n'));
  const decls = [];
  const pila = [];
  let i = 0;
  let inicio = 0; // dónde empieza la sentencia en curso
  const linea = (pos) => s.slice(0, pos).split('\n').length;

  // Avanza hasta el final de una sentencia (`;` o `}` de cierre) respetando
  // comillas, paréntesis e interpolaciones.
  function finDeValor(j) {
    let paren = 0;
    let quote = null;
    while (j < s.length) {
      const c = s[j];
      if (quote) {
        if (c === '\\') { j += 2; continue; }
        if (c === quote) quote = null;
      } else if (c === '"' || c === "'") quote = c;
      else if (c === '#' && s[j + 1] === '{') {
        let depth = 0;
        do { if (s[j] === '{') depth++; else if (s[j] === '}') depth--; j++; } while (j < s.length && depth > 0);
        continue;
      } else if (c === '(') paren++;
      else if (c === ')') paren--;
      else if (paren <= 0 && (c === ';' || c === '}')) return j;
      j++;
    }
    return j;
  }

  while (i < s.length) {
    const c = s[i];
    if (c === '#' && s[i + 1] === '{') { i = finDeValor(i) ; continue; }
    if (c === '{') {
      pila.push(s.slice(inicio, i).trim().replace(/\s+/g, ' '));
      i++;
      inicio = i;
      continue;
    }
    if (c === '}') { pila.pop(); i++; inicio = i; continue; }
    if (c === ';') { i++; inicio = i; continue; }
    // ¿Empieza aquí una custom property?
    if (c === '-' && s[i + 1] === '-' && s.slice(inicio, i).trim() === '') {
      const m = /^--[A-Za-z0-9_-]+\s*:/.exec(s.slice(i));
      if (m) {
        const desde = i + m[0].length;
        const fin = finDeValor(desde);
        decls.push({
          name: m[0].replace(/\s*:$/, ''),
          value: s.slice(desde, fin).trim().replace(/\s+/g, ' '),
          contexto: pila.slice(),
          line: linea(i),
        });
        i = fin;
        if (s[i] === ';') i++;
        inicio = i;
        continue;
      }
    }
    i++;
  }
  return decls;
}

module.exports = { sinComentarios, leerDeclaraciones };
