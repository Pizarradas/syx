/**
 * SYX — La cascada de :root sobre el CSS compilado
 * ───────────────────────────────────────────────────────────────────────────
 * Qué valor tiene cada custom property en cada estado de modo (el usuario no
 * elige, elige claro u oscuro; el SO en claro o en oscuro) y en cada rama de
 * navegador (con o sin color relativo). La usan check-modo-claro,
 * check-contraste, check-plantilla y build-tintas-respaldo; vive en lib/ para
 * que viaje en el paquete con el comando `syx-tintas-respaldo`.
 * ───────────────────────────────────────────────────────────────────────────
 */
'use strict';
const postcss = require('postcss');

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

/**
 * `rama` elige qué navegador se mide. «moderna» (por defecto): tiene color
 * relativo, así que vale lo que hay dentro de `@supports (…)` y se ignora el
 * respaldo de `@supports not (…)`. «sin-relativo»: un navegador del
 * browserslist que no lo tiene (scripts/build-tintas-respaldo.js), al revés.
 */
function declaraciones(css, rama = 'moderna') {
  const out = [];
  let orden = 0;
  postcss.parse(css).walkRules((rule) => {
    const pred = predicado(rule.selector);
    if (!pred) return;
    let so = null, descartar = false;
    for (let p = rule.parent; p && p.type !== 'root'; p = p.parent) {
      if (p.type === 'atrule' && p.name === 'supports') {
        const negado = /^not\b/.test(p.params.trim());
        const relativo = /\bfrom\b/.test(p.params);
        if (relativo && negado === (rama === 'moderna')) descartar = true;
        continue;
      }
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

module.exports = { predicado, especificidad, declaraciones, estado, resolver };
