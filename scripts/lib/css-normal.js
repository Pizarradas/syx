/**
 * SYX — CSS normalizado
 * ─────────────────────
 * Dos compilaciones del mismo SCSS pueden diferir en el formato sin diferir en
 * nada que el navegador vea: otra versión de dart-sass (la que lleva Prepros
 * frente a la de npm), saltos de línea, sangría, comentarios. Esto reduce una
 * hoja a lo que significa —reglas, selectores, declaraciones y valores, en su
 * orden— para compararla con otra. Una regla, un selector o un valor distinto
 * siguen siendo distintos.
 *
 * Normaliza: comentarios y @charset fuera; espacios del formato fuera; espacio
 * colapsado dentro de valores, selectores y parámetros de @-reglas; sin espacio
 * tras comas ni alrededor de combinadores; ceros a la izquierda (0.5 = .5) y
 * hex en minúsculas, que es lo que cambia el estilo comprimido de Sass.
 */

'use strict';

const postcss = require('postcss');

const espacios = (s) => s.replace(/\s+/g, ' ').trim();
const valor = (v) =>
  espacios(v)
    .replace(/\s*,\s*/g, ',')
    .replace(/\(\s+/g, '(')
    .replace(/\s+\)/g, ')')
    .replace(/(^|[^\d.\w-])0+\.(\d)/g, '$1.$2')
    .replace(/#[0-9a-fA-F]{3,8}\b/g, (h) => h.toLowerCase());
const selector = (s) => espacios(s).replace(/\s*([,>+~])\s*/g, '$1');

/** La hoja reducida a su significado, como texto comparable. */
function normalizar(css) {
  const root = postcss.parse(css);
  const out = [];
  root.walk((n) => {
    if (n.type === 'comment') return;
    const prof = (() => { let d = 0; for (let p = n.parent; p && p.type !== 'root'; p = p.parent) d++; return d; })();
    if (n.type === 'atrule') {
      if (n.name === 'charset') return;
      out.push(`${prof}@${n.name} ${valor(n.params).replace(/\s*:\s*/g, ':')}`);
    } else if (n.type === 'rule') {
      out.push(`${prof}R ${selector(n.selector)}`);
    } else if (n.type === 'decl') {
      out.push(`${prof}D ${n.prop.trim()}:${valor(n.value)}${n.important ? '!important' : ''}`);
    }
  });
  return out.join('\n');
}

module.exports = { normalizar };
