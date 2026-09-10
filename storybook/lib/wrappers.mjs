/**
 * Lógica compartida por generate-react.mjs y generate-vue.mjs.
 *
 * Los dos generadores compilan el mismo árbol (el usage parseado) y derivan
 * la misma API de props del spec; lo único que cambia entre frameworks es la
 * sintaxis emitida. Todo lo que decide *qué* se emite vive aquí, una vez.
 */

import { parseFragment } from './parse-html.mjs';

export const camel = (s) => s.replace(/-(\w)/g, (_, c) => c.toUpperCase());
export const pascal = (s) => camel(s).replace(/^\w/, (c) => c.toUpperCase());

// Un modifier puede camelizar a una palabra reservada de JS (atom-evidence--new
// → `new`), que no puede ser un binding. Regla general, no excepción manual:
// reservada → is + Pascal (new → isNew). Vive aquí para que React y Vue
// deriven el mismo nombre.
const RESERVED = new Set([
  'new', 'class', 'for', 'in', 'of', 'do', 'if', 'else', 'var', 'let', 'const',
  'function', 'return', 'this', 'typeof', 'delete', 'switch', 'case', 'default',
  'void', 'with', 'yield', 'await', 'static', 'enum', 'export', 'import',
  'extends', 'super', 'catch', 'try', 'finally', 'throw', 'while', 'break',
  'continue', 'instanceof', 'debugger', 'null', 'true', 'false',
]);
export const propName = (s) => {
  const c = camel(s);
  return RESERVED.has(c) ? 'is' + pascal(s) : c;
};

/** { axes: {eje: {valor: clase}}, flags: {propCamel: clase} } */
export function classMaps(C) {
  const axes = {};
  for (const [axis, values] of Object.entries(C.axes)) {
    axes[axis] = Object.fromEntries(values.map((v) => [v.value, v.class]));
  }
  const flags = Object.fromEntries(C.flags.map((f) => [propName(f.name), f.class]));
  return { axes, flags };
}

export function knownModifierClasses(C) {
  return new Set([
    ...Object.values(C.axes).flat().map((v) => v.class),
    ...C.flags.map((f) => f.class),
  ]);
}

/** Args por defecto de las stories, con los flags ya en camelCase. */
const PREFERRED = { variant: 'primary', size: 'md' };
export function defaultStoryArgs(C) {
  const args = {};
  for (const [axis, values] of Object.entries(C.axes)) {
    const p = PREFERRED[axis];
    args[axis] = values.some((v) => v.value === p) ? p : '';
  }
  for (const f of C.flags) args[propName(f.name)] = false;
  return args;
}

/**
 * Árbol del template con el nodo base marcado. Los 4 componentes sin usage
 * reciben el mismo render mínimo que usa el runtime HTML.
 */
export function componentTree(C) {
  const template = C.template ?? `<div class="${C.base}">${C.name}</div>`;
  const roots = parseFragment(template);
  let baseNode = null;
  const visit = (node) => {
    if (typeof node === 'string') return;
    const tokens = (node.attrs.class ?? '').split(/\s+/).filter(Boolean);
    if (!baseNode && tokens.includes(C.base)) baseNode = node;
    node.children.forEach(visit);
  };
  roots.forEach(visit);
  if (!baseNode) throw new Error(`${C.name}: el template no contiene la clase base ${C.base}`);
  return { roots, baseNode };
}

/** Clases del nodo base que no son modifiers conocidos (se conservan tal cual). */
export function staticBaseClasses(C, baseNode) {
  const known = knownModifierClasses(C);
  return (baseNode.attrs.class ?? '')
    .split(/\s+/)
    .filter(Boolean)
    .filter((t) => !known.has(t));
}

export function isVoid(node) {
  return node.children.length === 0;
}
