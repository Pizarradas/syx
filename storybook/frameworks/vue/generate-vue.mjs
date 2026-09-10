#!/usr/bin/env node
/**
 * generate-vue.mjs — Fase 3 de la prueba de portabilidad (Vue 3).
 *
 * Mismo contrato que generate-react.mjs con la sintaxis de Vue: el template
 * `usage` se compila a render functions h() (que es exactamente lo que hace
 * el compilador de SFCs), el nodo base calcula su class desde las props y
 * hereda attrs, y su contenido es el slot por defecto. Cero componentes
 * escritos a mano.
 */

import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  propName, pascal, classMaps, defaultStoryArgs, componentTree, staticBaseClasses,
} from '../../lib/wrappers.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const spec = JSON.parse(readFileSync(join(HERE, '..', '..', 'spec', 'spec.json'), 'utf8'));

const SRC = join(HERE, 'src');
const STORIES = join(HERE, 'stories');
rmSync(SRC, { recursive: true, force: true });
rmSync(STORIES, { recursive: true, force: true });
mkdirSync(SRC, { recursive: true });
mkdirSync(STORIES, { recursive: true });

const LAYER_TITLE = { atom: 'Atoms', molecule: 'Molecules', organism: 'Organisms' };

function hAttrs(node, { skipClass = false } = {}) {
  const entries = Object.entries(node.attrs).filter(([n]) => !(skipClass && n === 'class'));
  if (!entries.length) return null;
  return '{ ' + entries.map(([n, v]) => `${JSON.stringify(n)}: ${JSON.stringify(v)}`).join(', ') + ' }';
}

function emitNode(node, ctx, indent) {
  const pad = '  '.repeat(indent);
  if (typeof node === 'string') return pad + JSON.stringify(node);

  const isBase = node === ctx.baseNode;
  const attrs = hAttrs(node, { skipClass: isBase });
  const props = isBase
    ? `{ class: cls${attrs ? ', ...' + attrs : ''}, ...restAttrs }`
    : attrs ?? 'null';

  if (node.children.length === 0) {
    return `${pad}h(${JSON.stringify(node.tag)}, ${props})`;
  }
  const inner = node.children.map((c) => emitNode(c, ctx, indent + 1)).join(',\n');
  if (isBase) {
    return [
      `${pad}h(${JSON.stringify(node.tag)}, ${props}, slots.default ? slots.default() : [`,
      inner + ',',
      `${pad}])`,
    ].join('\n');
  }
  return `${pad}h(${JSON.stringify(node.tag)}, ${props}, [\n${inner},\n${pad}])`;
}

function emitComponent(C) {
  const name = pascal(C.name);
  const { axes, flags } = classMaps(C);
  const { roots, baseNode } = componentTree(C);
  const staticCls = staticBaseClasses(C, baseNode).join(' ');
  const axisProps = Object.keys(axes);
  const flagProps = Object.keys(flags);

  const propDecls = [
    ...axisProps.map((a) => `    ${a}: { type: String, default: undefined },`),
    ...flagProps.map((f) => `    ${f}: { type: Boolean, default: false },`),
  ].join('\n');

  const clsParts = [
    `        ${JSON.stringify(staticCls)},`,
    ...axisProps.map((a) => `        AXES.${a}[props.${a}],`),
    ...flagProps.map((f) => `        props.${f} && FLAGS.${f},`),
  ].join('\n');

  const ctx = { baseNode };
  const body =
    roots.length === 1
      ? emitNode(roots[0], ctx, 3)
      : ['      [', ...roots.map((r) => emitNode(r, ctx, 4) + ','), '      ]'].join('\n');

  return `// GENERADO por generate-vue.mjs desde spec/spec.json — no editar a mano.
// Fuente última: component-registry.json v${spec._meta.sourceVersion} → ${C.base}
import { h, defineComponent } from 'vue';

const AXES = ${JSON.stringify(axes, null, 2)};
const FLAGS = ${JSON.stringify(flags, null, 2)};

export default defineComponent({
  name: 'Syx${name}',
  inheritAttrs: false,
  props: {
${propDecls}
  },
  setup(props, { slots, attrs }) {
    return () => {
      // class va a la clase calculada; el resto de attrs cae en el nodo base,
      // igual que {...rest} en el wrapper React.
      const { class: _class, ...restAttrs } = attrs;
      const cls = [
${clsParts}
        attrs.class,
      ].filter(Boolean).join(' ');
      return (
${body}
      );
    };
  },
});
`;
}

function emitStories(C) {
  const name = pascal(C.name);
  const { axes } = classMaps(C);
  const args = defaultStoryArgs(C);

  const argTypes = {};
  for (const [axis, values] of Object.entries(C.axes)) {
    argTypes[axis] = {
      control: { type: 'select' },
      options: ['', ...values.map((v) => v.value)],
      table: { category: 'ejes' },
    };
  }
  for (const f of C.flags) {
    argTypes[propName(f.name)] = { control: { type: 'boolean' }, table: { category: 'flags' } };
  }

  const lines = [
    '// GENERADO por generate-vue.mjs desde spec/spec.json — no editar a mano.',
    `import ${name} from '../src/${name}.js';`,
    "import { showcase } from '../lib/showcase.js';",
    '',
    `const base = ${JSON.stringify(args)};`,
    '',
    'export default {',
    `  title: ${JSON.stringify(`${LAYER_TITLE[C.layer]}/${C.name}`)},`,
    "  tags: ['autodocs'],",
    `  component: ${name},`,
    '  args: base,',
    `  argTypes: ${JSON.stringify(argTypes, null, 2)},`,
    C.description ? `  parameters: { docs: { description: { component: ${JSON.stringify(C.description)} } } },` : null,
    '};',
    '',
    'export const Playground = {};',
  ].filter((l) => l !== null);

  for (const axis of Object.keys(axes)) {
    const items = C.axes[axis].map(
      (v) => `{ label: ${JSON.stringify(v.value)}, is: ${name}, props: { ...base, ${axis}: ${JSON.stringify(v.value)} } }`
    );
    lines.push(`export const ${pascal(axis)} = { render: () => showcase([${items.join(', ')}]) };`);
  }
  if (C.flags.length) {
    const items = [
      `{ label: 'base', is: ${name}, props: base }`,
      ...C.flags.map(
        (f) => `{ label: ${JSON.stringify(f.name)}, is: ${name}, props: { ...base, ${propName(f.name)}: true } }`
      ),
    ];
    lines.push(`export const Flags = { render: () => showcase([${items.join(', ')}]) };`);
  }
  return lines.join('\n') + '\n';
}

let ok = 0;
for (const C of spec.components) {
  writeFileSync(join(SRC, `${pascal(C.name)}.js`), emitComponent(C));
  writeFileSync(join(STORIES, `${C.name}.stories.js`), emitStories(C));
  ok += 1;
}
console.log(`vue: ${ok} componentes + ${ok} stories generados sin excepciones manuales`);
