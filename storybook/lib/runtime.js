/**
 * Runtime compartido por todas las stories generadas (renderer HTML).
 *
 * Las stories no saben construir nada: reciben el componente tal como lo
 * describe spec.json y este módulo deriva render, argTypes y showcases.
 * Cualquier cambio de criterio se hace aquí, una vez, no en 38 ficheros.
 */

function knownModifierClasses(C) {
  return new Set([
    ...Object.values(C.axes).flat().map((v) => v.class),
    ...C.flags.map((f) => f.class),
  ]);
}

function modifierClasses(C, args) {
  const cls = [];
  for (const [axis, values] of Object.entries(C.axes)) {
    const hit = values.find((v) => v.value === args[axis]);
    if (hit) cls.push(hit.class);
  }
  for (const f of C.flags) if (args[f.name]) cls.push(f.class);
  return cls;
}

/**
 * Renderiza el template del usage sustituyendo, en el primer nodo cuyo
 * atributo class contiene la clase base, los modifiers conocidos por los
 * que piden los args. El resto del template queda intacto.
 */
export function makeRender(C) {
  const known = knownModifierClasses(C);
  const template = C.template ?? `<div class="${C.base}">${C.name}</div>`;
  return function render(args = {}) {
    const mods = modifierClasses(C, args);
    let done = false;
    return template.replace(/class="([^"]*)"/g, (attr, value) => {
      const tokens = value.split(/\s+/).filter(Boolean);
      if (done || !tokens.includes(C.base)) return attr;
      done = true;
      const kept = tokens.filter((t) => !known.has(t));
      return `class="${[...kept, ...mods].join(' ')}"`;
    });
  };
}

export function makeArgTypes(C) {
  const argTypes = {};
  for (const [axis, values] of Object.entries(C.axes)) {
    argTypes[axis] = {
      control: { type: 'select' },
      options: ['', ...values.map((v) => v.value)],
      table: { category: 'ejes' },
    };
  }
  for (const f of C.flags) {
    argTypes[f.name] = { control: { type: 'boolean' }, table: { category: 'flags' } };
  }
  return argTypes;
}

const PREFERRED = { variant: 'primary', size: 'md' };

export function defaultArgs(C) {
  const args = {};
  for (const [axis, values] of Object.entries(C.axes)) {
    const preferred = PREFERRED[axis];
    args[axis] = values.some((v) => v.value === preferred) ? preferred : '';
  }
  for (const f of C.flags) args[f.name] = false;
  return args;
}

const ROW =
  'display:flex;flex-wrap:wrap;gap:1rem;align-items:center;max-width:72rem';
const ITEM = 'display:flex;flex-direction:column;gap:.5rem;align-items:center';
const LABEL = 'font-family:monospace;font-size:.75rem;opacity:.7';

function labelled(label, html) {
  return `<div style="${ITEM}"><div>${html}</div><span style="${LABEL}">${label}</span></div>`;
}

/** Una story estática con todos los valores de un eje, lado a lado. */
export function makeAxisShowcase(C, axis) {
  const render = makeRender(C);
  const base = defaultArgs(C);
  return () =>
    `<div style="${ROW}">` +
    C.axes[axis]
      .map((v) => labelled(v.value, render({ ...base, [axis]: v.value })))
      .join('') +
    '</div>';
}

/** Una story estática con cada flag activado individualmente. */
export function makeFlagsShowcase(C) {
  const render = makeRender(C);
  const base = defaultArgs(C);
  return () =>
    `<div style="${ROW}">` +
    labelled('base', render(base)) +
    C.flags
      .map((f) => labelled(f.name, render({ ...base, [f.name]: true })))
      .join('') +
    '</div>';
}

const LAYER_TITLE = { atom: 'Atoms', molecule: 'Molecules', organism: 'Organisms' };

export function makeMeta(C) {
  return {
    title: `${LAYER_TITLE[C.layer] ?? C.layer}/${C.name}`,
    render: makeRender(C),
    argTypes: makeArgTypes(C),
    args: defaultArgs(C),
    parameters: {
      docs: {
        description: { component: C.description ?? undefined },
        // El código que enseña la pestaña Docs es el contrato de markup real
        // del registro, no el interior del render function.
        source: { code: C.template ?? `<div class="${C.base}">${C.name}</div>`, language: 'html' },
      },
      syx: { base: C.base, generatedFrom: 'component-registry.json' },
    },
  };
}
