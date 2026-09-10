#!/usr/bin/env node
/**
 * generate-stories.mjs — Fase 2 de la prueba de portabilidad.
 *
 * Lee spec/spec.json y emite stories/<layer>/<name>.stories.js. Los ficheros
 * generados no contienen lógica: inlinean el componente del spec y delegan en
 * lib/runtime.js. Se regeneran enteros en cada ejecución; editarlos a mano no
 * tiene sentido y el encabezado lo dice.
 */

import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const spec = JSON.parse(readFileSync(join(HERE, 'spec', 'spec.json'), 'utf8'));

const OUT = join(HERE, 'stories');
rmSync(OUT, { recursive: true, force: true });

const cap = (s) => s[0].toUpperCase() + s.slice(1).replace(/-(\w)/g, (_, c) => c.toUpperCase());

let files = 0;
for (const C of spec.components) {
  const title = `${{ atom: 'Atoms', molecule: 'Molecules', organism: 'Organisms' }[C.layer]}/${C.name}`;
  const lines = [
    '// GENERADO por generate-stories.mjs desde spec/spec.json — no editar a mano.',
    `// Fuente última: component-registry.json v${spec._meta.sourceVersion} → ${C.base}`,
    "import { makeMeta, makeAxisShowcase, makeFlagsShowcase } from '../../lib/runtime.js';",
    '',
    `const C = ${JSON.stringify(C, null, 2)};`,
    '',
    'const meta = makeMeta(C);',
    '',
    // El default tiene que ser un objeto literal con el title como literal:
    // el indexador estático de Storybook no evalúa llamadas, y sin él el build
    // sale sin index.json y el preview no arranca.
    'export default {',
    `  title: ${JSON.stringify(title)},`,
    "  tags: ['autodocs'],",
    '  render: meta.render,',
    '  argTypes: meta.argTypes,',
    '  args: meta.args,',
    '  parameters: meta.parameters,',
    '};',
    '',
    'export const Playground = {};',
  ];
  for (const axis of Object.keys(C.axes)) {
    lines.push(`export const ${cap(axis)} = { render: makeAxisShowcase(C, '${axis}') };`);
  }
  if (C.flags.length) {
    lines.push('export const Flags = { render: makeFlagsShowcase(C) };');
  }
  const dir = join(OUT, C.layer + 's');
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, `${C.name}.stories.js`), lines.join('\n') + '\n');
  files += 1;
}

console.log(`stories/: ${files} ficheros generados (${spec.components.length} componentes)`);
