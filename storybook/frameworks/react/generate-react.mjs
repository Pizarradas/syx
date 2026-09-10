#!/usr/bin/env node
/**
 * generate-react.mjs — Fase 3 de la prueba de portabilidad (React).
 *
 * Compila cada componente del spec a un componente React de verdad:
 * el template `usage` parseado se convierte en JSX estático (como hace
 * cualquier compilador de templates), el nodo base recibe la className
 * calculada desde las props y {...rest}, y su contenido es el children
 * por defecto, sustituible desde fuera. Cero componentes escritos a mano:
 * cada excepción manual que hiciera falta aquí mediría lo no-portable.
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
const ATTR_RENAME = { class: 'className', for: 'htmlFor' };

function jsxAttrs(node, { skipClass = false } = {}) {
  const parts = [];
  for (const [name, value] of Object.entries(node.attrs)) {
    if (skipClass && name === 'class') continue;
    let jsxName = ATTR_RENAME[name] ?? name;
    // value= en un input sin onChange dispara el aviso de "controlled input";
    // el equivalente no controlado es defaultValue.
    if (node.tag === 'input' && name === 'value') jsxName = 'defaultValue';
    parts.push(value === '' ? jsxName : `${jsxName}=${JSON.stringify(value)}`);
  }
  return parts.length ? ' ' + parts.join(' ') : '';
}

function emitNode(node, ctx, indent) {
  const pad = '  '.repeat(indent);
  if (typeof node === 'string') return `${pad}{${JSON.stringify(node)}}`;

  const isBase = node === ctx.baseNode;
  const attrs = jsxAttrs(node, { skipClass: isBase });
  const open = isBase
    ? `<${node.tag} className={cls}${attrs} {...rest}>`
    : `<${node.tag}${attrs}>`;

  if (node.children.length === 0) {
    const self = isBase
      ? `<${node.tag} className={cls}${attrs} {...rest} />`
      : `<${node.tag}${attrs} />`;
    return pad + self;
  }

  const inner = node.children.map((c) => emitNode(c, ctx, indent + 1)).join('\n');
  if (isBase) {
    return [
      pad + open,
      `${pad}  {children !== undefined ? children : (`,
      `${pad}    <>`,
      node.children.map((c) => emitNode(c, ctx, indent + 3)).join('\n'),
      `${pad}    </>`,
      `${pad}  )}`,
      `${pad}</${node.tag}>`,
    ].join('\n');
  }
  return `${pad}${open}\n${inner}\n${pad}</${node.tag}>`;
}

function emitComponent(C) {
  const name = pascal(C.name);
  const { axes, flags } = classMaps(C);
  const { roots, baseNode } = componentTree(C);
  const staticCls = staticBaseClasses(C, baseNode).join(' ');
  const axisProps = Object.keys(axes);
  const flagProps = Object.keys(flags);
  const baseHasChildren = baseNode.children.length > 0;

  const params = [
    ...axisProps,
    ...flagProps,
    ...(baseHasChildren ? ['children'] : []),
    'className',
    '...rest',
  ].join(', ');

  const clsParts = [
    `    ${JSON.stringify(staticCls)},`,
    ...axisProps.map((a) => `    AXES.${a}[${a}],`),
    ...flagProps.map((f) => `    ${f} && FLAGS.${f},`),
    '    className,',
  ].join('\n');

  const ctx = { baseNode };
  const body =
    roots.length === 1
      ? emitNode(roots[0], ctx, 2)
      : ['    <>', ...roots.map((r) => emitNode(r, ctx, 3)), '    </>'].join('\n');

  return `// GENERADO por generate-react.mjs desde spec/spec.json — no editar a mano.
// Fuente última: component-registry.json v${spec._meta.sourceVersion} → ${C.base}
import React from 'react';

const AXES = ${JSON.stringify(axes, null, 2)};
const FLAGS = ${JSON.stringify(flags, null, 2)};

export default function ${name}({ ${params} }) {
  const cls = [
${clsParts}
  ].filter(Boolean).join(' ');
  return (
${body}
  );
}
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
    '// GENERADO por generate-react.mjs desde spec/spec.json — no editar a mano.',
    "import React from 'react';",
    `import ${name} from '../src/${name}.jsx';`,
    "import { Showcase } from '../lib/showcase.jsx';",
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
    lines.push(
      `export const ${pascal(axis)} = { render: () => <Showcase items={[${items.join(', ')}]} /> };`
    );
  }
  if (C.flags.length) {
    const items = [
      `{ label: 'base', is: ${name}, props: base }`,
      ...C.flags.map(
        (f) => `{ label: ${JSON.stringify(f.name)}, is: ${name}, props: { ...base, ${propName(f.name)}: true } }`
      ),
    ];
    lines.push(`export const Flags = { render: () => <Showcase items={[${items.join(', ')}]} /> };`);
  }
  return lines.join('\n') + '\n';
}

let ok = 0;
for (const C of spec.components) {
  writeFileSync(join(SRC, `${pascal(C.name)}.jsx`), emitComponent(C));
  writeFileSync(join(STORIES, `${C.name}.stories.jsx`), emitStories(C));
  ok += 1;
}
console.log(`react: ${ok} componentes + ${ok} stories generados sin excepciones manuales`);
